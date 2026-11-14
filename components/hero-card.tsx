"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import type { Snapshot } from "@/lib/types"
import { brl, int, type Analysis } from "@/lib/finance"
import { Ticker } from "./ui"

const KEY = "fluxo-privacy"
// arredonda pra o servidor e o navegador escreverem o mesmo número
const r2 = (n: number) => Math.round(n * 100) / 100

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
  // a cor acompanha o mês: laranja com folga, esquenta conforme aperta, telha quando passa do teto
  const left = a.budget > 0 ? a.free / a.budget : 1
  const bg = tight ? "#B83312" : left < 0.15 ? "#D23C16" : left < 0.35 ? "#EC4519" : "#FF4E20"
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
  const SEG = 17
  const fill = a.budget > 0 ? Math.max(0, Math.min(1, a.free / a.budget)) : 0
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

      {/* medidor em segmentos: os brancos são o que ainda cabe no teto */}
      <div className="relative mx-auto mt-3 w-full max-w-[300px]">
        <svg viewBox="-10 -10 320 190" className="block h-auto w-full overflow-visible" role="img"
          aria-label={a.budget > 0 ? `${Math.round(fill * 100)}% do teto ainda livre` : "Sem teto definido"}>
          {Array.from({ length: SEG }, (_, i) => {
            const ang = Math.PI - ((i + 0.5) / SEG) * Math.PI, on = (i + 0.5) / SEG < fill
            const c = Math.cos(ang), sn = Math.sin(ang)
            return (
              <motion.line key={i} x1={r2(150 + 120 * c)} y1={r2(162 - 120 * sn)} x2={r2(150 + 146 * c)} y2={r2(162 - 146 * sn)}
                strokeWidth="17" strokeLinecap="round" initial={{ stroke: "rgba(255,255,255,0.22)", pathLength: 0 }}
                animate={{ stroke: on ? "#ffffff" : "rgba(255,255,255,0.22)", pathLength: 1 }}
                transition={{ delay: 0.15 + i * 0.03, duration: 0.4 }} />
            )
          })}
        </svg>
      <AnimatePresence mode="wait" initial={false}>
          <motion.div key={hidden ? "h" : sd ? `d${sd.day}` : "v"}
            initial={{ opacity: 0, y: 6, filter: "blur(10px)", scale: 0.98 }} animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, filter: "blur(10px)" }} transition={{ duration: 0.35, ease: [0.2, 0.9, 0.2, 1] }} className="absolute inset-x-0 bottom-0 text-center">
            <p className="num text-[46px] leading-none" style={{ fontFeatureSettings: '"tnum" 1' }}>
              <span className="mr-1 text-[20px] text-white/70">{!sd && a.free < 0 ? "−R$" : "R$"}</span>
              {hidden ? dots : sd ? int(sd.total) : <Ticker value={Math.abs(Math.floor(a.free))} format={(n) => Math.round(n).toLocaleString("pt-BR")} />}
              {!hidden && !sd && <span className="text-[20px] text-white/70">,{String(Math.round((Math.abs(a.free) % 1) * 100)).padStart(2, "0")}</span>}
            </p>
          </motion.div>
        </AnimatePresence>
  
        </div>
      <p className="relative mx-auto mt-3 max-w-[30ch] text-balance text-center text-[13.5px] leading-snug text-white/85">
        {sd ? (sd.future ? <>Dia {sd.day} · ainda não chegou</> : <>Gasto no dia {sd.day}{a.dailyCap > 0 && <> · teto <span className="ttl">R$ {hidden ? "•••" : int(a.dailyCap)}</span></>}</>) :
          a.budget <= 0 ? "Toque na sua inicial e monte seu plano pra ver quanto cabe." :
          tight ? <>Você está <span className="ttl">{hidden ? "R$ •••" : brl(-a.free, false)}</span> acima do teto.</> :
          <>Dá uns <span className="ttl">R$ {hidden ? "•••" : int(a.perDay)}</span> por dia sem apertar.</>}
      </p>
      <div className="ttl relative mt-2.5 flex justify-between text-[11px] text-white/65">
        <span>R$ 0</span><span>{a.budget > 0 ? `teto ${brl(a.budget, false)}` : "sem teto"}</span>
      </div>
    </section>
  )
}
