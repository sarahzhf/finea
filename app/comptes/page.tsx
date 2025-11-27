

"use client";

export default function ComptesPage() {
  return (
    <div className="min-h-screen w-full bg-[#050A16] text-white px-4 py-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-[#F5D657]">Comptes et Portefeuilles</h1>
      </div>

      {/* SOLDE ACTUEL */}
      <div className="mb-6">
        <p className="text-sm text-gray-400">Solde actuel</p>
        <h2 className="text-4xl font-bold text-[#F5D657] mt-1">8,94 €</h2>

        <div className="mt-3 bg-white/5 backdrop-blur-xl rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.55),_-8px_-8px_20px_rgba(255,255,255,0.04)]">
          <p className="text-base">Tous les comptes</p>
          <p className="text-xl font-semibold mt-1">12,93 €</p>
        </div>
      </div>

      {/* POCKETS */}
      <div className="mb-8">
        <p className="uppercase text-gray-400 text-xs mb-3">Pockets</p>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.55),_-8px_-8px_20px_rgba(255,255,255,0.04)] flex justify-between items-center">
          <div>
            <p className="text-base">Sources</p>
            <p className="text-sm text-gray-400">0 €</p>
          </div>
        </div>
      </div>

      {/* OPTIONS */}
      <div className="space-y-4">

        {/* ÉPARGNE */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.55),_-8px_-8px_20px_rgba(255,255,255,0.04)] flex justify-between items-center">
          <div>
            <p className="text-base font-semibold">Épargne</p>
            <p className="text-sm text-gray-400">Gagnez du rendement sur votre argent.</p>
          </div>
          <button className="px-4 py-2 rounded-full bg-[#0A1A32] text-[#F5D657] text-xs shadow-[6px_6px_14px_#07101F,-6px_-6px_14px_#173A68] active:scale-95 transition-all">
            Découvrir
          </button>
        </div>

        {/* PRÊT PERSONNEL */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.55),_-8px_-8px_20px_rgba(255,255,255,0.04)] flex justify-between items-center">
          <div>
            <p className="text-base font-semibold">Prêt/crédit</p>
            <p className="text-sm text-gray-400">Jusqu'à 50 000 €</p>
          </div>
          <button className="px-4 py-2 rounded-full bg-[#0A1A32] text-[#F5D657] text-xs shadow-[6px_6px_14px_#07101F,-6px_-6px_14px_#173A68] active:scale-95 transition-all">
            Découvrir
          </button>
        </div>

        {/* COMPTE JOINT */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.55),_-8px_-8px_20px_rgba(255,255,255,0.04)] flex justify-between items-center">
          <div>
            <p className="text-base font-semibold">Compte joint</p>
            <p className="text-sm text-gray-400">Pour tous les types de duos.</p>
          </div>
          <button className="px-4 py-2 rounded-full bg-[#0A1A32] text-[#F5D657] text-xs shadow-[6px_6px_14px_#07101F,-6px_-6px_14px_#173A68] active:scale-95 transition-all">
            Découvrir
          </button>
        </div>

        {/* PRO */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.55),_-8px_-8px_20px_rgba(255,255,255,0.04)] flex justify-between items-center">
          <div>
            <p className="text-base font-semibold">Pro</p>
            <p className="text-sm text-gray-400">Pour les professionnels.</p>
          </div>
          <button className="px-4 py-2 rounded-full bg-[#0A1A32] text-[#F5D657] text-xs shadow-[6px_6px_14px_#07101F,-6px_-6px_14px_#173A68] active:scale-95 transition-all">
            Découvrir
          </button>
        </div>

      </div>

      {/* AJOUTER */}
      <div className="mt-10 flex justify-center">
        <button className="px-6 py-3 rounded-full bg-white text-black text-base font-semibold shadow-lg active:scale-95 transition-all">
          + Ajouter
        </button>
      </div>

    </div>
  );
}