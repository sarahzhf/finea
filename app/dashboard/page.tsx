"use client"

import { useRouter, usePathname } from "next/navigation"
import Card3D from "../components/card3d";
import { useState, useEffect } from "react";
import { motion } from "framer-motion"
import FineaMascotte from "../components/fineamascotte";
import CoachChat from "../components/coach_chat";
import { useAuth } from "@/components/AuthProvider";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function HomePage() {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const { user } = useAuth();
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [firstName, setFirstName] = useState<string>("");

  // Fetch Balance and Profile Name
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // 1. Fetch Operations for Balance
        const opsSnapshot = await getDocs(collection(db, "users", user.uid, "operations"));
        let sum = 0;
        opsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.amount) sum += Number(data.amount);
        });
        setTotalBalance(sum);

        // 2. Fetch Profile for Name
        const { doc, getDoc } = await import("firebase/firestore");
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
           const data = userDocSnap.data();
           if (data.personalInfo?.firstName) {
              setFirstName(data.personalInfo.firstName);
           }
        }

      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [user]);

  const displayName = firstName || user?.email?.split('@')[0] || "Invité";

  const modules = [
    { name: "Budget", route: "/budget", icon: "/icons/budget.png" },
    { name: "Épargne", route: "/epargne", icon: "/icons/epargne.png" },
    { name: "Crédits", route: "/credit", icon: "/icons/credit.png" },
    { name: "Scanner", route: "/scan", icon: "/icons/scanner.png" },
    { name: "Missions", route: "/missions", icon: "/icons/missions.png" },
    { name: "Quiz", route: "/quiz", icon: "/icons/quiz.png" },
  ]


  const isHome = pathname === "/"
  return (
    <>
    <FineaMascotte onOpen={() => setCoachOpen(true)} />
    <div className="w-full h-screen fixed top-0 left-0 bg-gradient-to-b from-[#253745] via-[#4A5C6A] to-[#11212D] flex justify-center items-center overflow-hidden">

      {/* iPhone frame */}
      <div className="w-full h-full bg-[#050A14] px-4 pt-8 pb-20 relative overflow-hidden">

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

        {/* Hi User */}
        <p className="text-xl font-semibold text-white mt-1">Hello {displayName}</p>

        {/* Subtitle */}
        <p className="text-white/60 text-sm">Bienvenue dans ton application de coaching financier</p>

        <p className="text-sm font-semibold text-white/80 px-4 mt-6">
          Tous les comptes
        </p>
        
        {/* Total Balance Display (if available) */}
        {totalBalance !== null && (
           <div className="px-6 mt-2 mb-2">
              <p className="text-white/60 text-xs uppercase tracking-wider">Solde Total</p>
              <p className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-[#F5D657]' : 'text-red-400'}`}>
                 {totalBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </p>
           </div>
        )}

        {/* Bank Accounts Row */}
        <div className="mt-2 w-[110%] ml-20 bg-white/10 backdrop-blur-2xl border border-white/10 px-2 py-2 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar overflow-y-hidden pl-6 pr-6">
             {/* Example Bank Cards - Cleaned up per user request (Supabase/Static removal) */}
             <div className="w-[42px] h-[42px] shrink-0 rounded-full bg-white/10 backdrop-blur-xl border-white/20 border flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.35)]">
               <span className="text-white text-xs font-bold">ALL</span>
             </div>

             {/* Add Button */}
             <button
              onClick={() => setAddAccountOpen(true)}
              className="w-[42px] h-[42px] rounded-full bg-[#F5D657]/80 flex items-center justify-center text-black text-2xl font-bold shadow-[0_4px_10px_rgba(245,214,87,0.35)]"
             >
               <span className="relative -top-[2px]">+</span>
             </button>
          </div>
        </div>

        {/* Tous les modules Header */}
        <div className="relative z-10 flex justify-between items-center px-4 mt-6">
          <h2 className="text-lg font-semibold text-white">Tous les modules</h2>
          <span className="text-[#F5D657] text-xl">{">"}</span>
        </div>

        {/* MODULES CONTAINER (full rounded block like image) */}
        <div className="w-[135%] h-[70vh] px-0 py-6 overflow-x-auto overflow-y-hidden">

          {/* MODULES GRID - horizontal scroll */}
          <div className="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar mt-2 h-full items-start pr-10">
            {/* TODO: Replace this grid with a full 3D slider (Apple Card + Sumeria) */}
            {modules.map((m, index) => (
              <button
                key={index}
                onClick={() => router.push(m.route)}
                className="min-w-[220px] h-[330px] shrink-0 rounded-2xl px-5 flex items-center justify-start gap-4 bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.25)] active:scale-[0.98] hover:scale-[1.02] transition-all duration-300 text-[#CCD0CF]"
              >
                <img src={m.icon} className="w-9 h-9 opacity-90" />
                <div className="text-[15px] font-semibold">{m.name}</div>
              </button>
            ))}
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
              <button onClick={() => router.push('/reglages')} className="text-left text-sm text-white/90 hover:text-[#F5D657] transition-colors">Paramètres</button>
              <button onClick={() => router.push('/profil')} className="text-left text-sm text-white/90 hover:text-[#F5D657] transition-colors">Mon Profil</button>
              <button className="text-left text-sm text-white/50 cursor-not-allowed">Gérer mes comptes bancaires (Bientôt)</button>
              <button className="text-left text-sm text-white/50 cursor-not-allowed">Documents & factures (Bientôt)</button>
              <button className="text-left text-sm text-white/50 cursor-not-allowed">Mémo du Coach (Bientôt)</button>
              <button className="text-left text-sm text-white/50 cursor-not-allowed">Apparence (Bientôt)</button>
              <button className="text-left text-sm text-white/50 cursor-not-allowed">Aides (Bientôt)</button>

              <div className="w-full h-[1px] bg-white/10 my-2"></div>
              
              <button onClick={() => router.push('/reglages/import')} className="text-left text-sm text-[#F5D657] font-medium">Import Données Excel</button>

              <div className="w-full h-[1px] bg-white/10 my-2"></div>

              <button onClick={() => router.push('/login')} className="text-left text-sm text-red-400 font-semibold">Se déconnecter</button>
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
    <style jsx global>{`
      html, body {
        overflow: hidden !important;
        height: 100% !important;
      }
      * { overscroll-behavior: none !important; }
    `}</style>
    </>
  )
}
