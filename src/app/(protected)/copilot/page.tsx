"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/auth/AuthContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Bot, Send, User as UserIcon, Settings2, CheckCircle2 } from "lucide-react";
import { getUserProfile } from "@/lib/firestore/profile";
import { getCredits } from "@/lib/firestore/credits";
import { getSavingsData } from "@/lib/firestore/savings";

type Role = "user" | "assistant";
type Msg = { id: string; role: Role; content: string };

function makeId(): string {
    return `${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

export default function CopilotPage() {
    const { user } = useAuth();

    const [token, setToken] = useState<string | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);

    const [text, setText] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Context Data
    const [contextData, setContextData] = useState({
        monthlyIncome: 0,
        remainingCredits: 0,
        averageRate: 0,
        totalSavings: 0,
    });
    const [isEditingContext, setIsEditingContext] = useState(false);

    const initialMessages: Msg[] = useMemo(() => {
        return [
            {
                id: "welcome",
                role: "assistant",
                content:
                    "Salut ! Je suis le Copilote Finéa. Dis-moi ton objectif (montant + date) et je te guiderai pas à pas.",
            },
        ];
    }, []);

    const [messages, setMessages] = useState<Msg[]>(initialMessages);

    // Auto-scroll
    const endRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // Token Firebase
    useEffect(() => {
        let cancelled = false;

        async function loadTokenAndContext() {
            setAuthError(null);
            setToken(null);

            if (!user) return;

            try {
                const t = await user.getIdToken();
                if (!cancelled) setToken(t);

                // Load initial context data
                const [profile, credits, savingsData] = await Promise.all([
                    getUserProfile(user.uid),
                    getCredits(user.uid),
                    getSavingsData(user.uid)
                ]);

                if (!cancelled) {
                    const totalBorrowed = credits.reduce((acc, c) => acc + c.totalAmount, 0);
                    const totalPaid = credits.reduce((acc, c) => acc + c.paidAmount, 0);
                    const remainingCredits = totalBorrowed - totalPaid;

                    const weightedSum = credits.reduce((acc, c) => acc + (c.interestRate * (c.totalAmount - c.paidAmount)), 0);
                    const averageRate = remainingCredits > 0 ? parseFloat((weightedSum / remainingCredits).toFixed(2)) : 0;

                    const totalSavings = savingsData?.accounts?.reduce((acc, accnt) => acc + accnt.balance, 0) || 0;

                    setContextData({
                        monthlyIncome: profile?.monthlyIncome || 0,
                        remainingCredits,
                        averageRate,
                        totalSavings
                    });
                }

            } catch (e) {
                console.error("[Copilot] init failed:", e);
                if (!cancelled) {
                    setAuthError("Erreur d'initialisation.");
                }
            }
        }

        loadTokenAndContext();
        return () => {
            cancelled = true;
        };
    }, [user]);

    const canSend = Boolean(token) && text.trim().length > 0 && !isLoading;

    async function sendMessage() {
        setApiError(null);

        if (!token) {
            setAuthError("Token manquant : connecte-toi puis reviens sur le copilote.");
            return;
        }

        const content = text.trim();
        if (!content) return;

        const userMsg: Msg = { id: makeId(), role: "user", content };
        const assistantId = makeId();

        // Optimistic UI: ajoute user + placeholder assistant
        setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
        setText("");
        setIsLoading(true);

        try {
            // IMPORTANT: reconstruire l’historique à partir d’une version cohérente
            // On repart de l’état "avant envoi" + le nouveau message user
            const payloadMessages = [...messages, userMsg].map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const res = await fetch("/api/copilot/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ messages: payloadMessages, contextData }),
            });

            if (!res.ok) {
                const errText = await res.text().catch(() => "");
                throw new Error(`HTTP ${res.status} ${res.statusText} ${errText}`.slice(0, 500));
            }

            if (!res.body) {
                throw new Error("Réponse sans body (stream indisponible).");
            }

            // Lire le stream texte
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let acc = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                acc += decoder.decode(value, { stream: true });

                setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)));
            }
        } catch (e: unknown) {
            console.error("[Copilot] sendMessage failed:", e);
            const msg = e instanceof Error ? e.message : String(e);
            setApiError(msg);

            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantId ? { ...m, content: "Désolé, une erreur est survenue côté serveur." } : m
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
                <h1 className="text-xl font-bold text-gray-900">Copilote Finéa</h1>
            </div>

            {/* Context Panel */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4 text-sm shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-900 flex items-center gap-2">
                        <Settings2 className="h-4 w-4" /> Paramètres Financiers du Scénario
                    </span>
                    <button
                        onClick={() => setIsEditingContext(!isEditingContext)}
                        className={`p-1.5 rounded-md transition-colors ${isEditingContext ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}
                    >
                        {isEditingContext ? <CheckCircle2 className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-blue-600 font-medium">Revenu Mensuel</label>
                        {isEditingContext ? (
                            <input type="number" value={contextData.monthlyIncome} onChange={e => setContextData({ ...contextData, monthlyIncome: parseFloat(e.target.value) || 0 })} className="w-full bg-white border border-blue-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500" />
                        ) : (
                            <div className="font-semibold text-gray-900">{contextData.monthlyIncome.toFixed(2)} €</div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-blue-600 font-medium">Épargne Totale</label>
                        {isEditingContext ? (
                            <input type="number" value={contextData.totalSavings} onChange={e => setContextData({ ...contextData, totalSavings: parseFloat(e.target.value) || 0 })} className="w-full bg-white border border-blue-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500" />
                        ) : (
                            <div className="font-semibold text-gray-900">{contextData.totalSavings.toFixed(2)} €</div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-blue-600 font-medium">Crédits Restants</label>
                        {isEditingContext ? (
                            <input type="number" value={contextData.remainingCredits} onChange={e => setContextData({ ...contextData, remainingCredits: parseFloat(e.target.value) || 0 })} className="w-full bg-white border border-blue-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500" />
                        ) : (
                            <div className="font-semibold text-gray-900">{contextData.remainingCredits.toFixed(2)} €</div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-blue-600 font-medium">Taux Moyen</label>
                        {isEditingContext ? (
                            <input type="number" step="0.1" value={contextData.averageRate} onChange={e => setContextData({ ...contextData, averageRate: parseFloat(e.target.value) || 0 })} className="w-full bg-white border border-blue-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500" />
                        ) : (
                            <div className="font-semibold text-gray-900">{contextData.averageRate.toFixed(2)} %</div>
                        )}
                    </div>
                </div>

                {authError ? (
                    <div className="mt-2 flex items-start gap-2 rounded-xl bg-red-50 p-2 text-red-700 border border-red-100">
                        <AlertTriangle className="h-4 w-4 mt-0.5" />
                        <div className="text-xs">{authError}</div>
                    </div>
                ) : null}

                {apiError ? (
                    <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 p-2 text-amber-800 border border-amber-100">
                        <AlertTriangle className="h-4 w-4 mt-0.5" />
                        <div className="text-xs break-words">{apiError}</div>
                    </div>
                ) : null}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto rounded-2xl bg-white shadow-sm border border-gray-100 p-4 space-y-4">
                {messages.map((m) => {
                    const isUser = m.role === "user";
                    return (
                        <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`flex max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                                    }`}
                            >
                                <div className="mr-3 hidden sm:block mt-1">
                                    {isUser ? (
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
                    );
                })}
                <div ref={endRef} />
            </div>

            {/* Composer */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (canSend) void sendMessage();
                }}
                className="flex items-end space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100"
            >
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Décris ton objectif (ex: 5000€ pour septembre 2027) ou réponds à ma question…"
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