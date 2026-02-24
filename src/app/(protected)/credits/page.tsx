"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getCredits, addCredit, deleteCredit, Credit } from "@/lib/firestore/credits";
import { Plus, CreditCard, Percent, ArrowRight, Trash2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreditsPage() {
    const { user } = useAuth();
    const [credits, setCredits] = useState<Credit[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAdding, setIsAdding] = useState(false);
    const [newCredit, setNewCredit] = useState<Partial<Credit>>({
        name: "",
        totalAmount: 0,
        paidAmount: 0,
        interestRate: 0,
    });

    const loadCredits = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getCredits(user.uid);
            setCredits(data);
        } catch (error) {
            console.error("Error loading credits", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCredits();
    }, [user]);

    const handleAddCredit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!newCredit.name || newCredit.totalAmount === undefined) return;

        try {
            await addCredit(user.uid, newCredit as Credit);
            setIsAdding(false);
            setNewCredit({ name: "", totalAmount: 0, paidAmount: 0, interestRate: 0 });
            await loadCredits();
        } catch (error) {
            console.error("Error adding credit", error);
            alert("Erreur lors de l'ajout du crédit");
        }
    };

    const handleDelete = async (id?: string) => {
        if (!id || !user) return;
        if (!confirm("Supprimer ce crédit ?")) return;
        try {
            await deleteCredit(user.uid, id);
            await loadCredits();
        } catch (error) {
            console.error("Error deleting credit", error);
        }
    };

    const totalBorrowed = credits.reduce((acc, c) => acc + c.totalAmount, 0);
    const totalPaid = credits.reduce((acc, c) => acc + c.paidAmount, 0);
    const totalRemaining = totalBorrowed - totalPaid;

    // Average interest rate weighted by remaining amount
    const weightedSum = credits.reduce((acc, c) => acc + (c.interestRate * (c.totalAmount - c.paidAmount)), 0);
    const averageRate = totalRemaining > 0 ? (weightedSum / totalRemaining) : 0;
    const globalProgress = totalBorrowed > 0 ? (totalPaid / totalBorrowed) * 100 : 0;

    return (
        <div className="space-y-6 pb-20 sm:pb-0">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Crédits</h1>
                    <p className="text-sm text-gray-500">Suivez vos remboursements</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Nouveau Crédit</span>
                </button>
            </div>

            {/* Total Recap */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-blue-100 bg-blue-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Restant à payer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{totalRemaining.toFixed(2)} €</div>
                        <p className="text-xs text-gray-500 mt-1">Sur {totalBorrowed.toFixed(2)} € empruntés</p>
                    </CardContent>
                </Card>

                <Card className="border-green-100 bg-green-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total remboursé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">{totalPaid.toFixed(2)} €</div>
                        <div className="mt-2 h-1.5 w-full bg-green-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${Math.min(globalProgress, 100)}%` }} />
                        </div>
                        <p className="text-xs text-green-800 mt-1">{globalProgress.toFixed(1)}% remboursé</p>
                    </CardContent>
                </Card>

                <Card className="border-orange-100 bg-orange-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Taux moyen pondéré</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-700">{averageRate.toFixed(2)} %</div>
                        <p className="text-xs text-orange-800 mt-1">Sur le capital restant</p>
                    </CardContent>
                </Card>
            </div>

            {/* Add Credit Form Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Ajouter un crédit</h2>
                        <form onSubmit={handleAddCredit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nom du crédit</label>
                                <input
                                    required
                                    type="text"
                                    value={newCredit.name}
                                    placeholder="Ex: Prêt étudiant, Crédit Auto..."
                                    onChange={(e) => setNewCredit({ ...newCredit, name: e.target.value })}
                                    className="mt-1 w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Emprunt total (€)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={newCredit.totalAmount || ""}
                                        onChange={(e) => setNewCredit({ ...newCredit, totalAmount: parseFloat(e.target.value) || 0 })}
                                        className="mt-1 w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Déjà remboursé (€)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={newCredit.paidAmount || ""}
                                        onChange={(e) => setNewCredit({ ...newCredit, paidAmount: parseFloat(e.target.value) || 0 })}
                                        className="mt-1 w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">Taux d'intérêt (%)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    value={newCredit.interestRate || ""}
                                    onChange={(e) => setNewCredit({ ...newCredit, interestRate: parseFloat(e.target.value) || 0 })}
                                    className="mt-1 w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                                />
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Credits List */}
            <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <span>Mes Crédits</span>
            </h2>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                </div>
            ) : credits.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                    <p className="text-sm text-gray-500">Aucun crédit enregistré.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {credits.map((credit) => {
                        const remaining = credit.totalAmount - credit.paidAmount;
                        const progress = (credit.paidAmount / credit.totalAmount) * 100;
                        const isDone = remaining <= 0;

                        return (
                            <Card key={credit.id} className="relative overflow-hidden group hover:border-blue-200 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            {credit.name}
                                            {isDone && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                        </CardTitle>
                                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                            <Percent className="h-3 w-3" /> {credit.interestRate.toFixed(2)}%
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(credit.id)}
                                        className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <span className="text-sm text-gray-600">Restant</span>
                                        <span className="text-lg font-bold text-gray-900">{remaining > 0 ? remaining.toFixed(2) : "0.00"} €</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-1">
                                        <div
                                            className={`h-full ${isDone ? 'bg-green-500' : 'bg-blue-600'}`}
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Remboursé: {credit.paidAmount.toFixed(2)} €</span>
                                        <span>{progress.toFixed(1)}%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
