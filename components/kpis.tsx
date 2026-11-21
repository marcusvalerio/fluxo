"use client"

import { animate, motion, useMotionValue, useTransform } from "framer-motion"
import { useEffect } from "react"
import { spring } from "./ui"

/** Número que conta do zero até o valor ao aparecer. */
export function CountUp({ value, prefix = "", suffix = "", className = "" }: { value: number; prefix?: string; suffix?: string; className?: string }) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => prefix + Math.round(v).toLocaleString("pt-BR") + suffix)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { mv.set(value); return }
    const c = animate(mv, value, { duration: 1.2, ease: [0.2, 0.9, 0.25, 1] })
    return () => c.stop()
  }, [value, mv])
  return <motion.span className={className}>{text}</motion.span>
}

/** Medidor em gomos grossos: `fill` de 0 a 1. Cores: cheio, borda (o gomo de agora) e vazio. */
export function Gomos({ fill, on = "var(--c-accent)", edge = "var(--c-sky)", off = "var(--c-sand)", n = 13, className = "" }: { fill: number; on?: string; edge?: string; off?: string; n?: number; className?: string }) {
  const k = Math.round(n * Math.max(0, Math.min(1, fill)))
  const cx = 140, cy = 142, R1 = 84, R2 = 134, gap = 0.085
  const P = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy - r * Math.sin(a)).toFixed(1)}`
  return (
    <svg viewBox="0 0 280 160" className={className} aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const a0 = Math.PI * (1 - i / n) - gap, a1 = Math.PI * (1 - (i + 1) / n) + gap
        const c = i < k ? on : i === k ? edge : off
        return (
          <motion.path key={i} d={`M${P(R1, a0)} L${P(R2, a0)} A${R2} ${R2} 0 0 1 ${P(R2, a1)} L${P(R1, a1)} A${R1} ${R1} 0 0 0 ${P(R1, a0)}Z`}
            fill={c} stroke={c} strokeWidth={11} strokeLinejoin="round" style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 16, delay: i * 0.045 }} />
        )
      })}
    </svg>
  )
}

/** Círculo escuro com arco e pontinhos (quanto foi guardado). */
export function RingStat({ pct, label }: { pct: number; label: string }) {
  const p = Math.max(0, Math.min(1, pct))
  return (
    <div className="relative grid aspect-square place-items-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#24345A,#1B2440_60%,#111829)] text-[#F7F7F7] shadow-[0_18px_36px_-22px_rgb(27_36_64/0.6)]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <motion.circle cx="50" cy="50" r="38" fill="none" stroke="#8FA4D0" strokeWidth="6" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: Math.max(0.02, p) }} transition={{ duration: 1.3, ease: [0.2, 0.9, 0.25, 1] }} />
        {Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI * 2 * (p + 0.06 + i * ((1 - p - 0.1) / 9))
          return <motion.circle key={i} cx={50 + 38 * Math.cos(a)} cy={50 + 38 * Math.sin(a)} r="3" fill="#F7F7F7" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.4 + i * 0.07 }} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
        })}
      </svg>
      <div className="relative flex flex-col text-center">
        <b className="text-[24px] font-medium tracking-[-0.03em]"><CountUp value={Math.round(p * 100)} suffix="%" /></b>
        <small className="text-[11px] text-[#B9C8DD]">{label}</small>
      </div>
    </div>
  )
}

/** Mapa de calor: um quadradinho por dia, mais escuro = mais gasto. */
export function HeatMap({ days }: { days: { total: number; future: boolean; today: boolean }[] }) {
  const max = Math.max(1, ...days.map((d) => d.total))
  return (
    <div className="grid grid-cols-10 gap-[4px]">
      {days.map((d, i) => {
        const l = d.future ? -1 : d.total <= 0 ? 0 : Math.min(4, 1 + Math.floor((d.total / max) * 3.999))
        return (
          <motion.i key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.014 }}
            className={`block aspect-square rounded-[5px] ${d.today ? "ring-2 ring-[var(--c-accent)] ring-offset-2 ring-offset-[var(--c-cotton)]" : ""}`}
            style={{ background: l < 0 ? "transparent" : `color-mix(in oklab, var(--c-accent) ${l * 24}%, var(--c-sand))`, boxShadow: l < 0 ? "inset 0 0 0 1px var(--c-sand-2)" : undefined }} />
        )
      })}
    </div>
  )
}

/** Barras listradas por categoria: a maior em degradê com selo escuro. */
export function StripeBars({ items }: { items: { name: string; value: number; delta?: number | null }[] }) {
  const top = items.slice(0, 4)
  const max = Math.max(1, ...top.map((c) => c.value))
  const total = items.reduce((a, c) => a + c.value, 0) || 1
  const big = top.reduce((m, c, i) => (c.value > top[m].value ? i : m), 0)
  return (
    <div className="grid h-[150px] grid-cols-4 items-end gap-2">
      {top.map((c, i) => {
        const on = i === big
        return (
          <div key={c.name} className="flex h-full min-w-0 flex-col justify-end gap-1.5">
            <span className={`num text-center text-[11px] ${on ? "font-semibold text-ink" : "text-faint"}`}>{Math.round((c.value / total) * 100)}%{c.delta != null && Math.abs(c.delta) >= 0.1 ? (c.delta > 0 ? " ↗" : " ↘") : ""}</span>
            <motion.i initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ ...spring, delay: 0.1 + i * 0.06 }} style={{ originY: 1, height: `${Math.max(14, (c.value / max) * 100)}%` }}
              className={`relative block rounded-[12px] ${on ? "bg-[linear-gradient(180deg,var(--c-sky),var(--c-accent))]" : "bg-[repeating-linear-gradient(-45deg,rgb(var(--c-accent-rgb)/0.3)_0_1.5px,transparent_1.5px_6px)] bg-sand"}`}>
              <b className={`num absolute left-1/2 top-1.5 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-px text-[10px] font-semibold shadow-sm ${on ? "bg-ink text-cotton" : "bg-card text-ink"}`}>{Math.round(c.value)}</b>
            </motion.i>
            <small className={`truncate text-center text-[11px] ${on ? "font-semibold text-ink" : "text-faint"}`}>{c.name}</small>
          </div>
        )
      })}
    </div>
  )
}
