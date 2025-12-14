// REPLACED ENTIRE FILE WITH NEW IMPLEMENTATION
"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"

type Bank = "CA" | "SG"
type Filter = "rev" | "dep" | "inut" | "all"

type Tx = {
  id?: string
  date?: string
  label?: string
  amount?: number | string
  bank?: string
}

export default function StatisticsPage() {
  const searchParams = useSearchParams()
  const bank = (searchParams.get("bank") ?? "CA") as Bank
  const [filter, setFilter] = useState<Filter>("all")
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [showInsight, setShowInsight] = useState(false)
  const [showCoachInline, setShowCoachInline] = useState(false)
  const [coachInput, setCoachInput] = useState("")
  const [messages, setMessages] = useState<
    { role: "user" | "finea"; text: string }[]
  >([])
  // Interactive category drill-down panel
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Manual category overrides (persisted in localStorage per bank)
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({})
  // Helper: unique key for a transaction (per bank)
  function txKey(t: Tx) {
    const date = typeof t?.date === "string" ? t.date.trim() : String(t?.date ?? "")
    const amount = Number((t as any)?.amount ?? 0)
    const lbl = normalizeForKey(cleanLabel(t?.label))
    return `${bank}__${date}__${amount}__${lbl}`
  }

  // All possible categories
  const categories = [
    "Alimentation",
    "Transport",
    "Restaurants",
    "Abonnements",
    "Shopping",
    "Santé",
    "Transferts",
    "Autres",
  ] as const

  // Helper: get category with manual override if present
  function getTxCategory(t: Tx) {
    const key = txKey(t)
    return categoryOverrides[key] ?? categorize(t.label)
  }

  // Load overrides from localStorage on bank change
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`finea:catOverrides:${bank}`)
      setCategoryOverrides(raw ? JSON.parse(raw) : {})
    } catch {
      setCategoryOverrides({})
    }
  }, [bank])

  // Save overrides to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem(`finea:catOverrides:${bank}`, JSON.stringify(categoryOverrides))
    } catch {}
  }, [categoryOverrides, bank])


  /* ---------------- DATE UTILS ---------------- */
  function parseAnyDate(v?: string) {
    if (!v || typeof v !== "string") return null
    const s = v.trim()

    // FR: DD/MM/YYYY
    const fr = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (fr) {
      const [, dd, mm, yyyy] = fr
      return new Date(Number(yyyy), Number(mm) - 1, Number(dd))
    }

    // ISO: YYYY-MM-DD (Supabase)
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) {
      const [, yyyy, mm, dd] = iso
      return new Date(Number(yyyy), Number(mm) - 1, Number(dd))
    }

    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  }

  function monthKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  }

  function monthLabel(key: string) {
    const [y, m] = key.split("-")
    const idx = Number(m) - 1
    const names = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"]
    return `${names[idx] ?? m} ${y}`
  }

  /* ---------------- CLEAN + DEDUPE ---------------- */
  function cleanLabel(label?: string) {
    if (!label) return "Transaction"
    return label
      .replace(/PAIEMENT PAR CARTE/gi, "")
      .replace(/PRELEVEMENT/gi, "")
      .replace(/VIREMENT EN VOTRE FAVEUR/gi, "")
      .replace(/VIREMENT EMIS/gi, "")
      .replace(/AVOIR/gi, "")
      .replace(/X\d{4}/gi, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  function normalizeForKey(label?: string) {
    return (label ?? "").toLowerCase().replace(/\s+/g, " ").trim()
  }

  function dedupeTransactions(list: Tx[]) {
    const seen = new Set<string>()
    const out: Tx[] = []
    for (const t of list) {
      const date = typeof t?.date === "string" ? t.date.trim() : String(t?.date ?? "")
      const amount = Number((t as any)?.amount ?? 0)
      const key = `${date}__${amount}__${normalizeForKey(cleanLabel(t?.label))}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(t)
    }
    return out
  }

  /* ---------------- SMART “USELESS” DETECTION ----------------
     Heuristics (no heavy AI): rule-based merchant/category detection.
     You can later replace/augment with LLM classification if you want.
  */
  function classifyUseless(label?: string, amount?: number) {
    const l = (label ?? "").toLowerCase()
    const a = Math.abs(Number(amount ?? 0))

    // Never mark credits as useless
    if (Number(amount ?? 0) > 0) return { useless: false, reason: "credit" }

    // Essentials whitelist
    const essentials = [
      "loyer",
      "edf",
      "engie",
      "eau",
      "assurance",
      "mutuelle",
      "impot",
      "taxe",
      "sncf",
      "ratp",
      "navigo",
      "imagine r",
      "orange",
      "free",
      "sfr",
      "bouygues",
      "pharm",
      "doct",
      "gyneco",
      "hopital",
      "clinique",
      "carrefour",
      "monoprix",
      "franprix",
      "intermarche",
      "auchan",
      "lidl",
      "aldi",
      "leclerc",
      "picard",
    ]
    if (essentials.some(k => l.includes(k))) {
      return { useless: false, reason: "essential" }
    }

    // “Likely discretionary” (shopping / fast-food / entertainment / taxis / deliveries / subscriptions)
    const discretionary = [
      "uber",
      "bolt",
      "deliveroo",
      "just eat",
      "ubereats",
      "uber eats",
      "tiktok",
      "shein",
      "bershka",
      "stradivarius",
      "zara",
      "h&m",
      "asos",
      "primark",
      "mcdon",
      "kfc",
      "burger",
      "pizza",
      "starbucks",
      "coffee",
      "cafe",
      "spotify",
      "netflix",
      "canal",
      "amazon prime",
      "prime",
      "apple.com/bill",
      "google *",
      "xbox",
      "playstation",
      "cinema",
      "fnac",
    ]
    if (discretionary.some(k => l.includes(k))) {
      // very small amounts (<=2€) might be rounding or fees; don't over-alert
      if (a <= 2) return { useless: false, reason: "small" }
      return { useless: true, reason: "discretionary" }
    }

    // Fallback: if it's a card payment and not recognized essential -> weakly useless when amount high
    if (l.includes("paiement") && a >= 40) return { useless: true, reason: "unclassified_card_high" }

    return { useless: false, reason: "unknown" }
  }

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    fetch(`/api/transactions/list?bank=${bank}`)
      .then(r => r.json())
      .then(data => {
        const tx = dedupeTransactions((data?.transactions ?? []) as Tx[])
        tx.sort((a, b) => {
          const da = parseAnyDate(a.date)?.getTime() ?? 0
          const db = parseAnyDate(b.date)?.getTime() ?? 0
          return db - da
        })
        setTransactions(tx)
      })
      .catch(() => setTransactions([]))
  }, [bank])

  /* ---------------- MONTHS ---------------- */
  const monthKeys = useMemo(() => {
    return Array.from(
      new Set(
        transactions
          .filter(t => (t.bank ?? bank) === bank)
          .map(t => parseAnyDate(t.date))
          .filter((d): d is Date => Boolean(d))
          .map(d => monthKey(d))
      )
    ).sort((a, b) => (a < b ? 1 : -1))
  }, [transactions, bank])

  useEffect(() => {
    if (!selectedMonth && monthKeys.length > 0) setSelectedMonth(monthKeys[0])
  }, [monthKeys, selectedMonth])

  const filteredTransactions = useMemo(() => {
    if (!selectedMonth) return []
    return transactions.filter(t => {
      if ((t.bank ?? bank) !== bank) return false
      const d = parseAnyDate(t.date)
      return d ? monthKey(d) === selectedMonth : false
    })
  }, [transactions, bank, selectedMonth])

  /* ---------------- MONTHLY AGGREGATION ---------------- */
  const monthly = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => {
        const amt = Number((t as any).amount ?? 0)
        if (amt < 0) acc.expenses += Math.abs(amt)
        else acc.income += amt
        acc.balance += amt
        return acc
      },
      { expenses: 0, income: 0, balance: 0 }
    )
  }, [filteredTransactions])

  const useless = useMemo(() => {
    let total = 0
    const list: (Tx & { uselessReason?: string })[] = []
    for (const t of filteredTransactions) {
      const amt = Number((t as any).amount ?? 0)
      if (amt >= 0) continue
      const c = classifyUseless(t.label, amt)
      if (c.useless) {
        total += Math.abs(amt)
        list.push({ ...t, uselessReason: c.reason })
      }
    }
    return { total, list }
  }, [filteredTransactions])

  const current = useMemo(() => {
    return {
      value: monthly.balance,
      rev: monthly.income,
      dep: monthly.expenses,
      inut: useless.total,
    }
  }, [monthly, useless])

  // AI monthly insight: show only if there are enough useless expenses
  const aiMonthlyInsight =
    current.inut > 100
      ? {
          message:
            `Ce mois-ci, tu as dépensé ${current.inut.toLocaleString("fr-FR")} € dans des achats considérés comme “inutiles”.\n\nUne partie de ces dépenses pourrait être réduite sans impacter ton confort de vie. Clique ci-dessous pour discuter d’un plan personnalisé avec Finéa !`,
        }
      : null

  const centerValue = useMemo(() => {
    switch (filter) {
      case "rev":
        return { value: current.rev, label: "Revenus" }
      case "dep":
        return { value: current.dep, label: "Dépenses" }
      case "inut":
        return { value: current.inut, label: "Dépenses inutiles" }
      default:
        return { value: current.value, label: "Solde" }
    }
  }, [filter, current])

  /* ---------------- COACH CONTEXT (REAL DATA SENT TO GPT) ---------------- */
  const coachContext = useMemo(() => {
    const txForCoach = filteredTransactions
      .slice(0, 30)
      .map((t) => {
        const amt = Number((t as any).amount ?? 0)
        return {
          date: t.date ?? "",
          label: cleanLabel(t.label),
          amount: amt,
          type: amt < 0 ? "debit" : "credit",
        }
      })

    const uselessExamples = useless.list.slice(0, 15).map((t) => ({
      date: t.date ?? "",
      label: cleanLabel(t.label),
      amount: Number((t as any).amount ?? 0),
      reason: (t as any).uselessReason ?? "",
    }))

    return {
      bank,
      month: selectedMonth,
      monthLabel: selectedMonth ? monthLabel(selectedMonth) : "",
      filter,
      summary: {
        income: current.rev,
        expenses: current.dep,
        uselessExpenses: current.inut,
        balance: current.value,
        txCount: filteredTransactions.length,
      },
      uselessExamples,
      transactions: txForCoach,
    }
  }, [bank, selectedMonth, filter, current, filteredTransactions, useless])

  /* ---------------- CURVE (realistic from cumulative series) ---------------- */
  function curveFromSeries(values: number[]) {
    // values: cumulative over the month (positive/negative). Create 5 control points.
    const n = Math.max(1, values.length)
    const sample = (idx: number) => values[Math.min(n - 1, Math.max(0, idx))] ?? 0

    const pts = [0, 0.25, 0.5, 0.75, 1].map(p => sample(Math.floor(p * (n - 1))))

    const min = Math.min(...pts, 0)
    const max = Math.max(...pts, 0)
    const span = Math.max(1, max - min)

    // Map to y within [10..34] (SVG 0..40)
    const mapY = (v: number) => {
      const t = (v - min) / span
      return 34 - t * 24
    }

    const y0 = mapY(pts[0])
    const y1 = mapY(pts[1])
    const y2 = mapY(pts[2])
    const y3 = mapY(pts[3])
    const y4 = mapY(pts[4])

    // Cubic-ish smooth curve
    return `M0 ${y0} C 20 ${y1}, 40 ${y2}, 60 ${y2} S 80 ${y3}, 100 ${y4}`
  }

  const cumulativeSeries = useMemo(() => {
    if (!selectedMonth) return []
    // sort ascending by date to compute cumulative
    const txAsc = [...filteredTransactions].sort((a, b) => {
      const da = parseAnyDate(a.date)?.getTime() ?? 0
      const db = parseAnyDate(b.date)?.getTime() ?? 0
      return da - db
    })
    const out: number[] = []
    let cum = 0
    for (const t of txAsc) {
      cum += Number((t as any).amount ?? 0)
      out.push(cum)
    }
    return out
  }, [filteredTransactions, selectedMonth])

  const curvePath = useMemo(() => {
    if (cumulativeSeries.length < 2) {
      return "M0 30 C 20 30, 40 30, 60 30 S 80 30, 100 30"
    }
    return curveFromSeries(cumulativeSeries)
  }, [cumulativeSeries])

  /* ---------------- DONUT SEGMENTS ---------------- */
  const donutSegments = useMemo(() => {
    const segs = [
      { key: "rev", color: "#5E90C8", val: current.rev },
      { key: "dep", color: "#D1B46E", val: current.dep },
      { key: "inut", color: "#C98484", val: current.inut },
    ]
    const total = segs.reduce((s, x) => s + Math.max(0, x.val), 0) || 1
    let start = 0
    return segs.map(s => {
      const length = (Math.max(0, s.val) / total) * 100
      const seg = { ...s, start, length }
      start += length
      return seg
    })
  }, [current])

  // Helper for Finéa's AI advice (moved inside component to access current/useless)
  function generateMonthlyAdvice() {
    const examples = useless.list
      .slice(0, 3)
      .map(t => cleanLabel(t.label))
      .filter(Boolean)
      .join(", ")

    if (current.inut > 200) {
      return `J’ai remarqué que ce mois-ci, tes dépenses inutiles sont très élevées (${current.inut.toLocaleString("fr-FR")} €).\n\nExemples repérés : ${examples || "achats impulsifs"}.\n\n👉 Actions concrètes possibles :\n- fixer un plafond mensuel (ex: 120 €) sur ces catégories\n- réduire Uber/Bolt en planifiant 2–3 trajets max par semaine\n- annuler/suspendre un abonnement non essentiel\n- faire une revue hebdo de 10 minutes (dimanche soir)\n\nDis-moi ce que tu veux réduire en premier (transport, shopping, abonnements) et je te fais un plan.`
    }

    if (current.inut > 100) {
      return `Tes dépenses inutiles sont modérées (${current.inut.toLocaleString("fr-FR")} €), mais on peut facilement les réduire.\n\nExemples repérés : ${examples || "quelques dépenses du quotidien"}.\n\n👉 Objectif simple : -30 à -50 € le mois prochain.\n- limite 1–2 achats “plaisir” par semaine\n- regrouper les sorties\n- couper un abonnement inutile\n\nTu veux optimiser quoi en priorité ?`
    }

    return `Bravo 👏 tes dépenses inutiles sont bien maîtrisées ce mois-ci (${current.inut.toLocaleString("fr-FR")} €).\n\nOn peut maintenant travailler sur l’épargne (objectif automatique) ou la projection du mois prochain. Tu préfères quoi ?`
  }


  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-[#0A1D37]">
      <div className="w-[390px] min-h-[844px] bg-[#020b18] rounded-[40px] shadow-xl overflow-y-auto relative p-6">
        <style>{`
          @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-spin-slow { animation: spin-slow 25s linear infinite; }
        `}</style>

        {/* PHONE FRAME */}
        <div className="w-full min-h-[780px] bg-[#020b18] rounded-[40px] p-6 overflow-visible">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => window.history.back()} className="text-white text-3xl">‹</button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">Statistiques</h1>
              <p className="text-white/60 text-xs mt-1">
                Compte : {bank === "CA" ? "Crédit Agricole" : "Société Générale"}
              </p>
            </div>
            <div className="w-8 h-8"></div>
          </div>

          {/* DONUT – FULL PREMIUM SEGMENTED */}
          <div className="w-full flex items-center justify-center relative mb-10">
            <svg
              viewBox="0 0 36 36"
              className="w-48 h-48 animate-spin-slow"
              preserveAspectRatio="xMidYMid meet"
              style={{ overflow: "visible" }}
            >
              {/* BASE CIRCLE */}
              <circle cx="18" cy="18" r="16" stroke="#ffffff15" strokeWidth="5.5" fill="none" />

              {/* GLOBAL (3 COLORS) */}
              {filter === "all" && (
                <>
              {donutSegments.map((seg, i) => (
                <circle
                  key={seg.key}
                  cx="18"
                  cy="18"
                  r="16"
                  stroke={seg.color}
                  strokeWidth="5.5"
                  fill="none"
                  strokeDasharray={`${seg.length} ${100 - seg.length}`}
                  strokeDashoffset={-seg.start}
                  strokeLinecap="round"
                  onClick={() => {
                    setFilter(seg.key as Filter)
                  }}
                  style={{ cursor: "pointer", filter: "drop-shadow(0px 0px 6px currentColor)" }}
                />
              ))}
                </>
              )}

              {/* SINGLE VIEW REVENUS */}
              {filter === "rev" && (
                <circle
                  cx="18" cy="18" r="16"
                  stroke="#5E90C8"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="100 0"
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0px 0px 10px currentColor)" }}
                />
              )}

              {/* SINGLE VIEW DÉPENSES */}
              {filter === "dep" && (
                <circle
                  cx="18" cy="18" r="16"
                  stroke="#D1B46E"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="100 0"
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0px 0px 10px currentColor)" }}
                />
              )}

              {/* SINGLE VIEW INUTILES */}
              {filter === "inut" && (
                <circle
                  cx="18" cy="18" r="16"
                  stroke="#C98484"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="100 0"
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0px 0px 10px currentColor)" }}
                />
              )}
            </svg>

            {/* CENTER LABEL */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-white text-xl font-bold transition-all duration-300">
                {centerValue.value.toLocaleString("fr-FR")} €
              </p>
              <p className="text-white/60 text-xs">
                {centerValue.label} • {selectedMonth ? monthLabel(selectedMonth) : ""}
              </p>
            </div>
          </div>

          <h2 className="text-white text-lg font-semibold mb-2">Analyse du mois</h2>

          {/* NEW OVAL TOGGLES WITH INNER CIRCLE */}
          <div className="flex gap-4 justify-center mb-8">
            {/* REVENUS */}
            <button
              onClick={() => {
                setFilter(filter === "rev" ? "all" : "rev")
              }}
              className="w-24 h-32 rounded-full bg-white/10 border border-white/20 flex flex-col items-center justify-center shadow-md relative overflow-hidden transition-all duration-300"
            >
              <div
                className={`absolute top-3 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                ${filter === "rev" ? "translate-y-3 bg-[#5E90C8]" : "translate-y-0 bg-white"}`}
              >
                <img src="/icons/revenue.png" className="w-6 h-6" />
              </div>
              <p className="text-white text-[10px] mb-1">{filter === "rev" ? "ON" : "OFF"}</p>
              <p className="text-white text-xs mt-8">Revenus</p>
            </button>

            {/* DEPENSES */}
            <button
              onClick={() => {
                setFilter(filter === "dep" ? "all" : "dep")
              }}
              className="w-24 h-32 rounded-full bg-white/10 border border-white/20 flex flex-col items-center justify-center shadow-md relative overflow-hidden transition-all duration-300"
            >
              <div
                className={`absolute top-3 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                ${filter === "dep" ? "translate-y-3 bg-[#D1B46E]" : "translate-y-0 bg-white"}`}
              >
                <img src="/icons/depense.png" className="w-6 h-6" />
              </div>
              <p className="text-white text-[10px] mb-1">{filter === "dep" ? "ON" : "OFF"}</p>
              <p className="text-white text-xs mt-8">Dépenses</p>
            </button>

            {/* INUTILES */}
            <button
              onClick={() => {
                setFilter(filter === "inut" ? "all" : "inut")
              }}
              className="w-24 h-32 rounded-full bg-white/10 border border-white/20 flex flex-col items-center justify-center shadow-md relative overflow-hidden transition-all duration-300"
            >
              <div
                className={`absolute top-3 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                ${filter === "inut" ? "translate-y-3 bg-[#C98484]" : "translate-y-0 bg-white"}`}
              >
                <img src="/icons/inutiles.png" className="w-6 h-6" />
              </div>
              <p className="text-white text-[10px] mb-1">{filter === "inut" ? "ON" : "OFF"}</p>
              <p className="text-white text-xs mt-8">Inutiles</p>
            </button>
          </div>

          <h2 className="text-white text-lg font-semibold mb-3">Évolution du solde</h2>

          <div className="relative w-full h-72 bg-[#0A1D37] rounded-3xl p-4 mb-10 overflow-visible shadow-[0_0_25px_rgba(0,0,0,0.4)]">
            {/* CURVE SVG */}
            <svg viewBox="0 0 100 40" className="absolute top-[35px] left-0 w-full h-[60%]">
              <defs>
                <linearGradient id="curveBankFinal" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#5E90C8" />
                  <stop offset="40%" stopColor="#7AA6D6" />
                  <stop offset="60%" stopColor="#D1B46E" />
                  <stop offset="85%" stopColor="#C98484" />
                  <stop offset="100%" stopColor="#A86363" />
                </linearGradient>
              </defs>

              <path
                d={curvePath}
                stroke="url(#curveBankFinal)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                className="drop-shadow-[0_0_14px_rgba(255,255,255,0.25)] transition-all duration-500 ease-out"
              />

              <path
                d={curvePath}
                stroke="url(#curveBankFinal)"
                strokeWidth="14"
                opacity="0.12"
                fill="none"
                strokeLinecap="round"
                className="blur-xl transition-all duration-500 ease-out"
              />
            </svg>

            {/* DYNAMIC VALUE LABEL */}
            <div className="absolute top-[55px] left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-3 py-1 rounded-xl shadow">
              {current.value.toLocaleString("fr-FR")} €
            </div>

            {/* DOT */}
            <div className="absolute top-[92px] left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_12px_white] border border-white/40"></div>

            {/* VERTICAL BAR (only if month selected) */}
            {Boolean(selectedMonth) && (
              <div
                className="absolute bottom-[32px] left-1/2 -translate-x-1/2 w-7 h-[150px] rounded-full
                bg-gradient-to-t from-[#5E90C8]/50 via-[#D1B46E]/50 to-[#C98484]/50
                backdrop-blur-md shadow-[0_0_25px_rgba(255,255,255,0.35)] transition-all duration-500 ease-out">
              </div>
            )}

            {/* MONTH SELECTOR AT BOTTOM */}
            <div className="absolute bottom-2 left-0 w-full overflow-x-auto no-scrollbar snap-x snap-mandatory px-0">
              <div className="flex gap-8 items-center mx-auto min-w-max px-[140px]">
                {monthKeys.map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedMonth(key)}
                    className={`text-white/70 text-sm px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 snap-center transition
                      ${selectedMonth === key ? "bg-white/20 text-white font-semibold" : "bg-white/5"}`}
                  >
                    {monthLabel(key)}
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* TRANSACTIONS HEADER */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-semibold text-lg">Transactions</h2>
            <p className="text-white/60 text-sm">
              {selectedMonth ? monthLabel(selectedMonth) : ""}
            </p>
          </div>

          {/* TRANSACTIONS LIST */}
          {/* Category aggregation summary */}
          <div className="space-y-3 pb-24 max-h-[320px] overflow-y-auto">
            {Object.entries(
              filteredTransactions.reduce<Record<string, number>>((acc, t) => {
                const amt = Number((t as any).amount ?? 0)
                if (amt >= 0) return acc
                const cat = getTxCategory(t)
                acc[cat] = (acc[cat] ?? 0) + Math.abs(amt)
                return acc
              }, {})
            )
              .sort(([a], [b]) => {
                const order = [
                  "Alimentation",
                  "Transport",
                  "Restaurants",
                  "Abonnements",
                  "Shopping",
                  "Santé",
                  "Transferts",
                  "Autres",
                ]
                return order.indexOf(a) - order.indexOf(b)
              })
              .map(([cat, total]) => (
                <div
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 transition"
                >
                  <p className="text-white font-semibold">{cat}</p>
                  <p className="text-red-300 font-semibold">
                    - {total.toLocaleString("fr-FR")} €
                  </p>
                </div>
              ))}

            {/* Drill-down side panel */}
            {activeCategory && (
              <div className="fixed right-4 top-24 w-[320px] max-h-[520px] bg-[#0A1D37] border border-white/15 rounded-3xl shadow-2xl p-4 z-[9999] animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-semibold">
                    {activeCategory}
                  </h3>
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="text-white/60 hover:text-white text-xl"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-3 overflow-y-auto max-h-[440px] pr-1">
                  {filteredTransactions
                    .filter(t => {
                      const amt = Number((t as any).amount ?? 0)
                      if (amt >= 0) return false
                      return getTxCategory(t) === activeCategory
                    })
                    .map((t, i) => {
                      const d = parseAnyDate(t.date)
                      const amt = Math.abs(Number((t as any).amount ?? 0))
                      return (
                        <div
                          key={`${t.date}-${amt}-${i}`}
                          className="bg-white/5 border border-white/10 rounded-2xl p-3"
                        >
                          <p className="text-white text-sm font-semibold line-clamp-1">
                            {cleanLabel(t.label)}
                          </p>
                          <p className="text-white/40 text-xs mt-1">
                            {d ? d.toLocaleDateString("fr-FR") : "—"}
                          </p>
                          <p className="text-red-300 font-semibold text-sm mt-1">
                            - {amt.toLocaleString("fr-FR")} €
                          </p>
                          <div className="mt-2">
                            <select
                              value={getTxCategory(t)}
                              onChange={(e) => {
                                const next = e.target.value
                                const key = txKey(t)
                                setCategoryOverrides(prev => ({ ...prev, [key]: next }))
                              }}
                              className="w-full bg-white/5 border border-white/10 text-white/80 text-xs rounded-xl px-3 py-2 outline-none"
                            >
                              {categories.map(c => (
                                <option key={c} value={c} className="bg-[#0A1D37]">
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )
                    })}
                  {filteredTransactions.filter(t => {
                    const amt = Number((t as any).amount ?? 0)
                    return amt < 0 && getTxCategory(t) === activeCategory
                  }).length === 0 && (
                    <p className="text-white/50 text-sm text-center pt-6">
                      Aucune transaction pour cette catégorie
                    </p>
                  )}
                </div>
              </div>
            )}

            {filteredTransactions.length === 0 && (
              <p className="text-white/50 text-sm text-center pt-6">
                Aucune dépense pour cette période
              </p>
            )}
          </div>
        </div>

        {/* BOTTOM SHEET */}
        {isSheetOpen && (
          <div className="fixed bottom-0 left-0 w-full h-[55%] bg-[#0A1D37] border-t border-white/10 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.4)] p-6 z-[9999] transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-semibold text-lg">Détails du mois</h2>
              <button
                onClick={() => {
                  setSheetOpen(false)
                  setFilter("all")
                }}
                className="text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="w-full flex items-center justify-center mb-6">
              <div className="text-center">
                <p className="text-white text-2xl font-bold">
                  {filter === "rev" && `${current.rev.toLocaleString("fr-FR")} €`}
                  {filter === "dep" && `${current.dep.toLocaleString("fr-FR")} €`}
                  {filter === "inut" && `${current.inut.toLocaleString("fr-FR")} €`}
                  {filter === "all" && `${current.value.toLocaleString("fr-FR")} €`}
                </p>
                <p className="text-white/60 text-sm mt-1">
                  {filter === "rev" && "Total revenus"}
                  {filter === "dep" && "Total dépenses"}
                  {filter === "inut" && "Achats inutiles (détection intelligente)"}
                  {filter === "all" && "Balance du mois"}
                </p>
              </div>
            </div>

            {filter === "inut" ? (
              <div className="space-y-3 max-h-[260px] overflow-y-auto pb-6">
                {useless.list.slice(0, 50).map((t, i) => {
                  const d = parseAnyDate(t.date)
                  const amount = Number((t as any).amount ?? 0)
                  return (
                    <div
                      key={`${t.date ?? "na"}-${amount}-${cleanLabel(t.label)}-${i}`}
                      className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10"
                    >
                      <div className="text-white min-w-0 pr-3">
                        <p className="font-semibold line-clamp-1">{cleanLabel(t.label)}</p>
                        <p className="text-xs text-white/40">
                          {d ? d.toLocaleDateString("fr-FR") : "—"} • {t.uselessReason ?? "—"}
                        </p>
                      </div>
                      <p className="font-semibold text-red-300">
                        - {Math.abs(amount).toLocaleString("fr-FR")} €
                      </p>
                    </div>
                  )
                })}

                {useless.list.length === 0 && (
                  <p className="text-white/50 text-sm text-center pt-6">
                    Aucun achat inutile détecté sur ce mois
                  </p>
                )}
              </div>
            ) : (
              <div className="w-full h-40 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-white/50">
                Graphique détaillé (pro) — prochain patch
              </div>
            )}

            {/* Alert */}
            {/* (Retiré: voir UX discrète en haut de page) */}
          </div>
        )}
      </div>
    </div>
  )
}
// Helper to categorize transaction labels into high-level categories (rule-based, lightweight)
function categorize(label?: string) {
  const l = (label ?? "").toLowerCase()

  // Transfers / top-ups / wallets
  if (
    [
      "revolut",
      "paypal",
      "virement",
      "vir inst",
      "virement emis",
      "virement en votre faveur",
      "remboursement",
      "caf ",
      "securite sociale",
      "henner",
      "setec",
    ].some(k => l.includes(k))
  ) return "Transferts"

  // Transport
  if (
    [
      "uber",
      "bolt",
      "taxi",
      "ratp",
      "sncf",
      "navigo",
      "imagine r",
      "trainline",
      "easyjet",
      "air",
      "relay air",
    ].some(k => l.includes(k))
  ) return "Transport"

  // Groceries / food shopping
  if (
    [
      "carrefour",
      "monoprix",
      "franprix",
      "lidl",
      "aldi",
      "leclerc",
      "auchan",
      "picard",
    ].some(k => l.includes(k))
  ) return "Alimentation"

  // Restaurants / takeaway / coffee
  if (
    [
      "pret a manger",
      "pret-à-manger",
      "mangiamo",
      "mangiamoitaliano",
      "restaurant",
      "cafe",
      "coffee",
      "burger",
      "pizza",
      "kfc",
      "mcdon",
      "tawouk",
      "chawarma",
      "uber * eats",
      "uber eats",
      "ubereats",
      "deliveroo",
      "just eat",
    ].some(k => l.includes(k))
  ) return "Restaurants"

  // Subscriptions / digital services
  if (
    [
      "netflix",
      "spotify",
      "canal",
      "amazon prime",
      "prime",
      "apple.com/bill",
      "amz digital",
      "microsoft",
      "xbox",
      "google",
      "scribd",
    ].some(k => l.includes(k))
  ) return "Abonnements"

  // Shopping / retail
  if (
    [
      "normal",
      "zara",
      "bershka",
      "stradivarius",
      "h&m",
      "asos",
      "primark",
      "shein",
      "fnac",
      "sephora",
      "kiko",
    ].some(k => l.includes(k))
  ) return "Shopping"

  // Health
  if (["pharm", "doct", "clinique", "hopital", "gyneco"].some(k => l.includes(k))) return "Santé"

  return "Autres"
}