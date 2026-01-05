import { NextResponse } from "next/server";
import { getFirestore, serverTimestamp } from "@/lib/firebase/admin";
import type { QuizQuestionDoc, QuizSessionDoc } from "@/lib/quiz/types";
import { selectNextQuestion } from "@/lib/quiz/adaptive";
import { toPublicQuestion } from "@/lib/quiz/transform";

export async function GET(_: Request, { params }: { params: { sessionId: string } }) {
  try {
    const db = getFirestore();
    const sessionRef = db.collection("quiz_sessions").doc(params.sessionId);
    const snap = await sessionRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    const session = snap.data() as QuizSessionDoc;

    // ✅ Normalisation défensive : tagsFilter doit toujours être un tableau
    const tagsFilter = Array.isArray(session.tagsFilter) ? session.tagsFilter : [];

    // session finie ?
    if (session.finished || (session.currentIndex ?? 0) >= (session.totalQuestions ?? 0)) {
      return NextResponse.json({
        progress: {
          currentIndex: session.currentIndex ?? 0,
          totalQuestions: session.totalQuestions ?? 0,
          score: session.score ?? 0,
          skills: session.skills ?? {},
          finished: true,
          tagsFilter,
        },
      });
    }

    // Charger des candidats (MVP: on prend un lot puis sélection adaptative)
    let query = db.collection("questions").where("active", "==", true).limit(300);

    if (tagsFilter.length > 0) {
      // Firestore "array-contains-any" max 10 valeurs
      query = db
        .collection("questions")
        .where("active", "==", true)
        .where("tags", "array-contains-any", tagsFilter.slice(0, 10))
        .limit(300);
    }

    const qs = await query.get();
    const candidates: Array<{ docId: string; doc: QuizQuestionDoc }> = [];
    qs.forEach((d) => candidates.push({ docId: d.id, doc: d.data() as QuizQuestionDoc }));

    const askedIds = new Set<string>(session.askedQuestionIds ?? []);
    const chosen = selectNextQuestion(candidates, session.skills ?? {}, askedIds, tagsFilter);

    if (!chosen) {
      // plus de questions disponibles
      await sessionRef.update({ finished: true, updatedAt: serverTimestamp() });

      return NextResponse.json({
        progress: {
          currentIndex: session.currentIndex ?? 0,
          totalQuestions: session.totalQuestions ?? 0,
          score: session.score ?? 0,
          skills: session.skills ?? {},
          finished: true,
          tagsFilter,
        },
      });
    }

    // marquer comme "asked" (pas encore answered)
    await sessionRef.update({
      askedQuestionIds: [...(session.askedQuestionIds ?? []), chosen.docId],
      updatedAt: serverTimestamp(),
    });

    const question = toPublicQuestion(chosen.docId, chosen.doc);

    return NextResponse.json({
      question,
      progress: {
        currentIndex: session.currentIndex ?? 0,
        totalQuestions: session.totalQuestions ?? 0,
        score: session.score ?? 0,
        skills: session.skills ?? {},
        finished: false,
        tagsFilter,
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}

