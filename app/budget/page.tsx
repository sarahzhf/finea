

"use client"

import { useState } from "react"
import Card3D from "@/app/components/card3d"

export default function BudgetPage() {
  const [activeTab, setActiveTab] = useState<"stats" | "add" | "more" | null>(null)

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">

      {/* PHONE FRAME */}
      <div className="w-[390px] min-h-[780px] bg-[#0A1D37] rounded-[40px] shadow-[0_0_40px_rgba(0,0,0,0.4)] p-6 relative overflow-y-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Mon budget</h1>

          <button
            onClick={() => window.location.href = "/coach"}
            className="active:scale-95 transition hover:scale-110"
          >
            <img
              src="/icons/fineamascotte.png"
              className="w-10 h-10"
            />
          </button>
        </div>

        {/* SOLDE ACTUEL */}
        <div className="mb-4">
          <p className="text-white/70 text-sm">Solde actuel</p>
          <p className="text-white text-2xl font-semibold">2 450,00 €</p>
        </div>

        {/* CARDS SWIPER */}
        <div className="w-full overflow-x-auto flex gap-4 snap-x snap-mandatory pb-4">
          <div className="min-w-[300px] h-[170px] rounded-3xl bg-gradient-to-br from-[#7C4DFF] to-[#4DA3FF] p-5 text-white snap-center">
            <p className="text-sm opacity-70">Balance</p>
            <p className="text-2xl font-bold mt-2">6 275,50 €</p>
          </div>

          <div className="min-w-[300px] h-[170px] snap-center">
            <Card3D />
          </div>

          <div className="min-w-[300px] h-[170px] rounded-3xl bg-white/10 backdrop-blur-xl p-5 text-white snap-center border border-white/10">
            <p className="text-sm opacity-70">Carte secondaire</p>
            <p className="text-xl font-bold mt-2">1 200 €</p>
          </div>
        </div>

        {/* ACTION BUBBLES */}
        <div className="flex justify-center gap-10 mt-6 mb-8">

          <button
            onClick={() => { window.location.href = "/budget/statistique" }}
            className="flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              📊
            </div>
            <p className="text-white text-xs mt-1">Statistiques</p>
          </button>

          <button
            onClick={() => setActiveTab("add")}
            className="flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              ➕
            </div>
            <p className="text-white text-xs mt-1">Ajouts</p>
          </button>

          <button
            onClick={() => setActiveTab("more")}
            className="flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              ⋯
            </div>
            <p className="text-white text-xs mt-1">Plus</p>
          </button>
        </div>

        {/* STATISTIQUES */}
        {activeTab === "stats" && (
          <div className="bg-white/10 backdrop-blur-xl p-5 rounded-3xl border border-white/10 mb-6">
            <h2 className="text-white font-semibold mb-4">Statistiques</h2>

            <div className="flex justify-between mb-4">
              <button className="text-white text-xs bg-[#4DA3FF] px-3 py-1 rounded-full">Revenus</button>
              <button className="text-white text-xs bg-[#EAC449] px-3 py-1 rounded-full">Dépenses</button>
              <button className="text-white text-xs bg-[#C56C6C] px-3 py-1 rounded-full">Inutiles</button>
            </div>

            {/* DONUT GLOBAL */}
            <div className="relative w-52 h-52 mx-auto">
              <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                <path d="M18 2 a 16 16 0 1 1 0 32" fill="none" stroke="#4DA3FF" strokeWidth="3" strokeDasharray="33,100" />
                <path d="M18 2 a 16 16 0 1 1 0 32" fill="none" stroke="#EAC449" strokeWidth="3" strokeDasharray="33,100" strokeDashoffset="-33" />
                <path d="M18 2 a 16 16 0 1 1 0 32" fill="none" stroke="#C56C6C" strokeWidth="3" strokeDasharray="34,100" strokeDashoffset="-66" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-white text-lg font-bold">Résumé</p>
              </div>
            </div>
          </div>
        )}

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
    </div>
  )
}