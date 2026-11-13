"use client"

import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { useEffect, useMemo, useState, useTransition } from "react"
import { ArrowLeft, Delete, X } from "lucide-react"
import type { Kind, Snapshot } from "@/lib/types"
import { brl, CATEGORIES, int, type Analysis } from "@/lib/finance"
import { addDays } from "@/lib/dates"
import { parseEntry } from "@/lib/parse"
import { addTransaction } from "@/app/actions"
import { parseEntries, parsePurchase, simulate, type Draft, type Purchase } from "@/lib/assistente"
import { monthRoom } from "@/lib/plan"
import { Sheet, spring } from "./ui"

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "del"]

export function Lancar({ open, onClose, snap, a, onDone, seed }: { open: boolean; onClose: () => void; snap: Snapshot; a: Analysis; onDone?: (r: { amount: number; kind: Kind; label: string; parts: number }) => void; seed?: string }) {
  const [kind, setKind] = useState<Kind>("expense")
  const [cents, setCents] = useState("") // dígitos digitados
  const [desc, setDesc] = useState("")
  const [cat, setCat] = useState<string | null>(null)
  const [when, setWhen] = useState<0 | -1>(0)
  const [cardId, setCardId] = useState<number | null>(null)
  const [parts, setParts] = useState(1)
  const [pending, start] = useTransition()
  // lançar por texto
  const [text, setText] = useState("")
  const [removed, setRemoved] = useState<number[]>([])
  const [plan, setPlan] = useState<Purchase | null>(null)

  useEffect(() => {
    if (open) { setKind("expense"); setCents(""); setDesc(""); setCat(null); setWhen(0); setCardId(null); setParts(1); setText(seed ?? ""); setRemoved([]); setPlan(null) }
  }, [open, seed])

  const cardNames = snap.cards.map((c) => c.name)
  const typed = text.trim()
  const purchase = useMemo(() => (/(quero|pensando|planejando|vale a pena|parcelar)/i.test(typed) ? parsePurchase(typed, cardNames) : null), [typed]) // eslint-disable-line react-hooks/exhaustive-deps
  const drafts = useMemo(() => (typed && !purchase ? parseEntries(typed, snap.today, cardNames) : []), [typed, purchase]) // eslint-disable-line react-hooks/exhaustive-deps
  const kept = drafts.map((d, i) => ({ d, i })).filter((x) => !removed.includes(x.i))
  const missingCard = kept.some(({ d }) => d.kind === "expense" && d.installments > 1 && !d.card)
  const cardOf = (d: Draft) => snap.cards.find((c) => c.name === d.card) ?? null

  const submitText = () => {
    if (!kept.length || missingCard || pending) return
    start(async () => {
      for (const { d } of kept) {
        const c = d.kind === "expense" ? cardOf(d) : null
        await addTransaction({ kind: d.kind, amount: d.amount, description: d.description, category: d.category, date: d.date, cardId: c?.id ?? null, installments: c ? d.installments : 1 })
      }
      if (navigator.vibrate) navigator.vibrate([8, 40, 12])
      const total = kept.reduce((x, { d }) => x + (d.kind === "expense" ? d.amount : 0), 0)
      onDone?.({ amount: total || kept[0].d.amount, kind: kept.every(({ d }) => d.kind === "income") ? "income" : "expense", label: kept.length > 1 ? `${kept.length} lançamentos` : kept[0].d.description, parts: 1 })
      onClose()
    })
  }

  const amount = (Number(cents) || 0) / 100
  const guessed = useMemo(() => (desc ? parseEntry(desc, snap.today).category : null), [desc, snap.today])
  const cats = CATEGORIES[kind] as readonly string[]
  const category = cat && cats.includes(cat) ? cat : guessed && cats.includes(guessed) ? guessed : cats[0]
  const after = kind === "expense" ? a.free - (cardId ? amount / parts : amount) : a.free + (snap.space.limit > 0 ? 0 : amount)
  const perDay = Math.max(0, after) / Math.max(1, a.daysLeft)

  const press = (k: string) => {
    if (navigator.vibrate) navigator.vibrate(6)
    if (k === "del") return setCents((c) => c.slice(0, -1))
    if (k === ",") return
    setCents((c) => (c.length >= 9 ? c : (c + k).replace(/^0+/, "")))
  }

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input")) return
      if (/^\d$/.test(e.key)) press(e.key)
      if (e.key === "Backspace") press("del")
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [open])

  const submit = () => {
    if (!amount || pending) return
    start(async () => {
      await addTransaction({ kind, amount, description: desc.trim() || category, category, date: addDays(snap.today, when), cardId: kind === "expense" ? cardId : null, installments: cardId ? parts : 1 })
      if (navigator.vibrate) navigator.vibrate([8, 40, 12])
      onDone?.({ amount, kind, label: desc.trim() || category, parts: cardId ? parts : 1 })
      onClose()
    })
  }

  const intPart = Math.floor(amount).toLocaleString("pt-BR")
  const decPart = String(Math.round((amount % 1) * 100)).padStart(2, "0")

  return (
    <Sheet open={open} onClose={onClose} title={seed ? "Posso comprar?" : "Lançar"}>
      <div className="flex flex-col">
        {seed && !plan && <p className="mb-3 px-1 text-[14px] leading-snug text-smoke">Escreve o que você tá de olho, tipo <b className="text-ink">"quero comprar um tênis de 400 em 4x no nubank"</b>. Eu mostro se cabe, como ficam as faturas e em quantas vezes vale parcelar.</p>}
        {plan ? <Simular snap={snap} a={a} plan={plan} onBack={() => setPlan(null)} onDone={onDone} onClose={onClose} /> : <>
        <label className={`flex items-center gap-2.5 rounded-[22px] border-[1.5px] bg-card py-1.5 pl-3 pr-1.5 transition ${typed ? "border-otan" : "border-transparent focus-within:border-otan"}`}>
          <TalkIcon className="size-7 shrink-0 text-otan" />
          <span className="sr-only">Escreva o que aconteceu</span>
          <input value={text} onChange={(e) => { setText(e.target.value); setRemoved([]) }} placeholder="Escreva o que aconteceu…" maxLength={200} enterKeyHint="done" autoFocus={!!seed}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitText() } }}
            className="h-10 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-faint focus-visible:outline-none" />
          {typed && <button onClick={() => { setText(""); setRemoved([]) }} aria-label="Limpar texto" className="grid size-9 shrink-0 place-items-center rounded-full bg-otan text-white"><X size={16} strokeWidth={2.6} /></button>}
        </label>

        {typed ? (
          <TextResults today={snap.today} drafts={drafts} kept={kept} purchase={purchase} cards={cardNames} missingCard={missingCard}
            onRemove={(i) => setRemoved((r) => [...r, i])} onPickCard={(c) => setText((t) => `${t.trim()} no ${c}`)} onPlan={(p) => setPlan(p)} />
        ) : <>
        <div className="mb-1 mt-3 flex items-center gap-2.5 px-1 text-[12px] text-faint"><span className="h-px flex-1 bg-sand" />ou digite o valor<span className="h-px flex-1 bg-sand" /></div>
        <div className="flex justify-center">
          <div className="lg flex gap-0.5 rounded-[22px] p-1">
            <LayoutGroup id="kind">
              {(["expense", "income"] as Kind[]).map((k) => (
                <button key={k} onClick={() => setKind(k)} className={`relative rounded-[18px] px-4 py-2 text-[14px] ${kind === k ? "font-semibold" : "text-smoke"}`}>
                  {kind === k && <motion.span layoutId="kindpill" className="absolute inset-0 rounded-[18px] bg-ink" transition={spring} />}
                  <span className={`relative ${kind === k ? "text-cotton" : ""}`}>{k === "expense" ? "Saída" : "Entrada"}</span>
                </button>
              ))}
            </LayoutGroup>
          </div>
        </div>

        <div className="pb-2 pt-6 text-center">
          <p className="num text-[60px] leading-none" aria-live="polite">
            <span className="mr-1.5 text-[26px] text-faint">R$</span>
            <motion.span key={intPart} initial={{ y: 8, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} transition={spring} className={amount ? "" : "text-faint"}>{intPart}</motion.span>
            <span className="text-faint">,{decPart}</span>
          </p>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição (ex.: almoço com a Ana)" maxLength={80}
            aria-label="Descrição" className="mt-3 w-full bg-transparent text-center text-[16px] text-smoke outline-none focus-visible:outline-none" />
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-2">
          {([0, -1] as const).map((d) => (
            <button key={d} onClick={() => setWhen(d)} className={`h-10 shrink-0 rounded-full px-4 text-[13px] font-medium ${when === d ? "bg-ink text-cotton" : "bg-card text-smoke"}`}>{d === 0 ? "Hoje" : "Ontem"}</button>
          ))}
          <span className="mx-1 w-px shrink-0 bg-sand" />
          {[category, ...cats.filter((c) => c !== category)].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`h-10 shrink-0 rounded-full px-4 text-[13px] font-medium transition ${c === category ? "bg-ink text-cotton" : "bg-card text-smoke"}`}>{c}</button>
          ))}
        </div>

        {kind === "expense" && snap.cards.length > 0 && (
          <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-2">
            <span className="shrink-0 text-[12px] text-mute">Pagar com</span>
            {[{ id: null as number | null, name: "Débito/Pix" }, ...snap.cards].map((c) => (
              <button key={String(c.id)} onClick={() => { setCardId(c.id); if (!c.id) setParts(1) }}
                className={`h-10 shrink-0 rounded-full px-4 text-[13px] font-medium ${cardId === c.id ? "bg-ink text-cotton" : "bg-card text-smoke"}`}>{c.name}</button>
            ))}
          </div>
        )}
        <AnimatePresence>
          {kind === "expense" && cardId && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-1 flex items-center justify-between rounded-[20px] bg-card px-2 py-1.5">
                <button onClick={() => setParts((p) => Math.max(1, p - 1))} className="grid size-10 place-items-center rounded-full text-[20px]" aria-label="Menos parcelas">−</button>
                <span className="text-[14px]">{parts === 1 ? "À vista" : <><span className="num">{parts}x</span> de <span className="num">{brl(amount / parts)}</span></>}</span>
                <button onClick={() => setParts((p) => Math.min(24, p + 1))} className="grid size-10 place-items-center rounded-full text-[20px]" aria-label="Mais parcelas">+</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {amount > 0 && a.budget > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-2 flex items-center justify-between rounded-[20px] bg-card px-4 py-3">
                <span className="text-[13px] text-smoke">Depois disso, {after < 0 ? "passa do teto em" : "sobram"}</span>
                <span className={`num text-[14px] ${after < 0 ? "text-gravy" : ""}`}>{brl(Math.abs(after), false)}{after >= 0 && <span className="text-mute"> · R$ {int(perDay)}/dia</span>}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {KEYS.map((k) => (
            <motion.button key={k} whileTap={{ scale: 0.92, backgroundColor: "var(--c-sand)" }} onClick={() => press(k)} aria-label={k === "del" ? "Apagar" : k}
              disabled={k === ","}
              className={`num grid h-[58px] place-items-center rounded-[18px] text-[24px] ${k === "del" || k === "," ? "bg-transparent" : "bg-card"} ${k === "," ? "opacity-0" : ""}`}>
              {k === "del" ? <Delete size={22} /> : k}
            </motion.button>
          ))}
        </div>

        </>}
        {typed ? (
          <motion.button whileTap={{ scale: 0.97 }} disabled={!kept.length || missingCard || pending} onClick={submitText}
            className="mt-4 h-[58px] rounded-[29px] bg-otan text-[16px] font-semibold text-white shadow-[inset_0_1px_1px_rgb(255_255_255/0.4),0_10px_24px_-10px_rgb(255_78_32/0.8)] disabled:opacity-35">
            {pending ? "Lançando…" : kept.length > 1 ? `Lançar ${kept.length}` : "Lançar"}
          </motion.button>
        ) : (
        <motion.button whileTap={{ scale: 0.97 }} disabled={!amount || pending} onClick={submit}
          className="mt-2.5 h-[58px] rounded-[29px] bg-otan text-[16px] font-semibold text-white shadow-[inset_0_1px_1px_rgb(255_255_255/0.4),0_10px_24px_-10px_rgb(255_78_32/0.8)] disabled:opacity-35">
          {pending ? "Lançando…" : amount ? `Lançar ${brl(amount)}` : "Digite o valor"}
        </motion.button>
        )}
        </>}
      </div>
    </Sheet>
  )
}

