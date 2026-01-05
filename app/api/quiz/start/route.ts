import { NextResponse } from "next/server";
import { getFirestore, serverTimestamp } from "@/lib/firebase/admin";
import type { QuizSessionDoc } from "@/lib/quiz/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const count = Math.min(Math.max(Number(searchParams.get("count") ?? 10), 1), 50);

    const tags = (searchParams.get("tags") ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const db = getFirestore();
    const sessionRef = db.collection("quiz_sessions").doc();

    const session: QuizSessionDoc = {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      totalQuestions: count,
      tagsFilter: tags, //  jamais undefined
      currentIndex: 0,
      score: 0,
      askedQuestionIds: [],
      answered: [],
      skills: {}, // tag -> theta
      finished: false,
    };

    await sessionRef.set(session);

    return NextResponse.json({
      progress: {
        sessionId: sessionRef.id,
        ...session,
        createdAt: undefined,
        updatedAt: undefined,
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "Failed to start quiz" },
      { status: 500 }
    );
  }
}
