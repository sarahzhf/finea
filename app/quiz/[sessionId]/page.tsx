"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnswerChoice, QuizQuestionPublic } from "@/lib/quiz/types";

type ApiState =
  | { status: "loading" }
  | { status: "question"; question: QuizQuestionPublic; progress: any }
  | { status: "finished"; progress: any; score: number; total: number }
  | { status: "error"; message: string };

export default function QuizSessionPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const sessionId = params.sessionId;

  const [state, setState] = useState<ApiState>({ status: "loading" });
  const [selected, setSelected] = useState<AnswerChoice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setState({ status: "loading" });
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch(`${origin}/api/quiz/${sessionId}`);

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      const text = await res.text().catch(() => "");
      console.error("/api/quiz/[sessionId] non‑JSON response", res.status, text);
      setState({ status: "error", message: "Le serveur n’a pas renvoyé de JSON valide." });
      return;
    }

    if (!data || typeof data !== "object") {
      setState({ status: "error", message: "Réponse serveur invalide." });
      return;
    }

    if (!res.ok) {
      setState({ status: "error", message: data?.error ?? "Erreur serveur" });
      return;
    }
    if (!data.question) {
      setState({ status: "finished", progress: data.progress, score: data.progress.score, total: data.progress.totalQuestions });
      return;
    }
    setSelected(null);
    setState({ status: "question", question: data.question, progress: data.progress });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function submit() {
    if (!selected || state.status !== "question") return;
    setSubmitting(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${origin}/api/quiz/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur");

      if (data.results) {
        setState({ status: "finished", progress: data.progress, score: data.results.score, total: data.results.total });
      } else {
        setSelected(null);
        setState({ status: "question", question: data.nextQuestion, progress: data.progress });
      }
    } catch (e: any) {
      alert(e?.message ?? "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  if (state.status === "loading") {
    return (
      <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">
        <div className="w-[390px] min-h-[780px] bg-[#0F2B52] rounded-[40px] border border-white/10 p-6 text-white">
          Chargement...
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">
        <div className="w-[390px] min-h-[780px] bg-[#0F2B52] rounded-[40px] border border-white/10 p-6 text-white">
          <p className="text-red-200">Erreur : {state.message}</p>
          <button className="mt-4 underline" onClick={() => router.push("/quiz")}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (state.status === "finished") {
    const pct = Math.round((state.score / state.total) * 100);
    return (
      <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">
        <div className="w-[390px] min-h-[780px] bg-[#0F2B52] rounded-[40px] border border-white/10 p-6 text-white">
          <h1 className="text-2xl font-bold">Résultats</h1>
          <p className="text-white/70 mt-2">
            Score : <span className="text-[#F5D657] font-semibold">{state.score}/{state.total}</span> ({pct}%)
          </p>

          <button
            className="w-full mt-8 rounded-2xl py-4 bg-[#F5D657] text-black font-semibold"
            onClick={() => router.push("/quiz")}
          >
            Refaire un quiz
          </button>
        </div>
      </div>
    );
  }

  const { question, progress } = state;
  const entries = (Object.entries(question.answers) as [AnswerChoice, string][]);

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">
      <div className="w-[390px] min-h-[780px] bg-[#0F2B52] rounded-[40px] border border-white/10 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-white/60">
            Question {progress.currentIndex + 1} / {progress.totalQuestions}
          </div>
          <div className="text-xs text-white/60">
            Score : <span className="text-[#F5D657] font-semibold">{progress.score}</span>
          </div>
        </div>

        <h2 className="text-lg font-semibold leading-snug">{question.question_text}</h2>
        <p className="text-xs text-white/50 mt-1">{question.theme} • Niveau {question.difficulty_level}</p>

        <div className="mt-6 flex flex-col gap-3">
          {entries.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setSelected(k)}
              className={`w-full text-left rounded-2xl px-4 py-4 border transition ${
                selected === k
                  ? "border-[#F5D657] bg-white/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="text-xs text-white/60 mb-1">{k}</div>
              <div className="text-sm">{label}</div>
            </button>
          ))}
        </div>

        <button
          disabled={!selected || submitting}
          onClick={submit}
          className="w-full mt-8 rounded-2xl py-4 bg-[#F5D657] text-black font-semibold disabled:opacity-60"
        >
          {submitting ? "Validation..." : "Valider"}
        </button>
      </div>
    </div>
  );
}
