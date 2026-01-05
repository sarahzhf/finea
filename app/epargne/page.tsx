"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, deleteDoc } from "firebase/firestore"

interface SavingsEntry {
  id?: string;
  userId: string;
  date: string;
  amount: number;
  note?: string;
  createdAt: any;
}

interface SavingsGoal {
  id?: string;
  userId: string;
  targetAmount: number;
  frequency: "day" | "week" | "month" | "year";
  createdAt: any;
}

interface SavingsAccount {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
  ceiling?: number;
  interestRate: number;
}

export default function EpargnePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [savingsEntries, setSavingsEntries] = useState<SavingsEntry[]>([])
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [modalAmount, setModalAmount] = useState("")
  const [modalNote, setModalNote] = useState("")
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalAmount, setGoalAmount] = useState("")
  const [goalFrequency, setGoalFrequency] = useState<"day" | "week" | "month" | "year">("month")
  const [isLoading, setIsLoading] = useState(true)
  const [activeAccountIndex, setActiveAccountIndex] = useState(0)
  const [existingEntry, setExistingEntry] = useState<SavingsEntry | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<"calendar" | "chart">("calendar")
  const [iaOpen, setIaOpen] = useState(false)
  const [fineaOpen, setFineaOpen] = useState(false)
  const [coachInput, setCoachInput] = useState("")
  const [coachMessages, setCoachMessages] = useState<
    { role: "user" | "finea"; text: string }[]
  >([])
  const [coachLoading, setCoachLoading] = useState(false)
  
  const router = useRouter()
  const { user } = useAuth()


  const savingsAccounts: SavingsAccount[] = [
    {
      id: "1",
      name: "Livret A",
      accountNumber: "12345678901",
      balance: 15420.50,
      ceiling: 22950,
      interestRate: 3.0,
    },
    {
      id: "2",
      name: "PEA",
      accountNumber: "98765432109",
      balance: 8340.25,
      interestRate: 0,
    },
    {
      id: "3",
      name: "Assurance Vie",
      accountNumber: "55544433322",
      balance: 24680.00,
      interestRate: 2.5,
    },
  ]

  const totalSavingsAccounts = savingsAccounts.reduce((sum, acc) => sum + acc.balance, 0)

  useEffect(() => {
    if (user) {
      loadSavingsData()
      loadSavingsGoal()
    }
  }, [user])

  async function loadSavingsData() {
    if (!user) return

    try {
      const q = query(
        collection(db, "savings_entries"),
        where("userId", "==", user.uid)
      )
      const querySnapshot = await getDocs(q)
      const entries: SavingsEntry[] = []
      querySnapshot.forEach((doc) => {
        entries.push({ id: doc.id, ...doc.data() } as SavingsEntry)
      })
      setSavingsEntries(entries)
    } catch (error) {
      console.error("Erreur chargement épargne:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadSavingsGoal() {
    if (!user) return

    try {
      const q = query(
        collection(db, "savings_goals"),
        where("userId", "==", user.uid)
      )
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        const goalDoc = querySnapshot.docs[0]
        setSavingsGoal({ id: goalDoc.id, ...goalDoc.data() } as SavingsGoal)
        setGoalAmount(goalDoc.data().targetAmount.toString())
        setGoalFrequency(goalDoc.data().frequency)
      }
    } catch (error) {
      console.error("Erreur chargement objectif:", error)
    }
  }

  async function saveGoal() {
    if (!user || !goalAmount) return

    try {
      const goalData = {
        userId: user.uid,
        targetAmount: parseFloat(goalAmount),
        frequency: goalFrequency,
        createdAt: serverTimestamp(),
      }

      if (savingsGoal?.id) {
        await updateDoc(doc(db, "savings_goals", savingsGoal.id), goalData)
      } else {
        await addDoc(collection(db, "savings_goals"), goalData)
      }

      await loadSavingsGoal()
      setShowGoalModal(false)
    } catch (error) {
      console.error("Erreur sauvegarde objectif:", error)
      alert("Erreur lors de la sauvegarde de l'objectif")
    }
  }

  async function saveSavingsEntry() {
    if (!user || !selectedDate || !modalAmount) return

    try {
      const amount = parseFloat(modalAmount)

      if (existingEntry?.id) {
        if (amount === 0) {
          await deleteDoc(doc(db, "savings_entries", existingEntry.id))
        } else {
          await updateDoc(doc(db, "savings_entries", existingEntry.id), {
            amount,
            note: modalNote || "",
          })
        }
      } else {
        if (amount > 0) {
          const entryData = {
            userId: user.uid,
            date: selectedDate,
            amount,
            note: modalNote || "",
            createdAt: serverTimestamp(),
          }
          await addDoc(collection(db, "savings_entries"), entryData)
        }
      }

      await loadSavingsData()
      
      setShowAddModal(false)
      setModalAmount("")
      setModalNote("")
      setSelectedDate("")
      setExistingEntry(null)
    } catch (error) {
      console.error("Erreur sauvegarde épargne:", error)
      alert("Erreur lors de la sauvegarde")
    }
  }

  const totalSaved = savingsEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const targetAmount = savingsGoal?.targetAmount || 0
  const progressPercent = targetAmount > 0 ? Math.min((totalSaved / targetAmount) * 100, 100) : 0

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

    const days = []
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return days
  }

  function getAmountForDate(day: number | null) {
    if (!day) return 0
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const entry = savingsEntries.find(e => e.date === dateStr)
    return entry?.amount || 0
  }

  function getEntryForDate(day: number | null): SavingsEntry | null {
    if (!day) return null
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return savingsEntries.find(e => e.date === dateStr) || null
  }

  function handleDayClick(day: number | null) {
    if (!day) return
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const entry = getEntryForDate(day)
    
    setSelectedDate(dateStr)
    if (entry) {
      setExistingEntry(entry)
      setModalAmount(entry.amount.toString())
      setModalNote(entry.note || "")
    } else {
      setExistingEntry(null)
      setModalAmount("")
      setModalNote("")
    }
    setShowAddModal(true)
  }

  function previousMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const days = getDaysInMonth(currentMonth)
  const monthName = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  function getMonthlyStats() {
    const stats = []
    
    for (let month = 1; month <= 12; month++) {
      const monthStr = `${selectedYear}-${String(month).padStart(2, '0')}`
      
      const monthEntries = savingsEntries.filter(e => e.date.startsWith(monthStr))
      const total = monthEntries.reduce((sum, entry) => sum + entry.amount, 0)
      
      stats.push({
        month: String(month).padStart(2, '0'),
        amount: total
      })
    }
    
    return stats
  }

  const monthlyStats = getMonthlyStats()
  const maxMonthlyAmount = Math.max(...monthlyStats.map(s => s.amount), 100)

  const currentAccount = savingsAccounts[activeAccountIndex]
  const ceilingPercent = currentAccount.ceiling 
    ? Math.min((currentAccount.balance / currentAccount.ceiling) * 100, 100) 
    : 0

  function nextAccount() {
    setActiveAccountIndex((activeAccountIndex + 1) % savingsAccounts.length)
  }

  function previousAccount() {
    setActiveAccountIndex((activeAccountIndex - 1 + savingsAccounts.length) % savingsAccounts.length)
  }

  function previousYear() {
    setSelectedYear(selectedYear - 1)
  }

  function nextYear() {
    setSelectedYear(selectedYear + 1)
  }

  const openFineaWithPrompt = async (prompt: string) => {
    setFineaOpen(true)
    setCoachLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          context: {
            month: currentMonth.toISOString().slice(0, 7),
            totalSaved,
            targetAmount,
            frequency: savingsGoal?.frequency ?? null,
            entriesSample: savingsEntries.slice(-20),
          },
        }),
      })

      const data = await res.json()
      const reply =
        data?.reply ||
        "Je n’ai pas pu analyser ton épargne pour le moment."

      setCoachMessages([
        { role: "user", text: prompt },
        { role: "finea", text: reply },
      ])
    } catch {
      setCoachMessages([
        { role: "user", text: prompt },
        { role: "finea", text: "Erreur interne du coach Finéa." },
      ])
    } finally {
      setCoachLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#050A14] flex justify-center items-start py-8 px-3">
      <div className="w-[390px] min-h-[780px] bg-[#0A1D37] rounded-[40px] shadow-none p-6 relative overflow-hidden pb-24">

        {/* HEADER AVEC BOUTON RETOUR */}
        <div className="relative z-10 flex items-center justify-between mb-5">
          <button
            onClick={() => router.push('/')}
            className="text-[#F5D657] text-xl active:scale-95 transition"
          >
            ←
          </button>
          <h1 className="text-xl font-semibold text-[#F5D657] drop-shadow">
            Épargne
          </h1>
          <div className="w-6"></div>
        </div>

        <div className="relative z-10 space-y-4 max-h-[650px] overflow-y-auto pb-4">

          {/* TOTAL ÉPARGNE */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-none">
            <p className="text-xs font-medium text-white mb-1">Total épargne</p>
            <p className="text-2xl font-bold text-white">
              {totalSavingsAccounts.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </p>
          </div>

          {/* COMPTES D'ÉPARGNE */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-none">
            <div className="flex items-center justify-between mb-3">
              <button 
                onClick={previousAccount}
                className="text-[#F5D657] text-lg p-1 active:scale-95 transition"
              >
                ←
              </button>
              <h2 className="text-base font-semibold text-white">{currentAccount.name}</h2>
              <button 
                onClick={nextAccount}
                className="text-[#F5D657] text-lg p-1 active:scale-95 transition"
              >
                →
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-xs">N° compte</span>
                <span className="text-white font-mono text-xs">{currentAccount.accountNumber}</span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-white/60 text-xs">Solde</span>
                <span className="text-white font-bold text-lg">
                  {currentAccount.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </span>
              </div>

              {currentAccount.ceiling && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-xs">Plafond</span>
                    <span className="text-white/70 text-xs">
                      {currentAccount.ceiling.toLocaleString('fr-FR')} €
                    </span>
                  </div>

                  <div className="pt-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white/60 text-xs">Remplissage</span>
                      <span className="text-white/70 text-xs font-medium">{ceilingPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0A1D37] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-500"
                        style={{ width: `${ceilingPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </>
              )}

              {currentAccount.interestRate > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-white/60 text-xs">Taux</span>
                  <span className="text-green-400 font-semibold text-xs">{currentAccount.interestRate}%</span>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-1.5 mt-3">
              {savingsAccounts.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all ${
                    idx === activeAccountIndex 
                      ? "w-4 bg-[#F5D657]" 
                      : "w-1 bg-[#F5D657]/20"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* OBJECTIF */}
          {savingsGoal && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-none">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-white">Objectif d'épargne</h2>
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="text-xs bg-[#F5D657]/10 text-[#F5D657] px-2 py-1 rounded-lg active:scale-95 transition"
                >
                  ⚙️
                </button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-xs">Épargné</span>
                  <span className="text-white font-bold text-base">{totalSaved.toFixed(2)} €</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-xs">Cible</span>
                  <span className="text-white/70 text-sm">{targetAmount.toFixed(2)} €</span>
                </div>
                
                <div className="pt-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/60 text-xs">Progression</span>
                    <span className="text-white/70 text-xs font-medium">{progressPercent.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#0A1D37] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!savingsGoal && (
            <button
              onClick={() => setShowGoalModal(true)}
              className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 shadow-none text-[#F5D657] text-sm font-medium active:scale-95 transition"
            >
              Définir un objectif d'épargne
            </button>
          )}

          {/* FILTRE VUE : JOURS / MOIS */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-none">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition ${
                  viewMode === "calendar"
                    ? "bg-[#F5D657] text-[#0F2B52]"
                    : "bg-[#0A1D37] text-[#F5D657]/60"
                }`}
              >
                Jours
              </button>
              <button
                onClick={() => setViewMode("chart")}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition ${
                  viewMode === "chart"
                    ? "bg-[#F5D657] text-[#0F2B52]"
                    : "bg-[#0A1D37] text-[#F5D657]/60"
                }`}
              >
                Mois
              </button>
            </div>

            {/* VUE CALENDRIER */}
            {viewMode === "calendar" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={previousMonth} className="text-[#F5D657] text-2xl">←</button>
                  <h2 className="text-lg font-bold text-[#F5D657] capitalize">{monthName}</h2>
                  <button onClick={nextMonth} className="text-[#F5D657] text-2xl">→</button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['LUN.', 'MAR.', 'MER.', 'JEU.', 'VEN.', 'SAM.', 'DIM.'].map(day => (
                    <div key={day} className="text-center text-[#F5D657]/50 text-xs font-semibold">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, idx) => {
                    const amount = getAmountForDate(day)
                    return (
                      <button
                        key={idx}
                        onClick={() => handleDayClick(day)}
                        disabled={!day}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs transition ${
                          day
                            ? "bg-[#0A1D37] text-[#F5D657] hover:bg-[#0A1D37]/70 active:scale-95"
                            : "bg-transparent"
                        }`}
                      >
                        {day && (
                          <>
                            <span className="font-semibold">{day}</span>
                            <span className="text-[10px] text-white">{amount.toFixed(0)} €</span>
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => {
                    setSelectedDate(new Date().toISOString().split('T')[0])
                    setExistingEntry(null)
                    setModalAmount("")
                    setModalNote("")
                    setShowAddModal(true)
                  }}
                  className="w-full mt-4 py-2 rounded-xl bg-[#F5D657] text-[#0F2B52] font-semibold text-sm active:scale-95 transition"
                >
                  + Ajouter de l'épargne
                </button>

                {/* IA FINÉA – COACH ÉPARGNE */}
                <div className="mt-5 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-none">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-white">Coach Finéa</p>
                    <button
                      onClick={() => setIaOpen(v => !v)}
                      className="text-xs text-[#F5D657]"
                    >
                      {iaOpen ? "Fermer" : "Ouvrir"}
                    </button>
                  </div>

                  <p className="text-xs text-white/60 mb-3">
                    Analyse intelligente de ton épargne et plan personnalisé.
                  </p>

                  {iaOpen && (
                    <div className="space-y-3">
                      <button
                        onClick={() =>
                          openFineaWithPrompt(
                            "Analyse mon épargne ce mois-ci et donne-moi 3 actions concrètes."
                          )
                        }
                        className="w-full py-2 rounded-xl bg-[#F5D657]/10 text-[#F5D657] text-xs"
                      >
                        Analyse du mois
                      </button>

                      <button
                        onClick={() =>
                          openFineaWithPrompt(
                            "Propose-moi un plan réaliste pour atteindre mon objectif d’épargne."
                          )
                        }
                        className="w-full py-2 rounded-xl bg-[#F5D657]/10 text-[#F5D657] text-xs"
                      >
                        Plan pour mon objectif
                      </button>

                      {fineaOpen && (
                        <div className="bg-[#0A1D37] border border-white/10 rounded-xl p-3 space-y-2">
                          {coachMessages.map((m, i) => (
                            <div
                              key={i}
                              className={`text-xs ${
                                m.role === "user" ? "text-white" : "text-[#F5D657]"
                              }`}
                            >
                              {m.text}
                            </div>
                          ))}

                          {coachLoading && (
                            <p className="text-xs text-white/40">Finéa réfléchit…</p>
                          )}

                          <form
                            onSubmit={e => {
                              e.preventDefault()
                              if (!coachInput.trim()) return
                              openFineaWithPrompt(coachInput)
                              setCoachInput("")
                            }}
                            className="flex gap-2 mt-2"
                          >
                            <input
                              value={coachInput}
                              onChange={e => setCoachInput(e.target.value)}
                              placeholder="Écris à Finéa…"
                              className="flex-1 bg-[#050A14] text-white text-xs rounded-lg px-2 py-1"
                            />
                            <button
                              type="submit"
                              className="px-3 rounded-lg bg-[#F5D657] text-[#0F2B52] text-xs"
                            >
                              ➤
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VUE GRAPHIQUE */}
            {viewMode === "chart" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <button 
                    onClick={previousYear}
                    className="text-[#F5D657] text-lg p-1 active:scale-95 transition"
                  >
                    ←
                  </button>
                  <h2 className="text-base font-semibold text-[#F5D657]">Évolution {selectedYear}</h2>
                  <button 
                    onClick={nextYear}
                    className="text-[#F5D657] text-lg p-1 active:scale-95 transition"
                  >
                    →
                  </button>
                </div>
                
                <div className="relative h-40">
                  <div className="absolute left-0 top-0 bottom-5 flex flex-col justify-between text-[10px] text-[#F5D657]/40 pr-2">
                    <span>{maxMonthlyAmount.toFixed(0)}€</span>
                    <span>{(maxMonthlyAmount * 0.75).toFixed(0)}€</span>
                    <span>{(maxMonthlyAmount * 0.5).toFixed(0)}€</span>
                    <span>{(maxMonthlyAmount * 0.25).toFixed(0)}€</span>
                    <span>0€</span>
                  </div>

                  <div className="absolute left-10 right-0 top-0 bottom-5 flex flex-col justify-between">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className="border-t border-[#F5D657]/5"></div>
                    ))}
                  </div>

                  <svg className="absolute left-10 right-0 top-0 bottom-5 w-[calc(100%-2.5rem)] h-[calc(100%-1.25rem)]" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="#F5D657"
                      strokeWidth="1.5"
                      points={monthlyStats.map((stat, idx) => {
                        const x = (idx / (monthlyStats.length - 1)) * 100
                        const y = 100 - ((stat.amount / maxMonthlyAmount) * 100)
                        return `${x},${y}`
                      }).join(' ')}
                    />
                    {monthlyStats.map((stat, idx) => {
                      const x = (idx / (monthlyStats.length - 1)) * 100
                      const y = 100 - ((stat.amount / maxMonthlyAmount) * 100)
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r="1.5"
                          fill="#F5D657"
                        />
                      )
                    })}
                  </svg>

                  <div className="absolute left-10 right-0 bottom-0 flex justify-between text-[9px] text-[#F5D657]/40">
                    {monthlyStats.map((stat, idx) => (
                      <span key={idx} className="flex-1 text-center">{stat.month}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* MODAL AJOUT/MODIFICATION */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-none">
              <h3 className="text-lg font-semibold text-[#F5D657] mb-4">
                {existingEntry ? "Modifier l'épargne" : "Ajouter de l'épargne"}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[#F5D657]/60 text-xs block mb-1.5">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-[#0A1D37] text-[#F5D657] rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="text-[#F5D657]/60 text-xs block mb-1.5">
                    Montant (€) {existingEntry && <span className="text-[#F5D657]/40">• Mettez 0 pour supprimer</span>}
                  </label>
                  <input
                    type="number"
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                    className="w-full bg-[#0A1D37] text-[#F5D657] rounded-xl px-3 py-2.5 text-base font-semibold"
                    placeholder="50"
                  />
                </div>

                <div>
                  <label className="text-[#F5D657]/60 text-xs block mb-1.5">Note (optionnelle)</label>
                  <input
                    type="text"
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                    className="w-full bg-[#0A1D37] text-[#F5D657] rounded-xl px-3 py-2.5 text-sm"
                    placeholder="Épargne mensuelle"
                  />
                </div>

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setExistingEntry(null)
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#0A1D37] text-[#F5D657] text-sm font-medium active:scale-95 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveSavingsEntry}
                    className="flex-1 py-2.5 rounded-xl bg-[#F5D657] text-[#0F2B52] text-sm font-medium active:scale-95 transition"
                  >
                    {existingEntry ? "Modifier" : "Enregistrer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL OBJECTIF */}
        {showGoalModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-none">
              <h3 className="text-lg font-semibold text-[#F5D657] mb-4">Définir mon objectif</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[#F5D657]/60 text-xs block mb-1.5">Montant cible (€)</label>
                  <input
                    type="number"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(e.target.value)}
                    className="w-full bg-[#0A1D37] text-[#F5D657] rounded-xl px-3 py-2.5 text-base font-semibold"
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label className="text-[#F5D657]/60 text-xs block mb-1.5">Fréquence</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { value: 'day', label: 'Jour' },
                      { value: 'week', label: 'Semaine' },
                      { value: 'month', label: 'Mois' },
                      { value: 'year', label: 'An' },
                    ].map((freq) => (
                      <button
                        key={freq.value}
                        onClick={() => setGoalFrequency(freq.value as any)}
                        className={`py-2 px-2 rounded-lg text-xs font-medium transition ${
                          goalFrequency === freq.value
                            ? "bg-[#F5D657] text-[#0F2B52]"
                            : "bg-[#0A1D37] text-[#F5D657]/60"
                        }`}
                      >
                        {freq.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => setShowGoalModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#0A1D37] text-[#F5D657] text-sm font-medium active:scale-95 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveGoal}
                    className="flex-1 py-2.5 rounded-xl bg-[#F5D657] text-[#0F2B52] text-sm font-medium active:scale-95 transition"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  )
}