"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import type { Snapshot } from "@/lib/types"
import { brl, int, type Analysis } from "@/lib/finance"
import { Ticker } from "./ui"

const KEY = "fluxo-privacy"

/** Modo privacidade: esconde todos os valores do app e lembra a escolha no aparelho. */
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
    if (navigator.vibrate) navigator.vibrate(v ? 8 : [6, 30, 10])
  }
  return { on, toggle }
}

/** Card principal: quanto ainda cabe, com a régua de palitos do mês (altura = gasto do dia). */
export function HeroCard({ snap, a, score }: { snap: Snapshot; a: Analysis; score: number }) {
  const privacy = usePrivacy()
  const [wave, setWave] = useState(0)
  const tight = a.free < 0
  // sempre laranja; escurece quando o mês passa do teto
  const bg = tight
    ? "radial-gradient(120% 90% at 100% 0%, rgb(255 120 80 / 0.35), transparent 55%), linear-gradient(160deg, #B83312, #6E1D08)"
    : "radial-gradient(120% 90% at 100% 0%, rgb(255 190 150 / 0.45), transparent 55%), linear-gradient(160deg, #FF5A2C, #E2401C 55%, #B83312)"
  void score

  const peak = Math.max(a.dailyCap * 1.6, ...a.days.map((d) => d.total), 1)
  const [scrub, setScrub] = useState<number | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const pick = (clientX: number) => {
    const r = box.current!.getBoundingClientRect()
    const d = Math.min(a.dim, Math.max(1, Math.floor(((clientX - r.left) / r.width) * a.dim) + 1))
    if (d !== scrub && navigator.vibrate) navigator.vibrate(3)
    setScrub(d)
  }
  const sd = scrub ? a.days[scrub - 1] : null
  const hidden = privacy.on
  const dots = <span className="text-[34px] tracking-[0.04em]">•••••</span>

  return (
    <section className="relative isolate overflow-hidden rounded-[23px] px-5 pb-4 pt-4 text-white shadow-[0_24px_50px_-20px_rgb(255_78_32/0.55)]" style={{ background: bg, transition: "background 600ms" }}>
      {/* revelação líquida: uma lente de vidro nasce do olho e atravessa o card */}
      <AnimatePresence>
        {wave > 0 && (
          <motion.span key={wave} aria-hidden className="pointer-events-none absolute right-[38px] top-[38px] -z-0 size-24 -translate-y-1/2 translate-x-1/2 rounded-full"
            style={{
              background: "radial-gradient(circle, transparent 52%, rgb(255 255 255 / 0.22) 64%, rgb(255 255 255 / 0.05) 72%, transparent 76%)",
              backdropFilter: "blur(3px) saturate(180%) brightness(1.15)", WebkitBackdropFilter: "blur(3px) saturate(180%) brightness(1.15)",
              boxShadow: "inset 0 0 18px rgb(255 255 255 / 0.35), 0 0 30px rgb(255 255 255 / 0.15)",
            }}
            initial={{ scale: 0, opacity: 1 }} animate={{ scale: 9, opacity: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.2, 0.8, 0.2, 1] }}
            onAnimationComplete={() => setWave(0)} />
        )}
      </AnimatePresence>

      <div className="relative flex items-center justify-between">
        <p className="text-[14px] font-medium text-white/85">{tight ? "Passou do teto" : `Livre até dia ${a.dim}`}</p>
        <div className="flex items-center gap-2">
          <span className="ttl text-[13px] text-white/75">{a.daysLeft} {a.daysLeft === 1 ? "dia" : "dias"}</span>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => { privacy.toggle(); setWave(Date.now()) }}
            aria-label={hidden ? "Mostrar valores" : "Esconder valores"} aria-pressed={hidden}
            className="grid size-9 place-items-center rounded-full bg-white/18 shadow-[inset_0_1px_1px_rgb(255_255_255/0.3)] backdrop-blur">
            {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={hidden ? "h" : sd ? `d${sd.day}` : "v"}
          initial={{ opacity: 0, y: 6, filter: "blur(10px)", scale: 0.98 }} animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)" }} transition={{ duration: 0.35, ease: [0.2, 0.9, 0.2, 1] }} className="relative">
          <p className="ttl mt-2 text-[44px] font-bold leading-none tracking-[-0.035em]" style={{ fontFeatureSettings: '"tnum" 1' }}>
            <span className="mr-1 text-[20px] text-white/70">{!sd && a.free < 0 ? "−R$" : "R$"}</span>
            {hidden ? dots : sd ? int(sd.total) : <Ticker value={Math.abs(Math.floor(a.free))} format={(n) => Math.round(n).toLocaleString("pt-BR")} />}
            {!hidden && !sd && <span className="text-[20px] text-white/70">,{String(Math.round((Math.abs(a.free) % 1) * 100)).padStart(2, "0")}</span>}
          </p>
          <p className="mt-1.5 text-[14px] text-white/85">
            {sd ? (sd.future ? <>Dia {sd.day} · ainda não chegou</> : <>Gasto no dia {sd.day}{a.dailyCap > 0 && <> · teto <span className="ttl">R$ {hidden ? "•••" : int(a.dailyCap)}</span></>}</>) :
              a.budget <= 0 ? "Defina um teto no menu da sua inicial." :
              tight ? <>Você está <span className="ttl">{hidden ? "R$ •••" : brl(-a.free, false)}</span> acima do teto.</> :
              <>Dá uns <span className="ttl">R$ {hidden ? "•••" : int(a.perDay)}</span> por dia sem apertar.</>}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* régua de palitos: arraste para ver cada dia */}
      <div ref={box} className="relative mt-4 flex h-11 touch-none select-none items-end gap-[3px]"
        onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); pick(e.clientX) }}
        onPointerMove={(e) => (e.buttons || e.pointerType === "mouse") && pick(e.clientX)}
        onPointerUp={() => setScrub(null)} onPointerLeave={() => setScrub(null)} onPointerCancel={() => setScrub(null)}
        role="img" aria-label="Gasto de cada dia do mês. Arraste para ver.">
        {a.days.map((d, i) => {
          const h = d.future ? 40 : Math.max(40, (d.total / peak) * 100)
          const on = scrub === d.day
          return (
            <div key={d.iso} className="relative flex h-full flex-1 flex-col items-center justify-end">
              {d.over && !d.future && <span className="mb-[3px] size-[5px] rounded-full bg-[#1F282E]" />}
              <motion.span initial={{ scaleY: 0 }} animate={{ scaleY: on ? 1.08 : 1 }} transition={{ delay: scrub ? 0 : 0.25 + i * 0.018, type: "spring", stiffness: 420, damping: 16 }}
                className="w-full origin-bottom rounded-[3px]"
                style={{ height: `${h}%`, background: d.today ? "#1F282E" : d.future ? "rgb(255 255 255 / 0.28)" : on ? "#fff" : "rgb(255 255 255 / 0.92)", boxShadow: d.today ? "0 0 0 1.5px rgb(255 255 255 / 0.9)" : undefined }} />
            </div>
          )
        })}
      </div>
      <div className="ttl relative mt-1.5 flex justify-between text-[11px] text-white/70">
        <span>dia 1</span><span className="text-white">hoje</span><span>dia {a.dim}</span>
      </div>
    </section>
  )
}
