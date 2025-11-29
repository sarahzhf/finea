"use client"

import { useState } from "react"
import Card3D from "@/app/components/card3d"

export default function StatisticsPage() {
  const [filter, setFilter] = useState<"rev" | "dep" | "inut" | "all">("all")
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [isSheetOpen, setSheetOpen] = useState(false)
  const months = ["Oct", "Nov", "Déc", "Jan", "Fév", "Mar"]

  // Sample dynamic data for each month
  const monthData = {
    Oct: { value: 980, rev: 400, dep: 300, inut: 280 },
    Nov: { value: 1200, rev: 500, dep: 450, inut: 250 },
    Déc: { value: 1720, rev: 900, dep: 600, inut: 220 },
    Jan: { value: 1480, rev: 850, dep: 500, inut: 130 },
    Fév: { value: 1890, rev: 1000, dep: 700, inut: 190 },
    Mar: { value: 1600, rev: 920, dep: 520, inut: 160 },
  };

  // If no month selected → show total of all months
  const totalValue = Object.values(monthData).reduce((sum, m) => sum + m.value, 0);

  const current =
    selectedMonth !== null
      ? monthData[months[selectedMonth] as keyof typeof monthData]
      : {
          value: totalValue,
          rev: totalValue,
          dep: totalValue,
          inut: totalValue,
        };

  function generateFinanceCurve(current: any) {
    if (!current) return "M0 25 C 20 25, 40 25, 60 25 S 80 25, 100 25";

    const base = 30;
    const amplitude = Math.min(12, Math.max(4, current.value / 200));
    const p1 = base - amplitude * 0.9;
    const p2 = base + amplitude * 0.5;
    const p3 = base - amplitude * 1.2;
    const p4 = base + amplitude * 0.7;
    const p5 = base - amplitude * 0.4;

    return `M0 ${base} C 20 ${p1}, 40 ${p2}, 60 ${p3} S 80 ${p4}, 100 ${p5}`;
  }

  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-[#0A1D37]">
      <div className="w-[390px] min-h-[844px] bg-[#020b18] rounded-[40px] shadow-xl overflow-y-auto relative p-6">
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 25s linear infinite; }
      `}</style>

      {/* PHONE FRAME */}
      <div className="w-full min-h-[780px] bg-[#020b18] rounded-[40px] p-6 overflow-visible">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => window.history.back()} className="text-white text-3xl">‹</button>
          <h1 className="text-xl font-bold text-white">Statistiques</h1>
          <div className="w-8 h-8"></div>
        </div>

        {/* DONUT – FULL PREMIUM SEGMENTED */}
        <div className="w-full flex items-center justify-center relative mb-10">
          <svg
            viewBox="0 0 36 36"
            className="w-48 h-48 animate-spin-slow"
            preserveAspectRatio="xMidYMid meet"
            style={{ overflow: "visible" }}
          >

              {/* BASE CIRCLE (background thickness) */}
              <circle
                cx="18"
                cy="18"
                r="16"
                stroke="#ffffff15"
                strokeWidth="5.5"
                fill="none"
              />

              {/* ——— GLOBAL VIEW (3 COLORS MIXED) ——— */}
              {filter === "all" && (
                <>
                  {[
                    { color: "#5E90C8", val: current ? current.rev : 400 },
                    { color: "#D1B46E", val: current ? current.dep : 300 },
                    { color: "#C98484", val: current ? current.inut : 200 },
                  ]
                  .map((seg, i, arr) => {
                    const total = arr.reduce((s, x) => s + x.val, 0);
                    const start = arr.slice(0, i).reduce((s, x) => s + x.val, 0) / total * 100;
                    const length = (seg.val / total) * 100;
                    return (
                      <circle
                        key={i}
                        cx="18"
                        cy="18"
                        r="16"
                        stroke={seg.color}
                        strokeWidth="5.5"
                        fill="none"
                        strokeDasharray={`${length} ${100 - length}`}
                        strokeDashoffset={-start}
                        strokeLinecap="round"
                        style={{ filter: "drop-shadow(0px 0px 6px currentColor)" }}
                      />
                    );
                  })}
                </>
              )}

              {/* ——— SINGLE VIEW REVENUS ——— */}
              {filter === "rev" && (
                <circle
                  cx="18" cy="18" r="16"
                  stroke="#5E90C8"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="100 0"
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0px 0px 10px currentColor)" }}
                />
              )}

              {/* ——— SINGLE VIEW DÉPENSES ——— */}
              {filter === "dep" && (
                <circle
                  cx="18" cy="18" r="16"
                  stroke="#D1B46E"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="100 0"
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0px 0px 10px currentColor)" }}
                />
              )}

              {/* ——— SINGLE VIEW INUTILES ——— */}
              {filter === "inut" && (
                <circle
                  cx="18" cy="18" r="16"
                  stroke="#C98484"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="100 0"
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0px 0px 10px currentColor)" }}
                />
              )}
            </svg>
          {/* CENTER LABEL */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-white text-xl font-bold">
              {current.value ? `${current.value} €` : `${totalValue} €`}
            </p>
            <p className="text-white/60 text-xs">Gain mensuel</p>
          </div>
        </div>

        <h2 className="text-white text-lg font-semibold mb-2">Analyse du mois</h2>

        {/* NEW OVAL TOGGLES WITH INNER CIRCLE */}
        <div className="flex gap-4 justify-center mb-8">

          {/* REVENUS */}
          <button
            onClick={() => {
              setFilter(filter === "rev" ? "all" : "rev");
              setSheetOpen(true);
            }}
            className="w-24 h-32 rounded-full bg-white/10 border border-white/20 flex flex-col items-center justify-center shadow-md relative overflow-hidden transition-all duration-300"
          >
            <div
              className={`absolute top-3 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
              ${filter === "rev" ? "translate-y-3 bg-[#5E90C8]" : "translate-y-0 bg-white"}`}
            >
              <img src="/icons/revenue.png" className="w-6 h-6" />
            </div>
            <p className="text-white text-[10px] mb-1">
              {filter === "rev" ? "ON" : "OFF"}
            </p>
            <p className="text-white text-xs mt-8">Revenus</p>
          </button>

          {/* DEPENSES */}
          <button
            onClick={() => {
              setFilter(filter === "dep" ? "all" : "dep");
              setSheetOpen(true);
            }}
            className="w-24 h-32 rounded-full bg-white/10 border border-white/20 flex flex-col items-center justify-center shadow-md relative overflow-hidden transition-all duration-300"
          >
            <div
              className={`absolute top-3 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
              ${filter === "dep" ? "translate-y-3 bg-[#D1B46E]" : "translate-y-0 bg-white"}`}
            >
              <img src="/icons/depense.png" className="w-6 h-6" />
            </div>
            <p className="text-white text-[10px] mb-1">
              {filter === "dep" ? "ON" : "OFF"}
            </p>
            <p className="text-white text-xs mt-8">Dépenses</p>
          </button>

          {/* INUTILES */}
          <button
            onClick={() => {
              setFilter(filter === "inut" ? "all" : "inut");
              setSheetOpen(true);
            }}
            className="w-24 h-32 rounded-full bg-white/10 border border-white/20 flex flex-col items-center justify-center shadow-md relative overflow-hidden transition-all duration-300"
          >
            <div
              className={`absolute top-3 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
              ${filter === "inut" ? "translate-y-3 bg-[#C98484]" : "translate-y-0 bg-white"}`}
            >
              <img src="/icons/inutiles.png" className="w-6 h-6" />
            </div>
            <p className="text-white text-[10px] mb-1">
              {filter === "inut" ? "ON" : "OFF"}
            </p>
            <p className="text-white text-xs mt-8">Inutiles</p>
          </button>

        </div>

        <h2 className="text-white text-lg font-semibold mb-3">Évolution du solde</h2>

        <div className="relative w-full h-72 bg-[#0A1D37] rounded-3xl p-4 mb-10 overflow-visible shadow-[0_0_25px_rgba(0,0,0,0.4)]">

          {/* CURVE SVG */}
          <svg viewBox="0 0 100 40" className="absolute top-[35px] left-0 w-full h-[60%]">
            <defs>
              <linearGradient id="curveBankFinal" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#5E90C8" />
                <stop offset="40%" stopColor="#7AA6D6" />
                <stop offset="60%" stopColor="#D1B46E" />
                <stop offset="85%" stopColor="#C98484" />
                <stop offset="100%" stopColor="#A86363" />
              </linearGradient>
            </defs>

            {/* MAIN CURVE (dynamic) */}
            <path
              d={generateFinanceCurve(current)}
              stroke="url(#curveBankFinal)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              className="drop-shadow-[0_0_14px_rgba(255,255,255,0.25)] transition-all duration-500 ease-out"
            />

            {/* GLOW UNDERLAY (dynamic) */}
            <path
              d={generateFinanceCurve(current)}
              stroke="url(#curveBankFinal)"
              strokeWidth="14"
              opacity="0.12"
              fill="none"
              strokeLinecap="round"
              className="blur-xl transition-all duration-500 ease-out"
            />
          </svg>

          {/* DYNAMIC VALUE LABEL */}
          <div className="absolute top-[55px] left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-3 py-1 rounded-xl shadow">
            {selectedMonth !== null ? `${current.value} €` : `${totalValue} €`}
          </div>

          {/* DOT ON CURVE (manually aligned to curve peak) */}
          <div className="absolute top-[92px] left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_12px_white] border border-white/40"></div>

          {/* VERTICAL BAR FROM MONTH → CURVE */}
          {selectedMonth !== null && (
            <div
              className="absolute bottom-[32px] left-1/2 -translate-x-1/2 w-7 h-[150px] rounded-full
              bg-gradient-to-t from-[#5E90C8]/50 via-[#D1B46E]/50 to-[#C98484]/50
              backdrop-blur-md shadow-[0_0_25px_rgba(255,255,255,0.35)] transition-all duration-500 ease-out">
            </div>
          )}

          {/* MONTH SELECTOR AT BOTTOM */}
          <div className="absolute bottom-2 left-0 w-full overflow-x-auto no-scrollbar snap-x snap-mandatory px-0">
            <div className="flex gap-8 items-center mx-auto min-w-max px-[140px]">
              {months.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedMonth(selectedMonth === i ? null : i)}
                  className={`text-white/70 text-sm px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 snap-center transition
                    ${selectedMonth === i ? "bg-white/20 text-white font-semibold" : "bg-white/5"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* TRANSACTIONS HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-semibold text-lg">Transactions</h2>
          <p className="text-white/60 text-sm">Semaine ▾</p>
        </div>

        {/* TRANSACTIONS LIST */}
        <div className="space-y-4 pb-20">

          <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="text-white">
              <p className="font-semibold">Spotify</p>
              <p className="text-xs text-white/50">30 Janvier - 19h48</p>
            </div>
            <p className="text-red-300 font-semibold">- 7,99 €</p>
          </div>

          <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="text-white">
              <p className="font-semibold">ClickUp</p>
              <p className="text-xs text-white/50">21 Janvier - 12h15</p>
            </div>
            <p className="text-red-300 font-semibold">- 19,00 €</p>
          </div>

          <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="text-white">
              <p className="font-semibold">Salaire</p>
              <p className="text-xs text-white/50">01 Janvier</p>
            </div>
            <p className="text-green-300 font-semibold">+ 2 450 €</p>
          </div>

        </div>
      </div>

      {isSheetOpen && (
        <div className="fixed bottom-0 left-0 w-full h-[55%] bg-[#0A1D37] border-t border-white/10 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.4)] p-6 z-[9999] transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-semibold text-lg">Détails du mois</h2>
            <button onClick={() => setSheetOpen(false)} className="text-white text-2xl">×</button>
          </div>

          <div className="w-full flex items-center justify-center mb-6">
            <div className="text-center">
              <p className="text-white text-2xl font-bold">{current.value} €</p>
              <p className="text-white/60 text-sm mt-1">
                {filter === "rev" && "Total revenus"}
                {filter === "dep" && "Total dépenses"}
                {filter === "inut" && "Total achats inutiles"}
                {filter === "all" && "Vue globale"}
              </p>
            </div>
          </div>

          <div className="w-full h-40 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-white/50">
            Graphique détaillé (pro)
          </div>
        </div>
      )}
      </div>
    </div>
  )
}