"use client"

import { motion } from "framer-motion"
import { useMemo } from "react"
import type { Snapshot } from "@/lib/types"
import { brl, int, type Analysis } from "@/lib/finance"

/** Gasto acumulado do mês, projeção no ritmo atual e o dia em que chega no teto. */
export function useRitmo(snap: Snapshot, a: Analysis) {
  return useMemo(() => {
    const byDay = Array.from({ length: a.dim }, () => 0)
    for (const t of snap.txs) if (t.kind === "expense" && t.date.startsWith(a.ym)) byDay[Number(t.date.slice(8)) - 1] += t.amount
    const cum: number[] = []
    byDay.reduce((acc, v, i) => (cum[i] = acc + v), 0)
    const today = a.dayOfMonth
    const spent = cum[today - 1] ?? 0
    const avg = spent / Math.max(1, today)
    const budget = a.budget
    let hitDay: number | null = null
    if (budget > 0) {
      if (spent >= budget) hitDay = cum.findIndex((v) => v >= budget) + 1
      else { const d = today + Math.ceil((budget - spent) / Math.max(1, avg)); hitDay = d <= a.dim ? d : null }
    }
    const projected = spent + avg * (a.dim - today)
    const last7 = byDay.slice(Math.max(0, today - 7), today).reduce((x, y) => x + y, 0)
    const prev7 = byDay.slice(Math.max(0, today - 14), Math.max(0, today - 7)).reduce((x, y) => x + y, 0)
    const peak = byDay.slice(0, today).reduce((m, v, i) => (v > byDay[m] ? i : m), 0)
    return { byDay, cum, spent, avg, budget, hitDay, projected, last7, prev7, peak }
  }, [snap.txs, a])
}

const pill = "rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap"

export function RitmoCard({ snap, a }: { snap: Snapshot; a: Analysis }) {
  const r = useRitmo(snap, a)
  const W = 320, H = 150, top = 22, bot = 124
  const maxV = Math.max(r.budget * 1.08, r.projected, r.spent, 1)
  const X = (d: number) => 8 + ((d - 1) / Math.max(1, a.dim - 1)) * (W - 16)
  const Y = (v: number) => bot - (v / maxV) * (bot - top)
  const pts = r.cum.slice(0, a.dayOfMonth).map((v, i) => [X(i + 1), Y(v)] as const)
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("")
  const [lx, ly] = pts[pts.length - 1] ?? [8, bot]
  const over = r.budget > 0 && r.hitDay !== null
  const days = r.hitDay !== null ? Math.max(0, r.hitDay - a.dayOfMonth) : null
  return (
    <section className="rounded-[26px] bg-card p-5">
      <div className="flex items-baseline justify-between text-[14px] text-mute"><span>Ritmo do mês</span><span className="first-letter:uppercase">{new Date(a.ym + "-15T12:00:00Z").toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" })}</span></div>
      <div className="mt-2.5 flex items-center gap-2.5">
        <span className="num text-[34px] leading-none">{brl(r.spent, false)}</span>
        {r.budget > 0 && <span className={`${pill} ${over ? "bg-otan/12 text-gravy" : "bg-[#E3F3EA] text-[#1F8A5B]"}`}>{over ? "Acima do ritmo" : "No ritmo"}</span>}
      </div>
      <p className="mt-2 text-[13.5px] leading-snug text-mute">
        {r.budget <= 0 ? "Defina um teto pra ver quando o mês aperta." : over ? (r.spent >= r.budget ? `Você passou do teto no dia ${r.hitDay}.` : `Nesse ritmo, você chega no teto no dia ${r.hitDay}.`) : `Nesse ritmo, o mês fecha em ${brl(r.projected, false)} e sobra uns ${brl(r.budget - r.projected, false)}.`}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 block h-auto w-full overflow-visible" role="img" aria-label="Gasto acumulado do mês e projeção">
        {r.budget > 0 && <>
          <line x1="8" x2={W - 8} y1={Y(r.budget)} y2={Y(r.budget)} stroke="var(--c-sand-2)" strokeDasharray="3 4" />
          <text x="8" y={Y(r.budget) - 7} fontSize="11" fill="var(--c-mute)">teto {brl(r.budget, false)}</text>
        </>}
        <motion.path d={`${line} L${lx} ${bot} L8 ${bot}Z`} fill="#FF4E20" fillOpacity={0.12} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} />
        <motion.path d={line} fill="none" stroke="#FF4E20" strokeWidth="2.4" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: [0.2, 0.9, 0.2, 1] }} />
        <path d={`M${lx} ${ly} L${X(a.dim)} ${Y(r.projected)}`} fill="none" stroke="#FF4E20" strokeOpacity={0.55} strokeWidth="2" strokeDasharray="5 5" />
        <line x1={lx} x2={lx} y1={ly} y2={bot} stroke="var(--c-faint)" strokeDasharray="2 3" />
        {r.hitDay !== null && r.budget > 0 && <>
          <line x1={X(r.hitDay)} x2={X(r.hitDay)} y1={Y(r.budget)} y2={bot} stroke="var(--c-gravy)" strokeDasharray="2 3" />
          <circle cx={X(r.hitDay)} cy={Y(r.budget)} r="4.5" fill="var(--c-gravy)" stroke="var(--c-card)" strokeWidth="2" />
        </>}
        <circle cx={lx} cy={ly} r="4.5" fill="#FF4E20" stroke="var(--c-card)" strokeWidth="2" />
        <text x="8" y={H - 2} fontSize="11" fill="var(--c-mute)">dia 1</text>
        <text x={lx} y={H - 2} fontSize="11" fontWeight="600" fill="var(--c-ink)" textAnchor="middle">hoje</text>
        {r.hitDay !== null && Math.abs(X(r.hitDay) - lx) > 30 && <text x={X(r.hitDay)} y={H - 2} fontSize="11" fontWeight="600" fill="var(--c-gravy)" textAnchor="middle">dia {r.hitDay}</text>}
      </svg>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[["Média/dia", brl(r.avg, false)], ["Ainda cabe", brl(Math.max(0, a.free), false)], ["Teto em", days === null ? "não chega" : days === 0 ? "hoje" : `${days} ${days === 1 ? "dia" : "dias"}`]].map(([k, v]) => (
          <div key={k} className="rounded-[14px] bg-paper px-3 py-2.5 text-[12px] text-mute">{k}<b className="num mt-0.5 block text-[15px] text-ink">{v}</b></div>
        ))}
      </div>
    </section>
  )
}

