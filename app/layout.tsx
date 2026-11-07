import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { DM_Sans, Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const dm = DM_Sans({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-dm" })

export const metadata: Metadata = {
  title: "Fluxo",
  description: "Quanto ainda cabe no seu mês, todo dia.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Fluxo" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#E4E3DC",
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
