import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Target, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-gray-900">
      {/* Hero Section */}
      <header className="px-6 py-8 sm:px-12">
        <div className="flex items-center space-x-2">
          <div className="rounded-xl bg-blue-600 p-2 text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">Finéa</span>
        </div>
      </header>

      <main className="flex-1 px-6 sm:px-12">
        <div className="mx-auto max-w-4xl pt-12 text-center sm:pt-20">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Prenez le contrôle de votre <span className="text-blue-600">avenir financier</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl">
            L'assistant intelligent qui aide les étudiants et jeunes actifs à épargner sereinement,
            maîtriser leurs dépenses et simuler leur avenir.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
            <Link
              href="/register"
              className="w-full rounded-2xl bg-blue-600 px-8 py-4 text-center text-lg font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-500 hover:shadow-xl sm:w-auto"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/login"
              className="w-full rounded-2xl border-2 border-gray-100 bg-white px-8 py-4 text-center text-lg font-semibold text-gray-900 transition-all hover:border-blue-100 hover:bg-gray-50 sm:w-auto"
            >
              Se connecter
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mx-auto mt-24 max-w-5xl pb-24">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Objectifs Zen</h3>
              <p className="mt-2 text-gray-600">Définissez vos buts et laissez l'IA tracer le chemin le plus court.</p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Copilote IA</h3>
              <p className="mt-2 text-gray-600">Simulations Monte Carlo pour anticiper les imprévus avec brio.</p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Sécurité Maximale</h3>
              <p className="mt-2 text-gray-600">Vos données sont protégées par les standards bancaires les plus élevés.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-12 text-center text-sm text-gray-400">
        <p>© 2026 Finéa - Conçu pour la nouvelle génération.</p>
      </footer>
    </div>
  );
}
