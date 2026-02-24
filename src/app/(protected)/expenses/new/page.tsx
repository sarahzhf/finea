"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { addExpense } from "@/lib/firestore/operations";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewExpensePage() {
    const { user } = useAuth();
    const router = useRouter();

    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<"expense" | "income">("expense");
    const [category, setCategory] = useState("Alimentation");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);

    const CATEGORIES = type === "expense"
        ? ["Alimentation", "Logement", "Transports", "Loisirs", "Santé", "Abonnements", "Autre"]
        : ["Salaire", "Aides", "Remboursement", "Autre"];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        const numericAmount = parseFloat(amount.replace(",", "."));
        const finalAmount = type === "expense" ? -Math.abs(numericAmount) : Math.abs(numericAmount);

        try {
            await addExpense(user.uid, {
                description,
                amount: finalAmount,
                category,
                date: new Date(date).toISOString(),
            });
            router.push("/expenses");
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'ajout de l'opération");
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-lg space-y-6 pb-20 sm:pb-0">
            <div className="flex items-center space-x-4">
                <Link href="/expenses" className="text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Nouvelle Opération</h1>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="flex rounded-md shadow-sm">
                        <button
                            type="button"
                            onClick={() => { setType("expense"); setCategory("Alimentation"); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-l-md border ${type === 'expense' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                            Dépense
                        </button>
                        <button
                            type="button"
                            onClick={() => { setType("income"); setCategory("Salaire"); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-r-md border-t border-b border-r ${type === 'income' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                            Revenu
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium leading-6 text-gray-900">Montant (€)</label>
                        <div className="mt-2">
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium leading-6 text-gray-900">Catégorie</label>
                        <div className="mt-2">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium leading-6 text-gray-900">Description (Optionnel)</label>
                        <div className="mt-2">
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="Ex : Courses Carrefour"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium leading-6 text-gray-900">Date</label>
                        <div className="mt-2">
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Enregistrement..." : "Enregistrer"}
                    </button>
                </form>
            </div >
        </div >
    );
}
