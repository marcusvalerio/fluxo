"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import type { Health } from "@/lib/plan"
import { spring } from "./ui"

/** Saúde financeira: anel com a nota e os cinco hábitos que formam ela. */
export function HealthCard({ h }: { h: Health }) {
  const [open, setOpen] = useState(false)
  if (h.score < 0) {
    return (
      <section className="flex items-center gap-4 rounded-[23px] bg-card p-5">
        <div className="relative size-[84px] shrink-0">
          <svg viewBox="0 0 84 84" className="size-full" aria-hidden><circle cx="42" cy="42" r="34" fill="none" stroke="var(--c-cotton)" strokeWidth="8" strokeDasharray="4 6" /></svg>
          <span className="ttl absolute inset-0 grid place-items-center text-[20px] text-faint">—</span>
        </div>
        <div>
          <p className="text-[13px] text-mute">Saúde financeira</p>
          <p className="ttl text-[19px] leading-tight">Ainda sem nota</p>
          <p className="mt-0.5 text-[13px] leading-snug text-smoke">Lance suas entradas e gastos do mês e a nota aparece aqui.</p>
        </div>
      </section>
    )
  }
  const R = 34, C = 2 * Math.PI * R
  const color = h.score >= 60 ? "var(--c-ink)" : h.score >= 40 ? "#FF4E20" : "var(--c-gravy)"
  const worst = [...h.factors].filter((f) => f.points >= 0).sort((a, b) => a.points / a.max - b.points / b.max)[0]
  return (
    <section className="rounded-[23px] bg-card p-5">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-4 text-left" aria-expanded={open}>
        <div className="relative size-[84px] shrink-0">
          <svg viewBox="0 0 84 84" className="size-full -rotate-90" aria-hidden>
            <circle cx="42" cy="42" r={R} fill="none" stroke="var(--c-cotton)" strokeWidth="8" />
            <motion.circle cx="42" cy="42" r={R} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={C}
              initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - h.score / 100) }} transition={{ duration: 1.4, ease: [0.2, 0.9, 0.2, 1], delay: 0.2 }} />
          </svg>
          <span className="num absolute inset-0 grid place-items-center text-[26px]">{h.score}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-mute">Saúde financeira</p>
          <p className="ttl text-[22px] leading-tight">{h.label}</p>
          <p className="mt-0.5 text-[13px] leading-snug text-smoke">{worst && worst.points < worst.max ? worst.tip : "Tudo em ordem por aqui."}</p>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-faint"><ChevronDown size={18} /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={spring} className="overflow-hidden">
            <div className="mt-4 space-y-3 border-t border-cotton pt-4">
              {h.factors.map((f) => (
                <div key={f.name}>
                  <div className="flex items-baseline justify-between text-[14px]">
                    <span>{f.name}</span>
                    <span className="num text-[13px] text-mute">{f.points < 0 ? "sem dados" : `${f.points}/${f.max}`}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cotton">
                    <motion.div className="h-full origin-left rounded-full" style={{ background: f.points / f.max >= 0.6 ? "var(--c-ink)" : "#FF4E20", width: `${(Math.max(0, f.points) / f.max) * 100}%` }}
                      initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, ease: [0.2, 0.9, 0.2, 1] }} />
                  </div>
                  <p className="mt-1 text-[12px] text-mute">{f.tip}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
