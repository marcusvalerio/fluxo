"use client"

import { motion } from "framer-motion"

/** O cofrinho de cada meta: engorda conforme o dinheiro entra e sorri quando a meta é batida. */
export function Piggy({ pct, size = 56 }: { pct: number; size?: number }) {
  const p = Math.max(0, Math.min(1, pct))
  const w = 36 * (0.72 + 0.5 * p), h = 29 * (0.85 + 0.25 * p)
  const done = p >= 1
  return (
    <motion.svg viewBox="0 0 100 70" width={size} height={size * 0.7} aria-hidden style={{ overflow: "visible", flex: "none" }}
      initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 16 }}>
      <g transform="translate(50 64)">
        <rect x={-w * 0.55} y={-6} width={7} height={9} rx={3} fill="#E2401C" />
        <rect x={w * 0.38} y={-6} width={7} height={9} rx={3} fill="#E2401C" />
        <motion.ellipse cx={0} cy={-h} fill="#FF4E20" initial={false} animate={{ rx: w, ry: h, cy: -h }} transition={{ type: "spring", stiffness: 140, damping: 14 }} />
        <ellipse cx={w * 0.95} cy={-h * 0.95} rx={5} ry={6} fill="#E2401C" />
        <rect x={-9} y={-h * 2 + 4} width={18} height={4} rx={2} fill="#B83312" />
        {done ? (
          <path d={`M${-w * 0.35} ${-h * 1.1 + 1}q4-5 8 0M${w * 0.1} ${-h * 1.1 + 1}q4-5 8 0`} stroke="#fff" strokeWidth={2.6} fill="none" strokeLinecap="round" />
        ) : (
          <>
            <circle cx={-w * 0.25} cy={-h * 1.1} r={3.6} fill="#fff" />
            <circle cx={w * 0.2} cy={-h * 1.1} r={3.6} fill="#fff" />
          </>
        )}
      </g>
    </motion.svg>
  )
}
