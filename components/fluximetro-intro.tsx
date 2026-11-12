"use client"

import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "framer-motion"
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { ArrowRight } from "lucide-react"
import type { FluximetroMood } from "@/lib/fluximetro"
import { Fluximetro } from "./fluximetro"
import { rise, spring } from "./ui"

// ---------- medidas do palco ----------
const SIZE = 196 // lado do mascote
const PAD = 46 // folga em volta, onde fica o arco de marcações
const W = SIZE + PAD * 2
const R = SIZE / 2 + 26 // raio do arco
const TICKS = 21
const SPAN = 84 // graus de cada lado do centro

/** Pontos para onde ele olha enquanto brinca sozinho. */
const WANDER = [
  { x: -0.85, y: 0.15 },
  { x: 0.8, y: -0.2 },
  { x: 0.15, y: 0.7 },
  { x: -0.55, y: -0.6 },
  { x: 0.6, y: 0.5 },
  { x: 0, y: 0 },
]
/** Humor de cada fala. */
const LINE_MOOD: FluximetroMood[] = ["happy", "thinking", "happy"]

const clamp = (n: number) => Math.max(-1, Math.min(1, n))

function script(name: string) {
  const first = name.trim().split(" ")[0] || "você"
  return [
    `Oi, ${first}! Eu sou o Fluximetro.`,
    "Vou ser o agente do seu dinheiro: aviso quando o mês apertar e respondo quanto ainda cabe.",
    "Ainda estou me montando. Em breve a gente conversa por aqui.",
  ]
}

/**
 * Apresentação do Fluximetro ao abrir o app: ele cai na tela, brinca olhando em volta
 * (o ponteiro do medidor acompanha o olhar), se apresenta e avisa que o agente vem em breve.
 */
