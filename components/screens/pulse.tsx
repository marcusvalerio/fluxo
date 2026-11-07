"use client"

import { motion } from "framer-motion"
import { useMemo } from "react"
import type { Snapshot } from "@/lib/types"
import { brl, catColor, compact, type Analysis } from "@/lib/finance"
import { addDays } from "@/lib/dates"

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

export function PulseScreen({ snap, a }: { snap: Snapshot; a: Analysis }) {
  const total = a.categories.reduce((s, c) => s + c.value, 0)

  const months = useMemo(() => {
    const out: { ym: string; inc: number; out: number }[] = []
    let cursor = a.ym + "-01"
    for (let i = 0; i < 6; i++) {
      const ym = cursor.slice(0, 7)
      const list = snap.txs.filter((t) => t.date.startsWith(ym))
      out.unshift({
        ym,
        inc: list.filter((t) => t.kind === "income").reduce((s, t) => s + t.amount, 0),
        out: list.filter((t) => t.kind === "expense").reduce((s, t) => s + t.amount, 0),
      })
      cursor = addDays(cursor, -1).slice(0, 7) + "-01"
    }
    return out
  }, [snap.txs, a.ym])
  const peak = Math.max(1, ...months.flatMap((m) => [m.inc, m.out]))
  const savingsRate = a.income > 0 ? (a.income - a.expense) / a.income : 0

  return (
    <div className="px-6 pt-[max(24px,env(safe-area-inset-top))]">
      <p className="eyebrow">Pulso</p>
      <h1 className="mt-1 font-serif text-[44px] leading-none">Para onde <span className="italic text-acid">vai</span></h1>

      {/* espectro */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <p className="num text-4xl">{brl(total, false)}</p>
          <p className="text-xs text-fg-3">gastos no mês</p>
        </div>
        <div className="mt-4 flex h-14 gap-1 overflow-hidden rounded-2xl">
          {a.categories.map((c, i) => (
            <motion.div key={c.name} title={c.name}
              initial={{ flexGrow: 0 }} animate={{ flexGrow: c.value }} transition={{ delay: i * 0.05, type: "spring", stiffness: 60, damping: 16 }}
              className="min-w-[3px] basis-0 rounded-md" style={{ background: `linear-gradient(180deg, ${catColor(c.name, 80)}, ${catColor(c.name, 55)})` }} />
          ))}
          {a.categories.length === 0 && <div className="flex-1 rounded-2xl border border-dashed border-line-2" />}
        </div>
      </section>

      <ul className="mt-6 space-y-1">
        {a.categories.map((c, i) => {
          const pct = total ? c.value / total : 0
          const expected = c.prev * (a.dayOfMonth / a.dim)
          const delta = expected > 80 && a.dayOfMonth >= 10 ? (c.value - expected) / expected : null
          return (
            <motion.li key={c.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
              className="flex items-center gap-3 border-b border-line py-3">
              <span className="size-2.5 rounded-full" style={{ background: catColor(c.name), boxShadow: `0 0 10px ${catColor(c.name)}` }} />
              <span className="flex-1">{c.name}</span>
              {delta !== null && Math.abs(delta) > 0.1 && delta < 2.5 && (
                <span className={`num rounded-full px-2 py-0.5 text-[11px] ${delta > 0 ? "bg-ember/15 text-ember" : "bg-mint/15 text-mint"}`}>
                  {delta > 0 ? "↑" : "↓"}{Math.round(Math.abs(delta) * 100)}%
                </span>
              )}
              <span className="num w-10 text-right text-xs text-fg-3">{Math.round(pct * 100)}%</span>
              <span className="num w-24 text-right">{brl(c.value, false)}</span>
            </motion.li>
          )
        })}
      </ul>

      {/* taxa de poupança */}
      <section className="glass mt-8 flex items-center gap-5 rounded-[28px] p-5">
        <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
          <circle cx="40" cy="40" r="32" fill="none" stroke="white" strokeOpacity=".08" strokeWidth="8" />
          <motion.circle cx="40" cy="40" r="32" fill="none" stroke={savingsRate >= 0 ? "var(--color-mint)" : "var(--color-rose)"} strokeWidth="8" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: Math.min(1, Math.abs(savingsRate)) }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} />
        </svg>
        <div>
          <p className="eyebrow">Taxa de poupança</p>
          <p className="num mt-1 text-3xl">{Math.round(savingsRate * 100)}%</p>
          <p className="text-xs text-fg-3">do que entrou ficou com você</p>
        </div>
      </section>

      {/* seis meses */}
      <section className="mt-8">
        <p className="eyebrow mb-4">Últimos 6 meses</p>
        <div className="flex h-44 items-end gap-3">
          {months.map((m, i) => (
            <div key={m.ym} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-36 w-full items-end justify-center gap-1">
                <motion.span initial={{ height: 0 }} animate={{ height: `${(m.inc / peak) * 100}%` }} transition={{ delay: i * 0.06, type: "spring", stiffness: 80, damping: 16 }}
                  className="w-2.5 rounded-full bg-mint/70" />
                <motion.span initial={{ height: 0 }} animate={{ height: `${(m.out / peak) * 100}%` }} transition={{ delay: 0.1 + i * 0.06, type: "spring", stiffness: 80, damping: 16 }}
                  className={`w-2.5 rounded-full ${m.ym === a.ym ? "bg-acid" : "bg-fg/30"}`} />
              </div>
              <span className={`num text-[11px] ${m.ym === a.ym ? "text-acid" : "text-fg-3"}`}>{MONTHS[Number(m.ym.slice(5)) - 1]}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-fg-3">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-mint/70" />Entradas</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-fg/30" />Saídas</span>
          <span className="ml-auto num">média {compact(months.reduce((s, m) => s + m.out, 0) / 6)}/mês</span>
        </div>
      </section>
    </div>
  )
}
