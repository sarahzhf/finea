"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, FileSpreadsheet } from "lucide-react";

export default function ImportExcelPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parsedItems, setParsedItems] = useState<any[] | null>(null);
  const [result, setResult] = useState<{ count: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;
    setLoading(true);
    setError("");

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'import");

      setParsedItems(data.items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsedItems || !user) return;
    setLoading(true);
    setError("");

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/import/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: parsedItems }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la confirmation");

      setResult({ count: data.count });
      setParsedItems(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-20 sm:pb-0">
      <div className="flex items-center space-x-4">
        <Link href="/expenses" className="text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Import Excel</h1>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        {!result ? (
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FileSpreadsheet className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3 flex-1 md:flex md:justify-between">
                  <p className="text-sm text-blue-700">
                    Format attendu : Fichier .xlsx ou .csv avec les colonnes Date, Description, Montant, Catégorie.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900">Fichier Excel ou CSV</label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                  <div className="mt-4 flex text-sm leading-6 text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                    >
                      <span>Sélectionner un fichier</span>
                      <input id="file-upload" name="file-upload" type="file" accept=".xlsx, .xls, .csv" className="sr-only" onChange={handleFileChange} />
                    </label>
                    <p className="pl-1">ou glisser-déposer</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-600">
                    {file ? file.name : "XLSX ou CSV jusqu'à 5 MB"}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "Analyse en cours..." : "Analyser le fichier"}
            </button>
          </form>
        ) : parsedItems ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Aperçu avant import</h2>
              <p className="mt-1 text-sm text-gray-500">
                {parsedItems.length} opérations détectées. Voici les 10 premières :
              </p>
            </div>

            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Montant</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Catégorie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {parsedItems.slice(0, 10).map((item, idx) => (
                    <tr key={idx}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500">
                        {new Date(item.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 truncate max-w-[150px]">
                        {item.description}
                      </td>
                      <td className={`whitespace-nowrap px-3 py-4 text-sm font-medium ${item.amount < 0 ? 'text-gray-900' : 'text-green-600'}`}>
                        {item.amount.toFixed(2)} €
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {item.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setParsedItems(null)}
                className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
              >
                {loading ? "Import en cours..." : `Confirmer (${parsedItems.length})`}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4 py-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Import réussi !</h2>
            <p className="text-gray-600">
              {result.count} opérations ont été ajoutées ou mises à jour depuis votre fichier.
            </p>
            <div className="pt-4">
              <Link
                href="/expenses"
                className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
              >
                Retour aux dépenses
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
