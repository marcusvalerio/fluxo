"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState, useTransition } from "react"
import { ArrowUp, Check, Sparkles } from "lucide-react"
import type { Snapshot } from "@/lib/types"
import { brl, int, type Analysis } from "@/lib/finance"
import { parseEntries, parseMoney, type Draft } from "@/lib/assistente"
import { addTransaction } from "@/app/actions"
import { Cofrinho } from "./cofrinho"
import { Sheet } from "./ui"
import { falaDoLancamento, fxPrefs, reagir } from "./fluximetro"

type Msg =
  | { id: number; from: "eu" | "fx"; text: string; soon?: boolean }
  | { id: number; from: "draft"; drafts: Draft[]; state: "open" | "done" | "cancel" }

let seq = 0
const SUGESTOES = ["ifood 52", "uber 23 ontem", "recebi 800 do freela", "quanto ainda cabe?"]
const dia = (iso: string, today: string) => (iso === today ? "hoje" : new Date(iso + "T12:00:00Z").toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" }))

/**
 * Conversa com o Fluximetro, sem IA por enquanto: entende lançamentos escritos do seu jeito
 * (o mesmo leitor do botão +) e responde perguntas simples sobre o mês. O resto fica para quando ele ganhar IA.
 */
export function FluxiChat({ open, onClose, snap, a }: { open: boolean; onClose: () => void; snap: Snapshot; a: Analysis }) {
  const first = snap.space.name.split(" ")[0]
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState("")
  const [pending, start] = useTransition()
  const end = useRef<HTMLDivElement>(null)
  const free = useRef(a.free)
  useEffect(() => { free.current = a.free }, [a.free])

  useEffect(() => {
    if (open && msgs.length === 0)
      setMsgs([{ id: ++seq, from: "fx", text: `E aí, ${first}! Me conta o que gastou ou recebeu do seu jeito que eu anoto. Prometo julgar só um pouquinho.` }])
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }) }, [msgs])

  const fx = (t: string, soon = false) => setMsgs((m) => [...m, { id: ++seq, from: "fx", text: t, soon }])

  /** Perguntas que dá pra responder com as contas do app. */
  const responder = (q: string): boolean => {
    const t = q.toLowerCase()
    const sem = a.budget <= 0
    if (/(quanto|o que).*(sobra|cabe|resta|posso gastar|livre)|ainda cabe/.test(t) && !/\d/.test(t)) {
      if (sem) fx("Ainda não sei seu teto. Monta seu plano tocando na sua inicial, lá em cima, que eu passo a fazer essa conta.")
      else if (a.free < 0) fx(`Por enquanto nada: você passou ${brl(-a.free, false)} do teto. Sem piada agora, bora segurar até o próximo salário.`)
      else fx(`Ainda cabem ${brl(a.free, false)} até o dia ${a.dim}. Dá uns R$ ${int(a.perDay)} por dia sem apertar.`)
      return true
    }
    if (/cabe|posso comprar|d[aá] pra comprar/.test(t)) {
      const v = parseMoney(q.replace(/[^\d.,]+/g, " ").trim().split(" ").find((x) => /\d/.test(x)) ?? "")
      if (!v) return false
      if (sem) fx("Sem teto eu não consigo dizer. Monta seu plano tocando na sua inicial, lá em cima.")
      else if (v > a.free) fx(`Não cabe: ficaria ${brl(v - a.free, false)} acima do teto. Se for no cartão, parcelar ajuda; simula pelo botão +.`)
      else {
        const dias = Math.max(1, a.daysLeft - 1)
        fx(`Cabe. Depois dela sobram ${brl(a.free - v, false)}, uns R$ ${int((a.free - v) / dias)} por dia até o fim do mês.${fxPrefs.humor() ? " Seu bolso pediu pra eu avisar que ele sente." : ""}`)
      }
      return true
    }
    if (/(gastei|saiu).*(m[eê]s|semana)|quanto (eu )?gastei/.test(t)) {
      fx(`Neste mês saíram ${brl(a.expense, false)} e entraram ${brl(a.income, false)}.`)
      return true
    }
    return false
  }

  const enviar = (raw?: string) => {
    const q = (raw ?? text).trim()
    if (!q || pending) return
    setText("")
    setMsgs((m) => [...m, { id: ++seq, from: "eu", text: q }])
    setTimeout(() => {
      if (responder(q)) return
      const drafts = parseEntries(q, snap.today, snap.cards.map((c) => c.name))
      if (drafts.length) setMsgs((m) => [...m, { id: ++seq, from: "draft", drafts, state: "open" }])
      else if (/\?$|^(por que|porque|como|qual|quando|o que|me ajuda|dica)/i.test(q))
        fx("Essa pergunta eu ainda não sei responder. Quando eu ganhar IA, a gente conversa sobre isso. Por enquanto eu lanço gastos e entradas e digo quanto ainda cabe.", true)
      else fx("Não achei um valor aí. Tenta algo como \"uber 23\" ou \"recebi 800 do freela\".")
    }, 350)
  }

  const lancar = (id: number, drafts: Draft[]) => start(async () => {
    for (const d of drafts) {
      const card = d.kind === "expense" && d.card ? snap.cards.find((c) => c.name === d.card) : null
      await addTransaction({ kind: d.kind, amount: d.amount, description: d.description, category: d.category, date: d.date, cardId: card?.id ?? null, installments: card ? d.installments : 1 })
    }
    navigator.vibrate?.([8, 40, 12])
    setMsgs((m) => m.map((x) => (x.id === id && x.from === "draft" ? { ...x, state: "done" } : x)))
    const gasto = drafts.filter((d) => d.kind === "expense").reduce((s, d) => s + d.amount, 0)
    const tight = a.budget > 0 && free.current - gasto < 0
    free.current -= gasto
    const kind = drafts.every((d) => d.kind === "income") ? "income" : "expense"
    const r = falaDoLancamento(kind, drafts.length > 1 ? `${drafts.length} lançamentos` : drafts[0].description, tight, !fxPrefs.humor())
    fx(r.text ?? "Anotado.")
    reagir({ state: r.state })
  })

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex min-h-[60dvh] flex-col gap-3 px-1">
        <div className="flex items-center gap-3 px-1">
          <span className="w-11"><Cofrinho state={pending ? "pensando" : "normal"} swing label="" /></span>
          <div><p className="ttl text-[18px] leading-tight">Fluximetro</p><p className="text-[12.5px] text-mute">lança gastos e entradas do seu jeito</p></div>
        </div>

        <div className="flex flex-1 flex-col gap-2 py-2" aria-live="polite">
          <AnimatePresence initial={false}>
            {msgs.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={m.from === "eu" ? "self-end max-w-[85%] rounded-[20px] rounded-br-[6px] bg-otan px-4 py-2.5 text-[15px] text-white" : "self-start max-w-[88%]"}>
                {m.from === "eu" && m.text}
                {m.from === "fx" && (
                  <div className="rounded-[20px] rounded-bl-[6px] bg-card px-4 py-2.5 text-[15px] leading-snug">
                    {m.soon && <span className="mb-1 flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-otan"><Sparkles size={12} />Em breve</span>}
                    {m.text}
                  </div>
                )}
                {m.from === "draft" && (
                  <div className="w-[min(320px,80vw)] rounded-[20px] rounded-bl-[6px] bg-card p-3">
                    <p className="px-1 pb-2 text-[13px] text-mute">{m.state === "done" ? "Lançado:" : "Entendi assim. Confere?"}</p>
                    {m.drafts.map((d, i) => (
                      <div key={i} className="flex items-center gap-3 border-t border-cotton px-1 py-2.5 first:border-0">
                        <span className="min-w-0 flex-1"><span className="block truncate text-[15px]">{d.description}</span>
                          <span className="block text-[12px] text-mute">{d.kind === "income" ? "Entrada" : d.category} · {dia(d.date, snap.today)}{d.installments > 1 ? ` · ${d.installments}x${d.card ? ` no ${d.card}` : " (sem cartão, vai à vista)"}` : ""}</span></span>
                        <span className={`num text-[16px] ${d.kind === "income" ? "text-otan" : ""}`}>{d.kind === "income" ? "+" : "−"}{brl(d.amount)}</span>
                      </div>
                    ))}
                    {m.state === "open" && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button onClick={() => setMsgs((all) => all.map((x) => (x.id === m.id && x.from === "draft" ? { ...x, state: "cancel" } : x)))} className="h-11 rounded-full bg-cotton text-[14px] font-semibold">Cancelar</button>
                        <button disabled={pending} onClick={() => lancar(m.id, m.drafts)} className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-ink text-[14px] font-semibold text-cotton disabled:opacity-50"><Check size={16} />Lançar</button>
                      </div>
                    )}
                    {m.state === "cancel" && <p className="px-1 pt-1 text-[13px] text-mute">Cancelado. Nada foi lançado.</p>}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={end} />
        </div>

        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {SUGESTOES.map((s) => <button key={s} onClick={() => enviar(s)} className="shrink-0 rounded-full border border-sand bg-card px-3.5 py-2 text-[13px] font-semibold">{s}</button>)}
        </div>
        <form className="sticky bottom-0 flex gap-2 bg-cotton pb-1 pt-1" onSubmit={(e) => { e.preventDefault(); enviar() }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: mercado 87,50 no débito" aria-label="Mensagem pro Fluximetro"
            className="h-12 min-w-0 flex-1 rounded-full border border-sand bg-card px-4 text-[16px] outline-none focus:border-otan" />
          <button type="submit" disabled={!text.trim() || pending} aria-label="Enviar" className="grid size-12 shrink-0 place-items-center rounded-full bg-otan text-white disabled:opacity-40"><ArrowUp size={20} /></button>
        </form>
      </div>
    </Sheet>
  )
}
