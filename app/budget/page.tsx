"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Card3D from "@/app/components/card3d"

function parseFRDate(dateStr?: unknown) {
  if (!dateStr) return null

  // Already a Date
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? null : dateStr
  }

  if (typeof dateStr !== "string") return null
  const cleaned = dateStr.trim()

  // DD/MM/YYYY
  let match = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (match) {
    const [, day, month, year] = match
    const d = new Date(Number(year), Number(month) - 1, Number(day))
    return isNaN(d.getTime()) ? null : d
  }

  // YYYY-MM-DD (Supabase/date column)
  match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    const [, year, month, day] = match
    const d = new Date(Number(year), Number(month) - 1, Number(day))
    return isNaN(d.getTime()) ? null : d
  }

  return null
}

function formatMonthLabel(key: string, showYear: boolean) {
  const [y, m] = key.split("-").map(Number)
  const label = new Date(y, m - 1).toLocaleDateString("fr-FR", {
    month: "long",
  })
  return showYear ? `${label} ${y}` : label
}

function cleanLabel(label?: string) {
  if (!label) return "Transaction"
  return label
    .replace(/PAIEMENT PAR CARTE/gi, "")
    .replace(/PRELEVEMENT/gi, "")
    .replace(/VIREMENT EN VOTRE FAVEUR/gi, "")
    .replace(/VIREMENT EMIS/gi, "")
    .replace(/X\d{4}/gi, "")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeForKey(label?: string) {
  if (!label) return ""
  return label
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function dedupeTransactions(list: any[]) {
  const seen = new Set<string>()
  const out: any[] = []

  for (const t of list) {
    const date = typeof t?.date === "string" ? t.date.trim() : String(t?.date ?? "")
    const amount = Number(t?.amount ?? 0)
    // On utilise le label brut + un label nettoyé pour éviter des variations d'espaces/retours à la ligne
    const raw = normalizeForKey(t?.label)
    const cleaned = normalizeForKey(cleanLabel(t?.label))
    const key = `${date}__${amount}__${raw || cleaned}`

    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }

  return out
}

const USELESS_KEYWORDS = [
  "uber",
  "bolt",
  "spotify",
  "apple",
  "shein",
  "bershka",
  "zara",
  "amazon",
  "prime",
  "tiktok",
  "deliveroo",
  "ubereats",
]

function isUselessExpense(label?: string) {
  const l = cleanLabel(label).toLowerCase()
  return USELESS_KEYWORDS.some(k => l.includes(k))
}

export default function BudgetPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bank = (searchParams.get("bank") ?? "CA") as "CA" | "SG"

  const [activeTab, setActiveTab] = useState<"stats" | "add" | "more" | null>(null)
  const [statFilter, setStatFilter] = useState<"all" | "income" | "expenses" | "useless">("all")

  // IA / Finéa (contextuelle, basée sur tes vraies transactions du mois + banque)
  const [iaOpen, setIaOpen] = useState(false)
  const [fineaOpen, setFineaOpen] = useState(false)
  const [coachInput, setCoachInput] = useState("")
  const [coachMessages, setCoachMessages] = useState<
    { role: "user" | "finea"; text: string }[]
  >([])
  const [coachLoading, setCoachLoading] = useState(false)

  const [summary, setSummary] = useState<{
    balance: number
    expenses: number
    income: number
  } | null>(null)

  const [transactions, setTransactions] = useState<any[]>([])

  const globalBalance = transactions.reduce((sum, t) => {
    return sum + (Number(t.amount) || 0)
  }, 0)

  const [selectedMonth, setSelectedMonth] = useState<string>("")


  useEffect(() => {
    fetch(`/api/transactions/summary?bank=${bank}`)
      .then(res => res.json())
      .then(setSummary)
  }, [bank])

  useEffect(() => {
    fetch(`/api/transactions/list?bank=${bank}`)
      .then(res => res.json())
      .then(data => {
        const txRaw = data.transactions ?? []
        const tx = dedupeTransactions(txRaw)

        tx.sort((a, b) => {
          const da = parseFRDate(a.date)?.getTime() ?? 0
          const db = parseFRDate(b.date)?.getTime() ?? 0
          return db - da
        })

        setTransactions(tx)
      })
  }, [bank])

  const monthKeys = Array.from(
    new Set(
      transactions
        .map(t => {
          const d = parseFRDate(t.date)
          if (!d || isNaN(d.getTime())) return null
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        })
        .filter((v): v is string => Boolean(v))
    )
  )

  // Sort newest -> oldest
  const months = monthKeys.sort((a, b) => {
    const [ay, am] = a.split("-").map(Number)
    const [by, bm] = b.split("-").map(Number)
    return by !== ay ? by - ay : bm - am
  })

  useEffect(() => {
    if (!selectedMonth && months.length > 0) {
      setSelectedMonth(months[0]) // mois le plus récent
    }
  }, [months, selectedMonth])

  const uniqueYears = Array.from(new Set(months.map(m => Number(m.split("-")[0]))))
  const showYearInMonthLabel = uniqueYears.length > 1

  const filteredTransactions =
    !selectedMonth
      ? []
      : transactions.filter(t => {
        const d = parseFRDate(t.date)
        if (!d) return false
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        return key === selectedMonth
      })

  const monthlySummary = filteredTransactions.reduce(
    (acc, t) => {
      if (t.amount < 0) acc.expenses += Math.abs(t.amount)
      else acc.income += t.amount
      acc.balance += t.amount
      return acc
    },
    { expenses: 0, income: 0, balance: 0 }
  )

  const uselessTransactions = useMemo(() => {
    return filteredTransactions.filter(
      (t) => Number(t.amount) < 0 && isUselessExpense(t.label)
    )
  }, [filteredTransactions])

  const uselessTotal = useMemo(() => {
    return uselessTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)
  }, [uselessTransactions])

  // Contexte envoyé à GPT (Finéa) : banque + mois + résumé + exemples
  const coachContext = useMemo(() => {
    const txSample = filteredTransactions.slice(0, 30).map((t) => {
      const amt = Number(t.amount) || 0
      return {
        date: t.date ?? "",
        label: cleanLabel(t.label),
        amount: amt,
        type: amt < 0 ? "debit" : "credit",
      }
    })

    const uselessSample = uselessTransactions.slice(0, 12).map((t) => ({
      date: t.date ?? "",
      label: cleanLabel(t.label),
      amount: Number(t.amount) || 0,
    }))

    return {
      bank,
      month: selectedMonth,
      monthLabel: selectedMonth ? formatMonthLabel(selectedMonth, showYearInMonthLabel) : "",
      summary: {
        monthIncome: monthlySummary.income,
        monthExpenses: monthlySummary.expenses,
        monthBalance: monthlySummary.balance,
        currentBalanceCalculated: globalBalance,
        uselessTotal,
        txCountMonth: filteredTransactions.length,
      },
      uselessExamples: uselessSample,
      transactions: txSample,
    }
  }, [
    bank,
    selectedMonth,
    showYearInMonthLabel,
    filteredTransactions,
    uselessTransactions,
    uselessTotal,
    monthlySummary,
    globalBalance,
  ])

  const filteredForStats = filteredTransactions.filter(t => {
    if (statFilter === "income") return t.amount > 0
    if (statFilter === "expenses") return t.amount < 0
    if (statFilter === "useless") return t.amount < 0 && isUselessExpense(t.label)
    return true
  })

  const statsTotals = filteredForStats.reduce(
    (acc, t) => {
      if (t.amount < 0) acc.expenses += Math.abs(t.amount)
      else acc.income += t.amount
      acc.balance += t.amount
      return acc
    },
    { expenses: 0, income: 0, balance: 0 }
  )

  const totalForDonut = statsTotals.expenses + statsTotals.income || 1
  const incomePct = (statsTotals.income / totalForDonut) * 100
  const expensesPct = (statsTotals.expenses / totalForDonut) * 100

  const openFineaWithPrompt = async (prompt: string) => {
    setFineaOpen(true)
    setCoachLoading(true)

    // Reset conversation with a first user message
    const first = [{ role: "user" as const, content: prompt }]

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: first,
          context: coachContext,
        }),
      })
      const data = await res.json()
      const reply =
        data?.reply ||
        data?.message ||
        "Je n’ai pas pu répondre pour le moment. Réessaie dans quelques secondes."

      setCoachMessages([
        { role: "user", text: prompt },
        { role: "finea", text: reply },
      ])
    } catch {
      setCoachMessages([
        { role: "user", text: prompt },
        {
          role: "finea",
          text: "Erreur interne du coach. Vérifie ta clé OpenAI et relance l’app.",
        },
      ])
    } finally {
      setCoachLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">

      {/* PHONE FRAME */}
      <div className="w-[390px] min-h-[780px] bg-[#0A1D37] rounded-[40px] shadow-[0_0_40px_rgba(0,0,0,0.4)] p-6 relative overflow-y-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/')}
              className="text-[#F5D657] text-xl active:scale-95 transition"
              aria-label="Retour"
              type="button"
            >
              ←
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Mon budget</h1>
              <p className="text-white/40 text-xs mt-1">
                {selectedMonth ? formatMonthLabel(selectedMonth, showYearInMonthLabel) : ""}
              </p>
              <p className="text-white/50 text-sm">
                Compte sélectionné : {bank === "CA" ? "Crédit Agricole" : "Société Générale"}
              </p>
            </div>
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

        {/* SOLDE ACTUEL */}
        <div className="mb-4">
          <p className="text-white/70 text-sm">Solde actuel</p>
          <p className="text-white text-2xl font-semibold">
            {globalBalance.toLocaleString("fr-FR")} €
          </p>

          <p className="text-white/40 text-xs mt-1">
            Variation {formatMonthLabel(selectedMonth, showYearInMonthLabel)} :
            {" "}
            {monthlySummary.balance >= 0 ? "+" : ""}
            {monthlySummary.balance.toLocaleString("fr-FR")} €
          </p>
        </div>

        {/* IA DISCRÈTE : alerte + explication + chat contextuel (mois + banque) */}
        <div className="mb-5">
          {selectedMonth && uselessTotal > 100 && (
            <button
              onClick={() => setIaOpen((v) => !v)}
              className="w-full text-left text-xs text-white/70 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 hover:bg-white/10 transition"
            >
              <span className="mr-2">⚠️</span>
              Attention : dépenses inutiles élevées ce mois-ci
              <span className="float-right text-white/40">{iaOpen ? "—" : "+"}</span>
            </button>
          )}

          {iaOpen && (
            <div className="mt-3 bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white text-sm font-semibold mb-2">
                Dépenses inutiles détectées : {uselessTotal.toLocaleString("fr-FR")} €
              </p>

              <p className="text-white/70 text-xs leading-relaxed">
                J’ai repéré des paiements récurrents/impulsifs (ex : transport, abonnements, achats).
                Si tu veux, je te fais un plan concret pour réduire ça le mois prochain.
              </p>

              {uselessTransactions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uselessTransactions.slice(0, 3).map((t, idx) => (
                    <div
                      key={`${t.date ?? "na"}-${t.amount ?? 0}-${idx}`}
                      className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-white text-xs font-medium truncate">
                          {cleanLabel(t.label)}
                        </p>
                        <p className="text-white/40 text-[10px]">
                          {(() => {
                            const d = parseFRDate(t.date)
                            return d ? d.toLocaleDateString("fr-FR") : "—"
                          })()}
                        </p>
                      </div>
                      <p className="text-white text-xs font-semibold">
                        -{Math.abs(Number(t.amount) || 0).toLocaleString("fr-FR")} €
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() =>
                    openFineaWithPrompt(
                      `Analyse ${selectedMonth ? formatMonthLabel(selectedMonth, showYearInMonthLabel) : "ce mois"} sur ${bank === "CA" ? "Crédit Agricole" : "Société Générale"
                      } : pourquoi mes dépenses inutiles sont élevées ? Donne-moi 3 actions concrètes + un plan sur 7 jours.`
                    )
                  }
                  className="flex-1 bg-white/10 border border-white/10 rounded-2xl py-2 text-white text-xs hover:bg-white/15 transition"
                >
                  Discuter avec Finéa
                </button>

                <button
                  onClick={() => setIaOpen(false)}
                  className="px-4 bg-white/5 border border-white/10 rounded-2xl py-2 text-white/70 text-xs hover:bg-white/10 transition"
                >
                  Fermer
                </button>
              </div>

              {/* Chat inline */}
              {fineaOpen && (
                <div className="mt-4 bg-[#08162B] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <img src="/icons/fineamascotte.png" className="w-7 h-7" />
                      <p className="text-white text-sm font-semibold">Finéa</p>
                    </div>
                    <button
                      onClick={() => setFineaOpen(false)}
                      className="text-white/50 hover:text-white/80 text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="max-h-[220px] overflow-y-auto px-4 py-3 space-y-3">
                    {coachMessages.length === 0 && (
                      <p className="text-white/50 text-xs">
                        Je peux analyser tes dépenses du mois et te proposer un plan.
                      </p>
                    )}

                    {coachMessages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${m.role === "user"
                              ? "bg-white/10 text-white"
                              : "bg-white/5 text-white/90"
                            }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    ))}

                    {coachLoading && (
                      <p className="text-white/40 text-xs">Finéa réfléchit…</p>
                    )}
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      const text = coachInput.trim()
                      if (!text || coachLoading) return

                      setCoachMessages((m) => [...m, { role: "user", text }])
                      setCoachInput("")
                      setCoachLoading(true)

                      try {
                        const history = [
                          ...coachMessages.map((m) => ({
                            role: m.role === "finea" ? ("assistant" as const) : ("user" as const),
                            content: m.text,
                          })),
                          { role: "user" as const, content: text },
                        ]

                        const res = await fetch("/api/chat", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            messages: history,
                            context: coachContext,
                          }),
                        })

                        const data = await res.json()
                        const reply =
                          data?.reply ||
                          data?.message ||
                          "Je n’ai pas pu répondre pour le moment. Réessaie dans quelques secondes."

                        setCoachMessages((m) => [...m, { role: "finea", text: reply }])
                      } catch {
                        setCoachMessages((m) => [
                          ...m,
                          {
                            role: "finea",
                            text: "Erreur interne du coach. Vérifie ta clé OpenAI et relance l’app.",
                          },
                        ])
                      } finally {
                        setCoachLoading(false)
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-3 border-t border-white/10"
                  >
                    <input
                      value={coachInput}
                      onChange={(e) => setCoachInput(e.target.value)}
                      placeholder="Écris à Finéa…"
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-white text-xs outline-none placeholder:text-white/30"
                    />
                    <button
                      type="submit"
                      className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 text-white text-sm hover:bg-white/15 transition active:scale-95"
                      aria-label="Envoyer"
                    >
                      ➤
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CARDS SWIPER */}
        <div className="w-full overflow-x-auto flex gap-4 snap-x snap-mandatory pb-4">
          <div className="min-w-[300px] h-[170px] snap-center">
            <Card3D
              front="/visacard1.jpg"
              back="/visacard2.jpg"
            />
          </div>

          <div className="min-w-[300px] h-[170px] snap-center">
            <Card3D
              front="/card1.jpg"
              back="/card2.jpg"
            />
          </div>
        </div>

        {/* ACTION BUBBLES */}
        <div className="flex justify-center gap-10 mt-6 mb-8">

          <button
            onClick={() => {
              router.push(`/budget/statistique?bank=${bank}`)
            }}
            className="flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              📊
            </div>
            <p className="text-white text-xs mt-1">Statistiques</p>
          </button>

          <button
            onClick={() => setActiveTab("add")}
            className="flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              ➕
            </div>
            <p className="text-white text-xs mt-1">Ajouts</p>
          </button>

          <button
            onClick={() => setActiveTab("more")}
            className="flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              ⋯
            </div>
            <p className="text-white text-xs mt-1">Plus</p>
          </button>
        </div>

        {/* STATISTIQUES */}
        {activeTab === "stats" && (
          <div className="bg-white/10 backdrop-blur-xl p-5 rounded-3xl border border-white/10 mb-6">
            <h2 className="text-white font-semibold mb-4">Statistiques</h2>

            <div className="flex justify-between mb-4">
              <button
                onClick={() => setStatFilter("income")}
                className={`text-white text-xs px-3 py-1 rounded-full ${statFilter === "income" ? "bg-[#4DA3FF]" : "bg-white/10"}`}
              >
                Revenus
              </button>
              <button
                onClick={() => setStatFilter("expenses")}
                className={`text-white text-xs px-3 py-1 rounded-full ${statFilter === "expenses" ? "bg-[#EAC449]" : "bg-white/10"}`}
              >
                Dépenses
              </button>
              <button
                onClick={() => setStatFilter("useless")}
                className={`text-white text-xs px-3 py-1 rounded-full ${statFilter === "useless" ? "bg-[#C56C6C]" : "bg-white/10"}`}
              >
                Inutiles
              </button>
            </div>

            {/* DONUT GLOBAL */}
            <div className="relative w-52 h-52 mx-auto">
              <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                <path
                  d="M18 2 a 16 16 0 1 1 0 32"
                  fill="none"
                  stroke="#4DA3FF"
                  strokeWidth="3"
                  strokeDasharray={`${incomePct} ${100 - incomePct}`}
                />
                <path
                  d="M18 2 a 16 16 0 1 1 0 32"
                  fill="none"
                  stroke="#EAC449"
                  strokeWidth="3"
                  strokeDasharray={`${expensesPct} ${100 - expensesPct}`}
                  strokeDashoffset={`-${incomePct}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-white text-lg font-bold">
                  {statFilter === "income" && `+${statsTotals.income.toLocaleString("fr-FR")} €`}
                  {statFilter === "expenses" && `-${statsTotals.expenses.toLocaleString("fr-FR")} €`}
                  {statFilter === "useless" && `-${statsTotals.expenses.toLocaleString("fr-FR")} €`}
                  {statFilter === "all" && `${statsTotals.balance.toLocaleString("fr-FR")} €`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TRANSACTIONS HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-semibold text-lg">Transactions</h2>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-transparent text-white/70 text-sm outline-none"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m, showYearInMonthLabel)}
              </option>
            ))}
          </select>
        </div>

        {/* TRANSACTIONS LIST */}
        <div className="space-y-3 pb-24 max-h-[320px] overflow-y-auto">
          {filteredTransactions.map((t, i) => (
            <div
              key={`${t.date ?? "na"}-${t.amount ?? 0}-${cleanLabel(t.label)}-${i}`}
              className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10"
            >
              <div className="text-white">
                <p className="font-semibold line-clamp-1">
                  {cleanLabel(t.label)}
                </p>
                <p className="text-xs text-white/50">
                  {(() => {
                    const d = parseFRDate(t.date)
                    return d ? d.toLocaleDateString("fr-FR") : "—"
                  })()}
                </p>
                <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${t.amount < 0
                    ? "bg-red-500/20 text-red-300"
                    : "bg-green-500/20 text-green-300"
                  }`}>
                  {t.amount < 0 ? "Débit" : "Crédit"}
                </span>
              </div>

              <p
                className={`font-semibold ${t.amount < 0 ? "text-red-300" : "text-green-300"
                  }`}
              >
                {t.amount > 0 ? "+" : ""}
                {Math.abs(t.amount).toLocaleString("fr-FR")} €
              </p>
            </div>
          ))}

          {filteredTransactions.length === 0 && (
            <p className="text-white/50 text-sm text-center pt-6">
              Aucune transaction pour cette période
            </p>
          )}
        </div>
      </div>
    </div>
  )
}