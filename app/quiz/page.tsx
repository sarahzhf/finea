"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TAG_OPTIONS = [
  { id: "budget", label: "Budget" },
  { id: "depenses", label: "Dépenses" },
  { id: "revenus", label: "Revenus" },
  { id: "epargne", label: "Épargne" },
  { id: "precaution", label: "Épargne de précaution" },
  { id: "credit", label: "Crédit" },
  { id: "investissement", label: "Investissement" },
];

export default function QuizIndexPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  async function start() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("count", "10");
      if (selectedTags.length > 0) {
        qs.set("tags", selectedTags.join(","));
      }

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${origin}/api/quiz/start?${qs.toString()}`);

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error("API did not return valid JSON");
      }

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to start quiz");
      }

      const sessionId = data?.progress?.sessionId;
      if (!sessionId || typeof sessionId !== "string") {
        console.error("Invalid start response", data);
        throw new Error("Session ID invalide (quiz non initialisé)");
      }

      router.push(`/quiz/${encodeURIComponent(sessionId)}`);
    } catch (e: any) {
      alert(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#050A14] flex justify-center items-start py-8 px-3">
      <div className="w-[390px] min-h-[780px] bg-[#0B1C33] rounded-[40px] shadow-[0_0_40px_rgba(0,0,0,0.6)] border border-white/10 p-6 text-white">
        <h1 className="text-xl font-semibold tracking-wide mb-2">Quiz</h1>
        <p className="text-white/70 text-sm mb-6">
          Teste tes connaissances et gagne des points.
        </p>

        <label className="block text-sm text-white/80 mb-2">Filtrer par thème (optionnel)</label>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {TAG_OPTIONS.map((tag) => (
            <label key={tag.id} className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={selectedTags.includes(tag.id)}
                onChange={() => {
                  setSelectedTags((prev) =>
                    prev.includes(tag.id) ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
                  );
                }}
              />
              {tag.label}
            </label>
          ))}
        </div>

        <button
          onClick={start}
          disabled={loading}
          className="w-full rounded-2xl py-4 bg-[#E6D27A] text-[#0B1C33] font-semibold shadow-[0_8px_24px_rgba(230,210,122,0.35)] disabled:opacity-60"
        >
          {loading ? "Démarrage..." : "Démarrer une session (10 questions)"}
        </button>
        <p className="text-xs text-white/50 mt-3">
          Mode adaptatif activé : la difficulté s’ajuste à ton niveau estimé par thème.
        </p>
      </div>
    </div>
  );
}
