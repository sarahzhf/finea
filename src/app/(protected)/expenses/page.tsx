"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getExpenses, deleteExpense, Expense } from "@/lib/firestore/operations";
import Link from "next/link";
import { Plus, Trash2, Calendar, FileDown, Scan } from "lucide-react";

export default function ExpensesPage() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterMonth, setFilterMonth] = useState("");
    const [filterCategory, setFilterCategory] = useState("");

    const loadExpenses = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getExpenses(user.uid);
            // Sort by date descending
            data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setExpenses(data);
        } catch (error) {
            console.error("Error loading expenses", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadExpenses();
    }, [user]);

    const handleDelete = async (id: string | undefined) => {
        if (!id || !user) return;
        if (!confirm("Voulez-vous vraiment supprimer cette opération ?")) return;
        try {
            await deleteExpense(user.uid, id);
            await loadExpenses();
        } catch (e) {
            console.error("Error deleting", e);
            alert("Erreur lors de la suppression");
        }
    };

    const filteredExpenses = expenses.filter((e) => {
        const d: any = e.date;
        const dateStr = typeof d === "string" ? d : (d?.toDate ? d.toDate().toISOString() : new Date(d).toISOString());
        const matchMonth = filterMonth ? dateStr.startsWith(filterMonth) : true;
        const matchCategory = filterCategory ? e.category === filterCategory : true;
        return matchMonth && matchCategory;
    });

    const totalExpenses = filteredExpenses
        .filter((e) => e.amount < 0)
        .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

    const totalIncome = filteredExpenses
        .filter((e) => e.amount > 0)
        .reduce((acc, curr) => acc + curr.amount, 0);

    const categories = Array.from(new Set(expenses.map(e => e.category))).sort();

    return (
        <div className="space-y-6 pb-20 sm:pb-0">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Opérations</h1>
                <div className="flex items-center gap-2">
                    <Link
                        href="/expenses/import"
                        className="flex items-center space-x-2 rounded-md bg-white border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        title="Importer Excel"
                    >
                        <FileDown className="h-4 w-4" />
                        <span className="hidden md:inline">Excel</span>
                    </Link>
                    <Link
                        href="/scan"
                        className="flex items-center space-x-2 rounded-md bg-white border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        title="Scanner un ticket"
                    >
                        <Scan className="h-4 w-4" />
                        <span className="hidden md:inline">Scanner</span>
                    </Link>
                    <Link
                        href="/expenses/new"
                        className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Ajouter</span>
                    </Link>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Mois:</span>
                    </label>
                    <input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="rounded-md border-gray-300 py-1.5 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Catégorie:</label>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="rounded-md border-gray-300 py-1.5 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="">Toutes</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                {(filterMonth || filterCategory) && (
                    <button
                        onClick={() => { setFilterMonth(""); setFilterCategory(""); }}
                        className="text-sm text-blue-600 hover:text-blue-500 ml-auto"
                    >
                        Réinitialiser
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex flex-col justify-center">
                    <p className="text-sm font-medium text-gray-500">Total Dépenses</p>
                    <h3 className="text-xl font-bold text-red-600 mt-1">{totalExpenses.toFixed(2)} €</h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm flex flex-col justify-center">
                    <p className="text-sm font-medium text-gray-500">Total Revenus</p>
                    <h3 className="text-xl font-bold text-green-600 mt-1">+{totalIncome.toFixed(2)} €</h3>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                </div>
            ) : filteredExpenses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                    <p className="text-sm text-gray-500">Aucune opération trouvée.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                    <ul className="divide-y divide-gray-200">
                        {filteredExpenses.map((expense) => (
                            <li key={expense.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm font-medium text-gray-900">
                                            {expense.description || (expense as any).label || expense.category}
                                        </p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                                {expense.category}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {(() => { const d: any = expense.date; const dt = typeof d === "string" ? new Date(d) : d?.toDate ? d.toDate() : new Date(d); return dt.toLocaleDateString("fr-FR"); })()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 ml-4">
                                        <span
                                            className={`text-sm font-bold ${expense.amount < 0 ? "text-red-600" : "text-green-600"
                                                }`}
                                        >
                                            {expense.amount > 0 ? "+" : ""}
                                            {expense.amount.toFixed(2)} €
                                        </span>
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )
            }
        </div >
    );
}
