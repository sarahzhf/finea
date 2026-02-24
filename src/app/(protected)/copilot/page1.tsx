"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Sparkles, Send, Bot, User, Activity, CheckCircle, TrendingUp, Target, AlertTriangle, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function CopilotPage() {
    const { user } = useAuth();
    const [token, setToken] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
            user.getIdToken().then(setToken);
        }
    }, [user]);

    const { messages, sendMessage, status, setMessages } = useChat(({
        api: "/api/copilot/chat",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        initialMessages: [
            {
                id: "welcome",
                role: "assistant",
                content: "Bonjour ! Je suis ton **Copilote Finéa**. Avant de lancer une simulation pour vérifier si ton objectif est atteignable, j'ai besoin de quelques informations : tes revenus mensuels, tes charges fixes, tes dépenses variables, ton épargne actuelle et ton objectif exact.",
            },
        ],
    } as any)) as any;

    const [input, setInput] = useState("");
    const isLoading = status === "streaming" || status === "submitted";

    const handleSubmit = (e?: { preventDefault?: () => void }) => {
        e?.preventDefault?.();
        if (!input.trim() || isLoading || !token) return;
        const msg = input;
        setInput("");
        sendMessage({ prompt: msg });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setInput(e.target.value);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const renderSimulationResult = (result: any) => {
        if (!result) return null;
        return (
            <div className="mt-4 space-y-4 w-full max-w-sm">
                <Card className="border-green-100 bg-green-50/50">
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-800">Probabilité de succès</p>
                            <div className="mt-1 flex items-baseline">
                                <span className="text-3xl font-extrabold tracking-tight text-green-900">
                                    {(result.successProb * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 border-b border-gray-100">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center space-x-2">
                            <Activity className="h-4 w-4" />
                            <span>Projections de capital simulées</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                        <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <span className="text-xs font-medium text-gray-700">Optimiste (P90)</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">{result.p90.toFixed(0)} €</span>
                        </div>

                        <div className="flex justify-between items-center bg-blue-50 p-2.5 rounded-lg ring-1 ring-blue-200 shadow-sm">
                            <div className="flex items-center space-x-2">
                                <Target className="h-4 w-4 text-blue-600" />
                                <span className="text-xs font-bold text-blue-900">Médian (P50)</span>
                            </div>
                            <span className="text-sm font-bold text-blue-900">{result.p50.toFixed(0)} €</span>
                        </div>

                        <div className="flex justify-between items-center bg-red-50 p-2.5 rounded-lg border border-red-100">
                            <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <span className="text-xs font-medium text-gray-700">Pessimiste (P10)</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">{result.p10.toFixed(0)} €</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-100px)] max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 shrink-0">
                <div className="rounded-full bg-blue-100 p-2.5 text-blue-600 shadow-inner">
                    <Sparkles className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Copilote IA</h1>
                    <p className="text-xs text-gray-500 font-medium tracking-wide">— Simulation Interactive</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto space-y-6 py-6 pb-32 hide-scrollbar">
                {messages.map((m: any) => (
                    <div key={m.id} className="space-y-4">
                        {/* Standard Message */}
                        {m.content && (
                            <div className={`flex items-start space-x-3 ${m.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${m.role === "user" ? "bg-indigo-100 text-indigo-600" : "bg-blue-600 text-white"}`}>
                                    {m.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                                </div>
                                <div className={`rounded-2xl px-4 py-3 max-w-[85%] sm:max-w-[75%] shadow-sm ${m.role === "user" ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white border text-gray-800 rounded-tl-sm"}`}>
                                    <div className={`prose prose-sm ${m.role === "user" ? "text-white" : ""} max-w-none break-words`}>
                                        <ReactMarkdown>
                                            {m.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div >
                        )}

                        {/* Tool Invocations (Simulations) */}
                        {
                            m.toolInvocations?.map((toolInv: any) => {
                                if (toolInv.toolName === "runSimulation") {
                                    return (
                                        <div key={toolInv.toolCallId} className="flex items-start space-x-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm bg-blue-600 text-white">
                                                <Bot className="h-5 w-5" />
                                            </div>
                                            <div className="w-full max-w-[85%] sm:max-w-[75%]">
                                                {toolInv.state === "call" ? (
                                                    <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-semibold border border-blue-100 animate-pulse">
                                                        <Activity className="h-4 w-4 animate-spin-slow" />
                                                        <span>Génération des scénarios en cours...</span>
                                                    </div>
                                                ) : toolInv.state === "result" ? (
                                                    renderSimulationResult(toolInv.result)
                                                ) : (
                                                    <div className="text-xs text-red-500 bg-red-50 p-2 rounded-lg inline-block border border-red-100">
                                                        Erreur lors de la simulation.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })
                        }
                    </div >
                ))}
                {
                    isLoading && messages[messages.length - 1]?.role === "user" && (
                        <div className="flex items-start space-x-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div className="bg-white border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex space-x-1.5 items-center h-[46px]">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    )
                }
                <div ref={messagesEndRef} />
            </div >

            {/* Input Area */}
            < div className="fixed bottom-[72px] sm:bottom-6 left-0 right-0 sm:left-[max(0px,calc(50%-24rem))] sm:right-auto sm:w-full sm:max-w-3xl px-4 sm:px-0 z-10" >
                <form
                    onSubmit={handleSubmit}
                    className="flex items-end space-x-2 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-200/50"
                >
                    <textarea
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Réponds aux questions ou donne tes objectifs..."
                        className="flex-1 max-h-32 min-h-[44px] resize-none overflow-y-auto rounded-xl border-0 bg-transparent px-3 py-3 text-sm focus:ring-0 placeholder:text-gray-400"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (input && input.trim() && !isLoading && token) {
                                    e.currentTarget.form?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
                                }
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!input || !input.trim() || isLoading || !token}
                        className="rounded-xl bg-blue-600 p-3 text-white transition-all hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 shadow-sm"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
                <div className="text-center mt-2 pb-1 sm:pb-0">
                    <p className="text-[10px] text-gray-400">Copilote utilise l'IA et le moteur de calcul Python. Vérifiez les informations.</p>
                </div>
            </div >
        </div >
    );
}
