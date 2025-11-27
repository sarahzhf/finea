import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json()

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, 
    })

    const formattedMessages = messages.map((m: any) => ({
      role: m.from === "user" ? "user" : "assistant",
      content: m.text,
    }))

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Tu es Finéa, un coach financier clair, gentil et très pédagogique. Adapte tes réponses au budget de l’utilisateur.",
        },
        ...formattedMessages,
        {
          role: "system",
          content: `Contexte budget: ${JSON.stringify(context ?? {})}`,
        },
      ],
    })

    const output = completion.choices[0].message.content

    return NextResponse.json({ output })
  } catch (e) {
    console.error("API error:", e)
    return NextResponse.json(
      { output: "Erreur interne du coach." },
      { status: 500 }
    )
  }
}