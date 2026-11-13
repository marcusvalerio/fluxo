"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useEffect } from "react"

const BARS = [0.4, 0.75, 0.55, 1, 0.65]

/** Abertura: os palitos do Fluxo sobem um a um, o nome aparece e o app abre. */
export function Splash({ onDone }: { onDone: () => void }) {
  const reduced = !!useReducedMotion()
  useEffect(() => {
    const t = setTimeout(onDone, reduced ? 700 : 1500)
    return () => clearTimeout(t)
  }, [onDone, reduced])
  return (
    <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-cotton" aria-hidden
      initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.38 }}>
      <div className="flex items-center gap-3">
        <div className="flex h-[46px] items-end gap-[5px]">
          {BARS.map((h, i) => (
            <motion.span key={i} className="w-[9px] origin-bottom rounded-full bg-otan" style={{ height: `${h * 100}%` }}
              initial={{ scaleY: reduced ? 1 : 0 }} animate={{ scaleY: reduced ? 1 : [0, 1.15, 1] }}
              transition={{ duration: 0.52, delay: i * 0.07, times: [0, 0.7, 1], ease: [0.2, 0.9, 0.3, 1] }} />
          ))}
        </div>
        <motion.span className="ttl text-[52px] leading-none tracking-[-0.05em]"
          initial={reduced ? { opacity: 1 } : { opacity: 0, x: -8, filter: "blur(6px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: reduced ? 0 : 0.38, ease: "easeOut" }}>fluxo</motion.span>
      </div>
    </motion.div>
  )
}
