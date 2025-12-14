"use client";

import { useState } from "react";

export default function DocumentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bank", "CA");

    setStatus("Import en cours...");

    const res = await fetch("/api/excel/import", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || "Erreur");
    } else {
      setStatus(`✅ ${data.imported} transactions importées`);
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#050A14] px-6 py-8 text-white">
      <h1 className="text-2xl font-bold mb-6">Documents bancaires</h1>

      <input
        type="file"
        accept=".xlsx"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="mb-4 text-sm"
      />

      <button
        onClick={handleUpload}
        className="w-full py-3 rounded-xl bg-[#F5D657] text-black font-semibold"
      >
        Importer Excel Crédit Agricole
      </button>

      {status && <p className="mt-4 text-sm text-white/80">{status}</p>}
    </div>
  );
}