const SCALE = ["var(--c-paper)", "#FFE1D6", "#FFB89E", "#FF8A63", "#FF4E20"]

export function GastosDiaCard({ snap, a }: { snap: Snapshot; a: Analysis }) {
  const r = useRitmo(snap, a)
  const max = Math.max(1, ...r.byDay.slice(0, a.dayOfMonth))
  const first = new Date(a.ym + "-01T12:00:00Z").getUTCDay()
  const delta = r.prev7 > 0 ? Math.round(((r.last7 - r.prev7) / r.prev7) * 100) : null
  const peakDate = new Date(`${a.ym}-${String(r.peak + 1).padStart(2, "0")}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", timeZone: "UTC" })
  return (
    <section className="rounded-[26px] bg-card p-5">
      <div className="flex items-baseline justify-between text-[14px] text-mute"><span>Gastos por dia</span><span>últimos 7 dias</span></div>
      <div className="mt-2.5 flex items-center gap-2.5">
        <span className="num text-[34px] leading-none">{brl(r.last7, false)}</span>
        {delta !== null && <span className={`${pill} ${delta <= 0 ? "bg-[#E3F3EA] text-[#1F8A5B]" : "bg-otan/12 text-gravy"}`}>{delta > 0 ? "+" : "−"}{Math.abs(delta)}%</span>}
      </div>
      <p className="mt-2 text-[13.5px] text-mute">média de R$ {int(r.last7 / 7)} por dia</p>
      <div className="mt-4 grid grid-cols-7 gap-[5px]">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <span key={i} className="pb-1 text-center text-[10.5px] text-faint">{d}</span>)}
        {Array.from({ length: first }, (_, i) => <span key={`e${i}`} />)}
        {r.byDay.map((v, i) => {
          const future = i + 1 > a.dayOfMonth
          const lvl = v <= 0 ? 0 : Math.min(4, 1 + Math.floor((v / max) * 3.999))
          return (
            <motion.span key={i} title={`Dia ${i + 1}: ${brl(v, false)}`} aria-label={`Dia ${i + 1}: ${brl(v, false)}`}
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.012 }}
              className="aspect-[1.45] rounded-[7px]" style={future ? { boxShadow: "inset 0 0 0 1.5px var(--c-paper)" } : { background: SCALE[lvl] }} />
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-mute">
        <span className="first-letter:uppercase">Mais caro: {peakDate}</span>
        <span className="flex items-center gap-1">Menos {SCALE.map((c) => <i key={c} className="size-[11px] rounded-[3px]" style={{ background: c }} />)} Mais</span>
      </div>
    </section>
  )
}
