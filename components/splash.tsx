"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useEffect } from "react"
import { NatalDrop } from "./natal"

const STEM = "M20 16Q20 10 26 10H44V84Q44 90 38 90H26Q20 90 20 84Z"
const ARM = "M40 10H78Q84 10 84 16V26Q84 32 78 32H40Z"
const FOLD = "M20 32V16Q20 10 26 10H44V32Z"
const ease = [0.2, 0.9, 0.3, 1.15] as const

/** O F do Fluxo: boleto e nota numa peça, inclinada, e a moeda redonda. */
export function LogoF({ size = 40, f = "#FF4E20", fold = "#B83312", coin = "#1F282E" }: { size?: number; f?: string; fold?: string; coin?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <g transform="translate(11 0) skewX(-12)"><path d={STEM} fill={f} /><path d={ARM} fill={f} /><path d={FOLD} fill={fold} /></g>
      <circle cx="57" cy="52" r="11" fill={coin} />
    </svg>
  )
}

/** Abertura: o F se monta (boleto sobe, nota encaixa, a moeda cai e quica) e o app abre. */
export function Splash({ onDone, natal = false }: { onDone: () => void; natal?: boolean }) {
  const reduced = !!useReducedMotion()
  useEffect(() => {
    const t = setTimeout(onDone, reduced ? 900 : natal ? 4800 : 2100)
    return () => clearTimeout(t)
  }, [onDone, reduced, natal])
  const r = reduced
  return (
    <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-otan" aria-hidden
      initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.4 }}>
      {natal && <NatalDrop />}
      <div className={`flex flex-col items-center gap-6 ${natal ? "translate-y-[30vh]" : ""}`}>
        <svg viewBox="0 0 100 100" width={120} height={120} style={{ overflow: "visible" }}>
          <g transform="translate(11 0) skewX(-12)">
            <motion.path d={STEM} fill="#FFF6EF" style={{ transformBox: "fill-box", originY: 1 }}
              initial={r ? false : { y: 110, scaleY: 0.6, opacity: 0 }} animate={{ y: 0, scaleY: 1, opacity: 1 }} transition={{ duration: 0.5, ease }} />
            <motion.path d={ARM} fill="#FFF6EF"
              initial={r ? false : { x: 90, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.45, delay: 0.4, ease }} />
            <motion.path d={FOLD} fill="#FFD8C4"
              initial={r ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: 0.8 }} />
          </g>
          <motion.circle cx="57" cy="52" r="11" fill="#1F282E"
            initial={r ? false : { y: -140, opacity: 0 }} animate={{ y: [-140, 0, -10, 0], opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.95, times: [0, 0.6, 0.8, 1], ease: "easeOut" }} />
        </svg>
        <motion.span className="ttl text-[40px] italic leading-none text-[#FFF6EF]"
          initial={r ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.45 }}>fluxo</motion.span>
      </div>
    </motion.div>
  )
}
