"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, FileText, User, CreditCard } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
             onClick={() => router.push('/dashboard')}
             className="p-2 bg-white/5 rounded-xl text-white/70 hover:text-white mr-4"
          >
             <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-[#F5D657]">Réglages</h1>
        </div>

        {/* Menu Grid */}
        <div className="grid gap-4">
          
          <button 
             onClick={() => router.push('/profil')}
             className="p-4 bg-[#0A1A32] rounded-2xl border border-white/5 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
          >
             <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                 <User className="w-5 h-5 text-blue-400" />
             </div>
             <div>
                <h3 className="text-white font-semibold">Mon Profil</h3>
                <p className="text-white/40 text-sm">Gérer mes informations personnelles</p>
             </div>
          </button>

          <button 
             onClick={() => router.push('/reglages/import')}
             className="p-4 bg-[#0A1A32] rounded-2xl border border-white/5 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
          >
             <div className="w-10 h-10 rounded-full bg-[#F5D657]/20 flex items-center justify-center">
                 <FileText className="w-5 h-5 text-[#F5D657]" />
             </div>
             <div>
                <h3 className="text-white font-semibold">Import Données</h3>
                <p className="text-white/40 text-sm">Importer mes relevés bancaires (Excel)</p>
             </div>
          </button>

        </div>
      </div>
    </div>
  )
}
