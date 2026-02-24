"use client";

import { useChat } from "@ai-sdk/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useEffect, useRef, useState } from "react";
import { Send, Bot, User as UserIcon, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

export default function ChatPage() {
    const { user } = useAuth();
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            user.getIdToken().then(setToken);
        }
    }, [user]);

    const chat = useChat(({
        api: "/api/chat",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        initialMessages: [
            {
                id: "welcome",
                role: "assistant",
                content: "Bonjour ! Je suis Finéa, ton coach financier. Comment puis-je t'aider aujourd'hui ?",
            },
        ],
    } as any)) as any;
    const { messages, input, handleInputChange, handleSubmit, isLoading } = chat;

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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

            <div className="flex-1 overflow-y-auto rounded-2xl bg-white shadow-sm border border-gray-100 p-4 space-y-4">
                {messages.map((m: any) => (
                    <div
                        key={m.id}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"
                            }`}
                    >
                        <div
                            className={`flex max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${m.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
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
                                        p: ({ node, ...props }) => <p className="mb-1" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
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

            <form
                onSubmit={handleSubmit}
                className="flex items-end space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100"
            >
                <textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Posez votre question (ex: Comment réduire mes factures ?)"
                    className="flex-1 max-h-32 min-h-[44px] resize-none overflow-y-auto rounded-xl border-0 bg-gray-50 p-3 text-sm focus:ring-0"
                    rows={1}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            // Trigger submit event
                            if (input && input.trim()) {
                                e.currentTarget.form?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
                            }
                        }
                    }}
                />
                <button
                    type="submit"
                    disabled={!input || !input.trim() || isLoading || !token}
                    className="rounded-xl bg-blue-600 p-3 text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                >
                    <Send className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
}
