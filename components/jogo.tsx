"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Heart, X } from "lucide-react"
import type { CofrinhoState } from "@/lib/cofrinho"
import { Cofrinho } from "./cofrinho"

type Kind = "moeda" | "nota" | "boleto"
interface Item { id: number; kind: Kind; x: number; y: number; vy: number; spin: number; el: HTMLDivElement }

const BEST = "fluxo-jogo-recorde"
const W = 70 // largura do cofrinho em px
const POINTS: Record<Kind, number> = { moeda: 1, nota: 5, boleto: 0 }
const FIM = [
  [0, "Nem uma moeda? O cofrinho tá com fome."],
  [10, "Deu pra pagar um café. Com pão de queijo, não."],
  [30, "Isso já paga a internet do mês."],
  [60, "Tá guardando melhor que muito banco."],
  [100, "Investidor nato. O cofrinho pediu aumento."],
] as const

function itemHtml(k: Kind) {
  if (k === "moeda") return `<span style="display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#FFC23D;box-shadow:inset 0 -3px 0 #E2A21A,inset 0 0 0 2px #E2A21A;font:700 12px var(--font-display),sans-serif;color:#9A6A00">R$</span>`
  if (k === "nota") return `<span style="display:grid;place-items:center;width:46px;height:26px;border-radius:6px;background:#57B98A;box-shadow:inset 0 0 0 2px #2F8F62;font:700 12px var(--font-display),sans-serif;color:#fff">50</span>`
  return `<span style="display:grid;place-items:center;width:44px;height:34px;border-radius:6px;background:var(--c-ink);color:var(--c-cotton);font:600 10px var(--font-sans),sans-serif;letter-spacing:.02em">boleto</span>`
}

