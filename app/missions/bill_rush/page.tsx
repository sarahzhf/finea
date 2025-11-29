

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LaneType = "income" | "essential" | "fun" | "invest";

type LaneItem = {
  id: number;
  type: LaneType;
  label: string;
  amount: number; // positif = gain, négatif = coût
};

type Cell = LaneItem | null;

const LANES = 3;
const ROWS = 6;
const TICK_MS = 1200; // 1,2 seconde par "case" pour laisser le temps de lire
const MAX_STEPS = 20; // plus d'étapes pour que le mois dure un peu plus longtemps

let nextId = 1;

function createRandomItem(step: number): LaneItem {
  // Quelques situations pas évidentes selon le moment du "mois"
  const pool: LaneItem[] = [
    {
      id: nextId++,
      type: "income",
      label: "Salaire",
      amount: 1200,
    },
    {
      id: nextId++,
      type: "income",
      label: "Remb. ami",
      amount: 40,
    },
    {
      id: nextId++,
      type: "essential",
      label: "Loyer",
      amount: -650,
    },
    {
      id: nextId++,
      type: "essential",
      label: "Transports",
      amount: -90,
    },
    {
      id: nextId++,
      type: "fun",
      label: "Uber Eats",
      amount: -28,
    },
    {
      id: nextId++,
      type: "fun",
      label: "Shopping -40%",
      amount: -80,
    },
    {
      id: nextId++,
      type: "invest",
      label: "Formation",
      amount: -120,
    },
    {
      id: nextId++,
      type: "invest",
      label: "Matériel boulot",
      amount: -90,
    },
  ];

  // 0 : Salaire
  if (step === 0) {
    return pool[0]; // "Salaire"
  }

  // 1 : Loyer (prélèvement unique en début de mois)
  if (step === 1) {
    return pool[2]; // "Loyer" (-650 €)
  }

  // 2 : Abonnement de transports (prélèvement mensuel)
  if (step === 2) {
    return pool[3]; // "Transports" (-90 €)
  }

  // Fonction utilitaire pour tirer dans un sous-ensemble d'indices
  const pickFrom = (indices: number[]) => {
    const idx = indices[Math.floor(Math.random() * indices.length)];
    return pool[idx];
  };

  // Légèrement biaisé selon le moment du "mois"
  if (step < 6) {
    // début / premier tiers après les gros prélèvements :
    // revenus secondaires + un peu de fun / invest, sans Salaire / Loyer / Transports
    return pickFrom([1, 4, 6]); // Remb. ami, Uber Eats, Formation
  }

  if (step > 10) {
    // fin de mois : plus de tentations et "investissements" (sans Salaire / Loyer / Transports)
    return pickFrom([4, 5, 6, 7]); // fun + invest
  }

  // milieu de mois : tout sauf Salaire / Loyer / Transports
  return pickFrom([1, 4, 5, 6, 7]);
}

