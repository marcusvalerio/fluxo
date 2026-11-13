"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { BellRing, CalendarClock, MessageCircleHeart, TrendingUp } from "lucide-react"
import type { CofrinhoState } from "@/lib/cofrinho"
import { Cofrinho } from "./cofrinho"
import { Sheet } from "./ui"
import type { Snapshot } from "@/lib/types"
import type { Analysis } from "@/lib/finance"
import { FluxiChat } from "./fluxi-chat"

// preferências do Fluximetro, guardadas no aparelho
const KEY = { met: "fluxo-fx-met", humor: "fluxo-fx-humor", nivel: "fluxo-fx-nivel", talk: "fluxo-fx-comenta" }
const read = (k: string, def: boolean) => { try { const v = localStorage.getItem(k); return v === null ? def : v === "1" } catch { return def } }
const write = (k: string, v: boolean) => { try { localStorage.setItem(k, v ? "1" : "0") } catch {} }
/** Nível de deboche: Educado (sem piada), Sincero (padrão) ou Sem filtro (zoa sem dó). */
export type Deboche = "educado" | "sincero" | "semfiltro"
const nivel = (): Deboche => {
  try { const v = localStorage.getItem(KEY.nivel); if (v === "educado" || v === "sincero" || v === "semfiltro") return v; return read(KEY.humor, true) ? "sincero" : "educado" } catch { return "sincero" }
}
export const fxPrefs = {
  nivel, setNivel: (v: Deboche) => { try { localStorage.setItem(KEY.nivel, v) } catch {} },
  humor: () => nivel() !== "educado",
  talk: () => read(KEY.talk, true), setTalk: (v: boolean) => write(KEY.talk, v),
}

/** O que o app pede pro Fluximetro fazer: mudar de forma e dizer alguma coisa. */
export interface FxReaction { state: CofrinhoState; text?: string; ms?: number }
export const reagir = (r: FxReaction) => window.dispatchEvent(new CustomEvent<FxReaction>("fluxo:reage", { detail: r }))

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const CONVITES = [
  "Psiu. Ainda não fomos apresentados. Toca em mim.",
  "Oi! Eu moro aqui agora. Vem me conhecer.",
  "Caí do céu pra cuidar das suas contas. Toca aqui que eu explico.",
]

/** Falas para quando você lança algo. `serio` desliga as piadas. */
export function falaDoLancamento(kind: "income" | "expense", label: string, tight: boolean, serio: boolean): FxReaction {
  if (kind === "income") return { state: "guardou", text: serio ? `Entrada anotada: ${label}.` : pick(["Plim! Dinheiro entrando. Separo um pouco pras metas?", "Opa! Meu ponteiro até subiu.", "Entrada anotada. Hoje eu durmo tranquilo."]) }
  if (tight) return { state: "apertado", text: serio ? "Esse passou do teto. Bora segurar até o próximo salário?" : fxPrefs.nivel() === "semfiltro" ? "Passou do teto. Parabéns, agora o mês é que tá te gastando." : "Esse passou do teto. Bora segurar até o próximo salário?" }
  if (serio) return { state: "pensando", text: `Anotado: ${label}.`, ms: 1400 }
  const forte = fxPrefs.nivel() === "semfiltro"
  if (forte && /ifood|delivery|rappi|lanche|pizza|hamb/i.test(label)) return { state: "pensando", text: pick(["De novo? Sua cozinha tá servindo de enfeite.", "Mais um. O motoboy já te chama de patrão.", "Anotado. Já pensou em casar com o iFood? Sai mais barato."]) }
  if (forte) return { state: "pensando", text: pick(["Lançado. Seu dinheiro pediu demissão.", "Anotado. Eu vi. Todo mundo viu.", "Mais um. Meu ponteiro tá com crise de ansiedade."]) }
  if (/ifood|delivery|rappi|lanche|pizza|hamb/i.test(label)) return { state: "pensando", text: pick(["Anotado. O motoboy já sabe seu nome.", "Delivery de novo? Eu anoto e não julgo. Muito."]) }
  return { state: "pensando", text: pick(["Lançado. Seu dinheiro saiu pra passear.", "Anotado. Não conto pra ninguém.", "Pronto. O ponteiro sentiu, mas aguenta."]) }
}

