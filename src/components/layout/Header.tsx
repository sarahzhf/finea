import Link from "next/link";
import { Sparkles, Home, PieChart, User, TrendingUp, BrainCircuit, MessageSquare, CreditCard, Layers } from "lucide-react";

const NAV_ITEMS = [
    { name: "Accueil", href: "/dashboard", icon: Home },
    { name: "Dépenses", href: "/expenses", icon: PieChart },
    { name: "Épargne", href: "/savings", icon: TrendingUp },
    { name: "Quiz", href: "/quiz", icon: BrainCircuit },
    { name: "Copilote", href: "/copilot", icon: Sparkles },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Crédits", href: "/credits", icon: CreditCard },
    { name: "Budgets", href: "/budgets", icon: Layers },
    { name: "Profil", href: "/profile", icon: User },
];

export default function Header() {
    return (
        <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm sm:px-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold tracking-tight text-gray-900">Finéa</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex items-center space-x-8">
                {NAV_ITEMS.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                    >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                    </Link>
                ))}
            </nav>
        </header>
    );
}
