

"use client"

import { useRouter } from "next/navigation"

export default function ScorePage() {
  const router = useRouter()

  const score = 73 // score sur 100
  const scoreLabel =
    score >= 80 ? "Excellent" :
    score >= 60 ? "Bon" :
    score >= 40 ? "Moyen" : "À améliorer"

  const insights = [
    "Tes dépenses récurrentes sont maîtrisées 👍",
    "Tu pourrais réduire les petites dépenses quotidiennes",
    "Ton taux d’épargne est cohérent mais améliorable",
    "Pense à automatiser un virement fixe chaque mois",
  ]

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">

      {/* iPhone frame */}
      <div className="w-[390px] min-h-[780px] bg-[#0F2B52] rounded-[40px] shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6 relative overflow-hidden">

        {/* Glow */}
        <div className="absolute -top-20 -left-24 w-72 h-72 bg-[#F5D657]/15 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#F5D657]/10 blur-3xl rounded-full"></div>

        {/* Title */}
        <h1 className="relative z-10 text-2xl font-bold text-[#F5D657] mb-4 drop-shadow">
          Score financier
        </h1>

        {/* Score Card */}
        <div
          className="
            relative z-10 mb-8 rounded-3xl p-6 text-center
            bg-[#0F2B52]
            shadow-[10px_10px_22px_#07101F,-10px_-10px_22px_#173A68]
          "
        >
          <p className="text-sm text-[#F5D657]/60">Ton score actuel</p>

          <p className="text-6xl font-bold text-[#F5D657] mt-2">{score}</p>

          <p className="text-lg text-[#F5D657]/70 mt-2">{scoreLabel}</p>

          {/* Ring */}
          <div className="relative w-40 h-40 mx-auto mt-6">
            <div className="absolute inset-0 rounded-full
              bg-[#0F2B52]
              shadow-[inset_8px_8px_16px_#07101F,inset_-8px_-8px_16px_#173A68]
            "></div>

            <div
              className="absolute inset-0 rounded-full border-4 border-[#F5D657]"
              style={{
                clipPath: `inset(${100 - score}% 0 0 0)`,
              }}
            ></div>
          </div>
        </div>

        {/* Insights */}
        <h2 className="relative z-10 text-lg font-semibold text-[#F5D657] mb-4">
          Analyse
        </h2>

        <div className="relative z-10 space-y-4 mb-8">
          {insights.map((tip, index) => (
            <div
              key={index}
              className="
                rounded-2xl px-5 py-4
                bg-[#0F2B52]
                text-[#F5D657]
                shadow-[8px_8px_18px_#07101F,-8px_-8px_18px_#173A68]
              "
            >
              {tip}
            </div>
          ))}
        </div>

        {/* Back */}
        <button
          onClick={() => router.push("/")}
          className="
            w-full py-4 rounded-2xl font-semibold text-[#F5D657]
            bg-[#0F2B52]
            shadow-[8px_8px_18px_#07101F,-8px_-8px_18px_#173A68]
            active:scale-95 transition-all
          "
        >
          ← Retour
        </button>
      </div>
    </div>
  )
}