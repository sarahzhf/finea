"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type SwipeCard = {
    id: number;
    title: string;
    amount: string;
    description: string;
    leftLabel: string;
    rightLabel: string;
    leftImpact: string;
    rightImpact: string;
};

const CARDS: SwipeCard[] = [
    {
        id: 1,
        title: "Sortie resto imprévue",
        amount: "-35 €",
        description:
            "Tes amis te proposent un resto ce soir. Tu t'étais promis un mois sans resto, mais tu as passé une semaine épuisante.",
        leftLabel: "Refuser",
        rightLabel: "Accepter",
        leftImpact:
            "Tu refuses : ton budget reste aligné avec ton objectif d'épargne, mais tu rates un moment social qui t'aurait peut-être reboosté.",
        rightImpact:
            "Tu acceptes : tu passes une bonne soirée, mais tu empiètes sur ton budget et devras compenser les prochains jours.",
    },
    {
        id: 2,
        title: "Promo -40% sur des baskets",
        amount: "-90 €",
        description:
            "Tu vois une paire de baskets en promo. Tu as déjà 2 paires en bon état, mais celles-ci te motivent à faire plus de sport.",
        leftLabel: "Laisser passer",
        rightLabel: "Craquer",
        leftImpact:
            "Tu laisses passer : tu gardes ton argent pour des priorités plus hautes, mais tu perds peut-être un petit boost de motivation.",
        rightImpact:
            "Tu craques : tu réduis ta marge d'épargne ce mois-ci, mais si tu fais vraiment plus de sport, le gain sur ta santé peut valoir l'investissement.",
    },
    {
        id: 3,
        title: "Formation en ligne",
        amount: "-120 €",
        description:
            "Une formation courte bien notée qui pourrait t'aider à augmenter ton salaire à moyen terme, mais ton budget du mois est déjà serré.",
        leftLabel: "Reporter",
        rightLabel: "Investir",
        leftImpact:
            "Tu reportes : tu protèges ton cash maintenant, mais tu repousses un investissement qui pourrait te rapporter plus plus tard.",
        rightImpact:
            "Tu investis : tu serres un peu le budget ce mois-ci, mais tu mises sur une hausse potentielle de revenus à moyen terme.",
    },
    {
        id: 4,
        title: "Voyage last minute",
        amount: "-250 €",
        description:
            "Un week-end last minute avec des amis, prix correct mais non prévu. Tu as un objectif d'épargne pour un projet plus gros.",
        leftLabel: "Dire non",
        rightLabel: "Partir",
        leftImpact:
            "Tu dis non : tu protèges ton projet principal, mais tu refuses un souvenir potentiellement fort avec tes proches.",
        rightImpact:
            "Tu pars : tu crées un super souvenir, mais tu t'éloignes de ton gros objectif et devras l'assumer plus tard.",
    },
    {
        id: 5,
        title: "Aide à un proche",
        amount: "-80 €",
        description:
            "Un proche te demande de l'aide ponctuelle. Tu peux l'aider, mais tu devras réduire d'autres postes (loisirs, restos...).",
        leftLabel: "Refuser",
        rightLabel: "Aider",
        leftImpact:
            "Tu refuses : tu protèges ton budget, mais tu peux te sentir coupable de ne pas avoir soutenu ton proche.",
        rightImpact:
            "Tu aides : tu tends la main, mais tu devras ajuster ton mois pour ne pas finir à découvert.",
    },
];

