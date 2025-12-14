"use client"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

const modules = [
  { name: "Budget", route: "/budget", icon: "/icons/budget.png" },
  { name: "Épargne", route: "/epargne", icon: "/icons/epargne.png" },
  { name: "Crédits", route: "/credit", icon: "/icons/credit.png" },
  { name: "Scanner", route: "/scan", icon: "/icons/scanner.png" },
  { name: "Missions", route: "/missions", icon: "/icons/missions.png" },
  { name: "Quiz", route: "/quiz", icon: "/icons/quiz.png" },
]

export default function ModuleCarousel() {
  const router = useRouter()

  return (
    <div className="w-full mt-4">
      {/* Title spacing is handled by parent page: modules appear UNDER 'Tous les modules' */}
      <div className="relative overflow-x-auto no-scrollbar">
        <motion.div
          className="flex gap-6 px-6 py-10"
          initial={{ x: 0 }}
          animate={{ x: 0 }}
        >
          {modules.map((m, index) => (
            <motion.div
              key={m.name}
              onClick={() => router.push(m.route)}
              className="
                min-w-[160px] h-[210px]
                rounded-2xl
                bg-white/10 backdrop-blur-xl
                border border-white/15
                flex flex-col items-center justify-center
                text-center
                cursor-pointer
                perspective-[1200px]
              "
              style={{
                transformStyle: "preserve-3d",
              }}
              whileHover={{
                rotateY: -12,
                rotateX: 6,
                y: -10,
              }}
              whileTap={{
                scale: 0.96,
              }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 20,
              }}
            >
              <div
                className="flex flex-col items-center justify-center"
                style={{ transform: "translateZ(35px)" }}
              >
                <img
                  src={m.icon}
                  alt=""
                  className="w-12 h-12 mb-4"
                  draggable={false}
                />
                <p className="text-white font-semibold">{m.name}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}