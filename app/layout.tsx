import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import SidebarMenu from "./components/sidebar-menu";

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Coach Financier",
  description: "Votre assistant intelligent pour gérer budget, épargne et finances.",
  generator: "v0.dev"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} bg-gradient-radial from-[#020202] via-[#0B1B35] to-[#000000] min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SidebarMenu />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
