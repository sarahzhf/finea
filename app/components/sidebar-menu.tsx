"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { label: "Accueil", href: "/", icon: "🏠" },
  { label: "Budget", href: "/budget", icon: "📊" },
  { label: "Épargne", href: "/epargne", icon: "💰" },
  { label: "Coach", href: "/coach", icon: "🤖" },
  { label: "Profil", href: "/profil", icon: "👤" },
  { label: "Réglages", href: "/settings", icon: "⚙️" },
];

export default function SidebarMenu() {
  const pathname = usePathname();

  return (
    <div>
      {/* SIDEBAR */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "0%" }}
        transition={{ type: "spring", stiffness: 140, damping: 20 }}
        whileHover={{ rotateY: 6, rotateX: -2, scale: 1.015 }}
        whileTap={{ rotateY: 0, rotateX: 0, scale: 0.98 }}
        className="
          fixed top-0 left-0 h-full w-64 z-50
          bg-[#0F2B52]
          shadow-[20px_0_35px_#07101F]
          border-r border-[#F5D657]/20
          p-6 flex flex-col gap-6
          rounded-r-3xl
          transform-gpu
          perspective-[1200px]
        "
      >
        <p className="text-[#F5D657] text-xl font-bold mb-4">Menu</p>

        <div className="flex flex-col gap-4">
          {menuItems.map((item, index) => (
            <Link href={item.href} key={index} className="relative">
              {pathname === item.href && (
                <div className="
                  absolute -top-4 left-1/2 -translate-x-1/2
                  w-12 h-12 rounded-full
                  bg-[radial-gradient(circle,rgba(245,214,87,0.45),transparent)]
                  blur-xl pointer-events-none
                " />
              )}
              <motion.div
                whileHover={{ x: 6, rotateY: -6, scale: 1.05 }}
                whileTap={{ scale: 0.95, rotateY: 0 }}
                className={`
                  flex items-center gap-3
                  px-4 py-3 rounded-2xl relative
                  border border-[#F5D657]/20
                  text-[#F5D657]
                  transform-gpu
                  ${pathname === item.href
                    ? "bg-[#122D56] shadow-[inset_6px_6px_12px_#07101F,inset_-6px_-6px_12px_#173A68] scale-[1.08]"
                    : "bg-[#0F2B52] shadow-[6px_6px_12px_#07101F,-6px_-6px_12px_#173A68]"
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-semibold">{item.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
