"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"

interface ReceiptData {
  merchant?: string;
  date?: string;
  total?: string;
  currency?: string;
  items: Array<{
    description: string;
    quantity?: string;
    price?: string;
  }>;
  rawText: string;
}

export default function ScanPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  const router = useRouter()
  const { user } = useAuth()

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    console.log("📸 Image sélectionnée:", file.name)
    
    setError(null)
    setReceiptData(null)
    setSaveSuccess(false)
    setImageFile(file)

    const reader = new FileReader()
    reader.onload = () => {
      console.log("✅ Image chargée en base64")
      setSelectedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function analyzeReceipt() {
    console.log("🚀 analyzeReceipt appelée !")
    
    if (!imageFile) {
      console.error("❌ Pas de fichier image")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      console.log("📤 Envoi de la requête à /api/ocr...")
      
      const formData = new FormData()
      formData.append('image', imageFile)

      const response = await fetch('api/ocr', {
        method: 'POST',
        body: formData,
      })

      console.log("📥 Réponse reçue, status:", response.status)

      const result = await response.json()
      console.log("📊 Résultat:", result)

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'analyse')
      }

      setReceiptData(result.data)
      console.log("✅ Données du ticket extraites :", result.data)

    } catch (err: any) {
      console.error('❌ Erreur:', err)
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function saveReceipt() {
    // 🔍 LIGNE AJOUTÉE POUR DEBUG
    console.log("🔍 User actuel:", user)
    console.log("🔍 User UID:", user?.uid)
    
    if (!receiptData) {
      setError("Aucune donnée à sauvegarder")
      return
    }

    if (!user) {
      setError("Vous devez être connecté pour sauvegarder")
      return
    }

    setIsSaving(true)
    setError(null)
    setSaveSuccess(false)

    try {
      console.log("💾 Sauvegarde du ticket...")

      const response = await fetch('/api/receipts/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptData,
          userId: user.uid,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde')
      }

      console.log("✅ Ticket sauvegardé:", result.receiptId)
      setSaveSuccess(true)

      // Rediriger vers la page des dépenses après 2 secondes
      setTimeout(() => {
        router.push('/depenses')
      }, 2000)

    } catch (err: any) {
      console.error('❌ Erreur sauvegarde:', err)
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  function resetScan() {
    console.log("🔄 Reset du scan")
    setSelectedImage(null)
    setImageFile(null)
    setReceiptData(null)
    setError(null)
    setSaveSuccess(false)
  }

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">
      <div className="w-[390px] min-h-[780px] bg-[#0A1D37] rounded-[40px] shadow-[0_0_40px_rgba(0,0,0,0.4)] p-6 relative overflow-hidden">
        {/* HEADER AVEC BOUTON RETOUR */}
        <div className="relative z-10 flex items-center justify-between mb-5">
          <button
            onClick={() => router.push('/')}
            className="text-[#F5D657] text-xl active:scale-95 transition"
          >
            ←
          </button>
          <h1 className="text-xl font-semibold text-[#F5D657] drop-shadow">
            Scanner un ticket
          </h1>
          <div className="w-6"></div>
        </div>

        {/* <h1 className="relative z-10 text-2xl font-bold text-white mb-6 drop-shadow">
          Scanner un ticket
        </h1> */}

        {!selectedImage && (
          <label className="relative z-10 w-full h-44 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center cursor-pointer shadow-md text-white">
            <span className="text-3xl mb-2">📸</span>
            <span className="text-sm text-white/60">Importer une photo</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        )}

        {selectedImage && (
          <div className="relative z-10 w-full flex flex-col items-center max-h-[600px] overflow-y-auto">
            <img
              src={selectedImage}
              alt="Ticket"
              className="w-full rounded-2xl mb-4 shadow-md border border-white/10"
            />

            {error && (
              <div className="w-full p-4 mb-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
                ⚠️ {error}
              </div>
            )}

            {saveSuccess && (
              <div className="w-full p-4 mb-4 rounded-xl bg-green-500/15 border border-green-500/30 text-green-300 text-sm">
                ✅ Ticket sauvegardé avec succès !
              </div>
            )}

            {receiptData && (
              <div className="w-full mb-4 p-4 rounded-2xl bg-white/5 border border-white/10 shadow-md text-white">
                <h3 className="font-bold mb-3 text-lg text-white">✅ Ticket analysé</h3>
                
                {receiptData.merchant && (
                  <div className="mb-2">
                    <span className="text-white/60">Commerçant:</span>
                    <span className="ml-2 font-semibold">{receiptData.merchant}</span>
                  </div>
                )}
                
                {receiptData.date && (
                  <div className="mb-2">
                    <span className="text-white/60">Date:</span>
                    <span className="ml-2 font-semibold">{receiptData.date}</span>
                  </div>
                )}
                
                {receiptData.total && (
                  <div className="mb-3">
                    <span className="text-white/60">Total:</span>
                    <span className="ml-2 text-white text-xl font-semibold">{receiptData.total} €</span>
                  </div>
                )}

                {receiptData.items.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-white">Articles:</h4>
                    <div className="space-y-2">
                      {receiptData.items.map((item, idx) => (
                        <div key={idx} className="text-sm bg-[#0A1D37]/50 p-2 rounded-lg">
                          <div className="flex justify-between">
                            <span>{item.description}</span>
                            {item.price && <span className="font-semibold">{item.price}</span>}
                          </div>
                          {item.quantity && (
                            <span className="text-xs text-white/60">Quantité: {item.quantity}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!receiptData && (
              <button
                onClick={analyzeReceipt}
                disabled={isAnalyzing}
                className="w-full py-4 rounded-2xl font-semibold bg-white/10 border border-white/10 text-white shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Analyse en cours...
                  </span>
                ) : (
                  "🔍 Analyser le ticket"
                )}
              </button>
            )}

            {receiptData && !saveSuccess && (
              <div className="w-full flex gap-3 mt-4">
                <button
                  onClick={saveReceipt}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl font-semibold bg-white text-[#0A1D37] shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Sauvegarde...
                    </span>
                  ) : (
                    "💾 Enregistrer"
                  )}
                </button>
                <button
                  onClick={resetScan}
                  className="flex-1 py-3 rounded-2xl font-semibold bg-white/10 border border-white/10 text-white shadow-md active:scale-95 transition-all"
                >
                  🔄 Nouveau
                </button>
              </div>
            )}

            {!receiptData && (
              <button
                className="mt-4 text-sm text-white/60 underline"
                onClick={resetScan}
              >
                Choisir une autre photo
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}