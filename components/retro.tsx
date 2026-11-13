"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import type { Snapshot, Tx } from "@/lib/types"
import { brl } from "@/lib/finance"
import { Cofrinho } from "./cofrinho"
import type { CofrinhoState } from "@/lib/cofrinho"

const SALARIO = /sal[aá]rio|pagamento|holerite/i
const fmt = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" }).replace(".", "")

export interface Ciclo {
  from: string; to: string; entrou: number; saiu: number; sobrou: number
  rival: { nome: string; vezes: number; total: number } | null
  diaCaro: { dia: string; total: number } | null
  nota: string; key: string
}

/** O ciclo que fechou: do penúltimo salário até o último. Só existe se o último caiu há até 7 dias. */
export function cicloFechado(snap: Snapshot): Ciclo | null {
  const sal = snap.txs.filter((t) => t.kind === "income" && (SALARIO.test(t.category) || SALARIO.test(t.description))).sort((a, b) => a.date.localeCompare(b.date))
  if (sal.length < 2) return null
  const last = sal[sal.length - 1], prev = sal[sal.length - 2]
  const dias = (Date.parse(snap.today) - Date.parse(last.date)) / 864e5
  if (dias < 0 || dias > 7 || last.date === prev.date) return null
  const dentro = (t: Tx) => t.date >= prev.date && t.date < last.date
  const txs = snap.txs.filter(dentro)
  const entrou = txs.filter((t) => t.kind === "income").reduce((s, t) => s + t.amount, 0)
  const gastos = txs.filter((t) => t.kind === "expense")
  const saiu = gastos.reduce((s, t) => s + t.amount, 0)
  const por = new Map<string, { nome: string; vezes: number; total: number }>()
  for (const t of gastos) { const k = t.description.trim().toLowerCase(); const r = por.get(k) ?? { nome: t.description.trim(), vezes: 0, total: 0 }; r.vezes++; r.total += t.amount; por.set(k, r) }
  const rival = [...por.values()].filter((r) => r.vezes >= 2).sort((a, b) => b.vezes - a.vezes || b.total - a.total)[0] ?? null
  const porDia = new Map<string, number>()
  for (const t of gastos) porDia.set(t.date, (porDia.get(t.date) ?? 0) + t.amount)
  const caro = [...porDia.entries()].sort((a, b) => b[1] - a[1])[0]
  const r = entrou > 0 ? saiu / entrou : 1
  const nota = r < 0.6 ? "A" : r < 0.75 ? "B+" : r < 0.88 ? "B" : r < 1 ? "C" : "D"
  return { from: prev.date, to: last.date, entrou, saiu, sobrou: entrou - saiu, rival, diaCaro: caro ? { dia: caro[0], total: caro[1] } : null, nota, key: `${prev.date}_${last.date}` }
}

interface Slide { bg: string; dark?: boolean; tag: string; big: React.ReactNode; sub: string; fala: string; st: CofrinhoState }

function slides(c: Ciclo, nome: string): Slide[] {
  const out: Slide[] = [
    { bg: "linear-gradient(170deg,#FF5A2C,#B83312)", tag: `De um salário ao outro · ${fmt(c.from)} → ${fmt(c.to)}`, big: <>Seu ciclo,<br />sem filtro.</>, sub: `Eu vi tudo, ${nome}. Agora você também vai ver.`, fala: "Respira fundo. Vai ter dado que dói.", st: "normal" },
    { bg: "#1F282E", tag: "Entrou e saiu", big: brl(c.entrou, false), sub: `entraram. Saíram ${brl(c.saiu, false)}.`, fala: c.saiu < c.entrou ? "Saiu menos do que entrou. Isso tem nome: milagre." : "Saiu mais do que entrou. A gente precisa conversar.", st: c.saiu < c.entrou ? "feliz" : "apertado" },
  ]
  if (c.rival) out.push({ bg: "linear-gradient(170deg,#C9302C,#5E1410)", tag: "Seu maior rival", big: <>{c.rival.nome}<br />{c.rival.vezes}x</>, sub: `${brl(c.rival.total, false)} no ciclo.`, fala: /ifood|delivery|rappi|lanche|pizza/i.test(c.rival.nome) ? "O motoboy vai te convidar pro casamento dele." : `${c.rival.nome} já te conhece pelo nome.`, st: "pensando" })
  if (c.diaCaro) out.push({ bg: "#2B2140", tag: "Dia mais caro", big: <>{fmt(c.diaCaro.dia)}<br />{brl(c.diaCaro.total, false)}</>, sub: "Esse dia foi intenso.", fala: "O que aconteceu nesse dia? Não precisa responder. Eu já sei.", st: "conta" })
  out.push(c.sobrou > 0
    ? { bg: "linear-gradient(170deg,#1F8A5B,#0F4A31)", tag: "Sobrou", big: brl(c.sobrou, false), sub: "no fim do ciclo.", fala: "Seu eu do futuro mandou um abraço.", st: "guardou" }
    : { bg: "linear-gradient(170deg,#B83312,#6E1D08)", tag: "Faltou", big: brl(-c.sobrou, false), sub: "além do que entrou.", fala: "O mês sentou em mim. Esse ciclo a gente acerta.", st: "apertado" })
  out.push({ bg: "#F4F3EE", dark: true, tag: "Nota do ciclo", big: <span style={{ color: "#FF4E20", fontSize: 140 }}>{c.nota}</span>, sub: c.nota.startsWith("A") ? "Gastou com consciência. Pode se gabar." : c.nota.startsWith("B") ? "Gastou com consciência. Quase sempre." : "Dá pra melhorar. E eu tô aqui pra isso.",
    fala: c.nota === "A" ? "Nota A. Vou emoldurar." : c.nota.startsWith("B") ? "Dava pra ser A se não fosse aquele delivery." : "Sem julgamento. Tá, um pouquinho.", st: c.nota <= "B+" ? "feliz" : "normal" })
  out.push({ bg: "linear-gradient(170deg,#FF5A2C,#B83312)", tag: "Novo ciclo começou", big: <>Bora repetir?</>, sub: "Eu fico de olho. Você fica longe do delivery.", fala: "Combinado?", st: "feliz" })
  return out
}

