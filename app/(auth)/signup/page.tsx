"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// ... existing imports

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password Security Check
  const isSecure = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);

  const reasons = [
    { id: "budget", label: "Gérer mon budget", icon: "💰" },
    { id: "learning", label: "Apprendre la finance", icon: "🧠" },
    { id: "savings", label: "Épargner pour un projet", icon: "🐷" },
    { id: "debts", label: "Rembourser mes dettes", icon: "📉" },
    { id: "scanner", label: "Scanner mes factures", icon: "📄" },
    { id: "invest", label: "Investir mon argent", icon: "📈" },
  ];

  const handleReasonToggle = (id: string) => {
    if (selectedReasons.includes(id)) {
      setSelectedReasons(selectedReasons.filter(r => r !== id));
    } else {
      setSelectedReasons([...selectedReasons, id]);
    }
  };

  const handleNext = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    
    if (step === 1) {
      if (email && password && isSecure) setStep(2);
    } else {
      // Submit
      setLoading(true);
      try {
        // 1. Create User in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Create User Document in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          createdAt: new Date(),
          onboardingReasons: selectedReasons,
          // Default user settings can go here
          settings: {
             currency: "EUR",
             theme: "dark"
          }
        });

        // 3. Redirect
        router.push("/dashboard");
      } catch (err: any) {
        console.error("Signup error:", err);
        setError(err.message || "Une erreur est survenue lors de l'inscription.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#253745] via-[#4A5C6A] to-[#11212D] flex items-center justify-center p-4">
      
      {/* Glow Effects */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#F5D657]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#4A5C6A]/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] z-10"
      >
        
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => step === 2 ? setStep(1) : router.push("/login")}
            className="flex items-center text-white/50 hover:text-white mb-4 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {step === 2 ? "Retour" : "Connexion"}
          </button>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Créer un compte</h1>
              <p className="text-white/60 text-sm">
                {step === 1 ? "Commencez votre voyage financier" : "Personnalisons votre expérience"}
              </p>
            </div>
            <div className="text-[#F5D657] font-bold text-xl opacity-50">
              {step}/2
            </div>
          </div>
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-200 text-sm">
               <span>⚠️</span> {error}
            </div>
          )}

          {/* Progress Bar */}
          <div className="w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
            <motion.div 
              className="h-full bg-[#F5D657]"
              initial={{ width: "50%" }}
              animate={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
        </div>

        <form onSubmit={handleNext}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium ml-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 group-focus-within:text-[#F5D657] transition-colors" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemple@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-[#F5D657]/50 focus:bg-white/10 transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium ml-1">Mot de passe</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 group-focus-within:text-[#F5D657] transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Créez un mot de passe sécurisé"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-[#F5D657]/50 focus:bg-white/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Security Indicators */}
                  <div className="flex gap-2 mt-2">
                    <div className={`h-1 flex-1 rounded-full transition-all ${password.length >= 8 ? 'bg-[#F5D657]' : 'bg-white/10'}`} />
                    <div className={`h-1 flex-1 rounded-full transition-all ${/[A-Z]/.test(password) ? 'bg-[#F5D657]' : 'bg-white/10'}`} />
                    <div className={`h-1 flex-1 rounded-full transition-all ${/[0-9]/.test(password) ? 'bg-[#F5D657]' : 'bg-white/10'}`} />
                  </div>
                  <p className="text-xs text-white/40 ml-1">
                    8+ caractères • Majuscule • Chiffre
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!email || !password || !isSecure}
                  className="w-full py-4 bg-[#F5D657] hover:bg-[#F5D657]/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-2xl shadow-[0_4px_20px_rgba(245,214,87,0.25)] transition-all mt-4 flex items-center justify-center gap-2 group"
                >
                  Continuer <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="text-white/80 text-lg font-medium block mb-4">
                    Pourquoi souhaitez-vous utiliser Finéa ?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {reasons.map((reason) => (
                      <button
                        key={reason.id}
                        type="button"
                        onClick={() => handleReasonToggle(reason.id)}
                        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                          selectedReasons.includes(reason.id)
                            ? "bg-[#F5D657]/20 border-[#F5D657] text-white"
                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-2xl mb-2 block">{reason.icon}</span>
                        <span className="text-sm font-semibold">{reason.label}</span>
                        {selectedReasons.includes(reason.id) && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-[#F5D657] rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-black" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleNext()}
                  disabled={selectedReasons.length === 0 || loading}
                  className="w-full py-4 bg-[#F5D657] hover:bg-[#F5D657]/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-2xl shadow-[0_4px_20px_rgba(245,214,87,0.25)] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    "Créer mon compte"
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}
