"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface Transaction {
  label: string;
  date: string;
  amount: number;
  account: string;
  category?: string;
  isUseless?: boolean;
}

interface DashboardCAProps {
  balance?: number;
  monthlyDelta?: number;
  transactions?: Transaction[];
}

export default function DashboardCA({
  balance,
  monthlyDelta,
  transactions,
}: DashboardCAProps) {
  const router = useRouter();

  // Valeurs par défaut (mock) si rien n'est encore connecté à Supabase
  const solde = balance ?? 2450.32;
  const variation = monthlyDelta ?? -128.4;

  const ops: Transaction[] =
    transactions ?? [
      {
        label: "Paiement CB - Carrefour",
        date: "12/11/2025",
        amount: -32.6,
        account: "Compte courant",
        category: "Courses",
      },
      {
        label: "Virement reçu - Salaire",
        date: "10/11/2025",
        amount: 1600,
        account: "Compte courant",
        category: "Revenu",
      },
      {
        label: "Shein",
        date: "07/11/2025",
        amount: -45.9,
        account: "Compte courant",
        category: "Dépense inutile",
        isUseless: true,
      },
    ];

  return (
    <div className="w-full min-h-full bg-[#071A3A] text-white px-4 pt-6 pb-8 rounded-[32px]">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#F5D657]">
            Crédit Agricole
          </h1>
          <p className="text-xs text-gray-300">
            Vue synchronisée de ton compte bancaire
          </p>
        </div>

        <Image
          src="/icons/creditagricole.png"
          alt="Crédit Agricole"
          width={40}
          height={40}
          className="rounded-full shadow-[0_0_18px_rgba(0,0,0,0.5)] bg-white"
        />
      </div>

      {/* SOLDE */}
      <div className="w-full bg-[#0B234C] p-5 rounded-3xl shadow-[0_18px_40px_rgba(0,0,0,0.5)] mb-5 border border-white/10">
        <p className="text-gray-300 text-xs">Solde actuel</p>
        <h2 className="text-3xl font-bold mt-1">
          {solde.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
        </h2>

        <p
          className={`mt-2 text-xs font-semibold ${
            variation >= 0 ? "text-emerald-300" : "text-red-300"
          }`}
        >
          {variation >= 0 ? "+" : ""}
          {variation.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          {" "}
          ce mois-ci
        </p>
      </div>

      {/* BOUTON DOCUMENTS */}
      <button
        onClick={() => router.push("/documents")}
        className="w-full bg-[#F5D657] text-[#071A3A] font-semibold py-3.5 rounded-2xl shadow-[0_14px_30px_rgba(0,0,0,0.4)] hover:scale-[1.02] active:scale-95 transition-transform mb-7 text-sm flex items-center justify-center gap-2"
      >
        <span>📄</span>
        <span>Voir mes documents Crédit Agricole</span>
      </button>

      {/* DERNIÈRES OPÉRATIONS */}
      <h3 className="text-sm font-semibold mb-3">Dernières opérations</h3>

      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
        {ops.map((op, index) => (
          <div
            key={index}
            className="bg-[#0B234C] p-4 rounded-2xl shadow-[0_10px_24px_rgba(0,0,0,0.35)] flex justify-between items-center border border-white/10"
          >
            <div>
              <p className="font-semibold text-sm">{op.label}</p>
              <p className="text-[11px] text-gray-400">
                {op.date} — {op.account}
                {op.category ? ` • ${op.category}` : ""}
              </p>
            </div>

            <p
              className={`text-sm font-bold ${
                op.amount >= 0 ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {op.amount >= 0 ? "+" : ""}
              {op.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
            </p>
          </div>
        ))}

        {ops.length === 0 && (
          <p className="text-xs text-gray-400">
            Aucune opération trouvée pour l'instant. Importe un relevé PDF
            pour commencer l'analyse.
          </p>
        )}
      </div>
    </div>
  );
}
