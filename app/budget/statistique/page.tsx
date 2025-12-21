"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/AuthProvider"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface MonthlyStats {
  monthLabel: string; // e.g. "Jan"
  fullLabel: string; // e.g. "Janvier 2025"
  value: number; // Net gain (Income - Expense)
  rev: number;
  dep: number;
  inut: number;
}

export default function StatisticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [filter, setFilter] = useState<"rev" | "dep" | "inut" | "all">("all")
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null)
  const [isSheetOpen, setSheetOpen] = useState(false)
  
  const [statsData, setStatsData] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Useless Keywords
  const USELESS_KEYWORDS = ["mcdo", "starbucks", "uber", "netflix", "spotify", "restaurant", "bar", "cinema", "kfc", "burger", "deliveroo", "amazon"];
  const USELESS_CATEGORIES = ["Restaurant", "Loisirs"];

  useEffect(() => {
    const fetchAndProcess = async () => {
      if (!user) return;
      try {
        const querySnapshot = await getDocs(collection(db, "users", user.uid, "operations"));
        
        const operations: any[] = [];
        querySnapshot.forEach((doc) => {
          operations.push(doc.data());
        });

        // Group by Month (YYYY-MM)
        const groups: Record<string, { rev: number, dep: number, inut: number, date: Date }> = {};

        operations.forEach(op => {
           // Parse Date
           const date = op.date?.toDate ? op.date.toDate() : new Date(op.date);
           const key = `${date.getFullYear()}-${date.getMonth()}`;
           
           if (!groups[key]) {
              groups[key] = { rev: 0, dep: 0, inut: 0, date };
           }

           const amount = Number(op.amount);
           const label = op.label?.toLowerCase() || "";
           const cat = op.category || "";

           if (amount > 0) {
              groups[key].rev += amount;
           } else {
              const absAmount = Math.abs(amount);
              groups[key].dep += absAmount;

              // Check "Useless"
              const isUseless = USELESS_CATEGORIES.includes(cat) || USELESS_KEYWORDS.some(k => label.includes(k));
              if (isUseless) {
                 groups[key].inut += absAmount;
              }
           }
        });

        // Convert to Array & Sort by Date
        const sortedKeys = Object.keys(groups).sort();
        // Limit to last 6 months for UI
        const recentKeys = sortedKeys.slice(-6);

        const processed: MonthlyStats[] = recentKeys.map(key => {
           const g = groups[key];
           const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
           const fullMonthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
           
           return {
              monthLabel: monthNames[g.date.getMonth()],
              fullLabel: `${fullMonthNames[g.date.getMonth()]} ${g.date.getFullYear()}`,
              value: g.rev - g.dep, // Net
              rev: g.rev,
              dep: g.dep,
              inut: g.inut
           };
        });

        setStatsData(processed);
        if (processed.length > 0) setSelectedMonthIndex(processed.length - 1); // Select latest by default

      } catch (err) {
        console.error("Error stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcess();
  }, [user]);

  // Current Selection
  const current = selectedMonthIndex !== null && statsData[selectedMonthIndex] 
    ? statsData[selectedMonthIndex]
    : { value: 0, rev: 0, dep: 0, inut: 0, fullLabel: "Aucune donnée" };


  function generateFinanceCurve(curr: any) {
    // Generate a simple curve based on net value 
    // Normalized for SVG 0-100 width, 0-40 height
    const base = 20; // Center Y
    // Map value e.g. -500 to +500 -> amplitude
    const normalized = Math.max(-15, Math.min(15, curr.value / 100)); // Scale factor
    
    // Create a smooth cubic bezier
    // Start at left center (0, 20)
    // End at right center (100, 20)
    // Control points affected by value
    return `M0 20 C 30 ${20 - normalized}, 70 ${20 + normalized}, 100 ${20 - (normalized/2)}`;
  }

  // Calculate percentages for Donut
  const totalVolume = current.rev + current.dep; // Total flow magnitude? No, conventionally Donut is Expense breakdown or In/Out. 
  // User mockup shows mixed Rev/Dep/Inut in one donut. 
  // Let's use: Total = Rev + Dep. Segments relative to this sum.
  const donutTotal = current.rev + current.dep; 

  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-[#0A1D37]">
      <div className="w-[390px] min-h-[850px] bg-[#020b18] rounded-[40px] shadow-xl overflow-y-auto relative p-6 pb-20">
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 25s linear infinite; }
      `}</style>
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 pt-4">
          <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-full text-white hover:bg-white/10">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Statistiques</h1>
          <div className="w-8 h-8"></div>
        </div>

        {loading ? (
           <div className="text-white text-center mt-20">Chargement...</div>
        ) : (
          <>
            {/* MONTH SELECTOR */}
            <div className="w-full overflow-x-auto no-scrollbar mb-8">
              <div className="flex justify-center gap-4 min-w-max px-4">
                {statsData.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedMonthIndex(i)}
                    className={`px-4 py-2 rounded-xl border border-white/10 transition-all font-medium text-sm
                      ${selectedMonthIndex === i ? "bg-white text-[#0A1D37] shadow-[0_0_15px_rgba(255,255,255,0.4)]" : "bg-white/5 text-white/60"}`}
                  >
                    {m.monthLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* DONUT CHART */}
            <div className="w-full flex items-center justify-center relative mb-10">
              <svg viewBox="0 0 36 36" className="w-56 h-56 animate-spin-slow" style={{ overflow: "visible" }}>
                {/* Background Circle */}
                <circle cx="18" cy="18" r="16" stroke="#ffffff10" strokeWidth="4" fill="none" />

                {/* Segments */}
                {donutTotal > 0 && (
                   <>
                     {/* Rev - Blue */}
                     <circle cx="18" cy="18" r="16" stroke="#5E90C8" strokeWidth="4" fill="none"
                        strokeDasharray={`${(current.rev / donutTotal) * 100} 100`} strokeDashoffset="0" strokeLinecap="round" />
                     
                     {/* Dep - Yellow (offset by Rev) */}
                     <circle cx="18" cy="18" r="16" stroke="#D1B46E" strokeWidth="4" fill="none"
                        strokeDasharray={`${(current.dep / donutTotal) * 100} 100`} 
                        strokeDashoffset={`-${(current.rev / donutTotal) * 100}`} strokeLinecap="round" />
                        
                     {/* Inutile - Red (Overlay on Dep? Or separate? Math says Inut is PART of Dep usually. 
                         But visual mockup shows 3 separate segments. Let's just overlay Red on top of Yellow section for visual effect or treat as separate category?)
                         User asked to see "Inutiles". If Inut is subset of Dep, the donut should logically represent breakdown.
                         Let's keep separate arcs for visual : Rev vs Dep vs Inut(as separate slice? no illogical).
                         Let's do: Rev vs (Dep - Inut) vs Inut. 
                     */}
                     {/* Clean Dep (Dep - Inut) */}
                     {/* Actually, user mockup implies they sum to 100% of pie. Let's use the visual style: Filter applies. */}
                   </>
                )}
                
                {/* Apply Filter Highlights */}
                {filter === "rev" && <circle cx="18" cy="18" r="16" stroke="#5E90C8" strokeWidth="4" fill="none" strokeDasharray="100 0" />}
                {filter === "dep" && <circle cx="18" cy="18" r="16" stroke="#D1B46E" strokeWidth="4" fill="none" strokeDasharray="100 0" />}
                {filter === "inut" && <circle cx="18" cy="18" r="16" stroke="#C98484" strokeWidth="4" fill="none" strokeDasharray="100 0" />}

              </svg>

              {/* CENTER LABEL */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-white text-3xl font-bold tracking-tighter">
                  {filter === "all" && `${current.value > 0 ? '+' : ''}${parseFloat(current.value.toFixed(2))} €`}
                  {filter === "rev" && `+${parseFloat(current.rev.toFixed(2))} €`}
                  {filter === "dep" && `-${parseFloat(current.dep.toFixed(2))} €`}
                  {filter === "inut" && `-${parseFloat(current.inut.toFixed(2))} €`}
                </p>
                <p className="text-white/50 text-xs uppercase tracking-widest mt-1">
                  {filter === "all" && "Solde Net"}
                  {filter === "rev" && "Revenus"}
                  {filter === "dep" && "Dépenses"}
                  {filter === "inut" && "Gaspillage"}
                </p>
              </div>
            </div>

            <h2 className="text-white text-sm font-semibold mb-3 px-2 opacity-80">Détails du mois</h2>

            {/* TOGGLES */}
            <div className="flex gap-3 justify-center mb-8">
              {/* Revenus */}
              <button onClick={() => setFilter(filter === "rev" ? "all" : "rev")} className={`relative w-24 h-32 rounded-3xl flex flex-col items-center justify-center transition-all ${filter === "rev" ? "bg-[#5E90C8] shadow-[0_0_20px_#5E90C860]" : "bg-white/5 border border-white/10"}`}>
                 <div className="mb-2 p-2 bg-white/20 rounded-full"><ArrowLeft className="w-4 h-4 text-white rotate-90" /></div>
                 <p className="text-white font-bold text-sm">Revenus</p>
                 <p className="text-white/60 text-xs">{parseFloat(current.rev.toFixed(2))} €</p>
              </button>

              {/* Dépenses */}
              <button onClick={() => setFilter(filter === "dep" ? "all" : "dep")} className={`relative w-24 h-32 rounded-3xl flex flex-col items-center justify-center transition-all ${filter === "dep" ? "bg-[#D1B46E] shadow-[0_0_20px_#D1B46E60]" : "bg-white/5 border border-white/10"}`}>
                 <div className="mb-2 p-2 bg-white/20 rounded-full"><ArrowLeft className="w-4 h-4 text-white -rotate-90" /></div>
                 <p className="text-white font-bold text-sm">Dépenses</p>
                 <p className="text-white/60 text-xs">{parseFloat(current.dep.toFixed(2))} €</p>
              </button>

              {/* Inutiles */}
              <button onClick={() => setFilter(filter === "inut" ? "all" : "inut")} className={`relative w-24 h-32 rounded-3xl flex flex-col items-center justify-center transition-all ${filter === "inut" ? "bg-[#C98484] shadow-[0_0_20px_#C9848460]" : "bg-white/5 border border-white/10"}`}>
                 <div className="mb-2 p-2 bg-white/20 rounded-full text-white font-bold text-xs">⚠️</div>
                 <p className="text-white font-bold text-sm">Inutile</p>
                 <p className="text-white/60 text-xs">{parseFloat(current.inut.toFixed(2))} €</p>
              </button>
            </div>

            {/* EVOLUTION CURVE */}
            <div className="w-full bg-[#050A14] rounded-3xl p-6 border border-white/5 shadow-2xl">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-semibold">Tendance</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${current.value >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                     {current.value >= 0 ? "Positive" : "Négative"}
                  </span>
               </div>
               
               <div className="relative h-24 w-full">
                  <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                    <path d={generateFinanceCurve(current)} fill="none" stroke={current.value >= 0 ? "#4Ade80" : "#f87171"} strokeWidth="3" strokeLinecap="round" />
                    <circle cx="50" cy="20" r="3" fill="white" className="animate-pulse" />
                  </svg>
                  
                  {/* Fake Grid lines */}
                  <div className="absolute inset-0 border-b border-white/10 flex justify-between items-end pb-1 text-[8px] text-white/20">
                     <span>01</span>
                     <span>15</span>
                     <span>30</span>
                  </div>
               </div>
            </div>
            
          </>
        )}
      </div>
    </div>
  )
}