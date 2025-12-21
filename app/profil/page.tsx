"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, Briefcase, Target, TrendingUp, DollarSign, Edit2, Save, X } from "lucide-react";
import Card3D from "@/app/components/card3d";

// Define the shape of our user profile data
interface UserProfile {
  firstName: string;
  lastName: string;
  job: string;
  financialGoal: string;
  level: string;
  monthlyIncome: number;
}

export default function ProfilPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    job: "",
    financialGoal: "Liberté financière",
    level: "Débutant",
    monthlyIncome: 0
  });

  const displayEmail = user?.email || "";

  // Fetch Data on Load
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Merge existing data with default structure
          setFormData(prev => ({
            ...prev,
            firstName: data.personalInfo?.firstName || "",
            lastName: data.personalInfo?.lastName || "",
            job: data.personalInfo?.job || "",
            financialGoal: data.personalInfo?.financialGoal || data.onboardingReasons?.[0] || "Gérer mon budget",
            level: data.personalInfo?.level || "Intermédiaire",
            monthlyIncome: data.personalInfo?.monthlyIncome || 0
          }));
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "monthlyIncome" ? parseFloat(value) || 0 : value
    }));
  };

  // Save to Firestore
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, {
        personalInfo: formData
      }, { merge: true }); // Merge to not overwrite operations or other data
      
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { name: "Home", route: "/dashboard", icon: "/icons/home.png" },
    { name: "Profil", route: "/profil", icon: "/icons/profil.png" },
    { name: "Réglages", route: "/reglages", icon: "/icons/settings.png" },
  ];

  if (loading) return <div className="min-h-screen bg-[#0A1D37] flex items-center justify-center text-[#F5D657]">Chargement...</div>;

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3 overflow-y-auto">
      
      {/* iPhone frame */}
      <div className="relative w-[390px] min-h-[850px] bg-[#0A1D37] rounded-[40px] shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6 overflow-hidden pb-24">

        {/* Glow */}
        <div className="absolute -top-20 -left-24 w-72 h-72 bg-[#F5D657]/15 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#F5D657]/10 blur-3xl rounded-full pointer-events-none"></div>

        {/* Header */}
        <div className="relative z-10 flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#F5D657]">Profil</h1>
          {!isEditing ? (
             <button 
               onClick={() => setIsEditing(true)}
               className="px-4 py-2 bg-[#F5D657] rounded-full text-[#0A1D37] font-bold hover:bg-[#F5D657]/90 transition-colors flex items-center gap-2 shadow-lg"
             >
               <Edit2 className="w-4 h-4" />
               <span className="text-sm">Modifier</span>
             </button>
          ) : (
            <div className="flex gap-2">
               <button 
                 onClick={() => setIsEditing(false)}
                 className="p-2 bg-red-500/10 rounded-full text-red-400 hover:bg-red-500/20 transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
               <button 
                 onClick={handleSave}
                 disabled={saving}
                 className="p-2 bg-green-500/10 rounded-full text-green-400 hover:bg-green-500/20 transition-colors"
               >
                 {saving ? <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
               </button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="relative z-10 rounded-3xl p-6 mb-8 bg-[#0A1A32] shadow-[8px_8px_18px_#07101F,-8px_-8px_18px_#173A68] flex flex-col items-center">
          <div className="w-24 h-24 rounded-full mb-4 bg-[#0A1A32] shadow-[inset_8px_8px_16px_#07101F,inset_-8px_-8px_16px_#173A68] flex items-center justify-center text-4xl text-[#F5D657]">
            <span className="text-3xl">👤</span>
          </div>
          
          {isEditing ? (
             <div className="flex gap-2 w-full mb-2">
                <input 
                  type="text" 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Prénom"
                  className="w-1/2 bg-[#07101F] text-white p-2 rounded-xl border border-white/10 text-center"
                />
                <input 
                  type="text" 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Nom"
                  className="w-1/2 bg-[#07101F] text-white p-2 rounded-xl border border-white/10 text-center"
                />
             </div>
          ) : (
             <p className="text-[#F5D657] text-xl font-semibold">
               {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}` : "Utilisateur Inconnu"}
             </p>
          )}

          {isEditing ? (
             <input 
               type="text" 
               name="job"
               value={formData.job}
               onChange={handleChange}
               placeholder="Profession (ex: Étudiant)"
               className="w-full bg-[#07101F] text-white/70 p-2 rounded-xl border border-white/10 text-center text-sm"
             />
          ) : (
             <p className="text-[#F5D657]/70 text-sm mt-1">{formData.job || "Profession non renseignée"}</p>
          )}
        </div>

        {/* Credit Card Graphic */}
        <div className="mb-8 scale-90 origin-top">
           <Card3D />
        </div>

        {/* Info Grid */}
        <div className="relative z-10 space-y-4 mb-20">
          
          {/* Email (Read Only) */}
          <div className="p-4 rounded-2xl bg-[#0A1A32] shadow-[8px_8px_20px_#07101F,-8px_-8px_20px_#173A68] flex items-center gap-4">
             <div className="p-3 rounded-full bg-[#0F2B52]"><User className="w-5 h-5 text-[#F5D657]" /></div>
             <div>
                <p className="text-xs text-white/40">Email</p>
                <p className="text-[#F5D657] text-sm font-medium">{displayEmail}</p>
             </div>
          </div>

          {/* Monthly Income */}
          <div className="p-4 rounded-2xl bg-[#0A1A32] shadow-[8px_8px_20px_#07101F,-8px_-8px_20px_#173A68] flex items-center gap-4">
             <div className="p-3 rounded-full bg-[#0F2B52]"><DollarSign className="w-5 h-5 text-green-400" /></div>
             <div className="w-full">
                <p className="text-xs text-white/40">Revenu Mensuel</p>
                {isEditing ? (
                  <input 
                    type="number" 
                    name="monthlyIncome"
                    value={formData.monthlyIncome}
                    onChange={handleChange}
                    className="w-full bg-[#07101F] text-[#F5D657] p-1 rounded-lg border border-white/10"
                  />
                ) : (
                  <p className="text-[#F5D657] text-sm font-medium">{formData.monthlyIncome} €</p>
                )}
             </div>
          </div>

          {/* Financial Goal */}
          <div className="p-4 rounded-2xl bg-[#0A1A32] shadow-[8px_8px_20px_#07101F,-8px_-8px_20px_#173A68] flex items-center gap-4">
             <div className="p-3 rounded-full bg-[#0F2B52]"><Target className="w-5 h-5 text-blue-400" /></div>
             <div className="w-full">
                <p className="text-xs text-white/40">Objectif</p>
                {isEditing ? (
                  <input 
                    type="text" 
                    name="financialGoal"
                    value={formData.financialGoal}
                    onChange={handleChange}
                    className="w-full bg-[#07101F] text-[#F5D657] p-1 rounded-lg border border-white/10"
                  />
                ) : (
                  <p className="text-[#F5D657] text-sm font-medium">{formData.financialGoal}</p>
                )}
             </div>
          </div>

          {/* Level */}
          <div className="p-4 rounded-2xl bg-[#0A1A32] shadow-[8px_8px_20px_#07101F,-8px_-8px_20px_#173A68] flex items-center gap-4">
             <div className="p-3 rounded-full bg-[#0F2B52]"><TrendingUp className="w-5 h-5 text-purple-400" /></div>
             <div className="w-full">
                <p className="text-xs text-white/40">Niveau</p>
                {isEditing ? (
                   <select 
                     name="level"
                     value={formData.level}
                     onChange={handleChange}
                     className="w-full bg-[#07101F] text-[#F5D657] p-1 rounded-lg border border-white/10 text-sm"
                   >
                     <option>Débutant</option>
                     <option>Intermédiaire</option>
                     <option>Expert</option>
                   </select>
                ) : (
                  <p className="text-[#F5D657] text-sm font-medium">{formData.level}</p>
                )}
             </div>
          </div>

        </div>

        {/* Bottom Navigation */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 w-[85%] bg-[#0F2B52] rounded-full px-4 py-3 shadow-[8px_8px_22px_#07101F,-8px_-8px_22px_#173A68] flex justify-between items-center backdrop-blur-md">
          {navItems.map((item) => {
            const active = pathname === item.route;
            const isProfil = item.route === "/profil";

            return (
              <button
                key={item.route}
                onClick={() => router.push(item.route)}
                className={`flex flex-col items-center justify-center transition-all duration-300 ${
                  isProfil ? "w-14 h-14 -mt-6 rounded-full" : "w-12 h-12 rounded-2xl"
                } ${
                  active
                    ? "bg-[#0F2B52] shadow-[inset_6px_6px_12px_#07101F,inset_-6px_-6px_12px_#173A68] scale-110"
                    : "bg-[#0F2B52] shadow-[6px_6px_12px_#07101F,-6px_-6px_12px_#173A68] opacity-75 scale-95"
                }`}
              >
                <img src={item.icon} className={isProfil ? "w-8 h-8" : "w-6 h-6"} />
              </button>
            )
          })}
        </div>

      </div>
    </div>
  );
}
