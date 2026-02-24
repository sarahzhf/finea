"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const EXPENSES = [
    { label: "Uber Eats - Commande repas", correct: "Restaurant" },
    { label: "Carrefour Market - Courses", correct: "Alimentation" },
    { label: "SNCF - Billet TGV Paris", correct: "Transport" },
    { label: "Netflix - Abonnement mensuel", correct: "Loisirs" },
    { label: "EDF - Facture électricité", correct: "Factures" },
    { label: "Zara - Vêtements hiver", correct: "Shopping" },
    { label: "McDonald's - Menu Best Of", correct: "Restaurant" },
    { label: "Monoprix - Alimentation", correct: "Alimentation" },
    { label: "Bolt - Course taxi", correct: "Transport" },
    { label: "Spotify Premium - Abo", correct: "Loisirs" },
    { label: "Loyer - Virement mensuel", correct: "Logement" },
    { label: "Free Mobile - Forfait", correct: "Factures" },
    { label: "Deliveroo - Pizza Napoli", correct: "Restaurant" },
    { label: "Auchan Drive - Courses", correct: "Alimentation" },
    { label: "Lime - Trottinette 15min", correct: "Transport" },
    { label: "Steam - Jeu vidéo", correct: "Loisirs" },
    { label: "Engie - Gaz naturel", correct: "Factures" },
    { label: "H&M - T-shirt pack", correct: "Shopping" },
    { label: "KFC - Bucket familial", correct: "Restaurant" },
    { label: "Lidl - Courses hebdo", correct: "Alimentation" },
    { label: "RATP - Pass Navigo", correct: "Transport" },
    { label: "Apple Music - Abonnement", correct: "Loisirs" },
    { label: "Assurance habitation", correct: "Factures" },
    { label: "Pharmacie - Médicaments", correct: "Santé" },
    { label: "Salle de sport - Abo", correct: "Santé" },
    { label: "Boulangerie Paul - Petit déj", correct: "Alimentation" },
    { label: "Amazon - Colis tech", correct: "Shopping" },
    { label: "Ikea - Déco maison", correct: "Logement" },
    { label: "Cinéma UGC - 2 places", correct: "Loisirs" },
    { label: "Bouygues Telecom - Box", correct: "Factures" },
];

const CATEGORIES = [
    "Alimentation", "Restaurant", "Transport", "Loisirs",
    "Factures", "Shopping", "Logement", "Santé",
];

