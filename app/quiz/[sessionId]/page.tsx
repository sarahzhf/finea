"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnswerChoice, QuizQuestionPublic, SkillProfile } from "@/lib/quiz/types";

type ApiState =
  | { status: "loading" }
  | { status: "question"; question: QuizQuestionPublic; progress: any }
  | { status: "review"; question: QuizQuestionPublic; progress: any; feedback: Feedback; nextQuestion?: QuizQuestionPublic }
  | { status: "finished"; progress: any; score: number; total: number; skills?: SkillProfile }
  | { status: "error"; message: string };

type Feedback = {
  isCorrect: boolean;
  correctIndex: number;
  storedExplanation?: string;
};

const LETTERS: AnswerChoice[] = ["A", "B", "C", "D"];

function skillLabel(theta: number) {
  if (theta <= -1.2) return "Débutant";
  if (theta <= 0.4) return "Intermédiaire";
  return "Avancé";
}

function SkillCard({ skills }: { skills: SkillProfile }) {
  const entries = Object.entries(skills)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (entries.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold">Profil de compétences</div>
        <div className="text-xs text-white/60 mt-1">Pas encore assez de réponses pour estimer un profil.</div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-semibold">Profil de compétences</div>
        <div className="text-xs text-white/60">Estimé en direct</div>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {entries.map(([tag, theta]) => {
          const pct = Math.round(((Math.max(-3, Math.min(3, theta)) + 3) / 6) * 100);
          return (
            <div key={tag} className="">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/80">{tag}</span>
                <span className="text-white/60">{skillLabel(theta)} ({pct}%)</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-2 rounded-full bg-[#F5D657]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-white/50">
        Modèle adaptatif léger (logistique) : la difficulté des questions et tes réponses ajustent un score par thème.
      </p>
    </div>
  );
}

export default function QuizSessionPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const sessionId = params.sessionId;

  const [state, setState] = useState<ApiState>({ status: "loading" });
  const [selected, setSelected] = useState<AnswerChoice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // LLM explanation modal
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainText, setExplainText] = useState<string>("");

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

    if (!res.ok) {
      setState({ status: "error", message: data?.error ?? "Erreur serveur" });
      return;
    }

    if (!data?.question) {
      const p = data?.progress ?? {};
      setState({
        status: "finished",
        progress: p,
        score: p.score ?? 0,
        total: p.totalQuestions ?? 0,
        skills: p.skills ?? {},
      });
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
        body: JSON.stringify({ selected, questionId: state.question.questionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur");

      if (data.results) {
        setState({
          status: "finished",
          progress: data.progress,
          score: data.results.score,
          total: data.results.total,
          skills: data.results.skills ?? data.progress?.skills ?? {},
        });
        return;
      }

      setState({
        status: "review",
        question: state.question,
        progress: data.progress,
        feedback: data.feedback,
        nextQuestion: data.nextQuestion,
      });
    } catch (e: any) {
      alert(e?.message ?? "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  async function continueToNext() {
    if (state.status !== "review") return;
    const next = state.nextQuestion;
    if (next) {
      setSelected(null);
      setState({ status: "question", question: next, progress: state.progress });
    } else {
      // fallback: reload
      await load();
    }
  }

  async function askExplanation() {
    const q =
      state.status === "review" ? state.question : state.status === "question" ? state.question : null;
    if (!q) return;

    setExplainOpen(true);
    setExplainText("");
    setExplainLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const selectedIndex =
        selected != null ? LETTERS.indexOf(selected) : undefined;

      const res = await fetch(`${origin}/api/quiz/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: q.questionId, selectedIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur");
      setExplainText(data?.explanation ?? "Pas de réponse.");
    } catch (e: any) {
      setExplainText(e?.message ?? "Erreur");
    } finally {
      setExplainLoading(false);
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
    const pct = state.total > 0 ? Math.round((state.score / state.total) * 100) : 0;
    return (
      <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">
        <div className="w-[390px] min-h-[780px] bg-[#0F2B52] rounded-[40px] border border-white/10 p-6 text-white">
          <h1 className="text-2xl font-bold">Résultats</h1>
          <p className="text-white/70 mt-2">
            Score : <span className="text-[#F5D657] font-semibold">{state.score}/{state.total}</span> ({pct}%)
          </p>

          <SkillCard skills={state.skills ?? {}} />

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

  const isReview = state.status === "review";
  const question = state.status === "question" ? state.question : state.question;
  const progress = state.progress;
  const entries = (Object.entries(question.answers) as [AnswerChoice, string][]);

  const correctChoice = isReview ? LETTERS[state.feedback.correctIndex] : null;

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">
      <div className="w-[390px] min-h-[780px] bg-[#0F2B52] rounded-[40px] border border-white/10 p-6 text-white relative">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-white/60">
            Question {progress.currentIndex + 1} / {progress.totalQuestions}
          </div>
          <div className="text-xs text-white/60">
            Score : <span className="text-[#F5D657] font-semibold">{progress.score}</span>
          </div>
        </div>

        <h2 className="text-lg font-semibold leading-snug">{question.question_text}</h2>
        <p className="text-xs text-white/50 mt-1">
          {question.theme} • Niveau {question.difficulty_level}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {entries.map(([k, label]) => {
            const isSelected = selected === k;
            const isCorrect = isReview && correctChoice === k;
            const isWrongSelected = isReview && isSelected && correctChoice !== k;

            const cls = isReview
              ? isCorrect
                ? "border-green-400 bg-green-500/10"
                : isWrongSelected
                  ? "border-red-300 bg-red-500/10"
                  : "border-white/10 bg-white/5 opacity-80"
              : isSelected
                ? "border-[#F5D657] bg-white/10"
                : "border-white/10 bg-white/5 hover:bg-white/10";

            return (
              <button
                key={k}
                onClick={() => !isReview && setSelected(k)}
                disabled={isReview}
                className={`w-full text-left rounded-2xl px-4 py-4 border transition ${cls}`}
              >
                <div className="text-xs text-white/60 mb-1">{k}</div>
                <div className="text-sm">{label}</div>
                {isReview && isCorrect && (
                  <div className="mt-2 text-xs text-green-300">Bonne réponse ✅</div>
                )}
                {isReview && isWrongSelected && (
                  <div className="mt-2 text-xs text-red-200">Ta réponse ❌</div>
                )}
              </button>
            );
          })}
        </div>

        {!isReview ? (
          <button
            disabled={!selected || submitting}
            onClick={submit}
            className="w-full mt-8 rounded-2xl py-4 bg-[#F5D657] text-black font-semibold disabled:opacity-60"
          >
            {submitting ? "Validation..." : "Valider"}
          </button>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            <div
              className={`rounded-2xl border p-4 ${
                state.feedback.isCorrect ? "border-green-400/40 bg-green-500/10" : "border-red-300/40 bg-red-500/10"
              }`}
            >
              <div className="text-sm font-semibold">
                {state.feedback.isCorrect ? "Correct 🎉" : "Pas tout à fait"}
              </div>
              <div className="text-xs text-white/70 mt-1">
                Bonne réponse : <span className="text-[#F5D657] font-semibold">{correctChoice}</span>
              </div>
              {state.feedback.storedExplanation?.trim() ? (
                <div className="text-xs text-white/80 mt-2">
                  {state.feedback.storedExplanation}
                </div>
              ) : (
                <div className="text-xs text-white/60 mt-2">
                  Pas d’explication enregistrée — tu peux demander au LLM.
                </div>
              )}
            </div>

            <button
              onClick={askExplanation}
              className="w-full rounded-2xl py-3 bg-white/10 border border-white/15 text-white font-semibold"
            >
              Demander une explication (LLM)
            </button>

            <button
              onClick={continueToNext}
              className="w-full rounded-2xl py-4 bg-[#F5D657] text-black font-semibold"
            >
              Continuer
            </button>

            <SkillCard skills={progress.skills ?? {}} />
          </div>
        )}

        {explainOpen && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full rounded-3xl bg-[#0B1C33] border border-white/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">Explication</div>
                <button
                  className="text-white/70 text-xl leading-none"
                  onClick={() => setExplainOpen(false)}
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>
              {explainLoading ? (
                <div className="text-sm text-white/70">Génération…</div>
              ) : (
                <div className="text-sm text-white/80 whitespace-pre-wrap">{explainText}</div>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  className="rounded-2xl px-4 py-2 bg-[#F5D657] text-black font-semibold"
                  onClick={() => setExplainOpen(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
