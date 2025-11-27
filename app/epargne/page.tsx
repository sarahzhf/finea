"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export default function EpargnePage() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { name: "Home", route: "/", icon: "🏠" },
    { name: "Épargne", route: "/epargne", icon: "💰" },
    { name: "Profil", route: "/profil", icon: "👤" },
    { name: "Réglages", route: "/settings", icon: "⚙️" },
  ]

  const [goal, setGoal] = useState(2000)
  const [current, setCurrent] = useState(750)

  const progress = Math.min((current / goal) * 100, 100)

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">

      {/* iPhone frame */}
      <div className="w-[390px] min-h-[780px] bg-[#0F2B52] rounded-[40px] shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6 relative overflow-hidden">

        {/* Glow */}
        <div className="absolute -top-20 -left-24 w-72 h-72 bg-[#F5D657]/15 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#F5D657]/10 blur-3xl rounded-full"></div>

        <p className="text-xl font-bold text-[#F5D657] mb-2">Bonjour Sarah 👋</p>

        {/* Total and Livret A cards */}
        <div className="relative z-10 mb-6 rounded-3xl p-6 bg-[#0F2B52] shadow-[10px_10px_22px_#07101F,-10px_-10px_22px_#173A68]">
          <p className="text-sm text-[#F5D657]/70">Total de mon épargne</p>
          <p className="text-3xl font-bold text-[#5BF0C6]">{current.toLocaleString()} €</p>
        </div>

        <div className="relative z-10 mb-8 rounded-3xl p-6 bg-[#0F2B52] shadow-[10px_10px_22px_#07101F,-10px_-10px_22px_#173A68]">
          <p className="text-lg font-semibold text-[#F5D657]">Livret A</p>
          <p className="text-sm text-[#F5D657]/60">36121929419</p>

          <div className="w-full mt-4 h-3 rounded-full bg-[#0A1D37] shadow-inner">
            <div className="h-full rounded-full bg-[#5BF0C6]" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="flex justify-between mt-3 text-[#F5D657]/80 text-sm">
            <span>{current.toLocaleString()} €</span>
            <span>Plafond {goal.toLocaleString()} €</span>
          </div>
        </div>

        <p className="text-sm text-[#F5D657]/70 mt-6 mb-2">Vous avez d'autres comptes ?</p>
        <button className="w-full flex items-center gap-3 p-4 rounded-2xl bg-[#0F2B52] shadow-[8px_8px_18px_#07101F,-8px_-8px_18px_#173A68] text-[#F5D657]">
          <span className="text-2xl">➕</span>
          <span className="font-medium">Ajouter une banque</span>
        </button>

        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="
            mt-10 w-full py-4 rounded-2xl font-semibold text-[#F5D657]
            bg-[#0F2B52]
            shadow-[8px_8px_18px_#07101F,-8px_-8px_18px_#173A68]
            active:scale-95 transition-all
          "
        >
          ← Retour
        </button>

        {/* Bottom Navigation */}
        <div
          className="
            absolute left-1/2 -translate-x-1/2 bottom-[-8px] 
            w-[85%]
            bg-[#0F2B52] rounded-full px-4 py-3
            shadow-[8px_8px_22px_#07101F,-8px_-8px_22px_#173A68]
            flex justify-between items-center
            backdrop-blur-md
          "
        >
          {navItems.map((item) => {
            const active = pathname === item.route
            const isEpargne = item.route === "/epargne"

            return (
              <button
                key={item.route}
                onClick={() => router.push(item.route)}
                className={`
                  flex flex-col items-center justify-center 
                  transition-all duration-300
                  ${isEpargne ? "w-14 h-14 -mt-6 rounded-full" : "w-12 h-12 rounded-2xl"}
                  ${
                    active
                      ? "bg-[#0F2B52] shadow-[inset_6px_6px_12px_#07101F,inset_-6px_-6px_12px_#173A68] scale-110 animate-pulse"
                      : "bg-[#0F2B52] shadow-[6px_6px_12px_#07101F,-6px_-6px_12px_#173A68] opacity-75 scale-95"
                  }
                `}
              >
                <span className={isEpargne ? "text-2xl" : "text-xl"}>{item.icon}</span>
                {!isEpargne && (
                  <span className="text-[9px] mt-1 text-[#F5D657]">{item.name}</span>
                )}
              </button>
            )
          })}
        </div>

      </div>
    </div>
  )
}
