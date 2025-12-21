"use client"

import { useState, useEffect } from "react"
import Card3D from "@/app/components/card3d"
import { useAuth } from "@/components/AuthProvider"
import { collection, getDocs, query } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface Operation {
  id: string;
  label: string;
  amount: number;
  date: any; 
  category?: string;
}

export default function BudgetPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"stats" | "add" | "more" | null>(null)
  
  const [allOperations, setAllOperations] = useState<Operation[]>([])
  const [filteredOperations, setFilteredOperations] = useState<Operation[]>([])
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [balance, setBalance] = useState(0)
  const [income, setIncome] = useState(0)
  const [expense, setExpense] = useState(0)
  const [uselessTotal, setUselessTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const USELESS_KEYWORDS = ["mcdo", "starbucks", "uber eats", "netflix", "spotify", "restaurant", "bar", "kfc", "burger", "deliveroo"];

  useEffect(() => {
    const fetchOperations = async () => {
      if (!user) return;
      
      try {
        const q = query(collection(db, "users", user.uid, "operations"));
        const querySnapshot = await getDocs(q);
        
        const ops: Operation[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          ops.push({
            id: doc.id,
            label: data.label,
            amount: Number(data.amount),
            date: data.date,
            category: data.category
          });
        });

        // Sort desc
        ops.sort((a, b) => {
           const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
           const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
           return dateB.getTime() - dateA.getTime();
        });

        setAllOperations(ops);
      } catch (err) {
        console.error("Error fetching budget data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOperations();
  }, [user]);

  // Filter by Month whenever Month or Operations change
  useEffect(() => {
    if (loading) return;

    const filtered = allOperations.filter(op => {
       const d = op.date?.toDate ? op.date.toDate() : new Date(op.date);
       return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

    setFilteredOperations(filtered);

    // Calc totals for this Month
    let inc = 0, exp = 0, inut = 0;
    filtered.forEach(op => {
       if (op.amount > 0) inc += op.amount;
       else {
          exp += Math.abs(op.amount);
          // Useless check
          const label = op.label.toLowerCase();
          if (USELESS_KEYWORDS.some(k => label.includes(k))) inut += Math.abs(op.amount);
       }
    });

    setIncome(inc);
    setExpense(exp);
    setBalance(inc - exp);
    setUselessTotal(inut);

  }, [allOperations, currentDate, loading]);


  const changeMonth = (dir: -1 | 1) => {
     const newDate = new Date(currentDate);
     newDate.setMonth(newDate.getMonth() + dir);
     setCurrentDate(newDate);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('fr-FR', {
       day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate);

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">

      {/* PHONE FRAME */}
      <div className="w-[390px] min-h-[780px] bg-[#0A1D37] rounded-[40px] shadow-[0_0_40px_rgba(0,0,0,0.4)] p-6 relative overflow-y-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="p-2 bg-white/5 rounded-full hover:bg-white/10"
            >
              <ArrowLeft className="text-white w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold text-white">Mon budget</h1>
          </div>

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

        {/* ALERT: Useless Expenses */}
        {uselessTotal > 50 && (
           <div className="mb-6 p-4 bg-[#C98484]/20 border border-[#C98484]/50 rounded-2xl flex items-start gap-3 animate-pulse">
              <AlertTriangle className="text-[#C98484] w-5 h-5 shrink-0 mt-0.5" />
              <div>
                 <p className="text-[#C98484] font-bold text-sm">Attention : Dépenses élevées</p>
                 <p className="text-white/80 text-xs mt-1">
                   Vous avez dépensé <span className="font-bold">{uselessTotal.toFixed(0)}€</span> en achats potentiellement inutiles (Fast-food, etc.) ce mois-ci.
                 </p>
              </div>
           </div>
        )}

        {/* SOLDE ACTUEL */}
        <div className="mb-4">
          <p className="text-white/70 text-sm">Solde du mois ({monthLabel})</p>
          <p className={`text-2xl font-semibold ${balance >= 0 ? "text-white" : "text-red-400"}`}>
            {loading ? "..." : balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>

        {/* CARDS SWIPER */}
        <div className="w-full overflow-x-auto flex gap-4 snap-x snap-mandatory pb-4 no-scrollbar">
          <div className="min-w-[300px] h-[170px] rounded-3xl bg-gradient-to-br from-[#7C4DFF] to-[#4DA3FF] p-5 text-white snap-center shadow-lg">
            <p className="text-sm opacity-70">Revenus vs Dépenses</p>
            <div className="flex items-end gap-2 mt-2">
               <div>
                  <div className="flex items-center gap-1 text-green-300 text-sm"><TrendingUp size={14}/> Revenus</div>
                  <p className="text-xl font-bold">{income.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
               </div>
               <div className="h-8 w-[1px] bg-white/20 mx-2"></div>
               <div>
                  <div className="flex items-center gap-1 text-red-300 text-sm"><TrendingDown size={14}/> Dépenses</div>
                  <p className="text-xl font-bold">{expense.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
               </div>
            </div>
          </div>

          <div className="min-w-[300px] h-[170px] snap-center">
            <Card3D />
          </div>
        </div>

        {/* ACTION BUBBLES */}
        <div className="flex justify-center gap-10 mt-6 mb-8">

          <button
            onClick={() => router.push('/budget/statistique')}
            className={`flex flex-col items-center transition-all opacity-70 hover:opacity-100 hover:scale-110`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-white/10 text-white`}>
              📊
            </div>
            <p className="text-white text-xs mt-1">Statistiques</p>
          </button>

          <button
            onClick={() => router.push('/reglages/import')}
            className="flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity hover:scale-110"
          >
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              ➕
            </div>
            <p className="text-white text-xs mt-1">Import</p>
          </button>

        </div>

        {/* TRANSACTIONS HEADER + FILTER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-semibold text-lg">Transactions</h2>
          
          <div className="flex items-center bg-white/5 rounded-full px-2 py-1">
             <button onClick={() => changeMonth(-1)} className="p-1 hover:text-[#F5D657] text-white/50"><ChevronLeft size={16}/></button>
             <span className="text-xs text-white px-2 min-w-[80px] text-center capitalize">{monthLabel}</span>
             <button onClick={() => changeMonth(1)} className="p-1 hover:text-[#F5D657] text-white/50"><ChevronRight size={16}/></button>
          </div>
        </div>

        {/* TRANSACTIONS LIST */}
        <div className="space-y-4 pb-20">
          {loading ? (
             <div className="text-center text-white/50 py-10">Chargement...</div>
          ) : filteredOperations.length === 0 ? (
             <div className="text-center text-white/50 py-10">
                <p>Aucune transaction pour ce mois.</p>
             </div>
          ) : (
            filteredOperations.map((op) => (
              <div key={op.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="text-white flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${op.amount > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                     {op.amount > 0 ? "↓" : "↑"}
                  </div>
                  <div className="flex flex-col">
                    <p className="font-semibold line-clamp-1 w-40">{op.label}</p>
                    <p className="text-xs text-white/50">{formatDate(op.date)}</p>
                  </div>
                </div>
                <p className={`font-semibold ${op.amount > 0 ? "text-green-300" : "text-white"}`}>
                  {op.amount > 0 ? "+" : ""} {op.amount.toFixed(2)} €
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}