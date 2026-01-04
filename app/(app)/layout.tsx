"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user === undefined) return
    if (user === null) {
      router.replace("/login")
    }
  }, [user, router])

  if (user === undefined || user === null) {
    return null
  }

  return <>{children}</>
}