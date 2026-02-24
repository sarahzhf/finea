"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getExpenses, Expense } from "@/lib/firestore/operations";
import { getBudgets, setBudgetLimit, BudgetLimit } from "@/lib/firestore/budgets";
import { PieChart, Calendar, Edit2, CheckCircle2, AlertTriangle, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BudgetsPage() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [budgets, setBudgets] = useState<BudgetLimit[]>([]);
    const [loading, setLoading] = useState(true);

    const [filterType, setFilterType] = useState<"month" | "rolling">("month");
    const [filterMonth, setFilterMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });

    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editLimit, setEditLimit] = useState<string>("");

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [expData, budData] = await Promise.all([
                getExpenses(user.uid),
                getBudgets(user.uid),
            ]);
            setExpenses(expData);
            setBudgets(budData);
        } catch (error) {
            console.error("Error loading budgets data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const handleSaveLimit = async (category: string) => {
        if (!user) return;
        const limit = parseFloat(editLimit);
        if (isNaN(limit)) return;

        try {
            await setBudgetLimit(user.uid, category, limit);
            await loadData();
            setEditingCategory(null);
            setEditLimit("");
        } catch (error) {
            console.error("Error saving limit", error);
            alert("Erreur lors de l'enregistrement du plafond.");
        }
    };

    // Filtre des dépenses
    const filteredExpenses = expenses.filter((e) => {
        if (e.amount >= 0) return false; // Ne prendre en compte que les dépenses

        if (filterType === "month") {
            const d: any = e.date;
            const dateStr = typeof d === "string" ? d : (d?.toDate ? d.toDate().toISOString() : new Date(d).toISOString());
            return dateStr.startsWith(filterMonth);
        } else {
            const expenseDate = new Date(e.date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return expenseDate >= thirtyDaysAgo;
        }
    });

    // Agrégats par catégorie
    const spentByCategory = filteredExpenses.reduce((acc, curr) => {
        const amount = Math.abs(curr.amount);
        acc[curr.category] = (acc[curr.category] || 0) + amount;
        return acc;
    }, {} as Record<string, number>);

    // Construire la liste des données d'affichage
    const categoriesDisplay = Object.keys({ ...spentByCategory, ...budgets.reduce((acc, b) => ({ ...acc, [b.category]: 0 }), {}) });

    // Trier par montant dépensé décroissant
    categoriesDisplay.sort((a, b) => (spentByCategory[b] || 0) - (spentByCategory[a] || 0));

    const totalSpentThisPeriod = Object.values(spentByCategory).reduce((a, b) => a + b, 0);
    const biggestCategory = categoriesDisplay[0] || "Aucune";
    const totalBudgets = budgets.reduce((acc, b) => acc + b.limit, 0);

    return (
        <div className="space-y-6 pb-20 sm:pb-0">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analyse Budgétaire</h1>
                    <p className="text-sm text-gray-500">Gérez vos plafonds de dépenses</p>
                </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2">
                    <button
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterType === "month" ? "bg-blue-100 text-blue-700" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                        onClick={() => setFilterType("month")}
                    >
                        Par mois
                    </button>
                    <button
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterType === "rolling" ? "bg-blue-100 text-blue-700" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                        onClick={() => setFilterType("rolling")}
                    >
                        30 jours glissants
                    </button>
                </div>

                {filterType === "month" && (
                    <div className="flex items-center space-x-2 border-l border-gray-200 pl-4">
                        <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>Mois:</span>
                        </label>
                        <input
                            type="month"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="rounded-md border border-gray-300 py-1.5 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                )}
            </div>

            {/* Stats globales */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-red-100 bg-red-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-800">Dépensé sur la période</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-900">{totalSpentThisPeriod.toFixed(2)} €</div>
                    </CardContent>
                </Card>

                <Card className="border-blue-100 bg-blue-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800">Total Plafonds Mensuels</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900">{totalBudgets.toFixed(2)} €</div>
                    </CardContent>
                </Card>

                <Card className="border-purple-100 bg-purple-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-purple-800">Premier Poste de Dépense</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-purple-900 truncate" title={biggestCategory}>{biggestCategory}</div>
                        <p className="text-xs text-purple-800 mt-1">{(spentByCategory[biggestCategory] || 0).toFixed(2)} €</p>
                    </CardContent>
                </Card>
            </div>

            {/* Liste des catégories et budgets */}
            <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2 mt-8">
                <PieChart className="h-5 w-5 text-gray-400" />
                <span>Plafonds par catégorie</span>
            </h2>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                </div>
            ) : categoriesDisplay.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                    <p className="text-sm text-gray-500">Aucune donnée pour cette période.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <ul className="divide-y divide-gray-100">
                        {categoriesDisplay.map((cat) => {
                            const spent = spentByCategory[cat] || 0;
                            const budgetObj = budgets.find(b => b.category === cat);
                            const limit = budgetObj ? budgetObj.limit : 0;

                            // Ajustement au prorata si rolling
                            const adjustedLimit = filterType === "rolling" ? limit : limit; // Simplifié, le budget mensuel reste le comparatif

                            const ratio = limit > 0 ? (spent / limit) * 100 : (spent > 0 ? 100 : 0);
                            const isOver = limit > 0 && spent > limit;
                            const isWarning = limit > 0 && ratio > 85 && !isOver;

                            return (
                                <li key={cat} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-gray-900">{cat}</span>
                                                <div className="text-sm font-medium">
                                                    <span className={isOver ? "text-red-600" : "text-gray-900"}>{spent.toFixed(2)} €</span>
                                                    {limit > 0 && <span className="text-gray-500"> / {limit.toFixed(2)} €</span>}
                                                </div>
                                            </div>
                                            {limit > 0 && (
                                                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden mt-2">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${isOver ? 'bg-red-500' : isWarning ? 'bg-orange-400' : 'bg-green-500'}`}
                                                        style={{ width: `${Math.min(ratio, 100)}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 sm:ml-4 sm:w-64 border-l pl-4 border-gray-100">
                                            {editingCategory === cat ? (
                                                <div className="flex items-center w-full gap-2">
                                                    <input
                                                        type="number"
                                                        value={editLimit}
                                                        onChange={(e) => setEditLimit(e.target.value)}
                                                        placeholder="Plafond €"
                                                        className="w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500 py-1"
                                                    />
                                                    <button onClick={() => handleSaveLimit(cat)} className="text-green-600 hover:text-green-700 p-1">
                                                        <CheckCircle2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="text-xs text-gray-500">
                                                        {limit > 0 ? (
                                                            isOver ? <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Dépassé de {(spent - limit).toFixed(2)}€</span>
                                                                : <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Reste {(limit - spent).toFixed(2)}€</span>
                                                        ) : (
                                                            <span className="italic text-gray-400">Aucun plafond</span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => { setEditingCategory(cat); setEditLimit(limit > 0 ? String(limit) : ""); }}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                                                        title="Définir le plafond"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
