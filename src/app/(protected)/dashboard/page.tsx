"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { logOut } from "@/lib/auth/helpers";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExpenses, Expense } from "@/lib/firestore/operations";
import { getSavingsData, SavingsData } from "@/lib/firestore/savings";
import { getCredits, Credit } from "@/lib/firestore/credits";
import { getUserProfile, UserProfile } from "@/lib/firestore/profile";
import { calculateBehavioralScore } from "@/lib/copilot/behavioral";
import { Wallet, Target, TrendingDown, ArrowRight, BrainCircuit, CreditCard, Activity, Gamepad2 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [savings, setSavings] = useState<SavingsData | null>(null);
    const [credits, setCredits] = useState<Credit[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!user) return;
            try {
                const [expensesData, savingsData, creditsData, profileData] = await Promise.all([
                    getExpenses(user.uid),
                    getSavingsData(user.uid),
                    getCredits(user.uid),
                    getUserProfile(user.uid),
                ]);
                setExpenses(expensesData);
                setSavings(savingsData);
                setCredits(creditsData);
                setProfile(profileData);
            } catch (err) {
                console.error("Error loading dashboard data", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [user]);

    const handleLogout = async () => {
        await logOut();
        router.push("/login");
    };

    // Filter to current month only
    const currentMonth = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    })();

    const thisMonthExpenses = expenses.filter((e) => {
        const d: any = e.date;
        const dateStr = typeof d === "string" ? d : (d?.toDate ? d.toDate().toISOString() : new Date(d).toISOString());
        return dateStr.startsWith(currentMonth);
    });

    const currentMonthExpenses = thisMonthExpenses
        .filter((e) => e.amount < 0)
        .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

    const currentMonthIncome = thisMonthExpenses
        .filter((e) => e.amount > 0)
        .reduce((acc, curr) => acc + curr.amount, 0);

    const totalSavingsBalance = savings?.accounts?.reduce((acc, account) => acc + account.balance, 0) || 0;
    const totalGoalAmount = savings?.goals?.reduce((acc, goal) => acc + goal.targetAmount, 0) || 0;
    const totalGoalCurrent = savings?.goals?.reduce((acc, goal) => acc + goal.currentAmount, 0) || 0;
    const overallProgress = totalGoalAmount > 0 ? (totalGoalCurrent / totalGoalAmount) * 100 : 0;

    const totalBorrowed = credits.reduce((acc, c) => acc + c.totalAmount, 0);
    const totalPaid = credits.reduce((acc, c) => acc + c.paidAmount, 0);
    const totalRemaining = totalBorrowed - totalPaid;
    const weightedSum = credits.reduce((acc, c) => acc + (c.interestRate * (c.totalAmount - c.paidAmount)), 0);
    const averageRate = totalRemaining > 0 ? (weightedSum / totalRemaining) : 0;
    const creditsProgress = totalBorrowed > 0 ? (totalPaid / totalBorrowed) * 100 : 0;

    // Behavioral Score Calculation
    const funExpenses = expenses
        .filter((e) => e.amount < 0 && (e.category?.toLowerCase() === "loisirs" || e.category?.toLowerCase() === "sorties" || e.category?.toLowerCase() === "restaurants"))
        .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

    const behaviorData = calculateBehavioralScore({
        monthlyIncomeNet: profile?.monthlyIncome || 0,
        monthlySavingsAmount: Math.max(0, currentMonthIncome - currentMonthExpenses),
        funExpenses,
        totalExpenses: currentMonthExpenses,
        debtsMonthly: 0,
        volatility: 0.1, // Default assumption for MVP
        goalAmount: totalGoalAmount,
        currentSavings: totalSavingsBalance,
        goalHorizonMonths: 12 // Default assumption
    });

    const behaviorColor = behaviorData.score > 75 ? "text-green-600 bg-green-50 border-green-100" : behaviorData.score > 50 ? "text-orange-500 bg-orange-50 border-orange-100" : "text-red-600 bg-red-50 border-red-100";
    const behaviorText = behaviorData.score > 75 ? "Excellent" : behaviorData.score > 50 ? "À surveiller" : "Critique";

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 sm:pb-0">
            <header className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Tableau de bord
                    </h1>
                    <p className="text-sm text-gray-500">
                        Bienvenue {user?.email?.split("@")[0]}
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="rounded-md bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                    Se déconnecter
                </button>
            </header>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Card 1: Dépenses */}
                <Link href="/expenses" className="block">
                    <Card className="h-full hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Dépenses (Mois)</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {currentMonthExpenses.toFixed(2)} €
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Revenus: +{currentMonthIncome.toFixed(2)} €
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                {/* Card 2: Epargne */}
                <Link href="/savings" className="block">
                    <Card className="h-full hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Mon Épargne</CardTitle>
                            <Wallet className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {totalSavingsBalance.toFixed(2)} €
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Card 3: Objectif */}
                <Link href="/savings" className="block sm:col-span-2 lg:col-span-1">
                    <Card className="h-full border-blue-100 bg-blue-50/50 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-900">
                                Progression Objectif
                            </CardTitle>
                            <Target className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-100">
                                <div
                                    className="h-full bg-blue-600 transition-all duration-500 ease-in-out"
                                    style={{ width: `${Math.min(overallProgress, 100)}%` }}
                                />
                            </div>
                            <p className="mt-2 text-xs font-medium text-blue-700">
                                {overallProgress.toFixed(1)}% complété
                            </p>
                            {totalGoalAmount > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Objectif: {totalGoalAmount.toFixed(2)} €
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </Link>

                {/* Card 4: Quiz */}
                <Link href="/quiz" className="block lg:col-span-1">
                    <Card className="h-full border-indigo-100 bg-indigo-50/50 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-indigo-900">
                                Quiz Adaptatif
                            </CardTitle>
                            <BrainCircuit className="h-4 w-4 text-indigo-600" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-indigo-700">Testez vos connaissances et progressez</p>
                        </CardContent>
                    </Card>
                </Link>

                {/* Card 5: Crédits */}
                <Link href="/credits" className="block sm:col-span-2 lg:col-span-1">
                    <Card className="h-full border-blue-100 bg-blue-50/50 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-900">
                                Mes Crédits
                            </CardTitle>
                            <CreditCard className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-100">
                                <div
                                    className="h-full bg-blue-600 transition-all duration-500 ease-in-out"
                                    style={{ width: `${Math.min(creditsProgress, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-xs font-medium text-blue-700">
                                    {creditsProgress.toFixed(1)}% remboursé
                                </p>
                                <p className="text-xs font-medium text-gray-500">
                                    Taux: {averageRate.toFixed(2)}%
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Card 6: Score Comportemental */}
                <Link href="/copilot" className="block sm:col-span-2 lg:col-span-1">
                    <Card className={`h-full transition-all cursor-pointer hover:shadow-md ${behaviorColor}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Santé Financière</CardTitle>
                            <Activity className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end space-x-2">
                                <span className="text-3xl font-bold">{behaviorData.score}</span>
                                <span className="text-sm font-medium mb-1">/ 100</span>
                            </div>
                            <p className="text-xs mt-1 font-medium">{behaviorText}</p>
                            {behaviorData.flags.length > 0 && (
                                <p className="text-[10px] mt-2 opacity-80 leading-tight">
                                    💡 {behaviorData.flags[0]}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </Link>

                {/* Card 7: Mini-Jeux */}
                <Link href="/missions" className="block lg:col-span-1">
                    <Card className="h-full border-emerald-100 bg-emerald-50/50 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-900">
                                Mini-Jeux
                            </CardTitle>
                            <Gamepad2 className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-emerald-700">4 jeux éducatifs pour apprendre en s&apos;amusant</p>
                            <div className="mt-2 flex items-center text-xs font-medium text-emerald-600">
                                Jouer <ArrowRight className="h-3 w-3 ml-1" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Link href="/expenses">
                    <div className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md cursor-pointer">
                        <div className="flex items-center space-x-3">
                            <div className="rounded-lg bg-red-50 p-2 text-red-600 group-hover:bg-red-100 transition-colors">
                                <TrendingDown className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Ajouter une dépense</p>
                                <p className="text-xs text-gray-500">Saisir une opération manuelle</p>
                            </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                </Link>

                <Link href="/copilot">
                    <div className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md cursor-pointer">
                        <div className="flex items-center space-x-3">
                            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 group-hover:bg-blue-100 transition-colors">
                                <Target className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Consulter le copilote</p>
                                <p className="text-xs text-gray-500">Analyse de vos finances</p>
                            </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                </Link>
            </div>
        </div>
    );
}
