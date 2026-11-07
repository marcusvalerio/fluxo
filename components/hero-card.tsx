"use client"

import { motion } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import type { Snapshot } from "@/lib/types"
import { brl, int, type Analysis } from "@/lib/finance"
import { Ticker } from "./ui"

const KEY = "fluxo-privacy"

/** Liga/desliga o modo privacidade (borra todos os valores). Lembra a escolha no aparelho. */
export function usePrivacy() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    let v = false
    try { v = localStorage.getItem(KEY) === "1" } catch {}
    setOn(v)
    document.documentElement.classList.toggle("privacy", v)
  }, [])
  const toggle = () => {
    const v = !on
    setOn(v)
    document.documentElement.classList.toggle("privacy", v)
    try { localStorage.setItem(KEY, v ? "1" : "0") } catch {}
    if (navigator.vibrate) navigator.vibrate(8)
  }
  return { on, toggle }
}

/** Card principal: quanto ainda cabe, com cor que reage ao mês e gráfico que dá para arrastar. */
export function HeroCard({ snap, a, score }: { snap: Snapshot; a: Analysis; score: number }) {
  const privacy = usePrivacy()
  const tight = a.free < 0
  const mood = tight ? "bad" : score < 60 ? "warn" : "ok"
  const bg = {
    ok: "radial-gradient(120% 90% at 100% 0%, rgb(255 78 32 / 0.28), transparent 55%), linear-gradient(160deg, #26323A, #161D22)",
    warn: "radial-gradient(120% 90% at 100% 0%, rgb(255 140 90 / 0.35), transparent 55%), linear-gradient(160deg, #FF5A2C, #B83312)",
    bad: "radial-gradient(120% 90% at 100% 0%, rgb(255 78 32 / 0.5), transparent 60%), linear-gradient(160deg, #8E2A10, #3A140A)",
  }[mood]

  // gasto acumulado por dia x ritmo ideal
  const series = useMemo(() => {
    let acc = 0
    return a.days.map((d) => { if (!d.future) acc += d.total; return { day: d.day, acc, future: d.future } })
  }, [a.days])
  const ideal = (day: number) => (a.budget > 0 ? (a.budget / a.dim) * day : 0)
  const maxY = Math.max(a.budget, series[series.length - 1]?.acc ?? 0, 1) * 1.05
  const W = 320, H = 92
  const x = (day: number) => ((day - 1) / (a.dim - 1)) * W
  const y = (v: number) => H - (v / maxY) * H
  const past = series.filter((p) => !p.future)
  const path = past.map((p, i) => `${i ? "L" : "M"}${x(p.day).toFixed(1)},${y(p.acc).toFixed(1)}`).join("")
  const area = past.length ? `${path}L${x(past[past.length - 1].day)},${H}L0,${H}Z` : ""

  const [scrub, setScrub] = useState<number | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const pick = (clientX: number) => {
    const r = box.current!.getBoundingClientRect()
    const d = Math.round(((clientX - r.left) / r.width) * (a.dim - 1)) + 1
    const v = Math.min(a.dayOfMonth, Math.max(1, d))
    if (v !== scrub && navigator.vibrate) navigator.vibrate(3)
    setScrub(v)
  }
  const sp = scrub ? series[scrub - 1] : null

  return (
    <section className="relative overflow-hidden rounded-[23px] p-5 text-white shadow-[0_24px_50px_-24px_rgb(31_40_46/0.7)]" style={{ background: bg, transition: "background 600ms" }}>
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-white/70">{tight ? "Passou do teto" : `Livre até dia ${a.dim}`}</p>
        <div className="flex items-center gap-2">
          <span className="ttl text-[13px] text-white/60">{a.daysLeft} {a.daysLeft === 1 ? "dia" : "dias"}</span>
          <button onClick={privacy.toggle} aria-label={privacy.on ? "Mostrar valores" : "Esconder valores"} aria-pressed={privacy.on}
            className="grid size-9 place-items-center rounded-full bg-white/12 backdrop-blur">
            {privacy.on ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <motion.p key={sp ? "s" : "m"} initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }} className="num mt-3 text-[48px] leading-none">
        <span className="mr-1 text-[22px] text-white/50">{!sp && a.free < 0 ? "−R$" : "R$"}</span>
        {sp ? int(sp.acc) : <Ticker value={Math.abs(Math.floor(a.free))} format={(n) => Math.round(n).toLocaleString("pt-BR")} />}
        {!sp && <span className="text-[22px] text-white/50">,{String(Math.round((Math.abs(a.free) % 1) * 100)).padStart(2, "0")}</span>}
      </motion.p>
      <p className="mt-2 h-5 text-[14px] text-white/75">
        {sp ? <>Gasto até o dia {sp.day}{a.budget > 0 && <> · ideal <span className="num text-white">R$ {int(ideal(sp.day))}</span></>}</> :
          a.budget <= 0 ? "Defina um teto no menu da sua inicial." :
          tight ? <>Você está <span className="num text-white">{brl(-a.free, false)}</span> acima do teto.</> :
          <>Dá uns <span className="num text-white">R$ {int(a.perDay)}</span> por dia sem apertar.</>}
      </p>

      <div ref={box} className="relative mt-4 touch-none select-none" style={{ height: H }}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); pick(e.clientX) }}
        onPointerMove={(e) => (e.buttons || e.pointerType === "mouse") && pick(e.clientX)}
        onPointerUp={() => setScrub(null)} onPointerLeave={() => setScrub(null)} onPointerCancel={() => setScrub(null)}
        aria-label="Gasto acumulado do mês; arraste para ver cada dia" role="img">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="heroArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.28" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {a.budget > 0 && <line x1={0} y1={y(0)} x2={W} y2={y(a.budget)} stroke="#fff" strokeOpacity="0.35" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />}
          {area && <motion.path d={area} fill="url(#heroArea)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />}
          {path && <motion.path d={path} fill="none" stroke="#fff" strokeWidth={2.2} strokeLinejoin="round" vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: [0.2, 0.9, 0.2, 1] }} />}
        </svg>
        {past.length > 0 && (() => {
          const p = sp ?? past[past.length - 1]
          return (
            <>
              {sp && <span className="absolute top-0 h-full w-px bg-white/40" style={{ left: `${(x(p.day) / W) * 100}%` }} />}
              <span className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-otan"
                style={{ left: `${(x(p.day) / W) * 100}%`, top: `${(y(p.acc) / H) * 100}%` }} />
            </>
          )
        })()}
      </div>
      <div className="ttl mt-2 flex justify-between text-[11px] text-white/50">
        <span>dia 1</span><span>{a.budget > 0 ? "- - - ritmo ideal" : ""}</span><span>dia {a.dim}</span>
      </div>
    </section>
  )
}
