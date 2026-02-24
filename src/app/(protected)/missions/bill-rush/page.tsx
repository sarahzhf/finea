"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type LaneType = "income" | "essential" | "fun" | "invest";
type LaneItem = { id: number; type: LaneType; label: string; amount: number };
type Cell = LaneItem | null;

const LANES = 3;
const ROWS = 6;
const TICK_MS = 1200;
const MAX_STEPS = 20;

let nextId = 1;

function createRandomItem(step: number): LaneItem {
    const pool: LaneItem[] = [
        { id: nextId++, type: "income", label: "Salaire", amount: 1200 },
        { id: nextId++, type: "income", label: "Remb. ami", amount: 40 },
        { id: nextId++, type: "essential", label: "Loyer", amount: -650 },
        { id: nextId++, type: "essential", label: "Transports", amount: -90 },
        { id: nextId++, type: "fun", label: "Uber Eats", amount: -28 },
        { id: nextId++, type: "fun", label: "Shopping -40%", amount: -80 },
        { id: nextId++, type: "invest", label: "Formation", amount: -120 },
        { id: nextId++, type: "invest", label: "Matériel boulot", amount: -90 },
    ];
    if (step === 0) return pool[0];
    if (step === 1) return pool[2];
    if (step === 2) return pool[3];
    const pickFrom = (indices: number[]) => pool[indices[Math.floor(Math.random() * indices.length)]];
    if (step < 6) return pickFrom([1, 4, 6]);
    if (step > 10) return pickFrom([4, 5, 6, 7]);
    return pickFrom([1, 4, 5, 6, 7]);
}

const CELL_COLORS: Record<LaneType, string> = {
    income: "bg-green-50 border-green-200 text-green-700",
    essential: "bg-amber-50 border-amber-200 text-amber-700",
    fun: "bg-red-50 border-red-200 text-red-600",
    invest: "bg-blue-50 border-blue-200 text-blue-700",
};

