"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useMemo, useState } from "react"
import { ArrowDownLeft, CreditCard, Receipt, RotateCcw } from "lucide-react"
import type { Snapshot } from "@/lib/types"
import { brl, int, type Analysis } from "@/lib/finance"
import { labelMonth } from "@/lib/dates"
import { monthEvents, type DayEvent } from "@/lib/plan"
import { rise, spring } from "../ui"
import { GastosDiaCard, RitmoCard } from "../ritmo"
import type { AgendaView } from "../fluxo-app"

const WD = ["D", "S", "T", "Q", "Q", "S", "S"]
const ICON = { income: ArrowDownLeft, bill: Receipt, sub: RotateCcw, invoice: CreditCard }
const NAME = { income: "Entrada", bill: "Conta", sub: "Assinatura", invoice: "Fatura" }

export function AgendaScreen({ snap, a, view, setView }: { snap: Snapshot; a: Analysis; view: AgendaView; setView: (v: AgendaView) => void }) {
  const events = useMemo(() => monthEvents(snap, a), [snap, a])
  const [sel, setSel] = useState(a.dayOfMonth)
  const first = new Date(a.ym + "-01T12:00:00Z").getUTCDay()
  const cells = [...Array(first).fill(null), ...Array.from({ length: a.dim }, (_, i) => i + 1)]

  const spentByDay = useMemo(() => {
    const m = new Map<number, number>()
    for (const t of snap.txs) if (t.kind === "expense" && t.date.startsWith(a.ym)) m.set(Number(t.date.slice(8)), (m.get(Number(t.date.slice(8))) ?? 0) + t.amount)
    return m
  }, [snap.txs, a.ym])

  const ahead = [...events.entries()].filter(([d]) => d >= a.dayOfMonth).flatMap(([d, es]) => es.filter((e) => !e.done && e.kind !== "income").map((e) => ({ d, e }))).sort((x, y) => x.d - y.d)
  const aheadTotal = ahead.reduce((x, y) => x + y.e.amount, 0)
  const selEvents = events.get(sel) ?? []
  const selSpent = spentByDay.get(sel) ?? 0

  return (
    <div className="px-4 pt-[max(52px,env(safe-area-inset-top))]">
      <motion.header {...rise} transition={spring} className="px-1 pb-6">
        <p className="text-[13px] text-mute">Agenda</p>
        <h1 className="ttl text-[30px] leading-tight first-letter:uppercase">{labelMonth(snap.today)}</h1>
      </motion.header>

      <div className="flex flex-col gap-6">
        <motion.div {...rise} transition={{ ...spring, delay: 0.03 }} className="flex flex-col gap-3">
          <div role="tablist" aria-label="Gráficos do mês" className="flex gap-1 rounded-full bg-sand p-1">
            {([["ritmo", "Ritmo do mês"], ["dia", "Gastos por dia"]] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}
                className={`relative h-10 flex-1 rounded-full text-[13.5px] font-semibold ${view === k ? "text-ink" : "text-mute"}`}>
                {view === k && <motion.span layoutId="agenda-seg" className="absolute inset-0 rounded-full bg-card shadow-[0_1px_3px_rgb(0_0_0/0.08)]" transition={spring} />}
                <span className="relative">{l}</span>
              </button>
            ))}
          </div>
          {view === "ritmo" ? <RitmoCard snap={snap} a={a} /> : <GastosDiaCard snap={snap} a={a} />}
        </motion.div>
        <motion.section {...rise} transition={{ ...spring, delay: 0.05 }} className="rounded-[23px] bg-card p-4">
          <div className="grid grid-cols-7 gap-1 pb-2">
            {WD.map((w, i) => <span key={i} className="text-center text-[11px] font-semibold text-faint">{w}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <span key={`e${i}`} />
              const es = events.get(d) ?? []
              const today = d === a.dayOfMonth
              const past = d < a.dayOfMonth
              const on = d === sel
              const kinds = [...new Set(es.map((e) => e.kind))]
              return (
                <motion.button key={d} onClick={() => setSel(d)} whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.008, ...spring }}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-[14px] text-[15px] ${on ? "bg-ink text-cotton" : today ? "bg-otan/12 text-gravy" : past ? "text-faint" : ""}`}
                  aria-label={`Dia ${d}${es.length ? `, ${es.length} eventos` : ""}`}>
                  <span className={`num ${today && !on ? "font-bold" : ""}`}>{d}</span>
                  <span className="absolute bottom-1.5 flex gap-[3px]">
                    {kinds.slice(0, 3).map((k) => (
                      <span key={k} className="size-[5px] rounded-full" style={{ background: k === "income" ? "var(--c-gravy)" : k === "invoice" ? "#FF4E20" : on ? "var(--c-cotton)" : "var(--c-ink)" }} />
                    ))}
                  </span>
                </motion.button>
              )
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-cotton pt-3 text-[11px] text-mute">
            <span className="flex items-center gap-1.5"><span className="size-[6px] rounded-full bg-gravy" />entrada</span>
            <span className="flex items-center gap-1.5"><span className="size-[6px] rounded-full bg-ink" />conta ou assinatura</span>
            <span className="flex items-center gap-1.5"><span className="size-[6px] rounded-full bg-otan" />fatura</span>
          </div>
        </motion.section>

        <motion.div {...rise} transition={{ ...spring, delay: 0.1 }}>
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="ttl text-[17px]">{sel === a.dayOfMonth ? "Hoje" : `Dia ${sel}`}</p>
            {selSpent > 0 && <span className="text-[12px] text-mute">gastou {brl(selSpent, false)}</span>}
          </div>
          <AnimatePresence mode="wait">
            <motion.section key={sel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              className="rounded-[23px] bg-card px-5 py-1">
              {selEvents.length === 0 ? <p className="py-4 text-[14px] text-mute">Nada marcado para este dia.</p> : selEvents.map((e, i) => <EventRow key={i} e={e} />)}
            </motion.section>
          </AnimatePresence>
        </motion.div>

        <motion.div {...rise} transition={{ ...spring, delay: 0.15 }}>
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="ttl text-[17px]">Até o fim do mês</p>
            <span className="num text-[15px] text-mute">{brl(aheadTotal, false)}</span>
          </div>
          <section className="rounded-[23px] bg-card px-5 py-1">
            {ahead.length === 0 ? <p className="py-4 text-[14px] text-mute">Nada mais para pagar este mês.</p> :
              ahead.map(({ d, e }, i) => (
                <div key={i} className="flex items-center gap-3 border-t border-cotton py-3 first:border-0">
                  <span className="num w-8 text-center text-[17px]">{String(d).padStart(2, "0")}</span>
                  <EventBody e={e} />
                </div>
              ))}
          </section>
          {a.budget > 0 && ahead.length > 0 && (
            <p className="mt-3 px-1 text-[13px] text-smoke">Depois de tudo isso pago, ainda cabem <span className="num text-ink">R$ {int(Math.max(0, a.free))}</span> no mês.</p>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function EventRow({ e }: { e: DayEvent }) {
  return <div className="flex items-center gap-3 border-t border-cotton py-3 first:border-0"><EventBody e={e} /></div>
}

function EventBody({ e }: { e: DayEvent }) {
  const Icon = ICON[e.kind]
  return (
    <>
      <span className={`grid size-9 shrink-0 place-items-center rounded-full ${e.kind === "income" ? "bg-otan/12 text-gravy" : e.kind === "invoice" ? "bg-otan text-white" : "bg-cotton text-smoke"}`}><Icon size={16} /></span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[15px] ${e.done && e.kind !== "income" ? "text-mute line-through" : ""}`}>{e.label}</span>
        <span className="block text-[12px] text-mute">{NAME[e.kind]}{e.done && e.kind !== "income" ? " · paga" : ""}</span>
      </span>
      <span className={`num text-[15px] ${e.kind === "income" ? "text-gravy" : ""}`}>{e.kind === "income" ? "+" : "−"}{brl(e.amount)}</span>
    </>
  )
}
