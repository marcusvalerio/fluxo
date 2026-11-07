import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument" })

export const metadata: Metadata = {
  title: "Fluxo — seu dinheiro, vivo",
  description: "Não é mais um app de finanças. Seu dinheiro como algo vivo: projeção, ritmo e metas em tempo real.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Fluxo" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#050608",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${mono.variable} ${serif.variable}`}>
      <body className="min-h-dvh font-sans">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
