"use client"

import Card3D from "@/app/components/card3d"
import { useRouter, usePathname } from "next/navigation"

export default function ProfilPage() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { name: "Home", route: "/", icon: "/icons/home.png" },
    { name: "Profil", route: "/profil", icon: "/icons/profil.png" },
    { name: "Réglages", route: "/settings", icon: "/icons/settings.png" },
  ]

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3 overflow-y-auto">
      
      {/* iPhone frame */}
      <div className="relative w-[390px] min-h-[780px] bg-[#0A1D37] rounded-[40px] shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6 overflow-hidden">

        {/* Glow */}
        <div className="absolute -top-20 -left-24 w-72 h-72 bg-[#F5D657]/15 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#F5D657]/10 blur-3xl rounded-full"></div>

        {/* Title */}
        <h1 className="relative z-10 text-2xl font-bold text-[#F5D657] mb-4">
          Profil
        </h1>

        {/* Profile Card */}
        <div className="
          relative z-10 rounded-3xl p-6 mb-8
          bg-[#0A1A32]
          shadow-[8px_8px_18px_#07101F,-8px_-8px_18px_#173A68]
          flex flex-col items-center
        ">
          <div className="
            w-24 h-24 rounded-full mb-4
            bg-[#0A1A32]
            shadow-[inset_8px_8px_16px_#07101F,inset_-8px_-8px_16px_#173A68]
            flex items-center justify-center text-4xl text-[#F5D657]
          ">
            <img src="/icons/profil.png" className="w-16 h-16" />
          </div>
          <p className="text-[#F5D657] text-xl font-semibold">Sarah Zahaf</p>
          <p className="text-[#F5D657]/70 text-sm mt-1">Étudiante & Data/IA Analyst</p>
        </div>
        <Card3D />

        {/* Infos section */}
        <div className="relative z-10 space-y-3 mb-10">
          
          <div className="
            p-4 rounded-2xl
            bg-[#0A1A32]
            shadow-[8px_8px_22px_#07101F,-8px_-8px_22px_#173A68]
            text-[#F5D657]
          ">
            Email : sarah@example.com
          </div>

          <div className="
            p-4 rounded-2xl
            bg-[#0A1A32]
            shadow-[8px_8px_22px_#07101F,-8px_-8px_22px_#173A68]
            text-[#F5D657]
          ">
            Objectif : Devenir financièrement libre
          </div>

          <div className="
            p-4 rounded-2xl
            bg-[#0A1A32]
            shadow-[8px_8px_22px_#07101F,-8px_-8px_22px_#173A68]
            text-[#F5D657]
          ">
            Niveau : Intermédiaire
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
          "
        >
          {navItems.map((item) => {
            const active = pathname === item.route
            const isProfil = item.route === "/profil"

            return (
              <button
                key={item.route}
                onClick={() => router.push(item.route)}
                className={`
                  flex flex-col items-center justify-center 
                  transition-all duration-300
                  ${isProfil ? "w-14 h-14 -mt-6 rounded-full" : "w-12 h-12 rounded-2xl"}
                  ${
                    active
                      ? "bg-[#0F2B52] shadow-[inset_6px_6px_12px_#07101F,inset_-6px_-6px_12px_#173A68] scale-110 animate-pulse"
                      : "bg-[#0F2B52] shadow-[6px_6px_12px_#07101F,-6px_-6px_12px_#173A68] opacity-75 scale-95"
                  }
                `}
              >
                <img src={item.icon} className={isProfil ? "w-8 h-8" : "w-6 h-6"} />
                {!isProfil && (
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