export default function BillRushPage() {
    const [grid, setGrid] = useState<Cell[][]>(() =>
        Array.from({ length: ROWS }, () => Array.from({ length: LANES }, () => null))
    );
    const [playerLane, setPlayerLane] = useState(1);
    const [step, setStep] = useState(0);
    const [balance, setBalance] = useState(400);
    const [essentialPaid, setEssentialPaid] = useState(0);
    const [funScore, setFunScore] = useState(0);
    const [investScore, setInvestScore] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [lastEvent, setLastEvent] = useState<string | null>(null);

    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            setGrid((prev) => {
                const newGrid: Cell[][] = Array.from({ length: ROWS }, () =>
                    Array.from({ length: LANES }, () => null)
                );
                for (let r = ROWS - 1; r >= 0; r--) {
                    for (let c = 0; c < LANES; c++) {
                        const cell = prev[r][c];
                        if (!cell) continue;
                        const newRow = r + 1;
                        if (newRow === ROWS - 1 && c === playerLane) {
                            applyCollision(cell);
                            continue;
                        }
                        if (newRow < ROWS) newGrid[newRow][c] = cell;
                    }
                }
                if (step < MAX_STEPS) {
                    const spawnLane = Math.floor(Math.random() * LANES);
                    newGrid[0][spawnLane] = createRandomItem(step);
                }
                return newGrid;
            });
            setStep((prev) => {
                const next = prev + 1;
                if (next >= MAX_STEPS) setIsRunning(false);
                return next;
            });
        }, TICK_MS);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRunning, playerLane, step]);

    const applyCollision = (item: LaneItem) => {
        setBalance((prev) => prev + item.amount);
        if (item.type === "essential") setEssentialPaid((prev) => prev + 1);
        else if (item.type === "fun") setFunScore((prev) => prev + 1);
        else if (item.type === "invest") setInvestScore((prev) => prev + 1);

        let text = "";
        if (item.type === "income") text = `💰 ${item.label} (+${item.amount} €)`;
        else if (item.type === "essential") text = `📄 Facture payée : ${item.label} (${item.amount} €)`;
        else if (item.type === "fun") text = `🎉 Plaisir : ${item.label} (${item.amount} €)`;
        else if (item.type === "invest") text = `📈 Investissement : ${item.label} (${item.amount} €)`;
        setLastEvent(text);
    };

    const resetGame = () => {
        setGrid(Array.from({ length: ROWS }, () => Array.from({ length: LANES }, () => null)));
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
    const balanceColor = balance < 0 ? "text-red-600" : balance < 100 ? "text-amber-600" : "text-green-600";

    return (
        <div className="space-y-6 pb-20 sm:pb-0">
            <header className="flex items-center space-x-3 rounded-2xl bg-white p-6 shadow-sm">
                <Link href="/missions" className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bill Rush</h1>
                    <p className="text-sm text-gray-500">Gère ton mois dans un runner 3 lignes</p>
                </div>
            </header>

            {/* Rules */}
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Comment jouer ?</h2>
                <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Le mois avance automatiquement, les cases descendent</li>
                    <li>• Change de ligne pour attraper ou esquiver les dépenses</li>
                    <li>• <span className="text-green-600 font-medium">Vert</span> = revenu · <span className="text-amber-600 font-medium">Orange</span> = facture · <span className="text-red-500 font-medium">Rouge</span> = plaisir · <span className="text-blue-600 font-medium">Bleu</span> = investissement</li>
                </ul>
            </div>

            {/* Balance & progress */}
            <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                <div>
                    <p className="text-xs text-gray-500">Solde estimé</p>
                    <p className={`text-xl font-bold ${balanceColor}`}>{balance} €</p>
                </div>
                <div className="flex-1 mx-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Début</span>
                        <span>Fin du mois</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(step / MAX_STEPS) * 100}%` }} />
                    </div>
                </div>
            </div>

            {/* Start button */}
            {!isRunning && step === 0 && (
                <div className="flex justify-center">
                    <button onClick={() => setIsRunning(true)} className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-md">
                        ▶ Commencer le mois
                    </button>
                </div>
            )}

            {/* Game grid */}
            <div className="mx-auto w-full max-w-sm rounded-2xl bg-white border border-gray-200 p-3 shadow-sm">
                <div className="grid grid-cols-3 gap-1 mb-1">
                    {["Gauche", "Centre", "Droite"].map((label) => (
                        <div key={label} className="text-[10px] text-center text-gray-400 uppercase tracking-wider font-medium">
                            {label}
                        </div>
                    ))}
                </div>
                <div className="space-y-1">
                    {grid.map((row, rowIndex) => (
                        <div key={rowIndex} className="grid grid-cols-3 gap-1">
                            {row.map((cell, colIndex) => {
                                const isPlayerRow = rowIndex === ROWS - 1 && colIndex === playerLane;
                                return (
                                    <div
                                        key={colIndex}
                                        className={`relative h-10 rounded-xl flex items-center justify-center text-[10px] text-center px-1 border transition-colors ${
                                            cell ? CELL_COLORS[cell.type] : "bg-gray-50 border-gray-100 text-gray-300"
                                        }`}
                                    >
                                        {cell && (
                                            <div className="flex flex-col items-center leading-tight">
                                                <span className="truncate max-w-[70px] font-medium">{cell.label}</span>
                                                <span className="text-[9px] opacity-70">
                                                    {cell.amount > 0 ? `+${cell.amount}` : cell.amount} €
                                                </span>
                                            </div>
                                        )}
                                        {isPlayerRow && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="h-8 w-8 rounded-full bg-blue-500 shadow-lg border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
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

                {/* Controls */}
                <div className="mt-2 grid grid-cols-3 gap-1">
                    <button onClick={() => setPlayerLane((p) => Math.max(0, p - 1))} className="rounded-xl bg-gray-100 border border-gray-200 py-2 text-xs font-medium text-gray-600 active:bg-gray-200 transition-colors">
                        ◀ Gauche
                    </button>
                    <div className="rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-[9px] text-gray-400">
                        Tape pour bouger
                    </div>
                    <button onClick={() => setPlayerLane((p) => Math.min(LANES - 1, p + 1))} className="rounded-xl bg-gray-100 border border-gray-200 py-2 text-xs font-medium text-gray-600 active:bg-gray-200 transition-colors">
                        Droite ▶
                    </button>
                </div>
            </div>

            {/* Last event */}
            {lastEvent && (
                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                    <p className="text-sm text-blue-800">{lastEvent}</p>
                </div>
            )}

            {/* End of month summary */}
            {monthFinished && (
                <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm space-y-3">
                    <h2 className="text-lg font-bold text-gray-900">📊 Bilan du mois</h2>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Solde final</p>
                            <p className={`text-lg font-bold ${balanceColor}`}>{balance} €</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 p-3">
                            <p className="text-xs text-gray-500">Factures payées</p>
                            <p className="text-lg font-bold text-amber-700">{essentialPaid}</p>
                        </div>
                        <div className="rounded-xl bg-red-50 p-3">
                            <p className="text-xs text-gray-500">Moments plaisir</p>
                            <p className="text-lg font-bold text-red-600">{funScore}</p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-3">
                            <p className="text-xs text-gray-500">Investissements</p>
                            <p className="text-lg font-bold text-blue-700">{investScore}</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        Il n&apos;y a pas de score parfait. L&apos;idée est de voir comment tu arbitres entre confort, obligations et futur.
                    </p>
                    <button onClick={resetGame} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors">
                        🔄 Rejouer le mois
                    </button>
                </div>
            )}
        </div>
    );
}
