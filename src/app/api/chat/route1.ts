import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split(" ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;

        const { messages } = await req.json();

        const goalDoc = await adminFirestore.doc(`users/${uid}/savings/goal`).get();
        const goalData = goalDoc.exists ? goalDoc.data() : null;

        let systemPrompt = `
Tu es Finéa, un coach financier expert pour étudiants et jeunes actifs en France.
Règles :
1. Réponds de façon concise (2-3 paragraphes max), avec un ton bienveillant et direct.
2. Ne donne JAMAIS de conseils d'investissement garantis ("achète X"). Reste sur de l'éducation financière générale.
3. Ne fais pas de calculs complexes précis. Si l'utilisateur demande une simulation, suggère-lui d'utiliser le Copilote IA de l'application.
4. Si tu manques d'informations, pose des questions avant de répondre.
`;

        if (goalData) {
            systemPrompt += `\nContexte Utilisateur (anonymisé) :\n- Objectif d'épargne: ${goalData.targetAmount}€\n- Épargne actuelle: ${goalData.currentAmount}€\n`;
        } else {
            systemPrompt += "\nL'utilisateur n'a pas encore défini d'objectif d'épargne. Encourage-le à le faire.";
        }

        const result = streamText({
            model: openai("gpt-4o-mini"),
            system: systemPrompt,
            messages,
            temperature: 0.7,
        });

        return result.toTextStreamResponse();
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