const GAME_DURATION = 30;

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function BudgetBlitzPage() {
    const [gameState, setGameState] = useState<"ready" | "playing" | "finished">("ready");
    const [shuffledExpenses, setShuffledExpenses] = useState(shuffle(EXPENSES));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [bestCombo, setBestCombo] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (gameState !== "playing") return;
        if (timeLeft <= 0) {
            setGameState("finished");
            return;
        }
        const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    const startGame = () => {
        setShuffledExpenses(shuffle(EXPENSES));
        setCurrentIndex(0);
        setScore(0);
        setCombo(0);
        setBestCombo(0);
        setTimeLeft(GAME_DURATION);
        setTotal(0);
        setFeedback(null);
        setGameState("playing");
    };

    const handleCategorize = useCallback(
        (category: string) => {
            if (gameState !== "playing" || currentIndex >= shuffledExpenses.length) return;

            const expense = shuffledExpenses[currentIndex];
            const isCorrect = expense.correct === category;
            setTotal((t) => t + 1);

            if (isCorrect) {
                const newCombo = combo + 1;
                setCombo(newCombo);
                setBestCombo((b) => Math.max(b, newCombo));
                setScore((s) => s + (newCombo >= 3 ? 2 : 1));
                setFeedback("correct");
            } else {
                setCombo(0);
                setFeedback("wrong");
            }

            setTimeout(() => setFeedback(null), 300);

            if (currentIndex + 1 >= shuffledExpenses.length) {
                setGameState("finished");
            } else {
                setCurrentIndex((i) => i + 1);
            }
        },
        [gameState, currentIndex, shuffledExpenses, combo]
    );

    const currentExpense = shuffledExpenses[currentIndex];
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;

    return (
        <div className="space-y-6 pb-20 sm:pb-0">
            <header className="flex items-center space-x-3 rounded-2xl bg-white p-6 shadow-sm">
                <Link href="/missions" className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">⚡ Budget Blitz</h1>
                    <p className="text-sm text-gray-500">Catégorise les dépenses en 30 secondes</p>
                </div>
            </header>

            {/* ===== READY ===== */}
            {gameState === "ready" && (
                <div className="rounded-2xl bg-white border border-gray-200 p-8 text-center shadow-sm">
                    <div className="text-5xl mb-4">⚡</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Budget Blitz</h2>
                    <p className="text-sm text-gray-600 mb-2">
                        Catégorise le plus de dépenses possible en <span className="font-bold text-blue-600">30 secondes</span> !
                    </p>
                    <p className="text-xs text-gray-400 mb-6">
                        Enchaîne les bonnes réponses pour des combos bonus ×2
                    </p>
                    <button onClick={startGame} className="w-full rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white hover:bg-blue-500 transition-colors shadow-md">
                        🚀 Jouer
                    </button>
                </div>
            )}

            {/* ===== PLAYING ===== */}
            {gameState === "playing" && (
                <div className="space-y-4">
                    {/* Timer + Score */}
                    <div className="flex items-center justify-between">
                        <span className={`text-2xl font-bold ${timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-blue-600"}`}>
                            {timeLeft}s
                        </span>
                        <div className="flex items-center gap-3">
                            {combo >= 2 && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-semibold animate-bounce">
                                    🔥 x{combo}
                                </span>
                            )}
                            <span className="text-lg font-bold text-gray-900">{score} pts</span>
                        </div>
                    </div>

                    {/* Timer bar */}
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                            style={{ width: `${(timeLeft / GAME_DURATION) * 100}%` }}
                        />
                    </div>

                    {/* Expense card */}
                    <div
                        className={`rounded-2xl p-6 text-center border-2 transition-colors duration-200 ${
                            feedback === "correct"
                                ? "bg-green-50 border-green-300"
                                : feedback === "wrong"
                                ? "bg-red-50 border-red-300"
                                : "bg-white border-gray-200"
                        }`}
                    >
                        <p className="text-xs text-gray-400 mb-2">Catégorise cette dépense :</p>
                        <p className="text-lg font-semibold text-gray-900">{currentExpense?.label}</p>
                    </div>

                    {/* Category buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => handleCategorize(cat)}
                                className="py-3 px-2 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm font-medium active:scale-95 active:bg-blue-50 active:border-blue-300 transition-all hover:border-blue-200 hover:shadow-sm"
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ===== FINISHED ===== */}
            {gameState === "finished" && (
                <div className="rounded-2xl bg-white border border-gray-200 p-8 text-center shadow-sm space-y-5">
                    <div className="text-5xl">
                        {accuracy >= 80 ? "🏆" : accuracy >= 50 ? "💪" : "📘"}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">{score} points</h2>
                    <p className="text-sm text-gray-500">
                        {total} dépenses catégorisées · {accuracy}% de précision
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-blue-50 p-3">
                            <p className="text-xl font-bold text-blue-700">{score}</p>
                            <p className="text-[10px] text-gray-500 mt-1">Score</p>
                        </div>
                        <div className="rounded-xl bg-orange-50 p-3">
                            <p className="text-xl font-bold text-orange-700">{bestCombo}</p>
                            <p className="text-[10px] text-gray-500 mt-1">Meilleur combo</p>
                        </div>
                        <div className="rounded-xl bg-green-50 p-3">
                            <p className="text-xl font-bold text-green-700">{accuracy}%</p>
                            <p className="text-[10px] text-gray-500 mt-1">Précision</p>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500">
                        {accuracy >= 80
                            ? "Excellent ! Tu maîtrises la catégorisation budgétaire 🔥"
                            : accuracy >= 50
                            ? "Bien joué ! Avec un peu de pratique tu seras expert 💪"
                            : "Continue de t'entraîner, tu vas progresser 📈"}
                    </p>

                    <div className="space-y-2">
                        <button onClick={startGame} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors">
                            🔄 Rejouer
                        </button>
                        <Link href="/missions" className="block w-full rounded-xl bg-gray-100 border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors text-center">
                            ← Retour aux mini-jeux
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
