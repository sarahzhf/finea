import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages = [], context } = await req.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { reply: "Clé OpenAI manquante côté serveur." },
        { status: 500 }
      )
    }

    const systemPrompt = `
Tu es Finéa, un coach financier personnel intelligent.

Tu analyses les données bancaires RÉELLES de l’utilisateur.

CONTEXTE FINANCIER :
- Banque : ${context?.bank}
- Mois analysé : ${context?.monthLabel}
- Solde global actuel : ${context?.summary?.currentBalanceCalculated} €
- Revenus du mois : ${context?.summary?.monthIncome} €
- Dépenses du mois : ${context?.summary?.monthExpenses} €
- Dépenses inutiles : ${context?.summary?.uselessTotal} €
- Nombre de transactions : ${context?.summary?.txCountMonth}

EXEMPLES DE DÉPENSES INUTILES :
${context?.uselessExamples
  ?.map((u: any) => `- ${u.label} : ${Math.abs(u.amount)} €`)
  .join("\n")}

RÈGLES :
- Sois concrète, personnalisée, bienveillante
- Ne répète JAMAIS la même réponse
- Donne des actions applicables immédiatement
- Parle comme une vraie coach humaine
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
    })

    const reply =
      completion.choices[0]?.message?.content ??
      "Je n’ai pas réussi à analyser tes données."

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("FINÉA CHAT ERROR:", error)
    return NextResponse.json(
      { reply: "Erreur serveur du coach Finéa." },
      { status: 500 }
    )
  }
}