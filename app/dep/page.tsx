"use client"

import { useRouter } from "next/navigation"

export default function DepInutilesPage() {
  const router = useRouter()

  const uselessExpenses = [
    { label: "Starbucks Latte", amount: 5.80, date: "2025-11-10", reason: "Café premium quotidien" },
    { label: "McDo Snack", amount: 12.50, date: "2025-11-09", reason: "Snacking impulsif" },
    { label: "Amazon petits achats", amount: 8.99, date: "2025-11-07", reason: "Achat non essentiel" },
    { label: "Uber court trajet", amount: 7.20, date: "2025-11-06", reason: "Trajet évitable" },
  ]

  const total = uselessExpenses.reduce((acc, item) => acc + item.amount, 0)

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">

      {/* iPhone frame */}
      <div className="w-[390px] min-h-[780px] bg-[#0F2B52] rounded-[40px] shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6 relative overflow-hidden">

        {/* glow */}
        <div className="absolute -top-16 -left-20 w-72 h-72 bg-[#F5D657]/15 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#F5D657]/10 blur-3xl rounded-full"></div>

        {/* title */}
        <h1 className="relative z-10 text-2xl font-bold text-[#F5D657] mb-6 drop-shadow">
          Dépenses inutiles
        </h1>

        {/* total card */}
        <div className="
          relative z-10 mb-8 rounded-3xl p-6 
          bg-[#0F2B52]
          shadow-[10px_10px_22px_#07101F,-10px_-10px_22px_#173A68]
        ">
          <p className="text-sm text-[#F5D657]/70">Économies possibles</p>
          <p className="text-4xl font-bold text-[#F5D657] mt-1">
            {total.toFixed(2)} €
          </p>
          <p className="text-sm text-[#F5D657]/60 mt-2">
            En réduisant ces achats non essentiels.
          </p>
        </div>

        {/* list */}
        <div className="relative z-10 space-y-4 mb-10">
          {uselessExpenses.map((item, index) => (
            <div
              key={index}
              className="
                rounded-2xl p-5 bg-[#0F2B52]
                shadow-[8px_8px_18px_#07101F,-8px_-8px_18px_#173A68]
                text-[#F5D657]
              "
            >
              <div className="flex justify-between mb-1">
                <span className="font-semibold">{item.label}</span>
                <span className="font-semibold">{item.amount.toFixed(2)} €</span>
              </div>

              <p className="text-xs text-[#F5D657]/60">{item.date}</p>
              <p className="text-xs italic text-[#F5D657]/70 mt-2">→ {item.reason}</p>
            </div>
          ))}
        </div>

        {/* buttons */}
        <div className="relative z-10 space-y-4">

          <button
            className="
              w-full py-4 rounded-2xl font-semibold text-[#F5D657]
              bg-[#0F2B52]
              shadow-[8px_8px_18px_#07101F,-8px_-8px_18px_#173A68]
              active:scale-95 transition-all
            "
          >
            🎯 Lancer une mission
          </button>

          <button
            onClick={() => router.push("/budget")}
            className="
              w-full py-4 rounded-2xl font-semibold text-[#F5D657]
              bg-[#0F2B52]
              shadow-[8px_8px_18px_#07101F,-8px_-8px_18px_#173A68]
              active:scale-95 transition-all
            "
          >
            ← Retour au budget
          </button>
        </div>

      </div>
    </div>
  )
}