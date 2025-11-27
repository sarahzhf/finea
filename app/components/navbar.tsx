"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const tabs = [
  { href: "/", label: "Accueil", icon: "🏠" },
  { href: "/budget", label: "Budget", icon: "📊" },
  { href: "/coach", label: "Coach", icon: "🤖" },
  { href: "/profil", label: "Profil", icon: "👤" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div
      className="
        fixed bottom-0 left-0 w-full
        backdrop-blur-2xl bg-[#091428]/70
        border-t border-white/10
        py-4
        flex justify-around items-center
        z-50
        shadow-[0_-4px_12px_rgba(0,0,0,0.45)]
      "
    >
      {tabs.map((tab, index) => {
        const isActive = pathname === tab.href;

        return (
          <Link href={tab.href} key={index} className="relative">
            <motion.div
              whileTap={{ scale: 0.88 }}
              className="
                flex flex-col items-center justify-center
                text-[#F5D657]
              "
            >
              {/* ICON */}
              <motion.div
                animate={{
                  scale: isActive ? 1.25 : 1,
                  y: isActive ? -4 : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="
                  text-xl
                  drop-shadow-[0_0_6px_rgba(245,214,87,0.25)]
                "
              >
                {tab.icon}
              </motion.div>

              {/* LABEL */}
              <motion.p
                className={`
                  text-[11px] font-medium tracking-wide
                  transition-opacity duration-300
                `}
              >
                {tab.label}
              </motion.p>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}