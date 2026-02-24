"use client";

import Link from "next/link";
import { ArrowLeft, Zap, CreditCard, PiggyBank, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GAMES = [
    {
        id: "swipe",
        title: "Swipe Game",
        icon: Layers,
        description: "Swipe les cartes pour accepter ou refuser des dépenses. Chaque choix a un impact !",
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-100",
        href: "/missions/swipe",
    },
    {
        id: "bill-rush",
        title: "Bill Rush",
        icon: Zap,
        description: "Cours dans ton mois, récupère tes revenus et gère tes factures dans un runner 3 lignes.",
        color: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-100",
        href: "/missions/bill-rush",
    },
    {
        id: "savings-lab",
        title: "Savings Lab",
        icon: PiggyBank,
        description: "Répartis ton épargne entre sécurité, projets et plaisir selon différents scénarios.",
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-100",
        href: "/missions/savings-lab",
    },
    {
        id: "budget-blitz",
        title: "Budget Blitz",
        icon: CreditCard,
        description: "Catégorise le plus de dépenses possible en 30 secondes. Combos bonus x2 !",
        color: "text-yellow-600",
        bg: "bg-yellow-50",
        border: "border-yellow-100",
        href: "/missions/budget-blitz",
    },
];

export default function MissionsPage() {
    return (
        <div className="space-y-6 pb-20 sm:pb-0">
            <header className="flex items-center space-x-3 rounded-2xl bg-white p-6 shadow-sm">
                <Link
                    href="/dashboard"
                    className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Mini-Jeux
                    </h1>
                    <p className="text-sm text-gray-500">
                        Apprends en jouant · 4 jeux éducatifs
                    </p>
                </div>
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
                {GAMES.map((game) => {
                    const Icon = game.icon;
                    return (
                        <Link key={game.id} href={game.href} className="block">
                            <Card
                                className={`h-full ${game.border} ${game.bg}/30 hover:shadow-md hover:${game.border.replace("border-", "border-")}/80 transition-all cursor-pointer`}
                            >
                                <CardHeader className="flex flex-row items-center space-x-3 space-y-0 pb-2">
                                    <div
                                        className={`rounded-xl ${game.bg} p-2.5`}
                                    >
                                        <Icon
                                            className={`h-5 w-5 ${game.color}`}
                                        />
                                    </div>
                                    <CardTitle className="text-base font-semibold text-gray-900">
                                        {game.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {game.description}
                                    </p>
                                    <div className="mt-3 flex items-center text-xs font-medium text-blue-600">
                                        Jouer →
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
