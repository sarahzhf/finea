"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BucketKey = "safety" | "midTerm" | "longTerm" | "fun";

type Scenario = {
  id: number;
  title: string;
  description: string;
  contextNote: string;
  total: number;
  recommended: Record<BucketKey, number>;
};

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "CDD + projet voyage",
    description:
      "Tu es en CDD 6 mois, tu veux partir en voyage dans 10 mois et tu n'as pas encore beaucoup d'épargne.",
    contextNote:
      "Tu as besoin de te protéger en priorité, tout en avançant un peu sur ton projet voyage.",
    total: 300,
    recommended: {
      safety: 160,
      midTerm: 80,
      longTerm: 20,
      fun: 40,
    },
  },
  {
    id: 2,
    title: "CDI + crédit conso",
    description:
      "Tu es en CDI, mais tu as un crédit conso à 18 % d'intérêt et tu n'as pas envie de sacrifier tout ton plaisir du mois.",
    contextNote:
      "Même avec un CDI, ton crédit coûte cher. Tu dois arbitrer entre rembourser vite, épargner et garder un peu de respiration.",
    total: 300,
    recommended: {
      safety: 120,
      midTerm: 90,
      longTerm: 60,
      fun: 30,
    },
  },
  {
    id: 3,
    title: "Études + alternance",
    description:
      "Tu es en alternance, tu veux garder une vie sociale correcte, tout en posant les bases d'un vrai coussin de sécurité.",
    contextNote:
      "Ton revenu n'est pas encore au max. Le but est de poser les fondations sans te priver à l'extrême.",
    total: 250,
    recommended: {
      safety: 120,
      midTerm: 60,
      longTerm: 40,
      fun: 30,
    },
  },
];

const BUCKET_LABELS: Record<BucketKey, string> = {
  safety: "Coussin de sécurité",
  midTerm: "Projets 1–3 ans",
  longTerm: "Investissement long terme",
  fun: "Plaisir / flex du mois",
};

