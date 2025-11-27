

"use client";

import { useState } from "react";
import { Search } from "lucide-react";

export default function SearchBarPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="w-full min-h-screen bg-[#0A1D37] flex flex-col items-center pt-10 px-4">
      
      {/* Search bar */}
      <div className="relative w-[90%] max-w-[380px] mt-4">
        <div
          className="
            w-full h-[55px]
            bg-[#0F2A4A]/80 
            backdrop-blur-xl
            rounded-full 
            border border-white/10 
            shadow-[0_10px_30px_rgba(0,0,0,0.45)]
            px-6 flex items-center gap-3
            transition-all duration-300
            hover:shadow-[0_15px_40px_rgba(0,0,0,0.55)]
          "
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un module..."
            className="
              bg-transparent 
              text-white text-[17px]
              placeholder-white/40
              focus:outline-none w-full
            "
          />

          <Search className="w-5 h-5 text-white/80" />
        </div>

        {/* Glow */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[70%] h-[14px] bg-[#FFD37A]/40 blur-[22px] rounded-full"></div>
      </div>

      {/* Placeholder results */}
      <div className="mt-6 text-white/70 text-sm">
        Tape un mot-clé pour rechercher un module.
      </div>
    </div>
  );
}