"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useMemo, useRef, useState, useTransition } from "react"
import { Check, Plus, Search } from "lucide-react"
import type { Bill, Snapshot } from "@/lib/types"
import { brl, CATEGORIES, catColor, compact, type Analysis } from "@/lib/finance"
import { labelMonth, labelWeekday, relativeDay } from "@/lib/dates"
import { TxRow } from "../tx-row"
import { Field, inputCls, Primary, Sheet } from "../ui"
import { addBill, deleteBill, toggleBill } from "@/app/actions"

type Filter = "all" | "income" | "expense"

export function TimelineScreen({ snap, a }: { snap: Snapshot; a: Analysis }) {
  const [filter, setFilter] = useState<Filter>("all")
  const [q, setQ] = useState("")
  const [billSheet, setBillSheet] = useState(false)
  const refs = useRef<Record<string, HTMLElement | null>>({})

  const txs = useMemo(() => snap.txs.filter((t) =>
    (filter === "all" || t.kind === filter) && (!q || `${t.description} ${t.category}`.toLowerCase().includes(q.toLowerCase()))), [snap.txs, filter, q])

  const groups = useMemo(() => {
    const m = new Map<string, typeof txs>()
    for (const t of txs) m.set(t.date, [...(m.get(t.date) ?? []), t])
    return [...m.entries()]
  }, [txs])

  // barras do mês: gasto por dia (passado) e contas previstas (futuro)
  const days = useMemo(() => {
    const out: { iso: string; d: number; out: number; inc: number; bills: number; future: boolean }[] = []
    for (let d = 1; d <= a.dim; d++) {
      const iso = `${a.ym}-${String(d).padStart(2, "0")}`
      const dayTx = snap.txs.filter((t) => t.date === iso)
      out.push({
        iso, d,
        out: dayTx.filter((t) => t.kind === "expense").reduce((s, t) => s + t.amount, 0),
        inc: dayTx.filter((t) => t.kind === "income").reduce((s, t) => s + t.amount, 0),
        bills: snap.bills.filter((b) => !b.paid && b.dueDay === d).reduce((s, b) => s + b.amount, 0),
        future: d > a.dayOfMonth,
      })
    }
    return out
  }, [snap, a])
  const peak = Math.max(1, ...days.map((d) => Math.max(d.out, d.bills)))
  const upcoming = snap.bills.filter((b) => !b.paid).sort((x, y) => x.dueDay - y.dueDay)
  const paid = snap.bills.filter((b) => b.paid)

  return (
    <div className="px-6 pt-[max(24px,env(safe-area-inset-top))]">
      <p className="eyebrow">Fluxo</p>
      <h1 className="mt-1 font-serif text-[44px] capitalize leading-none">{labelMonth(snap.today)}</h1>

      {/* faixa do mês */}
      <div className="glass -mx-2 mt-6 rounded-[28px] px-3 pb-3 pt-5">
        <div className="flex h-28 items-end gap-[3px]">
          {days.map((d, i) => {
            const today = d.d === a.dayOfMonth
            const h = d.future ? (d.bills / peak) * 100 : (d.out / peak) * 100
            return (
              <button key={d.iso} className="group relative flex h-full flex-1 flex-col items-center justify-end"
                onClick={() => refs.current[d.iso]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                aria-label={`${d.d}: ${brl(d.out)}`}>
                {d.inc > 0 && <span className="absolute top-0 size-1.5 rounded-full bg-mint shadow-[0_0_8px_var(--color-mint)]" />}
                <motion.span
                  initial={{ height: 0 }} animate={{ height: `${Math.max(d.future && !d.bills ? 0 : 3, h)}%` }}
                  transition={{ delay: i * 0.012, type: "spring", stiffness: 120, damping: 18 }}
                  className={`w-full rounded-full ${d.future ? "border border-dashed border-fg-3/60 bg-transparent" : today ? "bg-acid shadow-[0_0_14px_var(--color-acid)]" : "bg-fg/25 group-hover:bg-fg/50"}`}
                />
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex justify-between px-1 text-[10px] text-fg-3 num">
          <span>01</span><span className="text-acid">hoje · {String(a.dayOfMonth).padStart(2, "0")}</span><span>{a.dim}</span>
        </div>
      </div>

      {/* pela frente */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">Pela frente · {brl(a.upcomingBills, false)}</p>
          <button onClick={() => setBillSheet(true)} className="flex items-center gap-1 text-xs text-fg-3 hover:text-acid"><Plus size={12} /> conta fixa</button>
        </div>
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {upcoming.map((b) => <BillRow key={b.id} b={b} day={a.dayOfMonth} />)}
          </AnimatePresence>
          {upcoming.length === 0 && <li className="rounded-2xl border border-dashed border-line-2 p-4 text-center text-sm text-fg-3">Nenhuma conta pendente este mês ✦</li>}
        </ul>
        {paid.length > 0 && (
          <p className="mt-3 text-xs text-fg-3">Pagas: {paid.map((b) => b.name).join(", ")}</p>
        )}
      </section>

      {/* linha do hoje */}
      <div className="relative my-8 flex items-center gap-3">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-acid/60" />
        <span className="num rounded-full border border-acid/40 px-3 py-1 text-[11px] uppercase tracking-widest text-acid shadow-[0_0_24px_-6px_var(--color-acid)]">hoje</span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-acid/60" />
      </div>

      {/* filtros */}
      <div className="sticky top-0 z-20 -mx-6 bg-ink/80 px-6 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-line bg-white/[0.03] px-4">
            <Search size={14} className="text-fg-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className="h-10 w-full bg-transparent text-sm outline-none" />
          </div>
          <div className="flex rounded-full border border-line p-1 text-xs">
            {(["all", "expense", "income"] as Filter[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`relative rounded-full px-3 py-1.5 ${filter === f ? "text-ink" : "text-fg-3"}`}>
                {filter === f && <motion.span layoutId="flt" className="absolute inset-0 rounded-full bg-fg" />}
                <span className="relative">{f === "all" ? "Tudo" : f === "income" ? "Entradas" : "Saídas"}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* rio do passado */}
      <div className="mt-2">
        {groups.map(([iso, list]) => {
          const net = list.reduce((s, t) => s + (t.kind === "income" ? t.amount : -t.amount), 0)
          return (
            <section key={iso} ref={(el) => { refs.current[iso] = el }} className="relative border-l border-line pb-4 pl-5">
              <span className="absolute -left-[4.5px] top-1.5 size-2 rounded-full bg-fg-3" />
              <div className="flex items-baseline justify-between">
                <p className="text-sm"><span className="capitalize">{relativeDay(iso, snap.today)}</span> <span className="text-fg-3">· {labelWeekday(iso)}</span></p>
                <p className={`num text-xs ${net >= 0 ? "text-mint" : "text-fg-3"}`}>{net >= 0 ? "+" : "−"}{compact(Math.abs(net))}</p>
              </div>
              <ul className="mt-1"><AnimatePresence initial={false}>{list.map((t) => <TxRow key={t.id} tx={t} />)}</AnimatePresence></ul>
            </section>
          )
        })}
        {groups.length === 0 && <p className="py-10 text-center text-sm text-fg-3">Nada encontrado.</p>}
        <p className="py-6 text-center text-xs text-fg-3">Arraste um lançamento para a esquerda para apagar.</p>
      </div>

      <BillSheet open={billSheet} onClose={() => setBillSheet(false)} />
    </div>
  )
}

function BillRow({ b, day }: { b: Bill; day: number }) {
  const [pending, start] = useTransition()
  const d = b.dueDay - day
  const late = d < 0
  return (
    <motion.li layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: pending ? 0.4 : 1, y: 0 }} exit={{ opacity: 0, x: 60 }}
      className="group flex items-center gap-4 rounded-2xl border border-dashed border-line-2 px-4 py-3">
      <div className="num w-10 text-center">
        <p className="text-xl leading-none">{String(b.dueDay).padStart(2, "0")}</p>
        <p className={`mt-1 text-[10px] uppercase ${late ? "text-rose" : d <= 3 ? "text-ember" : "text-fg-3"}`}>{late ? "atraso" : d === 0 ? "hoje" : `${d}d`}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate">{b.name}</p>
        <p className="flex items-center gap-1.5 text-xs text-fg-3"><span className="size-1.5 rounded-full" style={{ background: catColor(b.category) }} />{b.category}</p>
      </div>
      <p className="num text-sm text-fg-2">{brl(b.amount)}</p>
      <button disabled={pending} onClick={() => start(() => toggleBill(b.id))} aria-label={`Marcar ${b.name} como paga`}
        className="grid size-9 place-items-center rounded-full border border-line-2 text-fg-3 transition hover:border-mint hover:bg-mint hover:text-ink">
        <Check size={15} />
      </button>
      <button onClick={() => start(() => deleteBill(b.id))} className="hidden text-xs text-fg-3 hover:text-rose group-hover:block" aria-label="Remover conta">×</button>
    </motion.li>
  )
}

function BillSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [due, setDue] = useState("10")
  const [cat, setCat] = useState("Contas")
  const [pending, start] = useTransition()
  return (
    <Sheet open={open} onClose={onClose} title="Conta fixa">
      <form className="space-y-4" onSubmit={(e) => {
        e.preventDefault()
        start(async () => { await addBill({ name, amount: Number(amount.replace(",", ".")), dueDay: Number(due), category: cat }); setName(""); setAmount(""); onClose() })
      }}>
        <Field label="Nome"><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Internet" className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor"><input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="129,90" className={`${inputCls} num`} /></Field>
          <Field label="Vence dia"><input required type="number" min={1} max={31} value={due} onChange={(e) => setDue(e.target.value)} className={`${inputCls} num`} /></Field>
        </div>
        <Field label="Categoria">
          <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputCls} appearance-none`}>
            {CATEGORIES.expense.map((c) => <option key={c} className="bg-ink">{c}</option>)}
          </select>
        </Field>
        <Primary type="submit" disabled={pending}>{pending ? "Salvando…" : "Adicionar"}</Primary>
      </form>
    </Sheet>
  )
}
