"use client";

import { Home, PieChart, Sparkles, User, TrendingUp, BrainCircuit, MessageSquare, CreditCard, Layers } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:hidden">
            <div className="flex h-16 w-full justify-around items-center px-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 text-[10px] font-medium transition-all duration-200",
                                isActive ? "text-blue-600 scale-105" : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6 mb-0.5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
