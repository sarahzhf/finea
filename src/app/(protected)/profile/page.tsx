"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { logOut } from "@/lib/auth/helpers";
import { useRouter } from "next/navigation";
import { User, Settings, FileText, Shield, LogOut, ChevronRight, HelpCircle, X, Save, Edit2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getUserProfile, setUserProfile, UserProfile } from "@/lib/firestore/profile";

export default function ProfilePage() {
    const { user } = useAuth();
    const router = useRouter();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCGUOpen, setIsCGUOpen] = useState(false);
    const [isRGPDOpen, setIsRGPDOpen] = useState(false);

    const [profile, setProfile] = useState<UserProfile>({
        firstName: "",
        lastName: "",
        job: "",
        financialGoal: "",
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && isSettingsOpen) {
            loadProfile();
        }
    }, [user, isSettingsOpen]);

    const loadProfile = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getUserProfile(user.uid);
            setProfile(data);
        } catch (e) {
            console.error("Error loading profile", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await setUserProfile(user.uid, profile);
            setIsEditing(false);
        } catch (e) {
            console.error("Error saving profile", e);
            alert("Erreur lors de la sauvegarde");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logOut();
        router.push("/login");
    };

    const menuItems = [
        { icon: Settings, label: "Paramètres du compte", onClick: () => setIsSettingsOpen(true), color: "text-gray-500" },
        { icon: HelpCircle, label: "Tutoriel d'utilisation", href: "#", color: "text-blue-500" },
        { icon: FileText, label: "Conditions Générales d'Utilisation", onClick: () => setIsCGUOpen(true), color: "text-gray-500" },
        { icon: Shield, label: "Politique de confidentialité (RGPD)", onClick: () => setIsRGPDOpen(true), color: "text-green-500" },
    ];

    return (
        <div className="mx-auto max-w-lg space-y-6 pb-20 sm:pb-0">
            <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <User className="h-8 w-8" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900">
                        {profile.firstName || profile.lastName ? `${profile.firstName} ${profile.lastName}` : (user?.displayName || "Utilisateur Finéa")}
                    </h2>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <span className="mt-1 inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Compte actif
                    </span>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
                <ul className="divide-y divide-gray-100">
                    {menuItems.map((item, idx) => (
                        <li key={idx}>
                            <button
                                onClick={item.onClick}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`rounded-lg p-2 bg-gray-50 ${item.color}`}>
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{item.label}</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-red-50 p-4 font-semibold text-red-600 hover:bg-red-100 transition-colors"
            >
                <LogOut className="h-5 w-5" />
                <span>Se déconnecter</span>
            </button>

            <div className="text-center mt-8">
                <p className="text-xs text-gray-400">Finéa v1.0.0 (MVP)</p>
            </div>

            {/* Modal Paramètres du compte */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Paramètres du compte</h2>
                            <button onClick={() => { setIsSettingsOpen(false); setIsEditing(false); }} className="rounded-full p-1 hover:bg-gray-100">
                                <X className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Email (Lecture seule)</label>
                                <input
                                    type="text"
                                    value={user?.email || ""}
                                    disabled
                                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Prénom</label>
                                    <input
                                        type="text"
                                        value={profile.firstName}
                                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                        disabled={!isEditing}
                                        className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</label>
                                    <input
                                        type="text"
                                        value={profile.lastName}
                                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                        disabled={!isEditing}
                                        className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50/50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Métier / Études</label>
                                <input
                                    type="text"
                                    value={profile.job}
                                    onChange={(e) => setProfile({ ...profile, job: e.target.value })}
                                    disabled={!isEditing}
                                    placeholder="Ex: Étudiant en alternance"
                                    className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50/50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Revenu Mensuel Net (€)</label>
                                <input
                                    type="number"
                                    value={profile.monthlyIncome || ""}
                                    onChange={(e) => setProfile({ ...profile, monthlyIncome: parseFloat(e.target.value) || 0 })}
                                    disabled={!isEditing}
                                    placeholder="Ex: 2000"
                                    className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50/50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Objectif financier principal</label>
                                <textarea
                                    value={profile.financialGoal}
                                    onChange={(e) => setProfile({ ...profile, financialGoal: e.target.value })}
                                    disabled={!isEditing}
                                    placeholder="Ex: Apport de 10k pour un premier appartement"
                                    className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50/50 h-20 resize-none"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                                >
                                    <Edit2 className="h-4 w-4" />
                                    Modifier
                                </button>
                            ) : (
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={loading}
                                    className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4" />
                                    {loading ? "Sauvegarde..." : "Enregistrer"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal CGU */}
            {isCGUOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl h-[80vh] rounded-2xl bg-white flex flex-col shadow-xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">Conditions Générales d'Utilisation</h2>
                            <button onClick={() => setIsCGUOpen(false)} className="rounded-full p-1 hover:bg-gray-100">
                                <X className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none text-gray-700">
                            <h3>1. Objet</h3>
                            <p>Les présentes CGU ont pour objet de définir les modalités de mise à disposition de l'application Finéa...</p>
                            <h3>2. Description des services</h3>
                            <p>Finéa propose un service de coaching financier basé sur l'IA, incluant le suivi de budget, des simulations et des quiz éducatifs.</p>
                            <h3>3. Accès au service</h3>
                            <p>L'accès à l'application nécessite la création d'un compte utilisateur via Firebase Authentication.</p>
                            <h3>4. Propriété intellectuelle</h3>
                            <p>L'ensemble du contenu de l'application est la propriété exclusive de Finéa.</p>
                            <p className="mt-8 italic text-gray-400">Ceci est un exemple de texte pour le MVP.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal RGPD */}
            {isRGPDOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl h-[80vh] rounded-2xl bg-white flex flex-col shadow-xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">Politique de confidentialité (RGPD)</h2>
                            <button onClick={() => setIsRGPDOpen(false)} className="rounded-full p-1 hover:bg-gray-100">
                                <X className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none text-gray-700">
                            <h3>1. Collecte des données</h3>
                            <p>Nous collectons les données suivantes : email, nom, prénom, profession, informations financières saisies par l'utilisateur.</p>
                            <h3>2. Utilisation des données</h3>
                            <p>Vos données sont utilisées exclusivement pour fournir les services de coaching personnalisé et améliorer l'expérience utilisateur.</p>
                            <h3>3. Conservation des données</h3>
                            <p>Les données sont conservées sur les serveurs sécurisés de Google Cloud Platform (Firebase) tant que votre compte est actif.</p>
                            <h3>4. Vos droits</h3>
                            <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.</p>
                            <p className="mt-8 italic text-gray-400">Ceci est un exemple de texte pour le MVP.</p>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
