"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useEffect } from "react"
import { NatalDrop } from "./natal"
import { LogoRing } from "./logo"

const STEM = "M20 16Q20 10 26 10H44V84Q44 90 38 90H26Q20 90 20 84Z"
const ARM = "M40 10H78Q84 10 84 16V26Q84 32 78 32H40Z"
const FOLD = "M20 32V16Q20 10 26 10H44V32Z"
const ease = [0.2, 0.9, 0.3, 1.15] as const

/** O F do Fluxo: boleto e nota numa peça, inclinada, e a moeda redonda. */
export function LogoF({ size = 40, f = "#3B5285", fold = "#1B2440", coin = "#1B2440" }: { size?: number; f?: string; fold?: string; coin?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <g transform="translate(11 0) skewX(-12)"><path d={STEM} fill={f} /><path d={ARM} fill={f} /><path d={FOLD} fill={fold} /></g>
      <circle cx="57" cy="52" r="11" fill={coin} />
    </svg>
  )
}

/** Abertura: os palitos do anel nascem um a um, a onda começa a correr e o nome sobe. */
export function Splash({ onDone, natal = false }: { onDone: () => void; natal?: boolean }) {
  const reduced = !!useReducedMotion()
  useEffect(() => {
    const t = setTimeout(onDone, reduced ? 500 : natal ? 3600 : 1500)
    return () => clearTimeout(t)
  }, [onDone, reduced, natal])
  const r = reduced
  return (
    <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-[linear-gradient(170deg,#3B5285_0%,#24345A_55%,#1B2440_100%)]" aria-hidden
      initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.3 }}>
      {natal && <NatalDrop />}
      <div className={`flex flex-col items-center gap-5 ${natal ? "translate-y-[30vh]" : ""}`}>
        <LogoRing size={104} color="#F7F7F7" intro={!r} />
        <span className="ttl flex text-[44px] leading-none text-[#F7F7F7]">
          {"fluxo".split("").map((c, i) => (
            <motion.span key={i} initial={r ? false : { opacity: 0, y: 18, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, delay: 0.45 + i * 0.05, ease }}>{c}</motion.span>
          ))}
        </span>
      </div>
    </motion.div>
  )
}
