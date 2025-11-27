"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export default function ScanPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { name: "Home", route: "/", icon: "🏠" },
    { name: "Scan", route: "/scan", icon: "📸" },
    { name: "Profil", route: "/profil", icon: "👤" },
    { name: "Réglages", route: "/settings", icon: "⚙️" },
  ]

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => setSelectedImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex justify-center items-start py-8 px-3">

      {/* iPhone frame */}
      <div className="w-[390px] min-h-[780px] bg-[#0F2B52] rounded-[40px] shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6 relative overflow-hidden">

        {/* Glow */}
        <div className="absolute -top-16 -left-20 w-72 h-72 bg-[#F5D657]/15 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#F5D657]/10 blur-3xl rounded-full"></div>

        {/* Title */}
        <h1 className="relative z-10 text-2xl font-bold text-[#F5D657] mb-6 drop-shadow">
          Scanner un ticket
        </h1>

        {/* Upload box */}
        {!selectedImage && (
          <label
            className="
              relative z-10 w-full h-44 rounded-3xl 
              bg-[#0F2B52]
              flex flex-col items-center justify-center cursor-pointer
              shadow-[10px_10px_22px_#07101F,-10px_-10px_22px_#173A68]
              text-[#F5D657]
            "
          >
            <span className="text-3xl mb-2">📸</span>
            <span className="text-sm opacity-80">Importer une photo</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        )}

        {/* Image preview */}
        {selectedImage && (
          <div className="relative z-10 w-full flex flex-col items-center">
            <img
              src={selectedImage}
              alt="Ticket"
              className="
                w-full rounded-2xl mb-4
                shadow-[10px_10px_22px_#07101F,-10px_-10px_22px_#173A68]
                border border-[#F5D657]/40
              "
            />

            {/* OCR Button */}
            <button
              className="
                w-full py-4 rounded-2xl font-semibold text-[#F5D657]
                bg-[#0F2B52]
                shadow-[8px_8px_18px_#07101F,-8px_-8px_18px_#173A68]
                active:scale-95 transition-all 
              "
            >
              🔍 Analyser le ticket (OCR)
            </button>

            {/* Reset */}
            <button
              className="mt-4 text-sm text-[#F5D657]/70 underline"
              onClick={() => setSelectedImage(null)}
            >
              Choisir une autre photo
            </button>
          </div>
        )}

        {/* Bottom Navigation */}
        <div
          className="
            absolute left-1/2 -translate-x-1/2 bottom-[-8px] 
            w-[85%]
            bg-[#0F2B52] rounded-full px-4 py-3
            shadow-[8px_8px_22px_#07101F,-8px_-8px_22px_#173A68]
            flex justify-between items-center
            backdrop-blur-md
          "
        >
          {navItems.map((item) => {
            const active = pathname === item.route
            const isScan = item.route === "/scan"

            return (
              <button
                key={item.route}
                onClick={() => router.push(item.route)}
                className={`
                  flex flex-col items-center justify-center 
                  transition-all duration-300
                  ${isScan ? "w-14 h-14 -mt-6 rounded-full" : "w-12 h-12 rounded-2xl"}
                  ${
                    active
                      ? "bg-[#0F2B52] shadow-[inset_6px_6px_12px_#07101F,inset_-6px_-6px_12px_#173A68] scale-110 animate-pulse"
                      : "bg-[#0F2B52] shadow-[6px_6px_12px_#07101F,-6px_-6px_12px_#173A68] opacity-75 scale-95"
                  }
                `}
              >
                <span className={isScan ? "text-2xl" : "text-xl"}>{item.icon}</span>
                {!isScan && (
                  <span className="text-[9px] mt-1 text-[#F5D657]">{item.name}</span>
                )}
              </button>
            )
          })}
        </div>

      </div>
    </div>
  )
}
