"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ConseilsPage() {
  const [montantJour, setMontantJour] = useState("1")
  const [montantSemaine, setMontantSemaine] = useState("5")
  
  // Dépenses personnalisables
  const [nomDepense, setNomDepense] = useState("Café quotidien")
  const [montantDepense, setMontantDepense] = useState("3.5")
  const [frequenceDepense, setFrequenceDepense] = useState<"jour" | "semaine" | "mois">("jour")
  
  const [objectifMontant, setObjectifMontant] = useState("1000")
  const [economieJour, setEconomieJour] = useState("10")
  const [activeCalculator, setActiveCalculator] = useState<"jour" | "depenses" | "objectif">("jour")
  
  const router = useRouter()

  // Tips rotatifs (sans emojis)
  const tips = [
    "Règle des 72h : Attendez 3 jours avant tout achat >20€. Si vous y pensez encore, achetez !",
    "Faites vos courses avec une liste stricte. Vous économiserez 20-30% par mois.",
    "Désactivez toutes les notifications d'apps shopping. Elles sont conçues pour vous faire dépenser.",
    "La règle 50/30/20 : 50% besoins, 30% envies, 20% épargne.",
    "Retirez en liquide votre budget hebdomadaire. Quand c'est fini, c'est fini !",
    "Supprimez les apps de shopping 'gamifié'. Les jeux et points sont des pièges psychologiques.",
    "Batch cooking le dimanche = 100-200€/mois économisés sur la livraison.",
    "Achetez d'occasion d'abord (Vinted, Leboncoin). Économie moyenne : 60%.",
    "Baissez votre chauffage de 1°C = -7% sur votre facture énergétique.",
    "Bibliothèque > Acheter des livres. Netflix > Acheter des DVDs. Location > Possession.",
  ]

  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  // Calculs
  const calculEconomieJour = () => {
    const montant = parseFloat(montantJour) || 0
    return {
      semaine: (montant * 7).toFixed(2),
      mois: (montant * 30).toFixed(2),
      an: (montant * 365).toFixed(2),
      anAvecInterets: (montant * 365 * 1.03).toFixed(2),
    }
  }

  const calculEconomieSemaine = () => {
    const montant = parseFloat(montantSemaine) || 0
    return {
      mois: (montant * 4).toFixed(2),
      an: (montant * 52).toFixed(2),
      anAvecInterets: (montant * 52 * 1.03).toFixed(2),
    }
  }

  const calculDepensePersonnalisee = () => {
    const montant = parseFloat(montantDepense) || 0
    let parJour = 0
    
    if (frequenceDepense === "jour") {
      parJour = montant
    } else if (frequenceDepense === "semaine") {
      parJour = montant / 7
    } else if (frequenceDepense === "mois") {
      parJour = montant / 30
    }
    
    return {
      jour: parJour.toFixed(2),
      semaine: (parJour * 7).toFixed(2),
      mois: (parJour * 30).toFixed(2),
      an: (parJour * 365).toFixed(2),
    }
  }

  const calculObjectif = () => {
    const montant = parseFloat(objectifMontant) || 0
    const ecoJour = parseFloat(economieJour) || 0
    if (ecoJour === 0) return { jours: 0, mois: 0, semaines: 0 }
    
    const jours = Math.ceil(montant / ecoJour)
    return {
      jours,
      semaines: Math.ceil(jours / 7),
      mois: (jours / 30).toFixed(1),
    }
  }

  const resultatsEcoJour = calculEconomieJour()
  const resultatsEcoSemaine = calculEconomieSemaine()
  const resultatsDepense = calculDepensePersonnalisee()
  const resultatsObjectif = calculObjectif()

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">
      <div className="w-[390px] min-h-[780px] bg-[#050A14] rounded-[40px] shadow-[0_0_40px_rgba(0,0,0,0.4)] p-6 relative overflow-hidden pb-10">

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-white">Conseils</h1>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="relative z-10 space-y-6 max-h-[690px] overflow-y-auto pb-4">

          {/* CONSEIL DU JOUR */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <h2 className="text-lg font-semibold text-white mb-3">
              Conseil du jour
            </h2>
            <p className="text-white/80 text-sm leading-relaxed mb-4">
              {tips[currentTipIndex]}
            </p>
            <button
              onClick={() => setCurrentTipIndex((currentTipIndex + 1) % tips.length)}
              className="w-full py-2 rounded-xl bg-[#F5D657] text-[#0A1D37] font-semibold text-sm active:scale-95 transition"
            >
              Conseil suivant
            </button>
          </div>

          {/* CALCULATEURS */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Calculateurs</h2>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveCalculator("jour")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition ${
                  activeCalculator === "jour"
                    ? "bg-[#F5D657] text-[#0F2B52]"
                    : "bg-white/5 border border-white/10 text-white/70"
                }`}
              >
                Économies
              </button>
              <button
                onClick={() => setActiveCalculator("depenses")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition ${
                  activeCalculator === "depenses"
                    ? "bg-[#F5D657] text-[#0F2B52]"
                    : "bg-white/5 border border-white/10 text-white/70"
                }`}
              >
                Dépenses
              </button>
              <button
                onClick={() => setActiveCalculator("objectif")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition ${
                  activeCalculator === "objectif"
                    ? "bg-[#F5D657] text-[#0F2B52]"
                    : "bg-white/5 border border-white/10 text-white/70"
                }`}
              >
                Objectif
              </button>
            </div>

            {/* Calculateur Économies */}
            {activeCalculator === "jour" && (
              <div className="space-y-3">
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Si j'économise par jour :</label>
                  <input
                    type="number"
                    value={montantJour}
                    onChange={(e) => setMontantJour(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-lg font-bold outline-none placeholder:text-white/30"
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2 bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Dans 1 semaine :</span>
                    <span className="text-white font-bold">{resultatsEcoJour.semaine}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Dans 1 mois :</span>
                    <span className="text-white font-bold">{resultatsEcoJour.mois}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Dans 1 an :</span>
                    <span className="text-white font-bold text-lg">{resultatsEcoJour.an}€</span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-white/10">
                    <span className="text-white/50">Avec Livret A (3%) :</span>
                    <span className="text-green-400 font-semibold">{resultatsEcoJour.anAvecInterets}€</span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-white/70 text-sm mb-2 block">Ou par semaine :</label>
                  <input
                    type="number"
                    value={montantSemaine}
                    onChange={(e) => setMontantSemaine(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-lg font-bold outline-none placeholder:text-white/30"
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2 bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Dans 1 mois :</span>
                    <span className="text-white font-bold">{resultatsEcoSemaine.mois}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Dans 1 an :</span>
                    <span className="text-white font-bold text-lg">{resultatsEcoSemaine.an}€</span>
                  </div>
                </div>
              </div>
            )}

            {/* Calculateur Dépenses Personnalisées */}
            {activeCalculator === "depenses" && (
              <div className="space-y-3">
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Nom de la dépense :</label>
                  <input
                    type="text"
                    value={nomDepense}
                    onChange={(e) => setNomDepense(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 font-semibold outline-none placeholder:text-white/30"
                    placeholder="Ex: Café, Netflix, Tabac..."
                  />
                </div>
                
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Montant (€) :</label>
                  <input
                    type="number"
                    value={montantDepense}
                    onChange={(e) => setMontantDepense(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-lg font-bold outline-none placeholder:text-white/30"
                    placeholder="3.50"
                  />
                </div>

                <div>
                  <label className="text-white/70 text-sm mb-2 block">Fréquence :</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setFrequenceDepense("jour")}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition ${
                        frequenceDepense === "jour"
                          ? "bg-[#F5D657] text-[#0F2B52]"
                          : "bg-white/5 border border-white/10 text-white/70"
                      }`}
                    >
                      Jour
                    </button>
                    <button
                      onClick={() => setFrequenceDepense("semaine")}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition ${
                        frequenceDepense === "semaine"
                          ? "bg-[#F5D657] text-[#0F2B52]"
                          : "bg-white/5 border border-white/10 text-white/70"
                      }`}
                    >
                      Semaine
                    </button>
                    <button
                      onClick={() => setFrequenceDepense("mois")}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition ${
                        frequenceDepense === "mois"
                          ? "bg-[#F5D657] text-[#0F2B52]"
                          : "bg-white/5 border border-white/10 text-white/70"
                      }`}
                    >
                      Mois
                    </button>
                  </div>
                </div>

                <div className="space-y-2 bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-white font-semibold text-sm mb-2">Coût de : {nomDepense}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Par mois :</span>
                    <span className="text-orange-400 font-bold">{resultatsDepense.mois}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Par an :</span>
                    <span className="text-red-400 font-bold text-lg">{resultatsDepense.an}€</span>
                  </div>
                  <p className="text-xs text-white/50 pt-2 border-t border-white/10">
                    En supprimant cette dépense, vous économisez {resultatsDepense.an}€/an !
                  </p>
                </div>
              </div>
            )}

            {/* Planificateur Objectif */}
            {activeCalculator === "objectif" && (
              <div className="space-y-3">
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Mon objectif (€) :</label>
                  <input
                    type="number"
                    value={objectifMontant}
                    onChange={(e) => setObjectifMontant(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-lg font-bold outline-none placeholder:text-white/30"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">J'économise par jour (€) :</label>
                  <input
                    type="number"
                    value={economieJour}
                    onChange={(e) => setEconomieJour(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-lg font-bold outline-none placeholder:text-white/30"
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2 bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-center pb-3 border-b border-white/10">
                    <p className="text-white/60 text-xs mb-1">Vous atteindrez votre objectif dans :</p>
                    <p className="text-white font-bold text-2xl">{resultatsObjectif.jours} jours</p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Soit environ :</span>
                    <span className="text-white font-semibold">{resultatsObjectif.semaines} semaines</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Ou :</span>
                    <span className="text-white font-semibold">{resultatsObjectif.mois} mois</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TECHNIQUES DE MANIPULATION */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <h2 className="text-lg font-semibold text-white mb-3">Reconnaître les pièges</h2>
            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <h3 className="text-white font-semibold text-sm mb-1">L'urgence artificielle</h3>
                <p className="text-white/60 text-xs">"Plus que 2 en stock !" - Souvent faux, ignorez-le.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <h3 className="text-white font-semibold text-sm mb-1">La pression sociale</h3>
                <p className="text-white/60 text-xs">"127 personnes regardent" - Chiffres manipulés.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <h3 className="text-white font-semibold text-sm mb-1">Notifications addictives</h3>
                <p className="text-white/60 text-xs">Désactivez toutes les notifs shopping !</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <h3 className="text-white font-semibold text-sm mb-1">Fausses promos</h3>
                <p className="text-white/60 text-xs">"-70% première commande" = vous dépensez quand même.</p>
              </div>
            </div>
          </div>

          {/* VOS OPTIMISATIONS (placeholder) */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <h2 className="text-lg font-semibold text-white mb-3">Vos optimisations</h2>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-white/70 text-sm">
                Fonctionnalité à venir
              </p>
              <p className="text-white/50 text-xs mt-2">
                Analyse automatique de vos dépenses et suggestions d'économies personnalisées.
              </p>
            </div>
          </div>

        </div>


      </div>
    </div>
  )
}