"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Bot, User as UserIcon, ArrowLeft, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function ChatPage() {
  const { user } = useAuth();

  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [text, setText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const initialMessages: ChatMessage[] = useMemo(
    () => [
      {
        id: "welcome",
        role: "assistant",
        content: "Bonjour ! Je suis Finéa, ton coach financier. Comment puis-je t'aider aujourd'hui ?",
      },
    ],
    []
  );

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // --- Debug auth ---
  useEffect(() => {
    console.log("[ChatPage] user =", user ? { uid: (user as any).uid, email: (user as any).email } : null);
  }, [user]);

  // --- Load token ---
  useEffect(() => {
    let cancelled = false;

    async function loadToken() {
      setAuthError(null);
      setToken(null);

      if (!user) return;

      try {
        const t = await user.getIdToken();
        if (!cancelled) setToken(t);
        console.log("[ChatPage] token loaded =", Boolean(t));
      } catch (e: unknown) {
        console.error("[ChatPage] getIdToken failed:", e);
        if (!cancelled) {
          setAuthError("Impossible de récupérer le token. Vérifie que tu es bien connecté.");
          setToken(null);
        }
      }
    }

    loadToken();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const canSend = Boolean(token) && text.trim().length > 0 && !isLoading;

  async function sendMessage() {
    setChatError(null);

    if (!token) {
      setAuthError("Token manquant : connecte-toi puis reviens sur le chat.");
      return;
    }

    const content = text.trim();
    if (!content) return;

    // 1) Ajoute le message user
    const userMsg: ChatMessage = { id: uid(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setText("");

    // 2) Prépare un message assistant vide qu’on va remplir en streaming
    const assistantId = uid();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [
            // Ton backend attend { messages }, donc on envoie toute la conversation
            // en format role/content.
            ...messages.map(({ role, content }) => ({ role, content })),
            { role: "user", content },
          ],
        }),
      });

      if (!res.ok) {
        const textErr = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} ${textErr}`.slice(0, 500));
      }

      if (!res.body) {
        throw new Error("Réponse sans body (stream indisponible).");
      }

      // 3) Lire le stream texte et mettre à jour le message assistant
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });

        // Met à jour le contenu du message assistant au fur et à mesure
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m))
        );
      }
    } catch (e: unknown) {
      console.error("[ChatPage] sendMessage failed:", e);
      setChatError(e instanceof Error ? e.message : String(e));

      // Si erreur, remplace le message assistant vide par un message d’erreur lisible
      setMessages((prev) =>
        prev.map((m) =>
          m.role === "assistant" && m.content === ""
            ? { ...m, content: "Désolé, une erreur est survenue côté serveur. Regarde la console / Network." }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-4rem)] max-w-3xl mx-auto space-y-4">
      <div className="flex items-center space-x-3 px-2">
        <Link href="/dashboard" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="rounded-full bg-blue-100 p-2 text-blue-600">
          <Bot className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Assistant Finéa</h1>
      </div>

      {/* Bandeau état */}
      <div className="rounded-2xl border border-gray-100 bg-white p-3 text-sm shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-gray-900">État :</span>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">user: {user ? "OK" : "ABSENT"}</span>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">token: {token ? "OK" : "ABSENT"}</span>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
            loading: {isLoading ? "OUI" : "NON"}
          </span>
        </div>

        {authError && (
          <div className="mt-2 flex items-start gap-2 rounded-xl bg-red-50 p-2 text-red-700">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <div>
              <div className="font-semibold">Auth error</div>
              <div>{authError}</div>
            </div>
          </div>
        )}

        {chatError && (
          <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 p-2 text-amber-800">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <div>
              <div className="font-semibold">Chat error</div>
              <div className="break-words">{chatError}</div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-white shadow-sm border border-gray-100 p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`flex max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                }`}
            >
              <div className="mr-3 hidden sm:block mt-1">
                {m.role === "user" ? (
                  <UserIcon className="h-5 w-5 text-blue-200" />
                ) : (
                  <Bot className="h-5 w-5 text-gray-400" />
                )}
              </div>

              <div className="prose prose-sm prose-p:leading-relaxed prose-pre:p-0">
                <ReactMarkdown
                  components={{
                    p: (props) => <p className="mb-1" {...props} />,
                    strong: (props) => <strong className="font-semibold" {...props} />,
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex rounded-2xl bg-gray-100 px-4 py-3 text-gray-500">
              <Bot className="h-5 w-5 mr-3 mt-1" />
              <div className="flex items-center space-x-1 mt-2.5">
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"></div>
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0.2s" }}></div>
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSend) sendMessage();
        }}
        className="flex items-end space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Posez votre question (ex: Comment réduire mes factures ?)"
          className="flex-1 max-h-32 min-h-[44px] resize-none overflow-y-auto rounded-xl border-0 bg-gray-50 p-3 text-sm focus:ring-0"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) e.currentTarget.form?.requestSubmit();
            }
          }}
        />

        <button
          type="submit"
          disabled={!canSend}
          className="rounded-xl bg-blue-600 p-3 text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}