"use client"

import { useRouter, usePathname } from "next/navigation"

export default function CreditPage() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { name: "Home", route: "/", icon: "🏠" },
    { name: "Crédits", route: "/credit", icon: "💳" },
    { name: "Profil", route: "/profil", icon: "👤" },
    { name: "Réglages", route: "/settings", icon: "⚙️" },
  ]

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">

      {/* iPhone frame */}
      <div className="w-[390px] min-h-[780px] bg-[#0F2B52] rounded-[40px] shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6 relative overflow-hidden">

        {/* Glow */}
        <div className="absolute -top-20 -left-24 w-72 h-72 bg-[#F5D657]/15 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#F5D657]/10 blur-3xl rounded-full"></div>

        <div className="overflow-y-auto pb-28 h-full relative z-10">

          <p className="text-xl font-bold text-[#F5D657] mb-4">Bonjour Sarah 👋</p>

          {/* Title */}
          <h1 className="text-center text-2xl font-bold text-[#F5D657] mb-4 drop-shadow">
            Crédits 💳
          </h1>

          {/* Total Credit Card */}
          <div
            className="
              mb-8 rounded-3xl p-6
              bg-[#0F2B52]
              shadow-[10px_10px_22px_#07101F,-10px_-10px_22px_#173A68]
              text-center
            "
          >
            <p className="text-sm text-[#F5D657]/70 mb-1">Total crédit</p>
            <p className="text-3xl font-bold text-[#5BF0C6]">0,00 €</p>
          </div>

          {/* Subtitle */}
          <h2 className="text-[#F5D657] text-lg font-semibold mb-6 px-2 mt-2">Nos offres pour vous</h2>

          {/* Buttons */}
          <div className="flex flex-col gap-6 px-2 mb-8">
            <button
              onClick={() => router.push("/credit/consommation")}
              className="
                flex items-center gap-4 p-6 rounded-3xl bg-[#0F2B52]
                shadow-[inset_6px_6px_12px_#07101F,inset_-6px_-6px_12px_#173A68]
                text-[#F5D657] font-semibold text-lg
                active:scale-95 transition-all
              "
            >
              <span className="text-3xl">🪙</span>
              Simuler un crédit consommation
            </button>

            <button
              onClick={() => router.push("/credit/immobilier")}
              className="
                flex items-center gap-4 p-6 rounded-3xl bg-[#0F2B52]
                shadow-[inset_6px_6px_12px_#07101F,inset_-6px_-6px_12px_#173A68]
                text-[#F5D657] font-semibold text-lg
                active:scale-95 transition-all
              "
            >
              <span className="text-3xl">🏡</span>
              Simuler un crédit immobilier
            </button>
          </div>

          {/* Ajouter une banque card */}
          <div
            className="
              mx-2 rounded-3xl p-6
              bg-[#0F2B52]
              shadow-[10px_10px_22px_#07101F,-10px_-10px_22px_#173A68]
              flex items-center gap-4 cursor-pointer
              text-[#F5D657] font-semibold text-lg
              select-none
              active:scale-95 transition-all
            "
            onClick={() => {}}
          >
            <span className="text-3xl">➕</span>
            Ajouter une banque
          </div>

        </div>

        {/* Bottom Navigation */}
        <div
          className="
            absolute left-1/2 -translate-x-1/2 bottom-[-8px] 
            w-[85%]
            bg-[#0F2B52] rounded-full px-4 py-3
            shadow-[8px_8px_22px_#07101F,-8px_-8px_22px_#173A68]
            flex justify-between items-center
            backdrop-blur-md
            z-20
          "
        >
          {navItems.map((item) => {
            const active = pathname === item.route

            return (
              <button
                key={item.route}
                onClick={() => router.push(item.route)}
                className={`
                  flex flex-col items-center justify-center
                  transition-all duration-300
                  ${active ? "w-16 h-16 -mt-6 rounded-full" : "w-12 h-12 rounded-2xl"}
                  ${
                    active
                      ? "bg-[#0F2B52] shadow-[inset_6px_6px_12px_#07101F,inset_-6px_-6px_12px_#173A68] scale-110 animate-pulse"
                      : "bg-[#0F2B52] shadow-[6px_6px_12px_#07101F,-6px_-6px_12px_#173A68] opacity-75 scale-95"
                  }
                `}
              >
                <span className={active ? "text-2xl" : "text-xl"}>{item.icon}</span>

                {!active && (
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