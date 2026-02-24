"use client";

import { useState } from "react";
import { signUpWithEmail } from "@/lib/auth/helpers";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { user } = await signUpWithEmail(email, password);
      // Create user document in Firestore directly on registration
      await setDoc(doc(firestore, "users", user.uid), {
        email: user.email,
        createdAt: new Date().toISOString(),
        onboardingComplete: false,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-sm">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Inscription
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              connectez-vous à votre compte existant
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="sr-only">Adresse email</label>
              <input
                type="email"
                required
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="sr-only">Mot de passe</label>
              <input
                type="password"
                required
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                placeholder="Mot de passe (min 6 caractères)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {loading ? "Création..." : "Créer le compte"}
            </button>
          </div>
        </form >
      </div >
    </div >
  );
}