/** Retrospectiva no estilo Stories: passa sozinha, toque na direita avança, na esquerda volta. */
export function Retro({ open, onClose, ciclo, nome }: { open: boolean; onClose: () => void; ciclo: Ciclo; nome: string }) {
  const reduced = !!useReducedMotion()
  const ss = useMemo(() => slides(ciclo, nome), [ciclo, nome])
  const [i, setI] = useState(0)
  const [host, setHost] = useState<HTMLElement | null>(null)
  useEffect(() => setHost(document.body), [])
  useEffect(() => { if (open) setI(0) }, [open])
  useEffect(() => {
    if (!open || reduced) return
    const t = setTimeout(() => (i < ss.length - 1 ? setI(i + 1) : undefined), 5200)
    return () => clearTimeout(t)
  }, [open, i, ss.length, reduced])
  if (!host) return null
  const s = ss[i]
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] mx-auto flex max-w-[480px] flex-col" role="dialog" aria-modal aria-label="Retrospectiva do ciclo"
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1, background: s.bg }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.35 }}
          style={{ color: s.dark ? "#1F282E" : "#fff" }}>
          <div className="flex gap-1 px-3.5 pt-[max(14px,env(safe-area-inset-top))]">
            {ss.map((_, k) => (
              <span key={k} className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: s.dark ? "rgb(31 40 46/.2)" : "rgb(255 255 255/.3)" }}>
                <motion.span key={k === i ? `a${i}` : k} className="block h-full" style={{ background: s.dark ? "#1F282E" : "#fff" }}
                  initial={{ width: k < i ? "100%" : "0%" }} animate={{ width: k < i ? "100%" : k === i ? "100%" : "0%" }} transition={{ duration: k === i && !reduced ? 5.2 : 0, ease: "linear" }} />
              </span>
            ))}
          </div>
          <button onClick={onClose} aria-label="Fechar" className="absolute right-4 top-[max(28px,calc(env(safe-area-inset-top)+16px))] z-10 grid size-10 place-items-center"><X size={22} /></button>
          <div className="relative flex flex-1 flex-col px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-12">
            <AnimatePresence mode="wait">
              <motion.div key={i} className="flex flex-1 flex-col gap-3" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease: [0.2, 0.9, 0.3, 1] }}>
                <p className="text-[12px] font-bold uppercase tracking-[0.14em] opacity-75">{s.tag}</p>
                <h2 className="ttl text-[56px] font-extrabold leading-[0.95] tracking-[-0.05em]">{s.big}</h2>
                <p className="text-[18px] leading-snug opacity-85">{s.sub}</p>
                <div className="mt-auto flex items-end gap-3">
                  <span className="w-[74px] shrink-0"><Cofrinho state={s.st} swing label="" /></span>
                  <p className="rounded-[22px] rounded-bl-[6px] bg-white px-4 py-3 text-[15px] font-medium leading-snug text-ink">{s.fala}</p>
                </div>
                {i === ss.length - 1 && <button onClick={onClose} className="mt-4 h-14 rounded-[28px] bg-white text-[16px] font-semibold text-ink">Bora</button>}
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-x-0 bottom-28 top-0 flex">
              <button aria-label="Anterior" className="flex-1" onClick={() => setI(Math.max(0, i - 1))} />
              <button aria-label="Próximo" className="flex-1" onClick={() => (i < ss.length - 1 ? setI(i + 1) : onClose())} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    host,
  )
}

/** Card na home: só aparece quando cai o salário novo (até 7 dias depois). */
export function RetroCard({ snap }: { snap: Snapshot }) {
  const ciclo = useMemo(() => cicloFechado(snap), [snap])
  const [open, setOpen] = useState(false)
  if (!ciclo) return null
  return (
    <>
      <motion.button initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 }}
        onClick={() => setOpen(true)} className="relative w-full overflow-hidden rounded-[26px] bg-ink p-5 text-left text-cotton">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-otan">Ciclo fechado · {fmt(ciclo.from)} → {fmt(ciclo.to)}</span>
        <span className="ttl mt-1.5 block max-w-[72%] text-[25px] font-extrabold leading-[1.05]">Caiu o salário. Bora ver o que o último fez?</span>
        <span className="mt-1.5 block max-w-[70%] text-[13px] opacity-70">Nota {ciclo.nota}{ciclo.rival ? `, ${ciclo.rival.vezes}x ${ciclo.rival.nome}` : ""}. Toque pra ver.</span>
        <span className="absolute -bottom-5 -right-3 w-[110px] rotate-[-12deg]"><Cofrinho state="feliz" label="" /></span>
      </motion.button>
      <Retro open={open} onClose={() => setOpen(false)} ciclo={ciclo} nome={snap.space.name.split(" ")[0]} />
    </>
  )
}
