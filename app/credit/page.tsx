"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { db } from "@/lib/firebase"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore"

type CreditType = "conso" | "immo" | "auto" | "etudiant" | "autre"

interface CreditItem {
  id?: string
  userId: string
  name: string
  type: CreditType
  principal: number // montant emprunté
  monthlyPayment: number // mensualité
  apr: number // taux annuel
  startDate?: string
  endDate?: string
  createdAt?: any
}

export default function CreditPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [credits, setCredits] = useState<CreditItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CreditItem | null>(null)

  const [name, setName] = useState("")
  const [type, setType] = useState<CreditType>("conso")
  const [principal, setPrincipal] = useState("")
  const [monthlyPayment, setMonthlyPayment] = useState("")
  const [apr, setApr] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Mini IA (même logique que Budget: panel inline)
  const [iaOpen, setIaOpen] = useState(false)
  const [fineaOpen, setFineaOpen] = useState(false)
  const [coachInput, setCoachInput] = useState("")
  const [coachMessages, setCoachMessages] = useState<{ role: "user" | "finea"; text: string }[]>([])
  const [coachLoading, setCoachLoading] = useState(false)

  async function loadCredits() {
    if (!user) return

    try {
      setIsLoading(true)
      const q = query(collection(db, "credits"), where("userId", "==", user.uid))
      const snap = await getDocs(q)
      const rows: CreditItem[] = []
      snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }))
      rows.sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0))
      setCredits(rows)
    } catch (e) {
      console.error("Erreur chargement crédits:", e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadCredits()
    else {
      setCredits([])
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const totals = useMemo(() => {
    const totalPrincipal = credits.reduce((s, c) => s + (Number(c.principal) || 0), 0)
    const totalMonthly = credits.reduce((s, c) => s + (Number(c.monthlyPayment) || 0), 0)
    const avgApr = credits.length
      ? credits.reduce((s, c) => s + (Number(c.apr) || 0), 0) / credits.length
      : 0

    return {
      totalPrincipal,
      totalMonthly,
      avgApr,
    }
  }, [credits])

  function resetForm() {
    setName("")
    setType("conso")
    setPrincipal("")
    setMonthlyPayment("")
    setApr("")
    setStartDate("")
    setEndDate("")
    setEditing(null)
  }

  function openAdd() {
    resetForm()
    setShowModal(true)
  }

  function openEdit(c: CreditItem) {
    setEditing(c)
    setName(c.name ?? "")
    setType((c.type as CreditType) ?? "conso")
    setPrincipal(String(c.principal ?? ""))
    setMonthlyPayment(String(c.monthlyPayment ?? ""))
    setApr(String(c.apr ?? ""))
    setStartDate(c.startDate ?? "")
    setEndDate(c.endDate ?? "")
    setShowModal(true)
  }

  async function saveCredit() {
    if (!user) {
      alert("Connecte-toi d’abord")
      return
    }

    const p = Number(principal)
    const m = Number(monthlyPayment)
    const a = Number(apr)

    if (!name.trim()) return alert("Ajoute un nom")
    if (!Number.isFinite(p) || p <= 0) return alert("Montant emprunté invalide")
    if (!Number.isFinite(m) || m < 0) return alert("Mensualité invalide")
    if (!Number.isFinite(a) || a < 0) return alert("Taux invalide")

    const payload: CreditItem = {
      userId: user.uid,
      name: name.trim(),
      type,
      principal: p,
      monthlyPayment: m,
      apr: a,
      startDate: startDate || "",
      endDate: endDate || "",
      createdAt: serverTimestamp(),
    }

    try {
      if (editing?.id) {
        const ref = doc(db, "credits", editing.id)
        await updateDoc(ref, {
          ...payload,
          createdAt: editing.createdAt ?? payload.createdAt,
        } as any)
      } else {
        await addDoc(collection(db, "credits"), payload as any)
      }

      await loadCredits()
      setShowModal(false)
      resetForm()
    } catch (e) {
      console.error("Erreur sauvegarde crédit:", e)
      alert("Erreur lors de la sauvegarde")
    }
  }

  async function removeCredit(id?: string) {
    if (!id) return
    if (!confirm("Supprimer ce crédit ?")) return

    try {
      await deleteDoc(doc(db, "credits", id))
      await loadCredits()
    } catch (e) {
      console.error("Erreur suppression crédit:", e)
      alert("Erreur lors de la suppression")
    }
  }

  const coachContext = useMemo(() => {
    return {
      module: "credit",
      stats: {
        totalPrincipal: totals.totalPrincipal,
        totalMonthly: totals.totalMonthly,
        avgApr: totals.avgApr,
        count: credits.length,
      },
      credits: credits.slice(0, 20).map((c) => ({
        name: c.name,
        type: c.type,
        principal: c.principal,
        monthlyPayment: c.monthlyPayment,
        apr: c.apr,
        startDate: c.startDate || "",
        endDate: c.endDate || "",
      })),
    }
  }, [credits, totals])

  const openFineaWithPrompt = async (prompt: string) => {
    setFineaOpen(true)
    setCoachLoading(true)

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
    <div className="w-full min-h-screen bg-[#050A14] flex justify-center items-start py-8 px-3">
      <div className="w-[390px] min-h-[780px] bg-[#0A1D37] rounded-[40px] shadow-none p-6 relative overflow-hidden pb-24">

        {/* HEADER (même style que Épargne) */}
        <div className="relative z-10 flex items-center justify-between mb-5">
          <button
            onClick={() => router.push("/")}
            className="text-[#F5D657] text-xl active:scale-95 transition"
            aria-label="Retour"
          >
            ←
          </button>
          <h1 className="text-xl font-semibold text-[#F5D657] drop-shadow">Crédits</h1>
          <div className="w-6" />
        </div>

        {/* CONTENT */}
        <div className="relative z-10 space-y-4 max-h-[650px] overflow-y-auto pb-4">

          {/* Résumé */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-none">
            <p className="text-xs font-medium text-white mb-1">Total emprunté</p>
            <p className="text-2xl font-bold text-white">
              {totals.totalPrincipal.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="bg-[#0A1D37] rounded-xl p-3">
                <p className="text-[10px] text-white/60">Mensualités</p>
                <p className="text-white font-semibold text-sm">
                  {totals.totalMonthly.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €/mois
                </p>
              </div>
              <div className="bg-[#0A1D37] rounded-xl p-3">
                <p className="text-[10px] text-white/60">Taux moyen</p>
                <p className="text-white font-semibold text-sm">
                  {totals.avgApr.toFixed(2)}%
                </p>
              </div>
            </div>

            <button
              onClick={openAdd}
              className="w-full mt-4 py-2 rounded-xl bg-[#F5D657] text-[#0F2B52] font-semibold text-sm active:scale-95 transition"
            >
              + Ajouter un crédit
            </button>
          </div>

          {/* IA Crédit */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-none">
            <button
              onClick={() => setIaOpen((v) => !v)}
              className="w-full text-left text-xs text-white/70 hover:text-white transition"
            >
              <span className="mr-2">✨</span>
              Finéa peut analyser tes crédits et te proposer un plan (réduction, regroupement, priorités)
              <span className="float-right text-white/40">{iaOpen ? "—" : "+"}</span>
            </button>

            {iaOpen && (
              <div className="mt-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      openFineaWithPrompt(
                        "Analyse mes crédits et donne-moi 3 actions concrètes pour réduire mes mensualités et mieux prioriser mes remboursements."
                      )
                    }
                    className="bg-[#0A1D37] border border-white/10 rounded-2xl py-2 text-white text-xs hover:bg-[#0A1D37]/70 transition"
                  >
                    Plan d’action
                  </button>
                  <button
                    onClick={() =>
                      openFineaWithPrompt(
                        "Est-ce que je devrais envisager un regroupement de crédits ? Explique-moi les avantages/inconvénients et les conditions."
                      )
                    }
                    className="bg-[#0A1D37] border border-white/10 rounded-2xl py-2 text-white text-xs hover:bg-[#0A1D37]/70 transition"
                  >
                    Regroupement ?
                  </button>
                </div>

                {fineaOpen && (
                  <div className="mt-4 bg-[#08162B] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <img src="/icons/fineamascotte.png" className="w-7 h-7" alt="Finéa" />
                        <p className="text-white text-sm font-semibold">Finéa</p>
                      </div>
                      <button
                        onClick={() => setFineaOpen(false)}
                        className="text-white/50 hover:text-white/80 text-sm"
                        aria-label="Fermer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="max-h-[220px] overflow-y-auto px-4 py-3 space-y-3">
                      {coachMessages.length === 0 && (
                        <p className="text-white/50 text-xs">
                          Je peux analyser tes crédits et te proposer une stratégie.
                        </p>
                      )}

                      {coachMessages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                              m.role === "user" ? "bg-white/10 text-white" : "bg-white/5 text-white/90"
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      ))}

                      {coachLoading && <p className="text-white/40 text-xs">Finéa réfléchit…</p>}
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

          {/* Simulateurs */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-none">
            <h2 className="text-base font-semibold text-white mb-3">Simulateurs</h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/credit/consommation")}
                className="w-full bg-[#0A1D37] border border-white/10 rounded-2xl px-4 py-3 text-left active:scale-95 transition"
              >
                <p className="text-white font-semibold text-sm">Crédit consommation</p>
                <p className="text-white/50 text-xs">Mensualité estimée + coût total</p>
              </button>
              <button
                onClick={() => router.push("/credit/immobilier")}
                className="w-full bg-[#0A1D37] border border-white/10 rounded-2xl px-4 py-3 text-left active:scale-95 transition"
              >
                <p className="text-white font-semibold text-sm">Crédit immobilier</p>
                <p className="text-white/50 text-xs">Capacité d’emprunt + scénarios</p>
              </button>
            </div>
          </div>

          {/* Mes crédits */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-none">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">Mes crédits</h2>
              <button
                onClick={openAdd}
                className="text-xs bg-[#F5D657]/10 text-[#F5D657] px-2 py-1 rounded-lg active:scale-95 transition"
              >
                ➕
              </button>
            </div>

            {isLoading && <p className="text-white/50 text-sm">Chargement…</p>}

            {!isLoading && credits.length === 0 && (
              <div className="bg-[#0A1D37] border border-white/10 rounded-2xl p-4">
                <p className="text-white/70 text-sm font-semibold">Aucun crédit enregistré</p>
                <p className="text-white/50 text-xs mt-1">
                  Ajoute ton crédit (montant, mensualité, taux) et Finéa pourra t’aider à l’optimiser.
                </p>
              </div>
            )}

            <div className="space-y-2">
              {credits.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#0A1D37] border border-white/10 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{c.name}</p>
                      <p className="text-white/50 text-xs">
                        {c.type === "conso" && "Conso"}
                        {c.type === "immo" && "Immo"}
                        {c.type === "auto" && "Auto"}
                        {c.type === "etudiant" && "Étudiant"}
                        {c.type === "autre" && "Autre"}
                        {c.apr ? ` • ${Number(c.apr).toFixed(2)}%` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-xs text-[#F5D657] bg-[#F5D657]/10 px-2 py-1 rounded-lg active:scale-95 transition"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => removeCredit(c.id)}
                        className="text-xs text-red-300 bg-red-500/10 px-2 py-1 rounded-lg active:scale-95 transition"
                      >
                        Suppr.
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-black/10 rounded-xl p-3">
                      <p className="text-[10px] text-white/60">Montant</p>
                      <p className="text-white font-semibold text-sm">
                        {Number(c.principal || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                      </p>
                    </div>
                    <div className="bg-black/10 rounded-xl p-3">
                      <p className="text-[10px] text-white/60">Mensualité</p>
                      <p className="text-white font-semibold text-sm">
                        {Number(c.monthlyPayment || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                      </p>
                    </div>
                  </div>

                  {(c.startDate || c.endDate) && (
                    <p className="text-white/40 text-[10px] mt-2">
                      {c.startDate ? `Début: ${c.startDate}` : ""}
                      {c.startDate && c.endDate ? " • " : ""}
                      {c.endDate ? `Fin: ${c.endDate}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info: règles Firestore */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-none">
            <p className="text-white/70 text-xs leading-relaxed">
              ⚠️ Si tu vois “PERMISSION_DENIED” à l’ajout : c’est que l’utilisateur n’est pas authentifié
              (request.auth == null) ou que les règles Firestore n’autorisent pas l’écriture.
            </p>
          </div>
        </div>

        {/* MODAL AJOUT / MODIF */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-none">
              <h3 className="text-lg font-semibold text-[#F5D657] mb-4">
                {editing ? "Modifier le crédit" : "Ajouter un crédit"}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[#F5D657]/60 text-xs block mb-1.5">Nom</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0A1D37] text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none"
                    placeholder="Ex: Prêt étudiant"
                  />
                </div>

                <div>
                  <label className="text-[#F5D657]/60 text-xs block mb-1.5">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CreditType)}
                    className="w-full bg-[#0A1D37] text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none"
                  >
                    <option value="conso">Conso</option>
                    <option value="immo">Immo</option>
                    <option value="auto">Auto</option>
                    <option value="etudiant">Étudiant</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[#F5D657]/60 text-xs block mb-1.5">Montant (€)</label>
                    <input
                      type="number"
                      value={principal}
                      onChange={(e) => setPrincipal(e.target.value)}
                      className="w-full bg-[#0A1D37] text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none"
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <label className="text-[#F5D657]/60 text-xs block mb-1.5">Mensualité (€)</label>
                    <input
                      type="number"
                      value={monthlyPayment}
                      onChange={(e) => setMonthlyPayment(e.target.value)}
                      className="w-full bg-[#0A1D37] text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none"
                      placeholder="150"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#F5D657]/60 text-xs block mb-1.5">Taux annuel (%)</label>
                  <input
                    type="number"
                    value={apr}
                    onChange={(e) => setApr(e.target.value)}
                    className="w-full bg-[#0A1D37] text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none"
                    placeholder="3.2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[#F5D657]/60 text-xs block mb-1.5">Début</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#0A1D37] text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#F5D657]/60 text-xs block mb-1.5">Fin</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-[#0A1D37] text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#0A1D37] text-[#F5D657] text-sm font-medium active:scale-95 transition border border-white/10"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveCredit}
                    className="flex-1 py-2.5 rounded-xl bg-[#F5D657] text-[#0F2B52] text-sm font-medium active:scale-95 transition"
                  >
                    {editing ? "Modifier" : "Enregistrer"}
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