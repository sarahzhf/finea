"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState } from "react";
import { motion, useMotionValue } from "framer-motion"
import FineaMascotte from "./components/fineamascotte";
import CoachChat from "./components/coach_chat";

export default function HomePage() {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  type BankCode = "CA" | "SG" | null;
  const [activeBank, setActiveBank] = useState<BankCode>("CA");

  const modules = [
    { name: "Budget", route: "/budget", icon: "/icons/budget.png" },
    { name: "Épargne", route: "/epargne", icon: "/icons/epargne.png" },
    { name: "Crédits", route: "/credit", icon: "/icons/credit.png" },
    { name: "Scanner", route: "/scan", icon: "/icons/scanner.png" },
    { name: "Missions", route: "/missions", icon: "/icons/missions.png" },
    { name: "Quiz", route: "/quiz", icon: "/icons/quiz.png" },
  ]

function ModuleDeck({
  modules,
  onOpen,
}: {
  modules: { name: string; route: string; icon: string }[]
  onOpen: (route: string) => void
}) {
  const dragX = useMotionValue(0)
  const [activeIndex, setActiveIndex] = useState(0)

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

  const snapTo = (next: number) => {
    setActiveIndex(clamp(next, 0, modules.length - 1))
    dragX.set(0)
  }

  return (
    <div className="relative w-full h-[180px] -mt-2 flex items-center justify-center overflow-visible">
      {/* subtle floor shadow */}
      <div className="absolute left-1/2 top-[60%] -translate-x-1/2 w-[88%] h-[120px] rounded-[999px] bg-black/30 blur-2xl pointer-events-none" />

      <motion.div
        className="flex items-center justify-center gap-0 will-change-transform"
        style={{ perspective: 1800, x: dragX }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        transition={{ type: "spring", stiffness: 180, damping: 30 }}
        onDragEnd={(_, info) => {
          const threshold = 80
          if (info.offset.x < -threshold) snapTo(activeIndex + 1)
          else if (info.offset.x > threshold) snapTo(activeIndex - 1)
          else snapTo(activeIndex)
        }}
      >
        {modules.map((m, i) => {
          const delta = i - activeIndex
          const abs = Math.abs(delta)

          // fan/deck effect (cards on the sides)
          const x = delta * 58
          const y = abs === 0 ? -12 : 6
          const scale = abs === 0 ? 1 : 0.9
          const rotateY = abs === 0 ? 0 : delta < 0 ? 22 : -22
          const rotateZ = 0
          const opacity = abs > 2 ? 0 : abs === 2 ? 0.6 : 1
          const zIndex = 50 - abs

          return (
            <motion.button
              key={m.name}
              type="button"
              onClick={() => onOpen(m.route)}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
              style={{ zIndex }}
              animate={{
                x,
                y,
                scale,
                rotateY,
                rotateZ,
                opacity,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <div className="w-[140px] h-[175px] rounded-[26px] bg-white/10 backdrop-blur-2xl border border-white/15 shadow-[0_18px_40px_rgba(0,0,0,0.55)] overflow-hidden">
                <div className="h-full w-full flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                    <img src={m.icon} alt={m.name} className="w-8 h-8" />
                  </div>
                  <div className="mt-5 text-white font-semibold text-base">{m.name}</div>
                  <div className="mt-2 text-white/55 text-xs">Ouvrir</div>
                </div>
              </div>
            </motion.button>
          )
        })}
        {/* Deck 3D : overflow-visible + z-index pour Safari iOS */}
      </motion.div>

    </div>
  )
}


  const isHome = pathname === "/"
  return (
    <>
    <style jsx>{`
      body {
        overflow-x: hidden;
      }
    `}</style>
    <FineaMascotte onOpen={() => setCoachOpen(true)} />
    <div className="w-full min-h-screen bg-gradient-to-b from-[#253745] via-[#4A5C6A] to-[#11212D] flex justify-center">

      {/* iPhone frame */}
      <div className="w-full min-h-screen bg-[#050A14] px-4 pt-8 pb-24 relative overflow-x-hidden">

        {/* Glow background */}
        <div className="absolute -top-16 -left-20 w-72 h-72 bg-[#000000]/20 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#000000]/15 blur-3xl rounded-full pointer-events-none"></div>

        {/* Hamburger Menu Button */}
        <button
          onClick={() => setMenuOpen(true)}
          className="absolute top-4 left-4 z-50 flex flex-col gap-[3px]"
        >
          <span className="w-6 h-[3px] bg-[#F5D657] rounded-full"></span>
          <span className="w-6 h-[3px] bg-[#F5D657] rounded-full"></span>
        </button>
        {/* FINÉA Title */}
        <h1 className="text-3xl font-bold text-[#F5D657]">FINÉA</h1>

        {/* Hi Sarah */}
        <p className="text-xl font-semibold text-white mt-1">Hi Sarah</p>

        {/* Subtitle */}
        <p className="text-white/60 text-sm">Bienvenue dans ton application de coaching financier</p>

        <p className="text-sm font-semibold text-white/80 px-4 mt-1">
          Tous les comptes
        </p>
        {/* Bank Accounts Row */}
        <div className="mt-6 w-full bg-white/10 backdrop-blur-2xl border border-white/10 px-3 py-3 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar overflow-y-hidden px-3">
            {/* Example Bank Cards */}
            <button
              onClick={() => setActiveBank("CA")}
              className={`w-[42px] h-[42px] shrink-0 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.35)]
    ${activeBank === "CA" ? "border-[#F5D657] scale-110 bg-white/20" : "border-white/20 bg-white/10 opacity-70"}
  `}
            >
              <img src="/icons/creditagricole.png" className="w-full h-full object-cover rounded-full" />
            </button>
            <button
              onClick={() => setActiveBank("SG")}
              className={`w-[42px] h-[42px] shrink-0 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.35)]
      ${activeBank === "SG" ? "border-[#F5D657] scale-110 bg-white/20" : "border-white/20 bg-white/10 opacity-70"}
    `}
            >
              <img src="/icons/societegeneral.jpg" className="w-full h-full object-cover rounded-full" />
            </button>
            {/* Add Button */}
            <button
              onClick={() => setAddAccountOpen(true)}
              className="w-[42px] h-[42px] rounded-full bg-[#F5D657]/80 flex items-center justify-center text-black text-2xl font-bold shadow-[0_4px_10px_rgba(245,214,87,0.35)]"
            >
              <span className="relative -top-[2px]">+</span>
            </button>
          </div>
          <p className="mt-3 text-xs text-white/60 px-2">
            Banque active : <span className="text-[#F5D657] font-semibold">{activeBank === "CA" ? "Crédit Agricole" : activeBank === "SG" ? "Société Générale" : "Aucune"}</span>
          </p>
        </div>

        {/* Tous les modules Header */}
        <div className="relative z-10 flex justify-between items-center px-4 mt-1">
          <h2 className="text-lg font-semibold text-white">Tous les modules</h2>
          <span className="text-[#F5D657] text-xl">{">"}</span>
        </div>

        {/* MODULES — deck 3D (cartes sur les côtés) */}
        <div className="relative z-50 -mt-1 mb-6 flex justify-center">
          <div className="relative w-full max-w-[320px] flex justify-center">
            <ModuleDeck modules={modules} onOpen={(route) => router.push(route)} />
          </div>
        </div>

        {/* Slide-in Menu */}
        {menuOpen && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex z-[999]">
            <div className="w-[75%] h-full bg-[#0F2038]/60 backdrop-blur-xl rounded-r-3xl px-6 py-10 text-white flex flex-col gap-6">
              
              {/* Close */}
              <div className="flex justify-end mb-4">
                <button onClick={() => setMenuOpen(false)} className="text-3xl font-bold text-white/80">×</button>
              </div>

              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20"></div>
                <div className="flex flex-col">
                  <p className="text-lg font-semibold">Hi Sarah</p>
                  <p className="text-xs text-white/70">Voir Profil</p>
                </div>
              </div>

              <div className="w-full h-[1px] bg-white/10 my-2"></div>

              {/* Menu Items */}
              <button className="text-left text-sm text-white/90">Gérer mes comptes bancaires</button>
              <button className="text-left text-sm text-white/90">Documents & factures</button>
              <button className="text-left text-sm text-white/90">Mémo du Coach</button>
              <button className="text-left text-sm text-white/90">Apparence</button>
              <button className="text-left text-sm text-white/90">À propos de Finéa</button>
              <button className="text-left text-sm text-white/90">Paramètres</button>
              <button className="text-left text-sm text-white/90">Aides</button>

              <div className="w-full h-[1px] bg-white/10 my-2"></div>

              <button className="text-left text-sm text-red-400 font-semibold">Se déconnecter</button>
            </div>

            {/* Click zone to close */}
            <div className="flex-1" onClick={() => setMenuOpen(false)}></div>
          </div>
        )}

        {/* Coach Slide-in Panel */}
        {coachOpen && (
          <div className="fixed inset-0 flex justify-end z-[999]">
            
            {/* Gray overlay to close */}
            <div className="flex-1 bg-black/40" onClick={() => setCoachOpen(false)}></div>

            {/* Panel content */}
            <div className="w-[85%] h-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.25)] rounded-l-3xl p-6 transform translate-x-0 transition-all duration-300">
              <h2 className="text-xl font-bold text-white mb-4">Coach Financier</h2>
              <CoachChat onClose={() => setCoachOpen(false)} />
            </div>
          </div>
        )}

      {/* Add Account Modal */}
      {addAccountOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[999] bg-black/40 backdrop-blur-sm">
          <div className="w-11/12 max-w-sm bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.25)] rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Ajouter un compte</h3>
            
            <input
              type="text"
              placeholder="Nom de la banque"
              className="w-full mb-3 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-white/50"
            />

            <input
              type="text"
              placeholder="Type de compte (Courant, Épargne...)"
              className="w-full mb-3 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-white/50"
            />

            <input
              type="text"
              placeholder="Identifiant / IBAN"
              className="w-full mb-3 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-white/50"
            />

            <input
              type="number"
              placeholder="Solde initial (€)"
              className="w-full mb-4 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-white/50"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAddAccountOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/20 text-white"
              >
                Annuler
              </button>

              <button
                onClick={() => setAddAccountOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#F5D657] text-black font-semibold"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
    </>
  )
}