export default function SwipeGamePage() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dragX, setDragX] = useState(0);
    const [dragStartX, setDragStartX] = useState<number | null>(null);
    const [lastImpact, setLastImpact] = useState<string | null>(null);
    const [decisions, setDecisions] = useState<("left" | "right")[]>([]);
    const [finished, setFinished] = useState(false);

    const currentCard = CARDS[currentIndex] ?? null;

    const resetDeck = () => {
        setCurrentIndex(0);
        setDragX(0);
        setDragStartX(null);
        setLastImpact(null);
        setDecisions([]);
        setFinished(false);
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragStartX(e.clientX);
        setLastImpact(null);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragStartX === null) return;
        setDragX(e.clientX - dragStartX);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragStartX === null) return;
        const delta = e.clientX - dragStartX;
        const threshold = 80;
        if (delta > threshold && currentCard) {
            handleSwipe("right");
        } else if (delta < -threshold && currentCard) {
            handleSwipe("left");
        } else {
            setDragX(0);
        }
        setDragStartX(null);
    };

    const handleSwipe = (direction: "left" | "right") => {
        if (!currentCard) return;
        const impact = direction === "left" ? currentCard.leftImpact : currentCard.rightImpact;
        setLastImpact(impact);
        setDecisions((prev) => [...prev, direction]);

        const outX = direction === "left" ? -400 : 400;
        setDragX(outX);
        setTimeout(() => {
            setDragX(0);
            if (currentIndex + 1 >= CARDS.length) {
                setFinished(true);
            } else {
                setCurrentIndex((prev) => prev + 1);
            }
        }, 280);
    };

    return (
        <div className="space-y-6 pb-20 sm:pb-0">
            <header className="flex items-center space-x-3 rounded-2xl bg-white p-6 shadow-sm">
                <Link href="/missions" className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Swipe Game</h1>
                    <p className="text-sm text-gray-500">Accepte ou refuse les dépenses</p>
                </div>
            </header>

            {/* Rules */}
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Comment jouer ?</h2>
                <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Glisse la carte vers la <strong>gauche</strong> pour refuser</li>
                    <li>• Glisse la carte vers la <strong>droite</strong> pour accepter</li>
                    <li>• Chaque choix a un impact — aucun n&apos;est parfait !</li>
                </ul>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Carte {Math.min(currentIndex + 1, CARDS.length)} / {CARDS.length}</span>
                <div className="flex-1 mx-4 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${((currentIndex + (finished ? 1 : 0)) / CARDS.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Card area */}
            {!finished && currentCard ? (
                <div className="flex flex-col items-center gap-4">
                    <div
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className="w-full max-w-sm cursor-grab active:cursor-grabbing touch-none"
                        style={{
                            transform: `translateX(${dragX}px) rotate(${dragX * 0.04}deg)`,
                            transition: dragStartX ? "none" : "transform 0.2s ease-out",
                        }}
                    >
                        <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-md">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Carte #{currentCard.id}</p>
                            <div className="mt-2 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">{currentCard.title}</h3>
                                <span className="text-base font-bold text-red-500">{currentCard.amount}</span>
                            </div>
                            <p className="mt-3 text-sm text-gray-600 leading-relaxed">{currentCard.description}</p>
                        </div>
                    </div>

                    {/* Labels */}
                    <div className="w-full max-w-sm flex items-center justify-between text-sm font-semibold px-2">
                        <span className={dragX < -40 ? "text-red-500" : "text-gray-400"}>
                            ← {currentCard.leftLabel}
                        </span>
                        <span className={dragX > 40 ? "text-green-500" : "text-gray-400"}>
                            {currentCard.rightLabel} →
                        </span>
                    </div>

                    {/* Buttons for non-drag */}
                    <div className="w-full max-w-sm grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleSwipe("left")}
                            className="py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                            {currentCard.leftLabel}
                        </button>
                        <button
                            onClick={() => handleSwipe("right")}
                            className="py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm font-medium hover:bg-green-100 transition-colors"
                        >
                            {currentCard.rightLabel}
                        </button>
                    </div>

                    {/* Impact feedback */}
                    {lastImpact && (
                        <div className="w-full max-w-sm rounded-2xl bg-blue-50 border border-blue-100 p-4">
                            <p className="text-sm text-blue-800">{lastImpact}</p>
                        </div>
                    )}
                </div>
            ) : finished ? (
                <div className="rounded-2xl bg-white border border-gray-200 p-8 text-center shadow-sm">
                    <div className="text-4xl mb-3">🎯</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Terminé !</h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Tu as pris {decisions.length} décisions. Il n&apos;y a pas de score parfait — l&apos;important est de réfléchir aux compromis.
                    </p>
                    <button
                        onClick={resetDeck}
                        className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
                    >
                        Recommencer
                    </button>
                </div>
            ) : null}
        </div>
    );
}