export function FluximetroIntro({ name, onClose }: { name: string; onClose: () => void }) {
  const reduced = !!useReducedMotion()
  const LINES = useRef(script(name)).current
  const last = LINES.length - 1

  const [line, setLine] = useState(-1) // -1: ainda chegando
  const [finished, setFinished] = useState(false)
  const [look, setLook] = useState({ x: 0, y: 0 })
  const [bump, setBump] = useState(false)

  const stage = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const lastTouch = useRef(0)
  const advance = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const bumpTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const close = useRef(onClose)
  close.current = onClose
  const hop = useAnimationControls()

  // começa a falar depois que ele aterrissa
  useEffect(() => {
    const t = setTimeout(() => setLine(0), reduced ? 150 : 1100)
    return () => clearTimeout(t)
  }, [reduced])

  // terminou de digitar a fala i: dá tempo de ler e passa para a próxima
  // (sem digitação, a fala aparece inteira de uma vez, então o tempo de leitura é maior)
  const lineDone = useCallback((i: number, instant: boolean) => {
    clearTimeout(advance.current)
    if (i >= last) { setFinished(true); return }
    const wait = instant ? 1200 + LINES[i].length * 45 : 900 + LINES[i].length * 10
    advance.current = setTimeout(() => setLine((l) => (l === i ? i + 1 : l)), wait)
  }, [last, LINES])

  // brinca sozinho, a não ser que a pessoa esteja mexendo nele
  useEffect(() => {
    if (reduced) return
    let k = 0
    const id = setInterval(() => {
      if (Date.now() - lastTouch.current < 2400) return
      setLook(WANDER[k++ % WANDER.length])
    }, 1500)
    return () => clearInterval(id)
  }, [reduced])

  const poke = useCallback(() => {
    setBump(true)
    clearTimeout(bumpTimer.current)
    bumpTimer.current = setTimeout(() => setBump(false), 1400)
    if (!reduced) {
      hop.start({
        y: [0, -28, 0, -9, 0],
        scaleX: [1, 0.96, 1.05, 0.99, 1],
        scaleY: [1, 1.05, 0.93, 1.02, 1],
        transition: { duration: 0.75, times: [0, 0.3, 0.55, 0.78, 1], ease: "easeOut" },
      })
    }
  }, [hop, reduced])

  // pulinho de "oi" quando a primeira fala começa
  useEffect(() => { if (line === 0) poke() }, [line, poke])

  useEffect(() => () => { clearTimeout(advance.current); clearTimeout(bumpTimer.current) }, [])

  // Esc fecha, a página de trás não rola e o foco entra no diálogo (sem anel, para não parecer um erro ao abrir)
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && close.current()
    window.addEventListener("keydown", k)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    dialog.current?.focus({ preventScroll: true })
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev }
  }, [])

  // ele olha para onde o dedo (ou o mouse) está
  const aim = useCallback((e: ReactPointerEvent) => {
    const r = stage.current?.getBoundingClientRect()
    if (!r) return
    lastTouch.current = Date.now()
    setLook({ x: clamp((e.clientX - (r.left + W / 2)) / 170), y: clamp((e.clientY - (r.top + PAD + SIZE / 2)) / 170) })
  }, [])

  const mood: FluximetroMood = bump ? "happy" : line >= 0 ? LINE_MOOD[Math.min(line, LINE_MOOD.length - 1)] : "idle"

  return (
    <motion.div
      ref={dialog} tabIndex={-1} style={{ outline: "none" }}
      role="dialog" aria-modal="true" aria-labelledby="fluximetro-title"
      className="fixed inset-0 z-[70] touch-none select-none overflow-hidden bg-cotton/80 backdrop-blur-2xl backdrop-saturate-150"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(10px)" }} transition={{ duration: 0.35 }}
      onPointerMove={aim} onPointerDown={aim}
    >
      <p className="sr-only">{LINES.join(" ")}</p>

      {/* brilho laranja atrás do mascote */}
      <div className="pointer-events-none absolute inset-x-0 top-[14%] mx-auto w-[360px] max-w-full">
        <div className="blob aspect-square rounded-full bg-[radial-gradient(circle,rgb(255_78_32/0.30),transparent_68%)]" />
      </div>

      <div className="relative mx-auto flex h-full max-w-[480px] flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))]">
        <div className="flex flex-1 flex-col items-center justify-center">
          {/* palco: arco de marcações + ponteiro + mascote */}
          <div ref={stage} className="relative" style={{ width: W, height: PAD + SIZE + 6 }}>
            <Meter x={reduced ? 0 : look.x} />
            <motion.div
              className="absolute" style={{ left: PAD, top: PAD, width: SIZE, height: SIZE }}
              initial={reduced ? { opacity: 0 } : { y: -170, opacity: 0, scale: 0.7, filter: "blur(12px)" }}
              animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={reduced ? { duration: 0.2 } : { type: "spring", stiffness: 170, damping: 11, mass: 0.9, delay: 0.15 }}
            >
              <motion.div animate={hop} style={{ originY: 1 }}>
                <button type="button" onClick={poke} aria-label="Brincar com o Fluximetro" className="block rounded-[36px]">
                  <Fluximetro size={SIZE} mood={mood} look={look} label="" />
                </button>
              </motion.div>
            </motion.div>
          </div>

          {/* nome + aviso */}
          <motion.div {...rise} transition={{ ...spring, delay: reduced ? 0 : 0.7 }} className="mt-3 flex items-center justify-center gap-2.5">
            <h2 id="fluximetro-title" className="ttl text-[30px] leading-none">Fluximetro</h2>
            <span className="lg flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold">
              <motion.span aria-hidden className="size-1.5 rounded-full bg-otan" style={{ boxShadow: "0 0 8px 1px rgb(255 78 32 / 0.8)" }}
                animate={reduced ? undefined : { opacity: [1, 0.35, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
              Em breve
            </span>
          </motion.div>

          {/* balão de fala */}
          <div className="relative mt-5 w-full">
            <span aria-hidden className="absolute -top-1.5 left-1/2 size-4 -translate-x-1/2 rotate-45 rounded-[4px] bg-card" />
            <div className="relative min-h-[118px] rounded-[23px] bg-card px-5 py-4">
              <AnimatePresence mode="wait" initial={false}>
                {line < 0 ? (
                  <motion.div key="wait" aria-hidden className="flex h-[26px] items-center gap-1.5"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i} className="size-2 rounded-full bg-faint"
                        animate={reduced ? undefined : { y: [0, -5, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.p key={line} aria-hidden className="text-[17px] leading-snug"
                    initial={{ opacity: 0, y: 8, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -6, filter: "blur(6px)" }} transition={{ duration: 0.25 }}>
                    <Typed text={LINES[line]} instant={reduced} onDone={() => lineDone(line, reduced)} />
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* quantas falas já passaram */}
          <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
            {LINES.map((_, i) => (
              <motion.span key={i} className="h-1.5 rounded-full"
                animate={{ width: i === line ? 20 : 6, backgroundColor: i <= line ? "var(--c-ink)" : "var(--c-sand-2)" }} transition={spring} />
            ))}
          </div>
        </div>

        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={onClose}
          className="relative flex h-14 w-full items-center justify-center gap-2 rounded-[28px] bg-ink font-semibold text-cotton">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={finished ? "go" : "skip"} initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }} transition={{ duration: 0.15 }}>
              {finished ? "Bora ver meu mês" : "Pular"}
            </motion.span>
          </AnimatePresence>
          <ArrowRight size={18} />
        </motion.button>
      </div>
    </motion.div>
  )
}

/** Digita o texto letra por letra. O que falta fica invisível, para o balão não mudar de forma. */
function Typed({ text, instant, onDone }: { text: string; instant: boolean; onDone: () => void }) {
  const [n, setN] = useState(instant ? text.length : 0)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    if (instant) { setN(text.length); done.current(); return }
    let k = 0
    const id = setInterval(() => {
      k += 1
      setN(k)
      if (k >= text.length) { clearInterval(id); done.current() }
    }, 26)
    return () => clearInterval(id)
  }, [text, instant])
  return (
    <>
      {text.slice(0, n)}
      {n < text.length && <span aria-hidden className="-mr-[2px] inline-block h-[1em] w-[2px] translate-y-[2px] rounded-full bg-otan" />}
      <span className="invisible">{text.slice(n)}</span>
    </>
  )
}

/** O "-metro" do Fluximetro: marcações em arco e um ponteiro que segue o olhar, com a folga de um medidor analógico. */
function Meter({ x }: { x: number }) {
  const c = W / 2
  const ticks = Array.from({ length: TICKS }, (_, k) => {
    const long = k % 5 === 0
    const a = ((-SPAN + (k * SPAN * 2) / (TICKS - 1)) * Math.PI) / 180
    const r2 = R + (long ? 12 : 7)
    return { k, long, x1: c + Math.sin(a) * R, y1: c - Math.cos(a) * R, x2: c + Math.sin(a) * r2, y2: c - Math.cos(a) * r2 }
  })
  return (
    <>
      <svg aria-hidden width={W} height={W} viewBox={`0 0 ${W} ${W}`} className="pointer-events-none absolute left-0 top-0">
        {ticks.map((t) => (
          <line key={t.k} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="var(--c-sand-3)" strokeWidth={t.long ? 3.5 : 3} strokeLinecap="round" />
        ))}
      </svg>
      <motion.div aria-hidden className="pointer-events-none absolute left-0 top-0" style={{ width: W, height: W }}
        animate={{ rotate: x * SPAN }} transition={{ type: "spring", stiffness: 90, damping: 11 }}>
        <svg width={W} height={W} viewBox={`0 0 ${W} ${W}`}>
          <line x1={c} y1={c - R + 6} x2={c} y2={c - R - 17} stroke="#FF4E20" strokeWidth={5} strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 6px rgb(255 78 32 / 0.75))" }} />
        </svg>
      </motion.div>
    </>
  )
}
