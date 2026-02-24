"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
        description: "Tu es en CDD 6 mois, tu veux partir en voyage dans 10 mois et tu n'as pas encore beaucoup d'épargne.",
        contextNote: "Tu as besoin de te protéger en priorité, tout en avançant un peu sur ton projet voyage.",
        total: 300,
        recommended: { safety: 160, midTerm: 80, longTerm: 20, fun: 40 },
    },
    {
        id: 2,
        title: "CDI + crédit conso",
        description: "Tu es en CDI, mais tu as un crédit conso à 18 % d'intérêt et tu n'as pas envie de sacrifier tout ton plaisir du mois.",
        contextNote: "Même avec un CDI, ton crédit coûte cher. Tu dois arbitrer entre rembourser vite, épargner et garder un peu de respiration.",
        total: 300,
        recommended: { safety: 120, midTerm: 90, longTerm: 60, fun: 30 },
    },
    {
        id: 3,
        title: "Études + alternance",
        description: "Tu es en alternance, tu veux garder une vie sociale correcte, tout en posant les bases d'un vrai coussin de sécurité.",
        contextNote: "Ton revenu n'est pas encore au max. Le but est de poser les fondations sans te priver à l'extrême.",
        total: 250,
        recommended: { safety: 120, midTerm: 60, longTerm: 40, fun: 30 },
    },
];

const BUCKET_LABELS: Record<BucketKey, { label: string; color: string; bg: string }> = {
    safety: { label: "🛡️ Coussin de sécurité", color: "text-amber-700", bg: "bg-amber-50" },
    midTerm: { label: "🎯 Projets 1–3 ans", color: "text-blue-700", bg: "bg-blue-50" },
    longTerm: { label: "📈 Investissement long terme", color: "text-purple-700", bg: "bg-purple-50" },
    fun: { label: "🎉 Plaisir du mois", color: "text-pink-700", bg: "bg-pink-50" },
};

export default function SavingsLabPage() {
    const [scenarioIndex, setScenarioIndex] = useState(0);
    const scenario = SCENARIOS[scenarioIndex];

    const [amounts, setAmounts] = useState<Record<BucketKey, number>>(() => ({ ...scenario.recommended }));
    const [feedback, setFeedback] = useState<string | null>(null);

    const totalBudget = scenario.total;
    const totalAllocated = amounts.safety + amounts.midTerm + amounts.longTerm + amounts.fun;
    const remaining = totalBudget - totalAllocated;

    const handleChange = (bucket: BucketKey, value: number) => {
        setAmounts((prev) => ({ ...prev, [bucket]: value }));
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
        setFeedback("Voici la répartition proposée par Finéa pour ce scénario. Tu peux l'ajuster librement.");
    };

    const evaluateDistribution = () => {
        if (remaining > 0) {
            setFeedback(`Il te reste encore ${remaining} € à répartir. Décide où tu veux les placer.`);
            return;
        }
        if (remaining < 0) {
            setFeedback(`Tu as dépassé ton budget de ${Math.abs(remaining)} €. Réduis une catégorie.`);
            return;
        }

        const { safety, midTerm, longTerm, fun } = amounts;
        let message = "";

        if (safety < totalBudget * 0.25) {
            message += "Ton coussin de sécurité est faible. En cas d'imprévu, tu devras couper brutalement dans le reste. ";
        } else if (safety > totalBudget * 0.45) {
            message += "Tu surprotèges ton coussin. C'est rassurant, mais tu immobilises peut-être trop au détriment de tes projets. ";
        } else {
            message += "Ton coussin de sécurité est cohérent : tu es protégé sans tout bloquer. ";
        }

        if (midTerm + longTerm < totalBudget * 0.35) {
            message += "À moyen/long terme, tu avances doucement. Si tes objectifs sont ambitieux, il faudra peut-être moins de confort maintenant. ";
        } else {
            message += "Tu donnes une vraie place à tes objectifs futurs — ça renforce ton toi du futur. ";
        }

        if (fun < totalBudget * 0.08) {
            message += "Très peu de marge plaisir. À long terme, ça peut créer de la frustration. ";
        } else if (fun > totalBudget * 0.3) {
            message += "Large enveloppe plaisir. Tu vis bien le présent, mais vérifie que ça ne retarde pas tes objectifs. ";
        } else {
            message += "Marge plaisir raisonnable : de quoi vivre sans sacrifier ton futur. ";
        }

        message += "Il n'y a pas de répartition parfaite. L'idée est de voir si cette configuration ressemble à ce que tu veux vraiment.";
        setFeedback(message);
    };

    const remainingColor = remaining === 0 ? "text-green-600" : remaining > 0 ? "text-blue-600" : "text-red-600";

    return (
        <div className="space-y-6 pb-20 sm:pb-0">
            <header className="flex items-center space-x-3 rounded-2xl bg-white p-6 shadow-sm">
                <Link href="/missions" className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Savings Lab</h1>
                    <p className="text-sm text-gray-500">Répartis ton épargne selon le scénario</p>
                </div>
            </header>

            {/* Scenario */}
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-900">
                        Scénario {scenario.id} — {scenario.title}
                    </h2>
                    <button onClick={goToNextScenario} className="text-xs text-blue-600 font-medium hover:underline">
                        Suivant →
                    </button>
                </div>
                <p className="text-sm text-gray-600">{scenario.description}</p>
                <p className="text-xs text-gray-400 mt-2">{scenario.contextNote}</p>
            </div>

            {/* Budget bar */}
            <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                <div>
                    <p className="text-xs text-gray-500">À répartir</p>
                    <p className="text-lg font-bold text-gray-900">{totalBudget} €</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Reste</p>
                    <p className={`text-lg font-bold ${remainingColor}`}>
                        {remaining === 0 ? "Tout réparti ✓" : remaining > 0 ? `+${remaining} €` : `${remaining} €`}
                    </p>
                </div>
            </div>

            {/* Sliders */}
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-5">
                {(Object.keys(BUCKET_LABELS) as BucketKey[]).map((key) => {
                    const bucket = BUCKET_LABELS[key];
                    return (
                        <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{bucket.label}</span>
                                <span className={`text-sm font-bold ${bucket.color}`}>{amounts[key]} €</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={totalBudget}
                                step={10}
                                value={amounts[key]}
                                onChange={(e) => handleChange(key, Number(e.target.value))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    );
                })}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
                <button onClick={evaluateDistribution} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors">
                    Valider cette répartition
                </button>
                <button onClick={resetToRecommended} className="w-full rounded-xl bg-gray-100 border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
                    Voir la proposition Finéa
                </button>
            </div>

            {/* Feedback */}
            {feedback && (
                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5">
                    <p className="text-sm text-blue-800 leading-relaxed">{feedback}</p>
                </div>
            )}
        </div>
    );
}