/**
 * O Fluximetro morando em cima do botão +: cai do céu quando o app abre, balança as perninhas,
 * chama pra conhecer e reage ao que acontece no app.
 */
export function FluximetroBuddy({ ready, hello, snap, a, natal = false }: { ready: boolean; hello?: FxReaction | null; snap: Snapshot; a: Analysis; natal?: boolean }) {
  const reduced = !!useReducedMotion()
  const [landed, setLanded] = useState(false)
  const [state, setState] = useState<CofrinhoState>("normal")
  const [bubble, setBubble] = useState<{ text: string; invite?: boolean } | null>(null)
  const [meet, setMeet] = useState(false)
  const [chat, setChat] = useState(false)
  const back = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hide = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const say = useCallback((r: FxReaction) => {
    clearTimeout(back.current); clearTimeout(hide.current)
    setState(r.state)
    back.current = setTimeout(() => setState("normal"), r.ms ?? 2400)
    if (r.text) { setBubble({ text: r.text }); hide.current = setTimeout(() => setBubble(null), 4800) }
  }, [])

  // depois de pousar: convida pra conhecer, ou dá o recado do dia
  useEffect(() => {
    if (!landed) return
    const t = setTimeout(() => {
      if (!read(KEY.met, false)) setBubble({ text: pick(CONVITES), invite: true })
      else if (hello && fxPrefs.talk()) say(hello)
    }, 250)
    return () => clearTimeout(t)
  }, [landed, hello, say])

  useEffect(() => {
    const on = (e: Event) => { if (fxPrefs.talk()) say((e as CustomEvent<FxReaction>).detail) }
    const open = () => setMeet(true)
    const talk = () => { setBubble(null); setChat(true) }
    window.addEventListener("fluxo:reage", on)
    window.addEventListener("fluxo:fluximetro", open)
    window.addEventListener("fluxo:conversa", talk)
    return () => { window.removeEventListener("fluxo:reage", on); window.removeEventListener("fluxo:fluximetro", open); window.removeEventListener("fluxo:conversa", talk) }
  }, [say])

  const openMeet = () => { setBubble(null); setMeet(true) }
  // depois de se conhecerem, tocar nele abre a conversa
  const tap = () => { setBubble(null); if (read(KEY.met, false)) setChat(true); else setMeet(true) }
  const closeMeet = () => {
    setMeet(false)
    if (!read(KEY.met, false)) {
      write(KEY.met, true)
      setTimeout(() => say({ state: "feliz", text: fxPrefs.humor() ? "Agora somos amigos. Isso significa que posso julgar seu iFood." : "Prazer! Tô por aqui quando precisar." }), 450)
    }
  }

  if (!ready) return null
  return (
    <>
      <motion.button type="button" onClick={tap} aria-label="Falar com o Fluximetro"
        className="absolute bottom-[calc(100%-20px)] left-1/2 z-10 w-[58px] -translate-x-1/2"
        initial={reduced ? { opacity: 0 } : { y: "-110vh", rotate: -25 }}
        animate={reduced ? { opacity: 1 } : { y: [null, 0, -26, 0], rotate: [null, 8, -4, 0], scaleX: [1, 1.14, 0.95, 1], scaleY: [1, 0.82, 1.06, 1] }}
        transition={reduced ? { duration: 0.3 } : { duration: 1.1, times: [0, 0.62, 0.8, 1], ease: ["easeIn", "easeOut", "easeIn"] }}
        onAnimationComplete={() => setLanded(true)} style={{ transformOrigin: "50% 100%" }}>
        <Cofrinho state={state} swing follow label="" lights={natal} />
      </motion.button>

      <AnimatePresence>
        {bubble && (
          <motion.div key={bubble.text} role="status"
            initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={bubble.invite ? openMeet : () => setBubble(null)}
            style={{ transformOrigin: "100% 100%" }}
            className="absolute bottom-[calc(100%+18px)] right-[calc(100%-8px)] z-10 w-[min(240px,calc(100vw-120px))] cursor-pointer rounded-[20px] rounded-br-[6px] bg-paper px-4 py-3 text-[13.5px] leading-snug text-ink shadow-[0_18px_40px_-10px_rgb(0_0_0/0.45)] ring-1 ring-ink/10">
            {bubble.text}
          </motion.div>
        )}
      </AnimatePresence>

      <MeetSheet open={meet} onClose={closeMeet} />
      <FluxiChat open={chat} onClose={() => setChat(false)} snap={snap} a={a} />
    </>
  )
}