/** Pega a grana: arraste o cofrinho pra pegar moedas e notas e fugir dos boletos. */
export function Jogo({ open, onClose }: { open: boolean; onClose: () => void }) {
  const field = useRef<HTMLDivElement>(null)
  const player = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<"start" | "play" | "end">("start")
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [best, setBest] = useState(0)
  const [mood, setMood] = useState<CofrinhoState>("normal")
  const moodT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const px = useRef(0.5) // posição do cofrinho, de 0 a 1

  useEffect(() => { try { setBest(Number(localStorage.getItem(BEST)) || 0) } catch {} }, [open])
  useEffect(() => { if (!open) setPhase("start") }, [open])

  const react = (s: CofrinhoState, ms = 700) => { clearTimeout(moodT.current); setMood(s); moodT.current = setTimeout(() => setMood("normal"), ms) }

  // laço do jogo: cria itens, faz cair, confere se o cofrinho pegou
  useEffect(() => {
    if (phase !== "play") return
    const box = field.current!
    let items: Item[] = [], raf = 0, last = performance.now(), spawn = 0, t = 0, id = 0
    let sc = 0, lv = 3
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now; t += dt
      const Wd = box.clientWidth, Hd = box.clientHeight
      const speed = 1 + Math.min(1.6, t / 40)
      spawn -= dt
      if (spawn <= 0) {
        spawn = Math.max(0.32, 0.9 - t / 60) * (0.7 + Math.random() * 0.6)
        const r = Math.random()
        const kind: Kind = r < 0.68 ? "moeda" : r < 0.8 ? "nota" : "boleto"
        const el = document.createElement("div")
        el.style.cssText = "position:absolute;left:0;top:0;will-change:transform;pointer-events:none"
        el.innerHTML = itemHtml(kind)
        box.appendChild(el)
        items.push({ id: id++, kind, x: 24 + Math.random() * (Wd - 48), y: -40, vy: (150 + Math.random() * 70) * speed * (kind === "nota" ? 0.8 : 1), spin: (Math.random() - 0.5) * 200, el })
      }
      const cx = 16 + px.current * (Wd - 32), top = Hd - 96
      items = items.filter((it) => {
        it.y += it.vy * dt
        if (it.kind === "nota") it.x += Math.sin(t * 3 + it.id) * 40 * dt
        it.el.style.transform = `translate(${it.x - 20}px, ${it.y}px) rotate(${it.kind === "boleto" ? 0 : it.y * it.spin * 0.004}deg)`
        const caught = it.y > top - 20 && it.y < top + 30 && Math.abs(it.x - cx) < W / 2 + 6
        if (caught) {
          if (it.kind === "boleto") { lv -= 1; setLives(lv); react("apertado", 900); navigator.vibrate?.([20, 40, 20]) }
          else { sc += POINTS[it.kind]; setScore(sc); react(it.kind === "nota" ? "feliz" : "guardou", it.kind === "nota" ? 900 : 600); navigator.vibrate?.(6) }
          it.el.animate([{ opacity: 1 }, { opacity: 0, transform: it.el.style.transform + " scale(.3)" }], { duration: 160 }).onfinish = () => it.el.remove()
          return false
        }
        if (it.y > Hd + 20) { it.el.remove(); return false }
        return true
      })
      if (lv <= 0) {
        items.forEach((i) => i.el.remove())
        try { const b = Number(localStorage.getItem(BEST)) || 0; if (sc > b) { localStorage.setItem(BEST, String(sc)); setBest(sc) } } catch {}
        setPhase("end"); return
      }
      if (player.current) player.current.style.transform = `translateX(${cx - W / 2}px)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const key = (e: KeyboardEvent) => { if (e.key === "ArrowLeft") px.current = Math.max(0, px.current - 0.06); if (e.key === "ArrowRight") px.current = Math.min(1, px.current + 0.06) }
    window.addEventListener("keydown", key)
    return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", key); items.forEach((i) => i.el.remove()) }
  }, [phase])

  const startGame = () => { setScore(0); setLives(3); setMood("normal"); px.current = 0.5; setPhase("play") }
  const drag = (clientX: number) => { const r = field.current!.getBoundingClientRect(); px.current = Math.max(0, Math.min(1, (clientX - r.left - 16) / (r.width - 32))) }
  const fim = [...FIM].reverse().find(([n]) => score >= n)![1]

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] mx-auto flex max-w-[480px] flex-col bg-cotton" role="dialog" aria-modal aria-label="Pega a grana"
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ type: "spring", stiffness: 380, damping: 34 }}>
          <header className="flex items-center justify-between px-5 pb-2 pt-[max(18px,env(safe-area-inset-top))]">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-faint">Pega a grana</p>
              <p className="num text-[32px] leading-none">R$ {score}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex gap-1" aria-label={`${lives} vidas`}>{[0, 1, 2].map((i) => <Heart key={i} size={18} className={i < lives ? "fill-otan text-otan" : "text-sand-2"} />)}</span>
              <button onClick={onClose} aria-label="Fechar o jogo" className="lg grid size-11 place-items-center rounded-full"><X size={18} /></button>
            </div>
          </header>

          <div ref={field} className="relative flex-1 touch-none select-none overflow-hidden"
            onPointerDown={(e) => { if (phase !== "play") return; e.currentTarget.setPointerCapture(e.pointerId); drag(e.clientX) }}
            onPointerMove={(e) => phase === "play" && (e.buttons || e.pointerType !== "mouse") && drag(e.clientX)}>
            <div ref={player} className="absolute bottom-[max(28px,env(safe-area-inset-bottom))] left-0" style={{ width: W, transform: "translateX(calc(50vw - 35px))" }}>
              <Cofrinho state={mood} swing label="" />
            </div>

            <AnimatePresence>
              {phase !== "play" && (
                <motion.div className="absolute inset-0 grid place-items-center px-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex max-w-[300px] flex-col items-center gap-4 text-center">
                    {phase === "start" ? (
                      <>
                        <h2 className="ttl text-[30px] leading-tight">Ajuda o Fluximetro a encher o cofrinho</h2>
                        <p className="text-[15px] leading-relaxed text-smoke">Arraste ele pros lados. Moeda vale R$ 1, nota vale R$ 5. Boleto tira uma vida, igual na vida real.</p>
                      </>
                    ) : (
                      <>
                        <h2 className="ttl text-[30px] leading-tight">Você guardou R$ {score}</h2>
                        <p className="text-[15px] leading-relaxed text-smoke">{fim}</p>
                        <p className="text-[13px] text-mute">Recorde: R$ {Math.max(best, score)}</p>
                      </>
                    )}
                    <button onClick={startGame} className="mt-2 h-14 w-full rounded-[28px] bg-ink font-semibold text-cotton">{phase === "start" ? "Jogar" : "Jogar de novo"}</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
