"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { addExpense } from "@/lib/firestore/operations";
import { useRouter } from "next/navigation";
import { Camera, UploadCloud, CheckCircle2, ArrowLeft, Loader2, ScanLine } from "lucide-react";
import Link from "next/link";

const CATEGORIES = ["Alimentation", "Logement", "Transports", "Loisirs", "Santé", "Abonnements", "Autre"];

export default function ScanPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleScan = async () => {
        if (!file || !user) return;
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/ocr", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Clean up missing data if OCR failed partially
            setResult({
                ...data,
                merchant: data.merchant || "Inconnu",
                amount: data.amount || 0,
                category: CATEGORIES.includes(data.category) ? data.category : "Autre",
                date: data.date || new Date().toISOString()
            });
        } catch (err: any) {
            alert("Erreur de scan : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!result || !user) return;
        setLoading(true);
        try {
            await addExpense(user.uid, {
                description: result.merchant,
                amount: -Math.abs(result.amount),
                category: result.category,
                date: result.date,
            });
            router.push("/expenses");
        } catch (error) {
            alert("Erreur lors de l'enregistrement");
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-lg space-y-6 pb-20 sm:pb-0">
            <div className="flex items-center space-x-2">
                <Link href="/dashboard" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Scanner un ticket</h1>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                {!result ? (
                    <div className="space-y-6">
                        <div className="relative flex justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-12 overflow-hidden bg-gray-50 min-h-[250px] items-center">
                            {loading && (
                                <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-pulse">
                                    <ScanLine className="h-12 w-12 text-blue-600 mb-4 animate-bounce" />
                                    <span className="text-sm font-medium text-blue-600">Lecture par l'IA en cours...</span>
                                </div>
                            )}

                            {file ? (
                                <div className="text-center relative z-0 flex flex-col items-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={URL.createObjectURL(file)} alt="Preview" className="max-h-48 max-w-full rounded-lg shadow-sm border border-gray-200 mb-4 object-contain" />
                                    <div className="flex text-sm leading-6 justify-center">
                                        <label className="relative cursor-pointer rounded-full bg-white px-4 py-1.5 font-semibold text-blue-600 hover:bg-blue-50 ring-1 ring-blue-600/20 transition-colors shadow-sm">
                                            <span>Changer la photo</span>
                                            <input type="file" className="sr-only" accept="image/*" capture="environment" onChange={handleFileChange} disabled={loading} />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center relative z-0">
                                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="mt-4 flex text-sm leading-6 justify-center">
                                        <label className="relative cursor-pointer rounded-full bg-blue-50 px-4 py-2 font-semibold text-blue-600 hover:bg-blue-100 transition-colors">
                                            <span>Prendre une photo ou choisir</span>
                                            <input type="file" className="sr-only" accept="image/*" capture="environment" onChange={handleFileChange} disabled={loading} />
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleScan}
                            disabled={loading || !file}
                            className="w-full flex items-center justify-center space-x-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition-colors"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                            <span>{loading ? "Analyse en cours..." : "Analyser"}</span>
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="flex items-center space-x-3 text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                            <CheckCircle2 className="h-6 w-6" />
                            <h2 className="text-sm font-medium">Analyse réussie. Vérifiez les informations.</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Montant détecté (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={result.amount}
                                    onChange={(e) => setResult({ ...result, amount: parseFloat(e.target.value) || 0 })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Commerçant</label>
                                <input
                                    type="text"
                                    required
                                    value={result.merchant}
                                    onChange={(e) => setResult({ ...result, merchant: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                                <select
                                    value={result.category}
                                    onChange={(e) => setResult({ ...result, category: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={result.date.split('T')[0]}
                                    onChange={(e) => setResult({ ...result, date: new Date(e.target.value).toISOString() })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-4 pt-2">
                            <button
                                type="button"
                                onClick={() => setResult(null)}
                                className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                                disabled={loading}
                            >
                                Réessayer
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex justify-center items-center space-x-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                            >
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                <span>{loading ? "Sauvegarde..." : "Valider et Sauver"}</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
