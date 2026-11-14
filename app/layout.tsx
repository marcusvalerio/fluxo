import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Anybody, Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const dm = Anybody({ subsets: ["latin"], axes: ["wdth"], variable: "--font-dm" })

export const metadata: Metadata = {
  title: "Fluxo",
  description: "Quanto ainda cabe no seu mês, todo dia.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Fluxo" },
  icons: { apple: "/icons/fluxo-v3-180.png" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#FFF6EF" }, { media: "(prefers-color-scheme: dark)", color: "#0F1418" }],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${dm.variable}`}>
      <body className="min-h-dvh font-sans">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
