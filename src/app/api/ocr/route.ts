import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export async function POST(req: NextRequest) {
    try {
        const data = await req.formData();
        const file = data.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No receipt provided" }, { status: 400 });
        }

        // Convert image to base64
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        const mimeType = file.type || "image/jpeg";
        const dataUrl = `data:${mimeType};base64,${base64}`;

        // Call OpenAI Vision to extract receipt data
        const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: z.object({
                amount: z.number().describe("Le montant total du ticket/reçu en euros (nombre positif)"),
                date: z.string().describe("La date du ticket au format ISO 8601 (ex: 2025-01-15T00:00:00.000Z). Si illisible, utilise la date d'aujourd'hui."),
                merchant: z.string().describe("Le nom du commerçant ou de l'enseigne"),
                category: z.enum(["Alimentation", "Logement", "Transports", "Loisirs", "Santé", "Abonnements", "Autre"])
                    .describe("La catégorie la plus adaptée pour cette dépense"),
            }),
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analyse ce ticket de caisse / reçu. Extrais le montant total, la date, le nom du commerçant, et catégorise la dépense. Si tu ne peux pas lire certaines informations, fais de ton mieux pour les deviner à partir du contexte."
                        },
                        {
                            type: "image",
                            image: dataUrl,
                        }
                    ]
                }
            ],
        });

        return NextResponse.json({
            amount: object.amount,
            date: object.date,
            merchant: object.merchant,
            category: object.category,
            confidence: 0.9,
        });
    } catch (error: any) {
        console.error("OCR API Error:", error);
        return NextResponse.json({ error: error.message || "Erreur lors de l'analyse du ticket" }, { status: 500 });
    }
}
