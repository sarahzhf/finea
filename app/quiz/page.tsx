"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"

export default function QuizPage() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { name: "Home", route: "/", icon: "🏠" },
    { name: "Quiz", route: "/quiz", icon: "📝" },
    { name: "Profil", route: "/profil", icon: "👤" },
    { name: "Réglages", route: "/settings", icon: "⚙️" },
  ]

  const questions = [
    {
      q: "Quelle est la meilleure définition d'un budget ?",
      options: [
        "Un tableau où on note ses dépenses",
        "Un plan qui organise ses revenus et dépenses",
        "Un outil utilisé seulement par les entreprises",
        "Une estimation vague de combien on peut dépenser"
      ],
      answer: 1
    },
    {
      q: "Qu’est‑ce qu’une épargne de précaution ?",
      options: [
        "Un compte utilisé pour les vacances",
        "Un montant mis de côté pour les imprévus",
        "Une épargne pour acheter une maison",
        "Un prêt bancaire spécial"
      ],
      answer: 1
    },
    {
      q: "Quel achat est généralement considéré comme une dépense inutile ?",
      options: [
        "Un café hors de prix tous les jours",
        "Les courses alimentaires essentielles",
        "Payer le loyer",
        "Économiser 20€ par mois"
      ],
      answer: 0
    }
  ]

  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  function submitAnswer() {
    if (selected === null) return

    if (selected === questions[current].answer) {
      setScore(score + 1)
    }

    if (current + 1 === questions.length) {
      setFinished(true)
    } else {
      setCurrent(current + 1)
      setSelected(null)
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">
      
      {/* iPhone frame */}
      <div className="w-[390px] min-h-[780px] bg-[#0F2B52] rounded-[40px] shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6 relative overflow-hidden">

        {/* Glow */}
        <div className="absolute -top-20 -left-24 w-72 h-72 bg-[#F5D657]/15 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#F5D657]/10 blur-3xl rounded-full"></div>

        {/* Title */}
        <h1 className="relative z-10 text-2xl font-bold text-[#F5D657] mb-6 drop-shadow">
          Quiz Finance
        </h1>

        {!finished && (
          <>
            {/* Question card */}
            <div className="
              relative z-10 mb-8 rounded-3xl p-6
              bg-[#0F2B52]
              shadow-[10px_10px_22px_#07101F,-10px_-10px_22px_#173A68]
            ">
              <p className="text-[#F5D657] text-lg font-semibold">
                {questions[current].q}
              </p>
            </div>

            {/* Options */}
            <div className="relative z-10 space-y-4 mb-8">
              {questions[current].options.map((opt, index) => (
                <button
                  key={index}
                  onClick={() => setSelected(index)}
                  className={`
                    w-full text-left px-5 py-4 rounded-2xl font-medium
                    bg-[#0F2B52] text-[#F5D657]
                    shadow-[8px_8px_18px_#07101F,-8px_-8px_18px_#173A68]
                    transition-all
                    ${selected === index ? "ring-2 ring-[#F5D657]" : ""}
                  `}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Submit */}
            <button
              onClick={submitAnswer}
              className="
                w-full py-4 rounded-2xl font-semibold text-[#0F2B52]
                bg-[#F5D657]
                shadow-[6px_6px_14px_#07101F,-6px_-6px_14px_#173A68]
                active:scale-95 transition-all
              "
            >
              Suivant
            </button>
          </>
        )}

        {finished && (
          <div className="relative z-10 text-center mt-10">
            <h2 className="text-[#F5D657] text-4xl font-bold mb-4 drop-shadow">
              {score}/{questions.length}
            </h2>

            <p className="text-[#F5D657]/70 text-lg mb-8">
              {score === questions.length
                ? "Excellent ! Tu maîtrises parfaitement les bases 🔥"
                : score >= 2
                ? "Très bien ! Tu progresses 💪"
                : "Continue d’apprendre, tu vas t’améliorer 📘"}
            </p>

            <button
              onClick={() => router.push("/")}
              className="
                w-full py-4 rounded-2xl font-semibold text-[#F5D657]
                bg-[#0F2B52]
                shadow-[8px_8px_18px_#07101F,-8px_-8px_18px_#173A68]
                active:scale-95 transition-all
              "
            >
              ← Retour
            </button>
          </div>
        )}

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
            const isQuiz = item.route === "/quiz"

            return (
              <button
                key={item.route}
                onClick={() => router.push(item.route)}
                className={`
                  flex flex-col items-center justify-center 
                  transition-all duration-300
                  ${isQuiz ? "w-14 h-14 -mt-6 rounded-full" : "w-12 h-12 rounded-2xl"}
                  ${
                    active
                      ? "bg-[#0F2B52] shadow-[inset_6px_6px_12px_#07101F,inset_-6px_-6px_12px_#173A68] scale-110 animate-pulse"
                      : "bg-[#0F2B52] shadow-[6px_6px_12px_#07101F,-6px_-6px_12px_#173A68] opacity-75 scale-95"
                  }
                `}
              >
                <span className={isQuiz ? "text-2xl" : "text-xl"}>{item.icon}</span>
                {!isQuiz && (
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
