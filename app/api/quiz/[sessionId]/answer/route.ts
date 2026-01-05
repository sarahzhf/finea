import { NextResponse } from "next/server";
import { getFirestore, nowTimestamp, serverTimestamp } from "@/lib/firebase/admin";
import type { AnswerChoice, QuizQuestionDoc, QuizSessionDoc } from "@/lib/quiz/types";
import { choiceToIndex, toPublicQuestion } from "@/lib/quiz/transform";
import { difficultyFromScore, updateSkills, selectNextQuestion } from "@/lib/quiz/adaptive";

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const selected = body?.selected as AnswerChoice | undefined;
    const questionId = body?.questionId as string | undefined;

    if (!selected || !["A", "B", "C", "D"].includes(selected)) {
      return NextResponse.json({ error: "Réponse invalide" }, { status: 400 });
    }
    if (!questionId || typeof questionId !== "string") {
      return NextResponse.json({ error: "questionId manquant" }, { status: 400 });
    }

    const db = getFirestore();
    const sessionRef = db.collection("quiz_sessions").doc(params.sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    const session = sessionSnap.data() as QuizSessionDoc;

    // ✅ normalisation défensive
    const tagsFilter = Array.isArray(session.tagsFilter) ? session.tagsFilter : [];

    if (session.finished) {
      return NextResponse.json({ error: "Session terminée" }, { status: 400 });
    }

    const qSnap = await db.collection("questions").doc(questionId).get();
    if (!qSnap.exists) return NextResponse.json({ error: "Question introuvable" }, { status: 404 });
    const q = qSnap.data() as QuizQuestionDoc;

    const selectedIndex = choiceToIndex(selected);
    const correctIndex = Number(q.correctIndex);
    const isCorrect = selectedIndex === correctIndex;

    const tags = (q.tags?.length ? q.tags : ["general"]).map((t) => String(t).toLowerCase());
    const b = difficultyFromScore(q.difficultyScore ?? null);
    const nextSkills = updateSkills(session.skills ?? {}, tags, isCorrect, b);

    const nextScore = (session.score ?? 0) + (isCorrect ? 1 : 0);
    const nextIndex = (session.currentIndex ?? 0) + 1;
    const totalQuestions = session.totalQuestions ?? 0;

    const answeredEntry = {
      questionId,
      selectedIndex,
      correctIndex,
      isCorrect,
      tags,
      difficulty: b,
      // ✅ IMPORTANT : Timestamp immédiat, autorisé dans un objet stocké dans un array
      answeredAt: nowTimestamp(),
    };

    const finished = nextIndex >= totalQuestions;

    // update session
    await sessionRef.update({
      currentIndex: nextIndex,
      score: nextScore,
      skills: nextSkills,
      answered: [...(session.answered ?? []), answeredEntry],
      finished,
      updatedAt: serverTimestamp(), // OK top-level
    });

    // If finished, return results
    if (finished) {
      return NextResponse.json({
        results: { score: nextScore, total: totalQuestions, skills: nextSkills },
        feedback: {
          isCorrect,
          correctIndex,
          storedExplanation: q.explanation ?? "",
        },
        progress: {
          currentIndex: nextIndex,
          totalQuestions,
          score: nextScore,
          skills: nextSkills,
          finished: true,
          tagsFilter,
        },
      });
    }

    // Otherwise pick next question now
    let query = db.collection("questions").where("active", "==", true).limit(300);

    if (tagsFilter.length > 0) {
      query = db
        .collection("questions")
        .where("active", "==", true)
        .where("tags", "array-contains-any", tagsFilter.slice(0, 10))
        .limit(300);
    }

    const qs = await query.get();
    const candidates: Array<{ docId: string; doc: QuizQuestionDoc }> = [];
    qs.forEach((d) => candidates.push({ docId: d.id, doc: d.data() as QuizQuestionDoc }));

    const askedIds = new Set([...(session.askedQuestionIds ?? []), questionId]);
    const chosen = selectNextQuestion(candidates, nextSkills, askedIds, tagsFilter);

    if (!chosen) {
      await sessionRef.update({ finished: true, updatedAt: serverTimestamp() });
      return NextResponse.json({
        results: { score: nextScore, total: totalQuestions, skills: nextSkills },
        feedback: { isCorrect, correctIndex, storedExplanation: q.explanation ?? "" },
        progress: {
          currentIndex: nextIndex,
          totalQuestions,
          score: nextScore,
          skills: nextSkills,
          finished: true,
          tagsFilter,
        },
      });
    }

    // mark as asked
    await sessionRef.update({
      askedQuestionIds: [...(session.askedQuestionIds ?? []), chosen.docId],
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      nextQuestion: toPublicQuestion(chosen.docId, chosen.doc),
      feedback: { isCorrect, correctIndex, storedExplanation: q.explanation ?? "" },
      progress: {
        currentIndex: nextIndex,
        totalQuestions,
        score: nextScore,
        skills: nextSkills,
        finished: false,
        tagsFilter,
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
