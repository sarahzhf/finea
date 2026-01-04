"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      console.error("Login error:", err);
      // Simplify error messages for user
      if (err.code === 'auth/invalid-credential') {
         setError("Email ou mot de passe incorrect.");
      } else {
         setError("Une erreur est survenue lors de la connexion.");
      }
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-[#253745] via-[#4A5C6A] to-[#11212D] flex items-center justify-center p-4">
      
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#F5D657]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#4A5C6A]/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] z-10 transition-all hover:border-[#F5D657]/30">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#F5D657] mb-2 tracking-tight">FINÉA</h1>
          <p className="text-white/70 font-medium">Bon retour parmi nous !</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-200 text-sm">
              <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          
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
                placeholder="Votre mot de passe"
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
            <div className="flex justify-end">
              <button type="button" className="text-xs text-[#F5D657]/80 hover:text-[#F5D657] transition-colors">
                Mot de passe oublié ?
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#F5D657] hover:bg-[#F5D657]/90 text-black font-bold rounded-2xl shadow-[0_4px_20px_rgba(245,214,87,0.25)] transition-all hover:transform hover:scale-[1.02] active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#3FA2F6]/0 px-2 text-white/40 backdrop-blur-sm">Ou continuer avec</span>
          </div>
        </div>

        {/* Social / Sign Up */}
        <div className="text-center">
          <p className="text-white/60 text-sm">
            Pas encore de compte ?{" "}
            <button 
              onClick={() => router.push("/signup")}
              className="text-[#F5D657] font-semibold hover:underline"
            >
              Créer un compte
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