export default function BillRushPage() {
  const router = useRouter();

  const [grid, setGrid] = useState<Cell[][]>(() =>
    Array.from({ length: ROWS }, () => Array.from({ length: LANES }, () => null)),
  );
  const [playerLane, setPlayerLane] = useState(1); // 0,1,2
  const [step, setStep] = useState(0);
  const [balance, setBalance] = useState(400);
  const [essentialPaid, setEssentialPaid] = useState(0);
  const [funScore, setFunScore] = useState(0);
  const [investScore, setInvestScore] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [mode, setMode] = useState<"demo" | "play">("demo");

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setGrid((prev) => {
        const newGrid: Cell[][] = Array.from({ length: ROWS }, () =>
          Array.from({ length: LANES }, () => null),
        );

        // Faire descendre les items
        for (let r = ROWS - 1; r >= 0; r--) {
          for (let c = 0; c < LANES; c++) {
            const cell = prev[r][c];
            if (!cell) continue;
            const newRow = r + 1;

            if (newRow === ROWS - 1 && c === playerLane) {
              // Collision avec le joueur
              applyCollision(cell);
              continue; // Consommé
            }

            if (newRow < ROWS) {
              newGrid[newRow][c] = cell;
            }
          }
        }

        // Nouvelle carte qui apparaît en haut
        if (step < MAX_STEPS) {
          const spawnLane = Math.floor(Math.random() * LANES);
          const item = createRandomItem(step);
          newGrid[0][spawnLane] = item;
        }

        return newGrid;
      });

      setStep((prev) => {
        const next = prev + 1;
        if (next >= MAX_STEPS) {
          setIsRunning(false);
        }
        return next;
      });
    }, TICK_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, playerLane, step]);

  const applyCollision = (item: LaneItem) => {
    setBalance((prev) => prev + item.amount);

    if (item.type === "essential") {
      setEssentialPaid((prev) => prev + 1);
    } else if (item.type === "fun") {
      setFunScore((prev) => prev + 1);
    } else if (item.type === "invest") {
      setInvestScore((prev) => prev + 1);
    }

    let text = "";
    if (item.type === "income") {
      text = `Tu encaisses : ${item.label} (+${item.amount} €).`;
    } else if (item.type === "essential") {
      text = `Facture payée : ${item.label} (${item.amount} €). Tu restes à jour, mais ton cash diminue.`;
    } else if (item.type === "fun") {
      text = `Plaisir immédiat : ${item.label} (${item.amount} €). Ton mois est plus fun, ton budget un peu moins.`;
    } else if (item.type === "invest") {
      text = `Tu investis : ${item.label} (${item.amount} €). Tu serres le budget maintenant pour potentiellement gagner plus plus tard.`;
    }
    setLastEvent(text);
  };

  const moveLeft = () => {
    setPlayerLane((prev) => Math.max(0, prev - 1));
  };

  const moveRight = () => {
    setPlayerLane((prev) => Math.min(LANES - 1, prev + 1));
  };

  const resetGame = () => {
    setGrid(
      Array.from({ length: ROWS }, () => Array.from({ length: LANES }, () => null)),
    );
    setPlayerLane(1);
    setStep(0);
    setBalance(400);
    setEssentialPaid(0);
    setFunScore(0);
    setInvestScore(0);
    setIsRunning(true);
    setLastEvent(null);
  };

  const monthFinished = !isRunning && step >= MAX_STEPS;

  const balanceColor =
    balance < 0 ? "text-rose-400" : balance < 100 ? "text-amber-300" : "text-emerald-300";

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-[#020617] via-[#020617] to-[#0b1120] text-slate-50 px-3 py-4">
      <div className="relative w-full max-w-[420px] aspect-[9/16] rounded-[40px] border border-white/10 bg-black/40 shadow-[0_0_60px_rgba(15,23,42,0.9)] overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Mini‑jeu
            </p>
            <h1 className="text-lg font-semibold text-slate-50">Bill Rush</h1>
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
              Chaque partie représente un mois. Tu avances dans un couloir avec 3 lignes et
              tu dois récupérer tes revenus, payer (ou esquiver) certaines factures, et
              décider quand accepter les tentations ou investir sur toi.
            </p>
          </div>

          {/* Comment ça marche */}
          <div className="mt-3 rounded-3xl bg-black/50 border border-white/10 px-4 py-3 space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-100">
              Comment ça marche ?
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-300">
              <li>Le mois avance automatiquement : les cases descendent vers toi.</li>
              <li>Swipe ou tape à gauche/droite pour changer de ligne.</li>
              <li>Si une case arrive sur ta ligne, tu encaisses le revenu ou subis la dépense.</li>
              <li>
                Certaines dépenses sont tentantes ou utiles. Il n&apos;y a pas toujours un
                &quot;bon&quot; choix évident.
              </li>
            </ul>
          </div>

          {/* Jauge de mois & solde */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Solde estimé</span>
              <span className={`text-sm font-semibold ${balanceColor}`}>
                {balance} €
              </span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                <span>Début du mois</span>
                <span>Fin du mois</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-400"
                  style={{ width: `${(step / MAX_STEPS) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Objectif du mois */}
          <div className="mt-2 rounded-2xl bg-black/40 border border-white/10 px-3 py-2">
            <p className="text-[10px] text-slate-300">
              Ton objectif : terminer le mois avec un solde supérieur ou égal à 0 €, payer au moins quelques
              factures essentielles et éviter que les dépenses plaisir prennent toute la place.
            </p>
          </div>

          {/* Bouton pour démarrer la partie */}
          {!isRunning && step === 0 && (
            <div className="mt-3 flex justify-center">
              <button
                onClick={() => setIsRunning(true)}
                className="rounded-full bg-white text-slate-900 text-[11px] font-semibold px-4 py-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.8)] hover:bg-slate-100 transition"
              >
                Commencer le mois
              </button>
            </div>
          )}

          {/* Zone de jeu */}
          <div className="mt-4 mx-auto w-full max-w-xs rounded-3xl bg-slate-950/80 border border-white/10 px-2 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.9)]">
            <div className="grid grid-cols-3 gap-1 mb-1">
              {Array.from({ length: LANES }).map((_, lane) => (
                <div
                  key={lane}
                  className="text-[9px] text-center text-slate-500 uppercase tracking-[0.16em]"
                >
                  {lane === 0 ? "Gauche" : lane === 1 ? "Centre" : "Droite"}
                </div>
              ))}
            </div>
            <div className="grid" style={{ gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))` }}>
              {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-3 gap-1 mb-1">
                  {row.map((cell, colIndex) => {
                    const isPlayerRow = rowIndex === ROWS - 1 && colIndex === playerLane;
                    const baseClasses =
                      "h-9 rounded-2xl flex items-center justify-center text-[9px] text-center px-1 border";
                    let colorClasses =
                      "bg-slate-900/60 border-slate-700/80 text-slate-400";

                    if (cell) {
                      if (cell.type === "income") {
                        colorClasses =
                          "bg-emerald-500/15 border-emerald-400/50 text-emerald-200";
                      } else if (cell.type === "essential") {
                        colorClasses =
                          "bg-amber-500/15 border-amber-400/50 text-amber-200";
                      } else if (cell.type === "fun") {
                        colorClasses =
                          "bg-rose-500/15 border-rose-400/50 text-rose-200";
                      } else if (cell.type === "invest") {
                        colorClasses =
                          "bg-sky-500/15 border-sky-400/50 text-sky-200";
                      }
                    }

                    return (
                      <div
                        key={colIndex}
                        className={`${baseClasses} ${colorClasses} ${
                          isPlayerRow ? "relative" : ""
                        }`}
                      >
                        {cell ? (
                          <div className="flex flex-col items-center leading-tight">
                            <span className="truncate max-w-[70px]">{cell.label}</span>
                            <span className="text-[8px] opacity-80">
                              {cell.amount > 0 ? `+${cell.amount} €` : `${cell.amount} €`}
                            </span>
                          </div>
                        ) : null}
                        {isPlayerRow && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="h-7 w-7 rounded-full bg-sky-400/90 shadow-[0_0_20px_rgba(56,189,248,0.8)] border border-white/60 flex items-center justify-center text-[9px] font-semibold text-slate-900">
                              Toi
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Contrôles tactiles */}
            <div className="mt-2 grid grid-cols-3 gap-1 text-[9px]">
              <button
                onClick={moveLeft}
                className="rounded-2xl bg-white/5 border border-white/15 py-1 active:bg-white/10"
              >
                ◀ Gauche
              </button>
              <div className="rounded-2xl bg-white/3 border border-dashed border-white/10 flex items-center justify-center text-slate-400">
                Tape ou swipe pour changer de ligne
              </div>
              <button
                onClick={moveRight}
                className="rounded-2xl bg-white/5 border border-white/15 py-1 active:bg-white/10"
              >
                Droite ▶
              </button>
            </div>
          </div>

          {/* Dernier événement */}
          {lastEvent && (
            <div className="mt-3 rounded-2xl bg-black/70 border border-white/10 px-3 py-2">
              <p className="text-[10px] text-slate-200">{lastEvent}</p>
            </div>
          )}

          {/* Résumé de fin de mois */}
          {monthFinished && (
            <div className="mt-3 rounded-3xl bg-black/70 border border-white/10 px-4 py-3 space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-100">
                Bilan du mois
              </p>
              <p className="text-[10px] text-slate-300">
                Tu termines le mois avec un solde de{" "}
                <span className={balanceColor}>{balance} €</span>.
              </p>
              <p className="text-[10px] text-slate-300">
                Factures essentielles traitées :{" "}
                <span className="text-amber-300">{essentialPaid}</span>
              </p>
              <p className="text-[10px] text-slate-300">
                Moments plaisir :{" "}
                <span className="text-rose-300">{funScore}</span>
              </p>
              <p className="text-[10px] text-slate-300">
                Investissements sur toi / ton futur :{" "}
                <span className="text-sky-300">{investScore}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Il n&apos;y a pas de score parfait. L&apos;idée est de voir comment tu arbitres
                entre confort maintenant, obligations et futur.
              </p>
              <button
                onClick={resetGame}
                className="mt-2 w-full rounded-full bg-white text-slate-900 text-[11px] font-semibold py-1.5 hover:bg-slate-100 transition"
              >
                Rejouer le mois
              </button>
            </div>
          )}

          {/* Boutons mode (en bas) */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsRunning(true);
                  setMode("demo");
                  resetGame();
                }}
                className={
                  "rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition " +
                  (mode === "demo"
                    ? "bg:white bg-white text-slate-900"
                    : "bg-white/5 text-slate-200 border border-white/10")
                }
              >
                Démo
              </button>
              <button
                onClick={() => {
                  setIsRunning(true);
                  setMode("play");
                  resetGame();
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
              Le mois avance tout seul. Tu choisis juste sur quelle ligne tu es.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}