/** Balão de conversa feito dos palitos do Fluxo. */
export function TalkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 6.5C4 5.1 5.1 4 6.5 4h11C18.9 4 20 5.1 20 6.5v8c0 1.4-1.1 2.5-2.5 2.5H11l-4.5 3.5V17h0C5.1 17 4 15.9 4 14.5z" />
      <path d="M8.5 13V9M12 13V7.5M15.5 13v-2.5" strokeWidth="2.2" />
    </svg>
  )
}

const WHEN = (d: string, today: string) => d === today ? "hoje" : d === addDays(today, -1) ? "ontem" : `${Number(d.slice(8))}/${d.slice(5, 7)}`

function TextResults({ today, drafts, kept, purchase, cards, missingCard, onRemove, onPickCard, onPlan }: {
  today: string; drafts: Draft[]; kept: { d: Draft; i: number }[]; purchase: Purchase | null; cards: string[]; missingCard: boolean
  onRemove: (i: number) => void; onPickCard: (c: string) => void; onPlan: (p: Purchase) => void
}) {
  if (purchase) {
    return (
      <div className="mt-4 rounded-[22px] bg-ink p-4 text-cotton">
        <p className="ttl text-[16px]">Parece uma compra planejada</p>
        <p className="mt-1 text-[14px] leading-snug text-[var(--c-on-ink-2)]">
          {purchase.description}{purchase.total ? ` de ${brl(purchase.total)}` : ""}{purchase.installments ? ` em ${purchase.installments}x` : ""}. Quer ver mês a mês quanto ela aperta antes de lançar?
        </p>
        <button onClick={() => onPlan(purchase)} disabled={!purchase.total}
          className="mt-3 h-10 rounded-full bg-otan px-4 text-[14px] font-semibold text-white disabled:opacity-40">{purchase.total ? "Simular compra" : "Diga o valor para simular"}</button>
      </div>
    )
  }
  if (!drafts.length) return <p className="mt-4 px-1 text-[14px] text-mute">Escreva o que foi e quanto. Ex.: <i>uber 23,50</i> ou <i>recebi 1.200 do freela</i>.</p>
  return (
    <div className="mt-4 flex flex-col gap-2" aria-live="polite">
      <p className="px-1 text-[13px] text-mute">{kept.length === 1 ? "Entendi assim:" : `Entendi ${kept.length} lançamentos:`}</p>
      <AnimatePresence initial={false}>
        {kept.map(({ d, i }) => (
          <motion.div key={i} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-3 rounded-[20px] bg-card py-3 pl-3.5 pr-1.5">
            <span className={`ttl grid size-9 shrink-0 place-items-center rounded-full text-[13px] text-white ${d.kind === "income" ? "bg-[#2E8B57]" : "bg-ink"}`}>{d.category[0]}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-medium">{d.description}</span>
              <span className="block truncate text-[12px] text-mute">{d.category} · {WHEN(d.date, today)}{d.installments > 1 ? ` · ${d.installments}x de ${brl(d.amount / d.installments)}` : ""}{d.card ? ` · ${d.card}` : ""}</span>
            </span>
            <span className={`num text-[16px] ${d.kind === "income" ? "text-[#2E8B57]" : ""}`}>{d.kind === "income" ? "+" : "−"}{brl(d.amount)}</span>
            <button onClick={() => onRemove(i)} aria-label={`Remover ${d.description}`} className="grid size-9 place-items-center rounded-full text-faint"><X size={16} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
      {missingCard && (cards.length ? (
        <div className="px-1">
          <p className="text-[13px] text-mute">Em qual cartão foi o parcelado?</p>
          <div className="mt-2 flex flex-wrap gap-2">{cards.map((c) => <button key={c} onClick={() => onPickCard(c)} className="h-9 rounded-full bg-card px-4 text-[13px] font-medium">{c}</button>)}</div>
        </div>
      ) : <p className="px-1 text-[13px] text-mute">Para parcelar, cadastre um cartão na Carteira. Ou tire o "x" para lançar à vista.</p>)}
    </div>
  )
}

const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
const lab = (k: string) => `${MES[Number(k.slice(5, 7)) - 1]}/${k.slice(2, 4)}`

function Simular({ snap, a, plan, onBack, onDone, onClose }: { snap: Snapshot; a: Analysis; plan: Purchase; onBack: () => void; onDone?: (r: { amount: number; kind: Kind; label: string; parts: number }) => void; onClose: () => void }) {
  const total = plan.total ?? 0
  const [cardName, setCardName] = useState(plan.card ?? snap.cards[0]?.name ?? "")
  const [n, setN] = useState(plan.installments ?? 10)
  const [pending, start] = useTransition()
  const room = useMemo(() => monthRoom(snap, a), [snap, a])
  const card = snap.cards.find((c) => c.name === cardName)
  if (!card) return (
    <div className="py-6 text-center">
      <p className="ttl text-[18px]">Cadastre um cartão primeiro</p>
      <p className="mt-1 text-[14px] text-mute">A simulação precisa do dia de fechamento e do vencimento.</p>
      <button onClick={onBack} className="mt-4 h-11 rounded-full bg-card px-5 text-[14px] font-semibold">Voltar</button>
    </div>
  )
  const rule = { name: card.name, closingDay: card.closingDay, dueDay: card.dueDay }
  const sim = simulate(total, n, rule, snap.today, room)
  const max = Math.max(1, ...sim.months.map((m) => m.freeBefore))
  const tag = { tranquilo: ["Tranquilo", "bg-[#2E8B57]/12 text-[#2E8B57]"], aperta: ["Aperta", "bg-[#C98A00]/14 text-[#A87300]"], "nao-cabe": ["Não cabe", "bg-otan/12 text-gravy"] }[sim.verdict]
  const launch = () => start(async () => {
    await addTransaction({ kind: "expense", amount: total, description: plan.description, category: "Compras", date: snap.today, cardId: card.id, installments: n })
    if (navigator.vibrate) navigator.vibrate([8, 40, 12])
    onDone?.({ amount: total, kind: "expense", label: plan.description, parts: n })
    onClose()
  })
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <button onClick={onBack} aria-label="Voltar" className="grid size-10 place-items-center rounded-full bg-card"><ArrowLeft size={18} /></button>
        <div className="min-w-0">
          <p className="text-[12px] text-mute">Simular compra</p>
          <p className="ttl truncate text-[18px]">{plan.description} · {brl(total)}</p>
        </div>
      </div>
      {snap.cards.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">{snap.cards.map((c) => (
          <button key={c.id} onClick={() => setCardName(c.name)} className={`h-9 rounded-full px-4 text-[13px] font-medium ${c.name === cardName ? "bg-ink text-cotton" : "bg-card text-smoke"}`}>{c.name}</button>
        ))}</div>
      )}
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {[1, 3, 6, 10, 12].map((k) => {
          const v = simulate(total, k, rule, snap.today, room).verdict
          return (
            <button key={k} onClick={() => setN(k)} className={`rounded-[16px] border-[1.5px] py-2 text-[13px] font-semibold leading-tight ${k === n ? "border-otan bg-otan/8" : "border-transparent bg-card"}`}>
              {k}x<span className="block text-[10.5px] font-medium text-mute">{v === "tranquilo" ? "folga" : v === "aperta" ? "aperta" : "não cabe"}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-3 rounded-[22px] bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="ttl text-[16px]">{n}x de {brl(total / n)}</p>
          <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[12px] font-semibold ${tag[1]}`}>{tag[0]}</span>
        </div>
        <p className="mt-0.5 text-[12.5px] text-mute">No {card.name}, a 1ª parcela cai na fatura de {lab(sim.months[0].key)} (fecha dia {card.closingDay}, vence dia {card.dueDay}).</p>
        <div className="mt-3 space-y-1.5">
          {sim.months.slice(0, 8).map((m) => (
            <div key={m.key} className="grid grid-cols-[44px_1fr_auto] items-center gap-2 text-[12px]">
              <span className="text-mute">{lab(m.key)}</span>
              <span className="flex h-2.5 overflow-hidden rounded-full bg-cotton">
                <span className={m.freeAfter < 0 ? "bg-gravy" : m.tight ? "bg-[#C98A00]" : "bg-ink"} style={{ width: `${(Math.max(0, m.freeAfter) / max) * 100}%` }} />
                <span className="bg-otan" style={{ width: `${(Math.min(m.parcel, Math.max(0, m.freeBefore)) / max) * 100}%` }} />
              </span>
              <span className={`num whitespace-nowrap text-right ${m.freeAfter < 0 ? "text-gravy" : ""}`}>sobra {brl(m.freeAfter, false)}</span>
            </div>
          ))}
          {sim.months.length > 8 && <p className="pt-1 text-[12px] text-mute">e mais {sim.months.length - 8} meses parecidos.</p>}
        </div>
        <p className="mt-3 text-[11.5px] leading-snug text-faint">Estimativa: o que entra no mês menos contas, assinaturas, parcelas já agendadas e o gasto do dia a dia do mês passado.</p>
      </div>
      <motion.button whileTap={{ scale: 0.97 }} disabled={pending || !total} onClick={launch}
        className="mt-4 h-[58px] rounded-[29px] bg-otan text-[16px] font-semibold text-white shadow-[inset_0_1px_1px_rgb(255_255_255/0.4),0_10px_24px_-10px_rgb(255_78_32/0.8)] disabled:opacity-35">
        {pending ? "Lançando…" : `Fechei · lançar ${n}x`}
      </motion.button>
      <button onClick={onBack} className="mt-1 h-11 text-[14px] font-semibold text-mute">Ainda não</button>
    </div>
  )
}
