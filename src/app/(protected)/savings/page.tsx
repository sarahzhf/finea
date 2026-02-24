"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getSavingsData, setSavingsData, SavingsData, Goal, Account } from "@/lib/firestore/savings";
import { Target, TrendingUp, Landmark, ArrowLeft, Plus, Trash2, Edit2, Wallet } from "lucide-react";
import Link from "next/link";

export default function SavingsPage() {
    const { user } = useAuth();
    const [data, setData] = useState<SavingsData>({ accounts: [], goals: [] });
    const [loading, setLoading] = useState(true);

    // Editing states
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

    useEffect(() => {
        async function fetchSavings() {
            if (!user) return;
            setLoading(true);
            try {
                const fetchedData = await getSavingsData(user.uid);
                if (fetchedData) {
                    setData({
                        accounts: fetchedData.accounts || [],
                        goals: fetchedData.goals || []
                    });
                }
            } catch (error) {
                console.error("Error fetching savings data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSavings();
    }, [user]);

    const handleSaveData = async (newData: SavingsData) => {
        if (!user) return;
        try {
            await setSavingsData(user.uid, newData);
            setData(newData);
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la mise à jour");
        }
    };

    const saveGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGoal) return;

        let newGoals = [...data.goals];
        if (editingGoal.id) {
            newGoals = newGoals.map(g => g.id === editingGoal.id ? editingGoal : g);
        } else {
            newGoals.push({ ...editingGoal, id: Date.now().toString() });
        }

        await handleSaveData({ ...data, goals: newGoals });
        setIsGoalModalOpen(false);
    };

    const deleteGoal = async (id: string) => {
        if (!confirm("Supprimer cet objectif ?")) return;
        const newGoals = data.goals.filter(g => g.id !== id);
        await handleSaveData({ ...data, goals: newGoals });
    };

    const saveAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAccount) return;

        let newAccounts = [...data.accounts];
        if (editingAccount.id) {
            newAccounts = newAccounts.map(a => a.id === editingAccount.id ? editingAccount : a);
        } else {
            newAccounts.push({ ...editingAccount, id: Date.now().toString() });
        }

        await handleSaveData({ ...data, accounts: newAccounts });
        setIsAccountModalOpen(false);
    };

    const deleteAccount = async (id: string) => {
        if (!confirm("Supprimer ce compte ?")) return;
        const newAccounts = data.accounts.filter(a => a.id !== id);
        await handleSaveData({ ...data, accounts: newAccounts });
    };

    if (loading && data.accounts.length === 0 && data.goals.length === 0) {
        return (
            <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            </div>
        );
    }

    const totalSavings = data.accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    return (
        <div className="space-y-8 pb-20 sm:pb-0">
            <div className="flex items-center space-x-2">
                <Link href="/dashboard" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Mon Épargne</h1>
            </div>

            {/* Patrimoine Total */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 shadow-md text-white">
                <div className="flex items-center space-x-3 opacity-80 mb-2">
                    <Wallet className="h-5 w-5" />
                    <h2 className="text-sm font-medium">Patrimoine total</h2>
                </div>
                <p className="text-3xl font-bold">{totalSavings.toFixed(2)} €</p>
            </div>

            {/* Comptes */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-gray-500" /> Mes Comptes
                    </h2>
                    <button
                        onClick={() => {
                            setEditingAccount({ id: "", name: "", balance: 0 });
                            setIsAccountModalOpen(true);
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full"
                    >
                        <Plus className="h-4 w-4" /> Ajouter
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {data.accounts.length === 0 ? (
                        <p className="text-sm text-gray-500 col-span-full">Aucun compte configuré.</p>
                    ) : (data.accounts.map(acc => {
                        const hasLimit = acc.limit && acc.limit > 0;
                        const fillPercentage = hasLimit ? Math.min((acc.balance / acc.limit!) * 100, 100) : 0;
                        return (
                            <div key={acc.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm relative group">
                                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingAccount(acc); setIsAccountModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-md">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => deleteAccount(acc.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded-md">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <h3 className="font-semibold text-gray-900 truncate pr-16">{acc.name}</h3>
                                <p className="text-2xl font-bold text-blue-700 mt-1">{acc.balance.toFixed(2)} €</p>

                                {acc.returnRate && (
                                    <p className="text-xs font-medium text-emerald-600 mt-1 bg-emerald-50 inline-block px-2 py-0.5 rounded-full">
                                        Taux: {acc.returnRate}%
                                    </p>
                                )}

                                {hasLimit && (
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-500">Plafond: {acc.limit} €</span>
                                            <span className="font-medium text-gray-700">{fillPercentage.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-400 transition-all duration-500" style={{ width: `${fillPercentage}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    }))}
                </div>
            </section>

            {/* Objectifs */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Target className="h-5 w-5 text-gray-500" /> Mes Objectifs
                    </h2>
                    <button
                        onClick={() => {
                            setEditingGoal({ id: "", name: "", targetAmount: 0, currentAmount: 0 });
                            setIsGoalModalOpen(true);
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full"
                    >
                        <Plus className="h-4 w-4" /> Ajouter
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {data.goals.length === 0 ? (
                        <p className="text-sm text-gray-500 col-span-full">Aucun objectif défini.</p>
                    ) : (data.goals.map(goal => {
                        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                        return (
                            <div key={goal.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm relative group">
                                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingGoal(goal); setIsGoalModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-md">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded-md">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <h3 className="font-semibold text-gray-900 truncate pr-16">{goal.name}</h3>

                                <div className="mt-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-bold text-gray-900">{goal.currentAmount.toFixed(2)} €</span>
                                        <span className="text-gray-500">sur {goal.targetAmount.toFixed(2)} €</span>
                                    </div>
                                    <div className="h-3 w-full bg-blue-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs font-semibold text-blue-700">{progress.toFixed(1)}%</p>
                                        {goal.deadline && (
                                            <p className="text-xs text-gray-500">
                                                Cible: {new Date(goal.deadline).toLocaleDateString("fr-FR")}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    }))}
                </div>
            </section>

            {/* Modals/Forms (Simplified inline overlays) */}
            {isGoalModalOpen && editingGoal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <form onSubmit={saveGoal} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">{editingGoal.id ? "Modifier l'objectif" : "Nouvel objectif"}</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet</label>
                            <input type="text" required value={editingGoal.name} onChange={(e) => setEditingGoal({ ...editingGoal, name: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" placeholder="Ex: Voyage au Japon" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cible (€)</label>
                                <input type="number" required min="0" value={editingGoal.targetAmount} onChange={(e) => setEditingGoal({ ...editingGoal, targetAmount: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Déjà épargné (€)</label>
                                <input type="number" required min="0" value={editingGoal.currentAmount} onChange={(e) => setEditingGoal({ ...editingGoal, currentAmount: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date cible (Optionnel)</label>
                            <input type="date" value={editingGoal.deadline ? editingGoal.deadline.split('T')[0] : ''} onChange={(e) => setEditingGoal({ ...editingGoal, deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
                        </div>
                        <div className="flex space-x-3 pt-4">
                            <button type="button" onClick={() => setIsGoalModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200">Annuler</button>
                            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500">Enregistrer</button>
                        </div>
                    </form>
                </div>
            )}

            {isAccountModalOpen && editingAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <form onSubmit={saveAccount} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">{editingAccount.id ? "Modifier le compte" : "Nouveau compte"}</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du compte</label>
                            <input type="text" required value={editingAccount.name} onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" placeholder="Ex: Livret A" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Solde (€)</label>
                            <input type="number" required value={editingAccount.balance} onChange={(e) => setEditingAccount({ ...editingAccount, balance: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plafond (€) <span className="text-xs text-gray-400 font-normal">Optionnel</span></label>
                                <input type="number" min="0" value={editingAccount.limit || ""} onChange={(e) => setEditingAccount({ ...editingAccount, limit: parseFloat(e.target.value) || undefined })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Taux (%) <span className="text-xs text-gray-400 font-normal">Optionnel</span></label>
                                <input type="number" step="0.1" min="0" value={editingAccount.returnRate || ""} onChange={(e) => setEditingAccount({ ...editingAccount, returnRate: parseFloat(e.target.value) || undefined })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
                            </div>
                        </div>
                        <div className="flex space-x-3 pt-4">
                            <button type="button" onClick={() => setIsAccountModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200">Annuler</button>
                            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500">Enregistrer</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
