"use client"

import Link from "next/link"
import { motion } from "framer-motion"

interface ModuleCardProps {
  label: string
  href: string
  icon?: React.ReactNode
  subtitle?: string
}

export default function ModuleCard({ label, href, icon, subtitle }: ModuleCardProps) {
  return (
    <Link href={href}>
      <motion.div
        whileTap={{ scale: 0.94 }}
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="
          bg-[#122D56]
          text-[#F5D657]
          p-5
          rounded-2xl
          shadow-[8px_8px_16px_#0B1A33,-8px_-8px_16px_#1A4179]
          border border-[#F5D657]/40
          flex flex-col items-center justify-center gap-3
        "
      >
        <div className="text-4xl drop-shadow-[0_0_8px_rgba(245,214,87,0.4)]">
          {icon || "📘"}
        </div>

        <p className="text-center text-base font-bold tracking-wide">
          {label}
        </p>

        {subtitle && (
          <p className="text-center text-xs text-[#F5D657]/70">
            {subtitle}
          </p>
        )}
      </motion.div>
    </Link>
  )
}