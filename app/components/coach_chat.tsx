"use client"

import { useEffect, useState } from "react"
import { Send, MessageCircle } from "lucide-react"

type BudgetContext = {
  month: string;
  totalDep: number;
  totalRev: number;
  totalUseless: number;
}

interface ChatbotProps {
  budgetContext?: BudgetContext | null
  autoMessage?: string | null
  onAction?: (action: any) => void
  onClose?: () => void
}

export default function Chatbot({
  budgetContext = null,
  autoMessage = null,
  onAction,
  onClose
}: ChatbotProps) {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Bonjour ! Je suis votre guide virtuel. Comment puis-je vous aider ?",
    },
  ])

  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  // message auto de page.tsx
  useEffect(() => {
    if (!autoMessage) return
    sendMessage(autoMessage, true)
  }, [autoMessage])

  const sendMessage = async (text: string, isAuto = false) => {
    if (!text.trim()) return
  
    const newMessages = [
      ...messages,
      ...(isAuto ? [] : [{ from: "user", text }])
    ]
  
    if (!isAuto) {
      setMessages(newMessages)
      setInput("")
    }
  
    setLoading(true)
  
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: newMessages,   
        context: budgetContext,
      }),
    })
  
    const data = await res.json()
  
    if (data.action && onAction) {
      onAction(data.action)
    }
  
    setMessages(m => [...m, { from: "bot", text: data.output }])
    setLoading(false)
  }

  return (
    <div className="w-full h-full pointer-events-auto">
      <div className="bg-black/80 text-white rounded-2xl p-4 border border-gold/30">
        
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-light text-gold">Guide Virtuel</h3>
          {onClose && (
            <button onClick={onClose} className="text-gold text-sm px-2 py-1 rounded">
              Fermer
            </button>
          )}
        </div>

        <div className="h-64 overflow-y-auto mb-4 space-y-2 p-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded-xl text-sm whitespace-pre-line ${
                msg.from === "user"
                  ? "bg-gold text-white self-end max-w-[80%]"
                  : "bg-white/10 self-start max-w-[90%]"
              }`}
            >
              {msg.text}
            </div>
          ))}

          {loading && <div className="italic text-white/60">Le guide réfléchit…</div>}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Pose une question..."
            className="flex-1 bg-white/10 border border-gold/20 rounded-xl px-3 py-2 text-sm"
          />
          
          <button
            onClick={() => sendMessage(input)}
            className="bg-gold text-black rounded-xl px-3 flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>

      </div>
    </div>
  )
}