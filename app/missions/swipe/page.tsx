"use client";

import { useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";

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

const DEMO_CARDS: SwipeCard[] = [
  {
    id: 1,
    title: "Sortie resto imprévue",
    amount: "-35 €",
    description:
      "Tes amis te proposent un resto ce soir. Tu t'étais promis un mois sans resto, mais tu as passé une semaine épuisante.",
    leftLabel: "Refuser",
    rightLabel: "Accepter",
    leftImpact:
      "Tu refuses : ton budget reste aligné avec ton objectif d'épargne, mais tu rates un moment social qui t'aurait peut‑être reboosté.",
    rightImpact:
      "Tu acceptes : tu passes une bonne soirée, mais tu empiètes sur ton budget et devras compenser les prochains jours.",
  },
  {
    id: 2,
    title: "Promo -40% sur des baskets",
    amount: "-90 €",
    description:
      "Tu vois une paire de baskets en promo. Tu as déjà 2 paires en bon état, mais celles‑ci te motivent à faire plus de sport.",
    leftLabel: "Laisser passer",
    rightLabel: "Craquer",
    leftImpact:
      "Tu laisses passer : tu gardes ton argent pour des priorités plus hautes, mais tu perds peut‑être un petit boost de motivation.",
    rightImpact:
      "Tu craques : tu réduis ta marge d'épargne ce mois‑ci, mais si tu fais vraiment plus de sport, le gain sur ta santé peut valoir l'investissement.",
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
      "Tu investis : tu serres un peu le budget ce mois‑ci, mais tu mises sur une hausse potentielle de revenus à moyen terme.",
  },
  {
    id: 4,
    title: "Voyage last minute",
    amount: "-250 €",
    description:
      "Un week‑end last minute avec des amis, prix correct mais non prévu. Tu as un objectif d'épargne pour un projet plus gros.",
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
  const router = useRouter();
  const [mode, setMode] = useState<"demo" | "play">("demo");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [lastImpact, setLastImpact] = useState<string | null>(null);
  const [lastDecision, setLastDecision] = useState<"left" | "right" | null>(null);

  const currentCard = DEMO_CARDS[currentIndex] ?? null;

  const resetDeck = () => {
    setCurrentIndex(0);
    setDragX(0);
    setDragStartX(null);
    setLastImpact(null);
    setLastDecision(null);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragStartX(e.clientX);
    setLastDecision(null);
    setLastImpact(null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX === null) return;
    const delta = e.clientX - dragStartX;
    setDragX(delta);
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
      // revient au centre
      setDragX(0);
    }
    setDragStartX(null);
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentCard) return;
    setLastDecision(direction);
    const impact =
      direction === "left" ? currentCard.leftImpact : currentCard.rightImpact;
    setLastImpact(impact);

    // Petite transition puis passage à la carte suivante
    const outX = direction === "left" ? -400 : 400;
    setDragX(outX);
    setTimeout(() => {
      setDragX(0);
      setLastDecision(null);
      setCurrentIndex((prev) => (prev + 1) % DEMO_CARDS.length);
    }, 280);
  };

  const modeLabel =
    mode === "demo"
      ? "Démo guidée"
      : "Mode jouer (enchaîne les décisions et observe les impacts)";

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-[#020617] via-[#020617] to-[#0b1120] text-slate-50 px-3 py-4">
      <div className="relative w-full max-w-[420px] aspect-[9/16] rounded-[40px] border border-white/10 bg-black/40 shadow-[0_0_60px_rgba(15,23,42,0.9)] overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Mini‑jeu
            </p>
            <h1 className="text-lg font-semibold text-slate-50">
              Swipe Game
            </h1>
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
          <div className="mt-4 rounded-3xl bg-black/60 border border-white/10 px-4 py-3 space-y-2">
            <p className="text-[11px] font-semibold text-slate-100">
              Concept du jeu
            </p>
            <p className="text-[11px] text-slate-300 leading-snug">
              Des cartes de dépenses apparaissent une par une. Swipe à gauche ou à
              droite comme dans Tinder pour décider si tu refuses ou acceptes,
              et vois comment tes choix impactent ton mois.
            </p>
          </div>

          <div className="mt-3 rounded-3xl bg-black/50 border border-white/10 px-4 py-3 space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-100">
              Comment ça marche ?
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-300">
              <li>Chaque carte représente une situation financière pas totalement évidente.</li>
              <li>Swipe vers la gauche pour refuser, vers la droite pour accepter.</li>
              <li>Les deux choix ont un impact : aucun n&apos;est parfait ou totalement logique.</li>
              <li>Le but est de te faire réfléchir aux compromis, pas d&apos;avoir 20/20.</li>
            </ul>
          </div>

          <div className="mt-4 rounded-3xl bg-black/40 border border-white/15 px-4 py-3">
            <p className="text-[10px] text-slate-400">
              {modeLabel}
            </p>
          </div>

          {/* Zone de carte swipe */}
          <div className="mt-4 flex flex-col items-center gap-3">
            {currentCard ? (
              <>
                <div
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="w-full max-w-xs cursor-grab active:cursor-grabbing touch-none"
                  style={{
                    transform: `translateX(${dragX}px) rotate(${dragX * 0.04}deg)`,
                    transition: dragStartX ? "none" : "transform 0.2s ease-out",
                  }}
                >
                  <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.8)]">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                      Carte #{currentCard.id}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold text-slate-50">
                        {currentCard.title}
                      </p>
                      <p className="text-[11px] font-semibold text-rose-300">
                        {currentCard.amount}
                      </p>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-300">
                      {currentCard.description}
                    </p>
                  </div>
                </div>

                {/* Labels gauche / droite */}
                <div className="w-full max-w-xs flex items-center justify-between text-[9px] uppercase tracking-[0.16em] font-semibold">
                  <span
                    className={
                      dragX < -40 || lastDecision === "left"
                        ? "text-rose-400"
                        : "text-slate-500"
                    }
                  >
                    {currentCard.leftLabel}
                  </span>
                  <span
                    className={
                      dragX > 40 || lastDecision === "right"
                        ? "text-emerald-400"
                        : "text-slate-500"
                    }
                  >
                    {currentCard.rightLabel}
                  </span>
                </div>

                {/* Feedback sur le choix */}
                {lastImpact && (
                  <div className="w-full max-w-xs rounded-2xl bg-black/70 border border-white/10 px-3 py-2">
                    <p className="text-[10px] text-slate-200">{lastImpact}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[10px] text-slate-400">
                Plus de cartes pour le moment. Recharge la démo pour recommencer.
              </p>
            )}
          </div>

          {/* Boutons Démo / Jouer */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMode("demo");
                  resetDeck();
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
                  resetDeck();
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
              Swipe la carte pour décider. Les deux choix ont un coût.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}