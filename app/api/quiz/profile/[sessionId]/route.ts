import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase/admin";
import type { QuizSessionDoc } from "@/lib/quiz/types";

export async function GET(_: Request, { params }: { params: { sessionId: string } }) {
  try {
    const db = getFirestore();
    const snap = await db.collection("quiz_sessions").doc(params.sessionId).get();
    if (!snap.exists) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    const session = snap.data() as QuizSessionDoc;

    return NextResponse.json({
      skills: session.skills ?? {},
      answeredCount: (session.answered ?? []).length,
      score: session.score ?? 0,
      totalQuestions: session.totalQuestions ?? 0,
      finished: !!session.finished,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
