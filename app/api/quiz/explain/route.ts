import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase/admin";
import type { QuizQuestionDoc } from "@/lib/quiz/types";

/**
 * Explain endpoint:
 * - First returns the stored "explanation" from Firestore if present.
 * - If empty, optionally calls an LLM (OpenAI) if OPENAI_API_KEY is set.
 *
 * This keeps the MVP working even without any LLM key.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const questionId = body?.questionId as string | undefined;
    const selectedIndex = body?.selectedIndex as number | undefined;

    if (!questionId) return NextResponse.json({ error: "questionId manquant" }, { status: 400 });

    const db = getFirestore();
    const qSnap = await db.collection("questions").doc(questionId).get();
    if (!qSnap.exists) return NextResponse.json({ error: "Question introuvable" }, { status: 404 });

    const q = qSnap.data() as QuizQuestionDoc;
    const stored = (q.explanation ?? "").trim();
    if (stored.length > 0) {
      return NextResponse.json({ source: "stored", explanation: stored });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        source: "none",
        explanation:
          "Aucune explication n’est enregistrée pour cette question et aucune clé LLM n’est configurée (OPENAI_API_KEY).",
      });
    }

    // Lazy import to avoid bundling if unused
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey });

    const prompt = [
      "Tu es un tuteur en éducation financière. Explique la bonne réponse de façon claire et courte.",
      "Règles: 1) pas de jargon, 2) 3-6 phrases max, 3) inclure un mini-exemple si utile.",
      "",
      `Question: ${q.question}`,
      `Choix: A) ${q.choices?.[0] ?? ""} | B) ${q.choices?.[1] ?? ""} | C) ${q.choices?.[2] ?? ""} | D) ${q.choices?.[3] ?? ""}`,
      `Bonne réponse: ${["A", "B", "C", "D"][Number(q.correctIndex) ?? 0]}`,
      typeof selectedIndex === "number"
        ? `Réponse de l'utilisateur: ${["A", "B", "C", "D"][selectedIndex] ?? "?"}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const resp = await client.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      input: prompt,
    });

    // @ts-ignore
    const text = (resp.output_text ?? "").trim();
    return NextResponse.json({ source: "llm", explanation: text || "Pas de réponse LLM." });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
