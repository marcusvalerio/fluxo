"use client"

import { motion } from "framer-motion"
import type { Analysis } from "@/lib/finance"

/** Curva do saldo do mês: passado sólido, futuro projetado tracejado. */
export function Projection({ a, height = 120 }: { a: Analysis; height?: number }) {
  const W = 400, H = height, pad = 8
  const vals = a.series.map((s) => s.value)
  const min = Math.min(0, ...vals), max = Math.max(1, ...vals)
  const x = (i: number) => pad + (i / (a.series.length - 1)) * (W - pad * 2)
  const y = (v: number) => pad + (1 - (v - min) / (max - min)) * (H - pad * 2)
  const pts = a.series.map((s, i) => [x(i), y(s.value)] as const)
  const split = a.dayOfMonth - 1
  const path = (arr: readonly (readonly [number, number])[]) => arr.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("")
  const past = pts.slice(0, split + 1)
  const future = pts.slice(split)
  const area = `${path(past)}L${past.at(-1)![0]},${H}L${past[0][0]},${H}Z`
  const end = pts.at(-1)!
  const zero = y(0)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id="pa" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--health)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--health)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {min < 0 && <line x1={0} x2={W} y1={zero} y2={zero} stroke="var(--color-rose)" strokeOpacity=".35" strokeDasharray="2 4" />}
      <motion.path d={area} fill="url(#pa)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} />
      <motion.path d={path(past)} fill="none" stroke="var(--health)" strokeWidth={2} vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
      <motion.path d={path(future)} fill="none" stroke="var(--color-fg)" strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="3 5" vectorEffect="non-scaling-stroke"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} />
      <circle cx={pts[split][0]} cy={pts[split][1]} r={4} fill="var(--health)" />
      <circle cx={pts[split][0]} cy={pts[split][1]} r={10} fill="var(--health)" opacity={0.25}>
        <animate attributeName="r" values="4;14;4" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values=".4;0;.4" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <circle cx={end[0]} cy={end[1]} r={3} fill="none" stroke="var(--color-fg)" strokeOpacity={0.6} />
    </svg>
  )
}
