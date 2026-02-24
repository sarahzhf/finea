export const runtime = "nodejs";

import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization") || "";
        if (!authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized: missing bearer token" }, { status: 401 });
        }

        const token = authHeader.slice("Bearer ".length).trim();
        if (!token) {
            return NextResponse.json({ error: "Unauthorized: empty token" }, { status: 401 });
        }

        // Vérif token (renvoie 401 si invalide)
        let uid: string;
        try {
            const decodedToken = await adminAuth.verifyIdToken(token);
            uid = decodedToken.uid;
        } catch (e) {
            console.error("verifyIdToken failed:", e);
            return NextResponse.json({ error: "Unauthorized: invalid token" }, { status: 401 });
        }

        // Body
        let body: any;
        try {
            body = await req.json();
        } catch (e) {
            console.error("Invalid JSON body:", e);
            return NextResponse.json({ error: "Bad Request: invalid JSON" }, { status: 400 });
        }

        const messages = body?.messages;
        const contextData = body?.contextData;

        if (!Array.isArray(messages)) {
            return NextResponse.json({ error: "Bad Request: messages must be an array" }, { status: 400 });
        }

        // Firestore (non bloquant)
        let goalData: any = null;
        try {
            const goalDoc = await adminFirestore.doc(`users/${uid}/savings/goal`).get();
            goalData = goalDoc.exists ? goalDoc.data() : null;
        } catch (e) {
            console.error("Firestore goal read failed:", e);
            goalData = null;
        }

        let systemPrompt = `
Tu es Finéa, un coach financier expert pour étudiants et jeunes actifs en France.
Règles :
1. Réponds de façon concise (2-3 paragraphes max), avec un ton bienveillant et direct.
2. Ne donne JAMAIS de conseils d'investissement garantis ("achète X"). Reste sur de l'éducation financière générale.
3. Si tu manques d'informations, pose des questions à l'utilisateur avant de proposer une réponse à sa question.
`.trim();

        if (contextData) {
            systemPrompt += `\n\nContexte Financier de l'Utilisateur:\n` +
                `- Revenu Mensuel : ${contextData.monthlyIncome} €\n` +
                `- Épargne Totale : ${contextData.totalSavings} €\n` +
                `- Crédits Restants : ${contextData.remainingCredits} €\n` +
                `- Taux Moyen des Crédits : ${contextData.averageRate} %\n`;
        } else if (goalData) {
            systemPrompt += `\n\nContexte Utilisateur (anonymisé) :\n- Objectif d'épargne: ${goalData.targetAmount}€\n- Épargne actuelle: ${goalData.currentAmount}€\n`;
        } else {
            systemPrompt += "\n\nL'utilisateur n'a pas encore défini d'objectif d'épargne. Encourage-le à le faire.";
        }

        // (Optionnel) check clé OpenAI
        if (!process.env.OPENAI_API_KEY?.trim()) {
            console.error("OPENAI_API_KEY missing on server env");
            return NextResponse.json({ error: "Server misconfigured: missing OPENAI_API_KEY" }, { status: 500 });
        }

        const result = streamText({
            model: openai("gpt-4o-mini"),
            system: systemPrompt,
            messages,
            temperature: 0.7,
            tools: {
                calculateCompoundInterest: tool({
                    description: "Calcule les intérêts composés pour projeter l'épargne sur une durée donnée. Retourne le capital final estimé, ainsi que des scénarios pessimistes et optimistes.",
                    parameters: z.object({
                        initial_amount: z.number().describe("Montant de départ de l'épargne (euros)"),
                        monthly_deposit: z.number().describe("Montant économisé/déposé chaque mois (euros)"),
                        years: z.number().describe("Horizon de temps en années"),
                        mean_return: z.number().describe("Rendement annuel moyen estimé en % (ex: 4 pour 4%)"),
                        volatility: z.number().optional().describe("Volatilité estimée en % (ex: 5 pour 5%). Si fournie, calcule les scénarios +/-."),
                    }),
                    // @ts-ignore
                    execute: async (params: { initial_amount: number; monthly_deposit: number; years: number; mean_return: number; volatility?: number }) => {
                        const calculateP = (rate: number) => {
                            const r = rate / 100 / 12; // monthly rate
                            const n = params.years * 12; // months
                            if (r === 0) return params.initial_amount + (params.monthly_deposit * n);
                            const compound = Math.pow(1 + r, n);
                            const principal = params.initial_amount * compound;
                            const contributions = params.monthly_deposit * ((compound - 1) / r);
                            return principal + contributions;
                        };

                        const median = calculateP(params.mean_return);

                        let result: any = {
                            scenario_median: Math.round(median),
                            total_invested: Math.round(params.initial_amount + (params.monthly_deposit * params.years * 12))
                        };

                        if (params.volatility) {
                            result.scenario_pessimistic = Math.round(calculateP(params.mean_return - params.volatility));
                            result.scenario_optimistic = Math.round(calculateP(params.mean_return + params.volatility));
                        }

                        return result;
                    },
                }),
            },
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.textStream) {
                        controller.enqueue(encoder.encode(chunk));
                    }
                } catch (e) {
                    console.error("[Copilot] stream error:", e);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    } catch (error: any) {
        console.error("Chat API Error (unhandled):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}