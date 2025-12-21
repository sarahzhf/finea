"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseOperationsExcel, Operation } from "@/lib/excelParser";
import { doc, collection, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { ArrowLeft, Upload, Check, AlertCircle } from "lucide-react";

export default function ImportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
      setLoading(true);

      try {
        const ops = await parseOperationsExcel(selectedFile);
        setOperations(ops);
      } catch (err: any) {
        console.error(err);
        setError("Erreur lors de la lecture du fichier. Assurez-vous qu'il s'agit d'un fichier Excel valide (.xlsx).");
        setFile(null);
      } finally {
        setLoading(false);
      }
    }
  };

  // Save to Firestore
  const handleSave = async () => {
    if (!user || operations.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Use batch writes for standard operations (limit is 500, so we chunk it)
      const batchSize = 450;
      const chunks = [];
      for (let i = 0; i < operations.length; i += batchSize) {
        chunks.push(operations.slice(i, i + batchSize));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((op) => {
          // Create a new document in 'operations' subcollection
          // We can use originalId as doc ID to prevent duplicates
          const opRef = doc(db, "users", user.uid, "operations", op.originalId);
          batch.set(opRef, op);
        });
        await batch.commit();
      }

      setSuccess(true);
      setTimeout(() => {
         router.push("/dashboard");
      }, 2000);

    } catch (err: any) {
      console.error(err);
      // Show specific error message if available, specifically for permissions or invalid IDs
      const errorMessage = err?.message || "Erreur inconnue";
      if (errorMessage.includes("permission-denied")) {
         setError("Erreur de permissions. Vérifiez les règles de sécurité Firestore.");
      } else if (errorMessage.includes("invalid-argument")) {
         setError("Erreur de données (ID invalide ou champ manquant).");
      } else {
         setError(`Erreur lors de la sauvegarde : ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex flex-col items-center p-6 pb-24">
      {/* Header */}
      <div className="w-full max-w-lg mb-8 flex items-center">
        <button 
           onClick={() => router.back()}
           className="p-2 bg-white/5 rounded-xl text-white/70 hover:text-white mr-4"
        >
           <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-[#F5D657]">Import Données</h1>
      </div>

      <div className="w-full max-w-lg space-y-6">
        
        {/* Drop Zone */}
        {!file && (
          <div className="w-full h-64 border-2 border-dashed border-white/20 rounded-3xl bg-white/5 flex flex-col items-center justify-center p-6 text-center transition-all hover:border-[#F5D657]/50 hover:bg-white/10 group cursor-pointer relative">
            <input 
              type="file" 
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-16 h-16 bg-[#F5D657]/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <Upload className="w-8 h-8 text-[#F5D657]" />
            </div>
            <p className="text-white font-medium mb-1">Cliquez ou glissez votre fichier Excel ici</p>
            <p className="text-white/40 text-sm">Format supporté : .xlsx</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
           <div className="flex flex-col items-center py-10">
              <div className="w-8 h-8 border-4 border-[#F5D657]/30 border-t-[#F5D657] rounded-full animate-spin mb-4"></div>
              <p className="text-white/60">Traitement en cours...</p>
           </div>
        )}

        {/* File Analysis Success */}
        {document && file && !loading && !success && (
          <div className="bg-[#0F2B52] rounded-3xl p-6 shadow-xl border border-white/10 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex justify-between items-center mb-6">
                <div>
                   <h2 className="text-lg font-bold text-white">Aperçu des données</h2>
                   <p className="text-white/50 text-sm">{operations.length} opérations trouvées</p>
                </div>
                <button 
                  onClick={() => { setFile(null); setOperations([]); }}
                  className="text-white/40 hover:text-white text-sm"
                >
                  Changer
                </button>
             </div>

             {/* Preview List */}
             <div className="bg-[#0A1A32] rounded-xl overflow-hidden mb-6 max-h-60 overflow-y-auto">
                <table className="w-full text-left text-sm text-white/80">
                   <thead className="bg-[#07101F] text-white/50 sticky top-0">
                      <tr>
                         <th className="p-3 font-medium">Date</th>
                         <th className="p-3 font-medium">Libellé</th>
                         <th className="p-3 font-medium text-right">Montant</th>
                      </tr>
                   </thead>
                   <tbody>
                      {operations.slice(0, 10).map((op, i) => (
                         <tr key={i} className="border-b border-white/5">
                            <td className="p-3">{op.date.toLocaleDateString()}</td>
                            <td className="p-3 opacity-80">{op.label.slice(0, 20)}{op.label.length > 20 && '...'}</td>
                            <td className={`p-3 font-medium text-right ${op.amount > 0 ? 'text-green-400' : 'text-white'}`}>
                               {op.amount.toFixed(2)} €
                            </td>
                         </tr>
                      ))}
                      {operations.length > 10 && (
                         <tr>
                            <td colSpan={3} className="p-3 text-center text-white/30 italic">
                               + {operations.length - 10} autres opérations...
                            </td>
                         </tr>
                      )}
                   </tbody>
                </table>
             </div>

             <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 py-4 bg-[#F5D657] hover:bg-[#F5D657]/90 text-black font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                   Valider l'import
                </button>
             </div>
          </div>
        )}

        {/* Success State */}
        {success && (
           <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-8 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Succès !</h2>
              <p className="text-white/60">Vos données ont été importées avec succès.</p>
           </div>
        )}

        {/* Error State */}
        {error && (
           <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-200">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
           </div>
        )}

      </div>
    </div>
  );
}