const FACTS = [
  { icon: TrendingUp, title: "Fico de olho no mês", text: "Se o ritmo apertar, eu aviso antes do teto chegar. Sem drama. Quase." },
  { icon: CalendarClock, title: "Lembro das contas", text: "Luz, aluguel, fatura. Eu lembro pra você poder esquecer." },
  { icon: MessageCircleHeart, title: "Comento seus gastos", text: "Com carinho. E um pouquinho de julgamento quando é o terceiro delivery da semana." },
  { icon: BellRing, title: "Mudo de forma", text: "Viro moeda quando você bate uma meta, calendário quando uma conta vence e fico achatado quando o mês aperta." },
]
const DEMO: CofrinhoState[] = ["normal", "guardou", "conta", "fatura", "moeda", "apertado", "feliz"]

/** Apresentação do Fluximetro: quem ele é e o que faz. Ele vai mudando de forma enquanto você lê. */
export function MeetSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!open) { setI(0); return }
    const t = setInterval(() => setI((n) => (n + 1) % DEMO.length), 2200)
    return () => clearInterval(t)
  }, [open])
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex flex-col gap-5 px-2 pb-2">
        <div className="mx-auto mt-2 w-[120px]"><Cofrinho state={DEMO[i]} swing label="Fluximetro" /></div>
        <div className="text-center">
          <h2 className="ttl text-[28px] leading-tight">Prazer, Fluximetro</h2>
          <p className="mx-auto mt-2 max-w-[34ch] text-[15px] leading-relaxed text-smoke">Sou um cofrinho que resolveu cuidar do seu dinheiro. Tenho duas perninhas, zero salário e muita opinião.</p>
        </div>
        <div className="rounded-[23px] bg-card px-4">
          {FACTS.map((f) => (
            <div key={f.title} className="flex items-start gap-3.5 border-b border-cotton py-3.5 last:border-0">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-otan/12 text-otan"><f.icon size={17} /></span>
              <span className="text-[14px] leading-snug text-smoke"><b className="mb-0.5 block text-[15px] font-semibold text-ink">{f.title}</b>{f.text}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-[13px] leading-snug text-mute">Já dá pra lançar gastos e entradas conversando comigo: é só tocar em mim.<br /><span className="inline-flex items-center gap-1.5"><span className="size-2 animate-pulse rounded-full bg-otan" />Em breve: perguntas livres, quando eu ganhar IA.</span></p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { onClose(); setTimeout(() => window.dispatchEvent(new Event("fluxo:jogo")), 350) }} className="h-14 rounded-[28px] bg-card font-semibold text-ink">Brincar com ele</button>
          <button onClick={() => { onClose(); setTimeout(() => window.dispatchEvent(new Event("fluxo:conversa")), 400) }} className="h-14 rounded-[28px] bg-ink font-semibold text-cotton">Conversar</button>
        </div>
      </div>
    </Sheet>
  )
}
