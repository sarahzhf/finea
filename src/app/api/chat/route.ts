export const runtime = "nodejs";

import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
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
3. Ne fais pas de calculs complexes précis. Si l'utilisateur demande une simulation, suggère-lui d'utiliser le Copilote IA de l'application.
4. Si tu manques d'informations, pose des questions avant de répondre.
`.trim();

        if (goalData) {
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
        });

        return result.toTextStreamResponse();
    } catch (error: any) {
        console.error("Chat API Error (unhandled):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}