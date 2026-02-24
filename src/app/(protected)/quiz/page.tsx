"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getActiveQuizQuestions, QuizQuestion } from "@/lib/firestore/quiz";
import { Trophy, ArrowRight, BrainCircuit, XCircle, CheckCircle, ArrowLeft, RefreshCw, Play, Filter, Sparkles, Bot } from "lucide-react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

type SessionState = "SETUP" | "PLAYING" | "FINISHED";

export default function QuizPage() {
    const { user } = useAuth();
    const [token, setToken] = useState<string | null>(null);
    const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);

    const [sessionState, setSessionState] = useState<SessionState>("SETUP");

    // SETUP STATE
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // PLAYING STATE
    const [thetaMap, setThetaMap] = useState<Record<string, number>>({});
    const [globalTheta, setGlobalTheta] = useState<number>(0);
    const [answeredIds, setAnsweredIds] = useState<Set<number>>(new Set());

    const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isReviewed, setIsReviewed] = useState(false);

    const [correctCount, setCorrectCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const MAX_QUESTIONS = 10;

    // AI EXPLANATION
    const [showAI, setShowAI] = useState(false);

    const { messages, sendMessage, status, setMessages } = useChat({
        api: "/api/chat",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    } as any) as any;
    const aiLoading = status === "streaming" || status === "submitted";


    useEffect(() => {
        if (user) {
            user.getIdToken().then(setToken);
        }
        async function load() {
            try {
                const data = await getActiveQuizQuestions();
                console.log("Quiz questions loaded:", data.length, data[0]);
                setAllQuestions(data);

                const tags = new Set<string>();
                data.forEach(q => {
                    if (q.tags && Array.isArray(q.tags)) {
                        q.tags.forEach(t => tags.add(t.trim().toLowerCase()));
                    }
                });
                setAvailableTags(Array.from(tags).filter(t => t.length > 0));
            } catch (e) {
                console.error("Error loading quiz data", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user]);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const startQuiz = () => {
        setThetaMap({});
        setGlobalTheta(0);
        setAnsweredIds(new Set());
        setCorrectCount(0);
        setTotalCount(0);
        setSessionState("PLAYING");
        selectNextQuestion(0, {});
    };

    const getTagsForQuestion = (q: QuizQuestion) => {
        return Array.isArray(q.tags)
            ? q.tags.map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
            : [];
    };

    const diffToB = (diff: number) => {
        // maps 1-5 to -2, -1, 0, 1, 2
        return diff - 3;
    };

    const selectNextQuestion = (currentGlobalTheta: number, currentThetaMap: Record<string, number>) => {
        const remaining = allQuestions.filter(q => !answeredIds.has(q.id));

        let pool = remaining;
        if (selectedTags.length > 0) {
            pool = remaining.filter(q => {
                const qTags = getTagsForQuestion(q);
                return qTags.some(t => selectedTags.includes(t));
            });
        }

        if (pool.length === 0 || totalCount >= MAX_QUESTIONS) {
            setSessionState("FINISHED");
            return;
        }

        setSelectedAnswer(null);
        setIsReviewed(false);
        setShowAI(false);
        setMessages([]);


        const epsilon = 0.15;
        if (Math.random() < epsilon) {
            const randomQ = pool[Math.floor(Math.random() * pool.length)];
            setCurrentQuestion(randomQ);
            return;
        }

        let bestMatch = pool[0];
        let minDiff = Infinity;

        for (const q of pool) {
            const b = diffToB(q.difficultyScore ?? 3);
            const qTags = getTagsForQuestion(q);

            let avgTheta = currentGlobalTheta;
            if (qTags.length > 0) {
                let sum = 0;
                let count = 0;
                qTags.forEach(t => {
                    if (currentThetaMap[t] !== undefined) {
                        sum += currentThetaMap[t];
                        count++;
                    }
                });
                if (count > 0) avgTheta = sum / count;
            }

            const diff = Math.abs(avgTheta - b);
            if (diff < minDiff) {
                minDiff = diff;
                bestMatch = q;
            }
        }

        setCurrentQuestion(bestMatch);
    };

    const handleAnswer = (choiceIndex: number) => {
        if (isReviewed || !currentQuestion) return;

        setSelectedAnswer(choiceIndex);
        setIsReviewed(true);

        const isCorrect = choiceIndex === currentQuestion.correctIndex;
        const b = diffToB(currentQuestion.difficultyScore ?? 3);
        const qTags = getTagsForQuestion(currentQuestion);

        let avgTheta = globalTheta;
        let count = 0;
        let sum = 0;
        qTags.forEach(t => {
            if (thetaMap[t] !== undefined) {
                sum += thetaMap[t];
                count++;
            }
        });
        if (count > 0) avgTheta = sum / count;

        const p = 1 / (1 + Math.exp(-(avgTheta - b)));
        const actual = isCorrect ? 1 : 0;
        const lr = 0.35;
        const delta = lr * (actual - p);

        const newThetaMap = { ...thetaMap };
        qTags.forEach(t => {
            newThetaMap[t] = (newThetaMap[t] || 0) + delta;
        });

        const newGlobalTheta = globalTheta + delta;

        setThetaMap(newThetaMap);
        setGlobalTheta(newGlobalTheta);

        if (isCorrect) setCorrectCount(c => c + 1);
        setTotalCount(c => c + 1);

        const newAnsweredIds = new Set(answeredIds);
        newAnsweredIds.add(currentQuestion.id);
        setAnsweredIds(newAnsweredIds);
    };

    const handleNext = () => {
        selectNextQuestion(globalTheta, thetaMap);
    };

    const triggerAIExplanation = () => {
        if (!currentQuestion || showAI) return;
        setShowAI(true);
        sendMessage({
            prompt: `Explique-moi de façon simple pourquoi la réponse à "${currentQuestion.question}" est "${currentQuestion.choices?.[currentQuestion.correctIndex]}". (L'explication courte est: ${currentQuestion.explanation}). Donne du contexte éducatif.`
        });
    };




    // Rendering Helpers
    const getTier = (theta: number) => {
        if (theta < -0.5) return { label: "Débutant", color: "text-blue-600", bg: "bg-blue-50" };
        if (theta > 0.5) return { label: "Avancé", color: "text-purple-600", bg: "bg-purple-50" };
        return { label: "Intermédiaire", color: "text-emerald-600", bg: "bg-emerald-50" };
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (sessionState === "SETUP") {
        return (
            <div className="mx-auto max-w-2xl space-y-6 pb-20 sm:pb-0">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BrainCircuit className="text-blue-600" /> Configuration du Quiz
                    </h1>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Thèmes abordés</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Sélectionnez les thèmes que vous souhaitez aborder. Laissez tout décoché pour un mix global.
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8">
                        {availableTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${selectedTags.includes(tag)
                                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                    : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                                    }`}
                            >
                                {tag.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={startQuiz}
                        className="w-full flex justify-center items-center space-x-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
                    >
                        <Play className="h-4 w-4 fill-current" />
                        <span>Démarrer le Quiz Adaptatif ({selectedTags.length > 0 ? "Filtré" : "Global"})</span>
                    </button>
                </div>
            </div>
        );
    }

    if (sessionState === "FINISHED") {
        const percent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
        const globalTier = getTier(globalTheta);

        return (
            <div className="mx-auto max-w-2xl space-y-6 pb-20 sm:pb-0 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Bilan de la Session</h1>
                </div>

                <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center space-y-6">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                        <Trophy className="h-10 w-10 text-blue-600" />
                    </div>

                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900">{percent}% de réussite</h2>
                        <p className="text-gray-500 mt-1">Score brut : {correctCount} / {totalCount}</p>
                    </div>

                    <div className="flex justify-center">
                        <div className={`px-4 py-1.5 rounded-full ${globalTier.bg} ${globalTier.color} font-bold text-sm border flex items-center gap-2`}>
                            <BrainCircuit className="h-4 w-4" />
                            Niveau Évalué : {globalTier.label}
                        </div>
                    </div>

                    {Object.keys(thetaMap).length > 0 && (
                        <div className="pt-4 border-t border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Profil de compétences</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart outerRadius="70%" data={
                                        Object.entries(thetaMap).map(([tag, theta]) => ({
                                            subject: tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase(),
                                            score: Math.max(0, Math.min(10, ((theta + 3) / 6) * 10)),
                                            fullMark: 10,
                                        }))
                                    }>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                        <Radar name="Compétences" dataKey="score" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.6} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 border-t border-gray-100 flex gap-4">
                        <button
                            onClick={() => setSessionState("SETUP")}
                            className="flex-1 flex justify-center rounded-md bg-white border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Filter className="h-4 w-4 mr-2" /> Changer les options
                        </button>
                        <button
                            onClick={startQuiz}
                            className="flex-1 flex justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" /> Rejouer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // PLAYING STATE
    const isCorrect = selectedAnswer === currentQuestion?.correctIndex;

    return (
        <div className="mx-auto max-w-2xl space-y-6 pb-20 sm:pb-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => setSessionState("SETUP")} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <span className="text-sm font-medium text-gray-500">Question {totalCount + (isReviewed ? 0 : 1)} / {MAX_QUESTIONS}</span>
                </div>
                <div className="flex items-center space-x-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
                    <Trophy className="h-4 w-4" />
                    <span>Score: {correctCount}</span>
                </div>
            </div>

            {currentQuestion && (
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-8 animate-in slide-in-from-right-4">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                Niveau {currentQuestion.difficultyScore} - {currentQuestion.difficultyLevel}
                            </span>
                        </div>
                        <h2 className="text-xl font-medium text-gray-900 leading-relaxed">
                            {currentQuestion.question}
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {(() => {
                            const LETTERS = ["A", "B", "C", "D"] as const;

                            // Sécurité : si choices n'existe pas ou n'est pas un tableau, on affiche rien
                            const choices = Array.isArray(currentQuestion.choices) ? currentQuestion.choices : [];
                            return choices.map((label, idx) => {
                                // On ignore les labels vides/null
                                if (!label) return null;

                                const letter = LETTERS[idx] ?? String(idx + 1); // fallback si >4 choix
                                const isChoiceCorrect = idx === currentQuestion.correctIndex;
                                const isChoiceSelected = selectedAnswer === idx;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={isReviewed}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${!isReviewed
                                            ? "border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                                            : isChoiceCorrect
                                                ? "border-green-500 bg-green-50"
                                                : isChoiceSelected
                                                    ? "border-red-500 bg-red-50"
                                                    : "border-gray-100 opacity-50 bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-800">
                                                <span className="font-bold mr-2 text-gray-400">{letter}.</span> {label}
                                            </span>

                                            {isReviewed && isChoiceCorrect && (
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            )}

                                            {isReviewed && isChoiceSelected && !isChoiceCorrect && (
                                                <XCircle className="h-5 w-5 text-red-500" />
                                            )}
                                        </div>
                                    </button>
                                );
                            });
                        })()}
                    </div>

                    {isReviewed && (
                        <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className={`rounded-xl border p-5 ${isCorrect ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"}`}>
                                <h3 className={`font-semibold flex items-center gap-2 ${isCorrect ? "text-green-800" : "text-red-800"}`}>
                                    {isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                    {(() => {
                                        const LETTERS = ["A", "B", "C", "D"] as const;
                                        const correctLetter = currentQuestion ? (LETTERS[currentQuestion.correctIndex] ?? String(currentQuestion.correctIndex + 1)) : "";
                                        return isCorrect
                                            ? "Bonne réponse !"
                                            : `Mauvaise réponse. La bonne réponse était ${correctLetter}.`;
                                    })()}
                                </h3>
                                <p className="mt-3 text-sm text-gray-700 leading-relaxed bg-white/60 p-3 rounded-lg">
                                    {currentQuestion.explanation}
                                </p>

                                {!showAI ? (
                                    <button
                                        onClick={triggerAIExplanation}
                                        className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                                    >
                                        <Sparkles className="h-4 w-4" /> Demander des précisions à l'IA
                                    </button>
                                ) : (
                                    <div className="mt-4 border-t border-indigo-100 pt-4">
                                        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-indigo-800">
                                            <Bot className="h-4 w-4" /> Explication détaillée de Finéa
                                        </div>
                                        <div className="prose prose-sm prose-p:leading-relaxed text-gray-800 bg-white p-4 rounded-xl border border-indigo-50">
                                            {messages.filter((m: any) => m.role === 'assistant').map((m: any) => (
                                                <ReactMarkdown key={m.id}>{m.content}</ReactMarkdown>
                                            ))}
                                            {aiLoading && (
                                                <div className="flex items-center space-x-1 mt-2">
                                                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400"></div>
                                                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "0.2s" }}></div>
                                                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "0.4s" }}></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-full flex justify-center items-center space-x-2 rounded-md bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors shadow-sm"
                            >
                                <span>{totalCount >= MAX_QUESTIONS ? "Terminer la session" : "Question suivante"}</span>
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div >
                    )}
                </div >
            )}
        </div >
    );
}