export default function SavingsLabPage() {
  const router = useRouter();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [mode, setMode] = useState<"demo" | "play">("demo");

  const scenario = SCENARIOS[scenarioIndex];
  const [amounts, setAmounts] = useState<Record<BucketKey, number>>(
    () => ({ ...scenario.recommended }),
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  const totalBudget = scenario.total;
  const totalAllocated =
    amounts.safety + amounts.midTerm + amounts.longTerm + amounts.fun;
  const remaining = totalBudget - totalAllocated;

  const handleChange = (bucket: BucketKey, value: number) => {
    setAmounts((prev) => ({
      ...prev,
      [bucket]: value,
    }));
    setFeedback(null);
  };

  const goToNextScenario = () => {
    const next = (scenarioIndex + 1) % SCENARIOS.length;
    setScenarioIndex(next);
    setAmounts({ ...SCENARIOS[next].recommended });
    setFeedback(null);
  };

  const resetToRecommended = () => {
    setAmounts({ ...scenario.recommended });
    setFeedback(
      "Voici une répartition de base proposée par Finéa pour ce scénario. Tu peux l'ajuster librement.",
    );
  };

  const evaluateDistribution = () => {
    if (remaining > 0) {
      setFeedback(
        `Il te reste encore ${remaining} € à répartir. Décide où tu veux les placer avant de valider.`,
      );
      return;
    }
    if (remaining < 0) {
      setFeedback(
        `Tu as dépassé ton budget de ${Math.abs(
          remaining,
        )} €. Réduis une ou plusieurs catégories avant de valider.`,
      );
      return;
    }

    const { safety, midTerm, longTerm, fun } = amounts;
    let message = "";

    // Coussin de sécurité
    if (safety < totalBudget * 0.25) {
      message +=
        "Ton coussin de sécurité est assez faible par rapport au contexte. En cas d'imprévu, tu devras peut-être couper brutalement dans le reste. ";
    } else if (safety > totalBudget * 0.45) {
      message +=
        "Tu surprotèges beaucoup ton coussin de sécurité. C'est rassurant, mais tu immobilises peut-être trop d'argent au détriment de tes projets. ";
    } else {
      message +=
        "Ton coussin de sécurité est plutôt cohérent avec le contexte : tu es protégé sans tout bloquer. ";
    }

    // Moyen / long terme
    if (midTerm + longTerm < totalBudget * 0.35) {
      message +=
        "À moyen / long terme, tu avances doucement. Si tes objectifs sont ambitieux, il faudra peut-être accepter un peu moins de confort maintenant. ";
    } else {
      message +=
        "Tu donnes une vraie place à tes objectifs futurs, ce qui réduit la marge tout de suite mais renforce ton toi du futur. ";
    }

    // Plaisir
    if (fun < totalBudget * 0.08) {
      message +=
        "Tu te laisses très peu de marge plaisir. Sur le papier c'est sérieux, mais à long terme ça peut créer de la frustration et du craquage. ";
    } else if (fun > totalBudget * 0.3) {
      message +=
        "Tu te laisses une large enveloppe plaisir. Tu vis bien le présent, mais vérifie que ça ne retarde pas trop tes objectifs de fond. ";
    } else {
      message +=
        "Tu gardes une marge plaisir raisonnable : de quoi vivre un peu maintenant sans sacrifier totalement ton futur. ";
    }

    message +=
      "Il n'y a pas une répartition parfaite. L'idée est de voir si cette configuration ressemble à ce que tu veux vraiment, ou à ce que tu subis par habitude.";

    setFeedback(message);
  };

  const remainingColor =
    remaining === 0
      ? "text-emerald-300"
      : remaining > 0
      ? "text-sky-300"
      : "text-rose-300";

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-[#020617] via-[#020617] to-[#0b1120] text-slate-50 px-3 py-4">
      <div className="relative w-full max-w-[420px] aspect-[9/16] rounded-[40px] border border-white/10 bg-black/40 shadow-[0_0_60px_rgba(15,23,42,0.9)] overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Mini-jeu
            </p>
            <h1 className="text-lg font-semibold text-slate-50">Savings Lab</h1>
          </div>
          <button
            onClick={() => router.push("/missions")}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] text-slate-200 hover:bg-white/10 transition"
          >
            Retour
          </button>
        </div>

        {/* Content */}
        <div className="absolute inset-0 pt-16 pb-6 px-4 overflow-y-auto">
          {/* Concept */}
          <div className="mt-4 rounded-3xl bg-black/60 border border-white/10 px-4 py-3 space-y-2">
            <p className="text-[11px] font-semibold text-slate-100">Concept du jeu</p>
            <p className="text-[11px] text-slate-300 leading-snug">
              Tu as une somme à répartir entre ton coussin de sécurité, tes projets, ton
              futur et ton plaisir du mois. Chaque scénario change le contexte. Ton rôle :
              décider ce que tu privilégies vraiment.
            </p>
          </div>

          {/* Scénario */}
          <div className="mt-3 rounded-3xl bg-black/50 border border-white/10 px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold text-slate-100">
                Scénario {scenario.id} · {scenario.title}
              </p>
              <button
                onClick={goToNextScenario}
                className="text-[9px] rounded-full border border-white/15 bg-white/5 px-2 py-[2px] hover:bg-white/10"
              >
                Scénario suivant
              </button>
            </div>
            <p className="text-[10px] text-slate-300">{scenario.description}</p>
            <p className="text-[10px] text-slate-400 mt-1">{scenario.contextNote}</p>
          </div>

          {/* Budget global */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">À répartir</span>
              <span className="text-sm font-semibold text-slate-50">
                {totalBudget} €
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400">Reste à répartir</span>
              <span className={`text-sm font-semibold ${remainingColor}`}>
                {remaining === 0
                  ? "Tout est réparti"
                  : remaining > 0
                  ? `+${remaining} €`
                  : `${remaining} €`}
              </span>
            </div>
          </div>

          {/* Sliders de répartition */}
          <div className="mt-3 rounded-3xl bg-black/50 border border-white/10 px-3 py-3 space-y-2.5">
            {(Object.keys(BUCKET_LABELS) as BucketKey[]).map((key) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-200">{BUCKET_LABELS[key]}</span>
                  <span className="text-slate-300 font-semibold">
                    {amounts[key]} €
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={totalBudget}
                  step={10}
                  value={amounts[key]}
                  onChange={(e) => handleChange(key, Number(e.target.value))}
                  className="w-full cursor-pointer accent-sky-400"
                />
              </div>
            ))}
          </div>

          {/* Feedback / validation */}
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={evaluateDistribution}
              className="w-full rounded-full bg-white text-slate-900 text-[11px] font-semibold py-1.5 hover:bg-slate-100 transition disabled:opacity-60"
            >
              Valider cette répartition
            </button>
            <button
              onClick={resetToRecommended}
              className="w-full rounded-full bg-white/5 border border-white/15 text-[10px] text-slate-200 py-1.5 hover:bg-white/10 transition"
            >
              Voir la proposition de Finéa pour ce scénario
            </button>
          </div>

          {feedback && (
            <div className="mt-3 rounded-3xl bg-black/70 border border-white/10 px-3 py-2">
              <p className="text-[10px] text-slate-200">{feedback}</p>
            </div>
          )}

          {/* Boutons mode */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMode("demo");
                  resetToRecommended();
                }}
                className={
                  "rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition " +
                  (mode === "demo"
                    ? "bg-white text-slate-900"
                    : "bg-white/5 text-slate-200 border border-white/10")
                }
              >
                Démo
              </button>
              <button
                onClick={() => {
                  setMode("play");
                  setFeedback(null);
                }}
                className={
                  "rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition " +
                  (mode === "play"
                    ? "text-slate-900"
                    : "text-slate-900/80")
                }
                style={{
                  backgroundColor: mode === "play" ? "#38bdf8" : "#38bdf8CC",
                }}
              >
                Jouer
              </button>
            </div>
            <p className="text-[9px] text-slate-400">
              Teste plusieurs répartitions et regarde ce que ça raconte de tes priorités.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}