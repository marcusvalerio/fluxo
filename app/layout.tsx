import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Inter, Syne } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const syne = Syne({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-syne" })

export const metadata: Metadata = {
  title: "Fluxo",
  description: "Quanto ainda cabe no seu mês, todo dia.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Fluxo" },
  icons: { apple: "/icons/fluxo-v7-180.png" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F3F5F9" }, { media: "(prefers-color-scheme: dark)", color: "#0F1524" }],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${syne.variable}`}>
      <body className="min-h-dvh font-sans">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
