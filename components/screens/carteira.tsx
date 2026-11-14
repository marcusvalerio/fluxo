"use client"

import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { useState, useTransition } from "react"
import { Check, CreditCard, Plus, RotateCcw, Trash2 } from "lucide-react"
import type { Card, Snapshot, Subscription } from "@/lib/types"
import { brl, CATEGORIES, int, type Analysis } from "@/lib/finance"
import { cardSummary, invoiceKey, subMonthly, subsSummary } from "@/lib/plan"
import { field, Label, Primary, rise, Sheet, spring } from "../ui"
import { CatIcon } from "../cat-icon"
import { MetasScreen } from "./metas"
import { addCard, addSubscription, deleteCard, deleteSubscription, setCategoryLimit, toggleSubscription } from "@/app/actions"

type Seg = "cartoes" | "assinaturas" | "limites" | "metas"
const SEGS: { id: Seg; label: string }[] = [
  { id: "cartoes", label: "Cartões" }, { id: "assinaturas", label: "Assinaturas" }, { id: "limites", label: "Limites" }, { id: "metas", label: "Metas" },
]
const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
const fmtDay = (iso: string) => `${Number(iso.slice(8))} ${MES[Number(iso.slice(5, 7)) - 1]}`
const H = "mb-3 flex items-center justify-between px-1"

export function CarteiraScreen({ snap, a }: { snap: Snapshot; a: Analysis }) {
  const [seg, setSeg] = useState<Seg>(() => { try { const v = sessionStorage.getItem("fluxo-seg"); sessionStorage.removeItem("fluxo-seg"); if (v === "metas") return "metas" } catch {} return "cartoes" })
  return (
    <div className="px-4 pt-[max(52px,env(safe-area-inset-top))]">
      <motion.header {...rise} transition={spring} className="px-1 pb-5">
        <p className="text-[13px] text-mute">O que está planejado</p>
        <h1 className="ttl text-[30px] leading-tight">Carteira</h1>
      </motion.header>
      <div className="no-scrollbar mb-6 flex gap-0.5 overflow-x-auto rounded-[22px] bg-sand p-1">
        <LayoutGroup id="carteira">
          {SEGS.map((s) => (
            <button key={s.id} onClick={() => setSeg(s.id)} className={`relative flex-1 whitespace-nowrap rounded-[18px] px-3 py-2.5 text-[13px] ${seg === s.id ? "font-semibold" : "text-smoke"}`}>
              {seg === s.id && <motion.span layoutId="cseg" className="absolute bg-card shadow-sm inset-0 rounded-[18px]" transition={spring} />}
              <span className="relative">{s.label}</span>
            </button>
          ))}
        </LayoutGroup>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={seg} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
          {seg === "cartoes" && <Cartoes snap={snap} />}
          {seg === "assinaturas" && <Assinaturas snap={snap} />}
          {seg === "limites" && <Limites snap={snap} a={a} />}
          {seg === "metas" && <MetasScreen snap={snap} embedded />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ---------------- Cartões ---------------- */

function Cartoes({ snap }: { snap: Snapshot }) {
  const [adding, setAdding] = useState(false)
  return (
    <div className="flex flex-col gap-6">
      {snap.cards.length === 0 && (
        <Empty icon={<CreditCard size={22} />} title="Nenhum cartão" text="Cadastre seus cartões para ver a fatura de cada um, já com as parcelas dos próximos meses." action="Adicionar cartão" onClick={() => setAdding(true)} />
      )}
      {snap.cards.map((c, i) => <CardBlock key={c.id} snap={snap} card={c} index={i} />)}
      {snap.cards.length > 0 && (
        <button onClick={() => setAdding(true)} className="flex h-14 items-center justify-center gap-2 rounded-[23px] border-2 border-dashed border-sand-2 text-[14px] font-semibold text-smoke"><Plus size={16} /> Adicionar cartão</button>
      )}
      <NewCardSheet open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}

function CardBlock({ snap, card, index }: { snap: Snapshot; card: Card; index: number }) {
  const [pending, start] = useTransition()
  const sum = cardSummary(snap, card)
  const usedPct = card.limit > 0 ? Math.min(1, sum.used / card.limit) : 0
  const items = snap.txs.filter((t) => t.cardId === card.id && t.kind === "expense" && invoiceKey(card, t.date) === sum.current.key)
  const dark = index % 2 === 0
  return (
    <motion.div {...rise} transition={{ ...spring, delay: index * 0.05 }}>
      <div className={`relative overflow-hidden rounded-[23px] p-5 ${dark ? "bg-ink text-cotton" : "bg-otan text-white"}`}>
        <div className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="ttl text-[17px]">{card.name}</p>
            <p className="text-[12px] opacity-70">fecha dia {card.closingDay} · vence dia {card.dueDay}</p>
          </div>
          <button disabled={pending} onClick={() => confirm(`Remover o cartão ${card.name}? Os lançamentos continuam, só deixam de estar no cartão.`) && start(() => deleteCard(card.id))}
            className="grid size-9 place-items-center rounded-full bg-white/10" aria-label={`Remover ${card.name}`}><Trash2 size={15} /></button>
        </div>
        {sum.closed && (
          <div className="relative mt-5 flex items-center justify-between rounded-[16px] bg-white/12 px-3.5 py-2.5">
            <span className="text-[12px]">Fatura fechada · vence {fmtDay(sum.closed.due)}</span>
            <span className="num text-[16px]">{brl(sum.closed.total)}</span>
          </div>
        )}
        <p className="relative mt-5 text-[12px] opacity-70">Fatura aberta · vence {fmtDay(sum.current.due)}</p>
        <p className="num relative text-[34px] leading-tight">{brl(sum.current.total)}</p>
        {card.limit > 0 && (
          <div className="relative mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <motion.div className="h-full origin-left rounded-full bg-current" initial={{ scaleX: 0 }} animate={{ scaleX: usedPct }} transition={{ duration: 1, ease: [0.2, 0.9, 0.2, 1] }} />
            </div>
            <p className="mt-1.5 flex justify-between text-[12px] opacity-70"><span>usado {brl(sum.used, false)}</span><span>livre {brl(Math.max(0, sum.available ?? 0), false)}</span></p>
          </div>
        )}
      </div>
      <div className="mt-3 rounded-[23px] bg-card px-5 py-1">
        <Row label={`Próxima fatura · ${fmtDay(sum.next.due)}`} value={brl(sum.next.total)} />
        {sum.future.slice(1, 4).map((f) => <Row key={f.key} label={`Fatura de ${MES[Number(f.key.slice(5)) - 1]}`} value={brl(f.total)} muted />)}
        {items.slice(0, 4).map((t) => (
          <Row key={t.id} label={`${t.description}${t.installment ? ` · ${t.installment.no}/${t.installment.total}` : ""}`} value={brl(t.amount)} muted />
        ))}
      </div>
    </motion.div>
  )
}

function NewCardSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("")
  const [closing, setClosing] = useState("3")
  const [due, setDue] = useState("10")
  const [limit, setLimit] = useState("")
  const [pending, start] = useTransition()
  return (
    <Sheet open={open} onClose={onClose} title="Novo cartão">
      <form className="space-y-3 px-1" onSubmit={(e) => { e.preventDefault(); start(async () => { await addCard({ name, closingDay: Number(closing), dueDay: Number(due), limit: Number(limit.replace(/\./g, "").replace(",", ".")) || 0 }); setName(""); setLimit(""); onClose() }) }}>
        <label className="block"><Label>Nome</Label><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nubank" className={field} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><Label>Fecha dia</Label><input required type="number" min={1} max={31} value={closing} onChange={(e) => setClosing(e.target.value)} className={`${field} num`} /></label>
          <label className="block"><Label>Vence dia</Label><input required type="number" min={1} max={31} value={due} onChange={(e) => setDue(e.target.value)} className={`${field} num`} /></label>
        </div>
        <label className="block"><Label>Limite (opcional)</Label><input inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="8.000" className={`${field} num`} /></label>
        <div className="pt-2"><Primary type="submit" disabled={pending}>{pending ? "Salvando…" : "Adicionar cartão"}</Primary></div>
      </form>
    </Sheet>
  )
}

/* ---------------- Assinaturas ---------------- */

function Assinaturas({ snap }: { snap: Snapshot }) {
  const [adding, setAdding] = useState(false)
  const sum = subsSummary(snap)
  const sorted = [...snap.subs].sort((x, y) => subMonthly(y) - subMonthly(x))
  const day = Number(snap.today.slice(8))
  return (
    <div className="flex flex-col gap-6">
      <motion.div {...rise} transition={spring} className="grid grid-cols-2 gap-3">
        <div className="rounded-[23px] bg-ink p-4 text-cotton">
          <p className="text-[12px] opacity-70">Por mês</p>
          <p className="num mt-1 text-[24px] leading-none">{brl(sum.monthly, false)}</p>
          <p className="mt-1 text-[11px] opacity-60">{sum.count} {sum.count === 1 ? "assinatura" : "assinaturas"}</p>
        </div>
        <div className="rounded-[23px] bg-card p-4">
          <p className="text-[12px] text-mute">Por ano</p>
          <p className="num mt-1 text-[24px] leading-none text-gravy">{brl(sum.yearly, false)}</p>
          <p className="mt-1 text-[11px] text-mute">o custo real delas</p>
        </div>
      </motion.div>

      {sorted.length > 0 && (
        <motion.div {...rise} transition={{ ...spring, delay: 0.05 }}>
          <div className={H}><p className="ttl text-[17px]">Quanto cada uma pesa</p></div>
          <div className="flex h-3 gap-[3px] overflow-hidden rounded-full">
            {sorted.map((x, i) => (
              <motion.span key={x.id} initial={{ flexGrow: 0 }} animate={{ flexGrow: subMonthly(x) }} transition={{ delay: 0.1 + i * 0.04, type: "spring", stiffness: 70, damping: 16 }}
                className="basis-0" style={{ background: i === 0 ? "#FF4E20" : ["var(--c-ink)", "var(--c-smoke)", "var(--c-faint)", "var(--c-sand-3)"][Math.min(3, i - 1)] }} title={x.name} />
            ))}
          </div>
        </motion.div>
      )}

      <motion.div {...rise} transition={{ ...spring, delay: 0.1 }}>
        <div className={H}>
          <p className="ttl text-[17px]">Assinaturas</p>
          <button onClick={() => setAdding(true)} className="flex h-8 items-center gap-1 text-[13px] font-semibold text-mute"><Plus size={14} /> Nova</button>
        </div>
        {sorted.length === 0 ? (
          <Empty icon={<RotateCcw size={22} />} title="Nenhuma assinatura" text="Netflix, Spotify, academia… Cadastre e veja quanto elas custam por ano." action="Adicionar assinatura" onClick={() => setAdding(true)} />
        ) : (
          <div className="rounded-[23px] bg-card px-5 py-1">
            {sorted.map((x) => <SubRow key={x.id} x={x} day={day} card={snap.cards.find((c) => c.id === x.cardId)?.name} />)}
          </div>
        )}
      </motion.div>
      <NewSubSheet open={adding} onClose={() => setAdding(false)} cards={snap.cards} />
    </div>
  )
}

function SubRow({ x, day, card }: { x: Subscription; day: number; card?: string }) {
  const [pending, start] = useTransition()
  const d = x.billingDay - day
  const when = x.cycle === "yearly" ? `todo ${x.billingDay} de ${MES[(x.billingMonth ?? 1) - 1]}` : x.paid ? "cobrada este mês" : d < 0 ? "deveria ter cobrado" : d === 0 ? "cobra hoje" : `cobra em ${d} ${d === 1 ? "dia" : "dias"}`
  return (
    <div className={`group flex items-center gap-3 border-t border-cotton py-3 first:border-0 ${pending ? "opacity-40" : ""}`}>
      <span className="ttl grid size-10 shrink-0 place-items-center rounded-full bg-cotton text-[15px] text-smoke">{x.name[0]?.toUpperCase()}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px]">{x.name}</p>
        <p className={`truncate text-[12px] ${!x.paid && d < 0 && x.dueThisMonth ? "text-gravy" : "text-mute"}`}>{when}{card ? ` · ${card}` : ""}</p>
      </div>
      <div className="text-right">
        <p className="num text-[15px]">{brl(x.amount)}</p>
        <p className="text-[11px] text-mute">{x.cycle === "yearly" ? "por ano" : `${brl(x.amount * 12, false)}/ano`}</p>
      </div>
      {x.dueThisMonth && (
        <button disabled={pending} onClick={() => start(() => toggleSubscription(x.id))} aria-label={x.paid ? `Desfazer cobrança de ${x.name}` : `Marcar ${x.name} como cobrada`}
          className={`grid size-9 shrink-0 place-items-center rounded-full border transition ${x.paid ? "border-ink bg-ink text-cotton" : "border-sand text-mute"}`}>
          {x.paid ? <Check size={15} /> : <Check size={15} />}
        </button>
      )}
      <button onClick={() => confirm(`Remover ${x.name}?`) && start(() => deleteSubscription(x.id))} className="hidden text-mute hover:text-gravy group-hover:block" aria-label={`Remover ${x.name}`}><Trash2 size={14} /></button>
    </div>
  )
}

function NewSubSheet({ open, onClose, cards }: { open: boolean; onClose: () => void; cards: Card[] }) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [dayV, setDay] = useState("10")
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly")
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [card, setCard] = useState<number | null>(cards[0]?.id ?? null)
  const [pending, start] = useTransition()
  return (
    <Sheet open={open} onClose={onClose} title="Nova assinatura">
      <form className="space-y-3 px-1" onSubmit={(e) => { e.preventDefault(); start(async () => { await addSubscription({ name, amount: Number(amount.replace(/\./g, "").replace(",", ".")), billingDay: Number(dayV), cycle, billingMonth: Number(month), cardId: card }); setName(""); setAmount(""); onClose() }) }}>
        <label className="block"><Label>Nome</Label><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Netflix" className={field} /></label>
        <div className="flex gap-2">
          {(["monthly", "yearly"] as const).map((c) => (
            <button type="button" key={c} onClick={() => setCycle(c)} className={`h-10 flex-1 rounded-full text-[13px] font-semibold ${cycle === c ? "bg-ink text-cotton" : "bg-card text-smoke"}`}>{c === "monthly" ? "Mensal" : "Anual"}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><Label>Valor</Label><input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="44,90" className={`${field} num`} /></label>
          <label className="block"><Label>Cobra dia</Label><input required type="number" min={1} max={31} value={dayV} onChange={(e) => setDay(e.target.value)} className={`${field} num`} /></label>
        </div>
        {cycle === "yearly" && (
          <label className="block"><Label>Mês da cobrança</Label>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className={`${field} appearance-none`}>{MES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
          </label>
        )}
        {cards.length > 0 && (
          <div><Label>Cobrada em</Label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setCard(null)} className={`h-10 rounded-full px-4 text-[13px] font-medium ${card === null ? "bg-ink text-cotton" : "bg-card text-smoke"}`}>Débito/Pix</button>
              {cards.map((c) => <button type="button" key={c.id} onClick={() => setCard(c.id)} className={`h-10 rounded-full px-4 text-[13px] font-medium ${card === c.id ? "bg-ink text-cotton" : "bg-card text-smoke"}`}>{c.name}</button>)}
            </div>
          </div>
        )}
        <div className="pt-2"><Primary type="submit" disabled={pending}>{pending ? "Salvando…" : "Adicionar"}</Primary></div>
      </form>
    </Sheet>
  )
}

/* ---------------- Limites ---------------- */

function Limites({ snap, a }: { snap: Snapshot; a: Analysis }) {
  const [edit, setEdit] = useState<string | null>(null)
  const used = Object.entries(snap.limits).map(([cat, lim]) => ({ cat, lim, spent: a.byCategory[cat] ?? 0 })).sort((x, y) => y.spent / y.lim - x.spent / x.lim)
  const free = CATEGORIES.expense.filter((c) => !(c in snap.limits))
  const expected = a.dayOfMonth / a.dim
  return (
    <div className="flex flex-col gap-6">
      {used.length > 0 && (
        <motion.div {...rise} transition={spring}>
          <div className={H}><p className="ttl text-[17px]">Neste mês</p><span className="text-[12px] text-mute">linha = onde deveria estar hoje</span></div>
          <div className="rounded-[23px] bg-card px-5 py-1">
            {used.map((l) => {
              const pct = l.spent / l.lim
              const tone = pct >= 1 ? "#FF4E20" : pct > expected + 0.1 ? "var(--c-gravy)" : "var(--c-ink)"
              return (
                <button key={l.cat} onClick={() => setEdit(l.cat)} className="flex w-full items-center gap-3 border-t border-cotton py-3.5 text-left first:border-0">
                  <CatIcon category={l.cat} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between text-[15px]">
                      <span>{l.cat}</span>
                      <span><span className="num">{brl(l.spent, false)}</span><span className="text-[12px] text-mute"> de {brl(l.lim, false)}</span></span>
                    </div>
                    <div className="hatch relative mt-2 h-2 overflow-visible rounded">
                      <motion.div className="h-full origin-left rounded" style={{ width: `${Math.min(100, pct * 100)}%`, background: tone }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9, ease: [0.2, 0.9, 0.2, 1] }} />
                      <span className="absolute -top-1 h-4 w-0.5 rounded bg-ink/40" style={{ left: `${expected * 100}%` }} />
                    </div>
                    <p className={`mt-1.5 text-[12px] ${pct >= 1 ? "text-gravy" : "text-mute"}`}>
                      {pct >= 1 ? `Estourou em ${brl(l.spent - l.lim, false)}` : `Restam ${brl(l.lim - l.spent, false)} · R$ ${int((l.lim - l.spent) / Math.max(1, a.daysLeft))}/dia`}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </motion.div>
      )}
      <motion.div {...rise} transition={{ ...spring, delay: 0.05 }}>
        <div className={H}><p className="ttl text-[17px]">{used.length ? "Adicionar limite" : "Limites por categoria"}</p></div>
        {!used.length && <p className="mb-3 px-1 text-[14px] text-smoke">Escolha uma categoria e quanto quer gastar nela por mês. O app avisa quando chegar perto.</p>}
        <div className="flex flex-wrap gap-2">
          {free.map((c) => (
            <button key={c} onClick={() => setEdit(c)} className="flex h-10 items-center gap-1.5 rounded-full bg-card px-4 text-[13px] font-medium text-smoke"><Plus size={13} />{c}</button>
          ))}
        </div>
      </motion.div>
      <LimitSheet cat={edit} current={edit ? snap.limits[edit] : undefined} spent={edit ? a.byCategory[edit] ?? 0 : 0} prev={edit ? a.categories.find((c) => c.name === edit)?.prev ?? 0 : 0} onClose={() => setEdit(null)} />
    </div>
  )
}

function LimitSheet({ cat, current, spent, prev, onClose }: { cat: string | null; current?: number; spent: number; prev: number; onClose: () => void }) {
  const [v, setV] = useState("")
  const [pending, start] = useTransition()
  const n = Number(v.replace(/\./g, "").replace(",", ".")) || 0
  return (
    <Sheet open={!!cat} onClose={() => { setV(""); onClose() }} title={cat ? `Limite · ${cat}` : undefined}>
      {cat && (
        <div className="space-y-3 px-1">
          <p className="text-[14px] text-smoke">Neste mês: <span className="num text-ink">{brl(spent, false)}</span>{prev > 0 && <> · mês passado: <span className="num text-ink">{brl(prev, false)}</span></>}</p>
          <label className="block"><Label>Quanto por mês</Label>
            <input autoFocus inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} placeholder={current ? String(current) : prev ? String(Math.round(prev)) : "500"} className={`${field} num text-[22px]`} />
          </label>
          <Primary disabled={pending || !n} onClick={() => start(async () => { await setCategoryLimit(cat, n); setV(""); onClose() })}>{pending ? "Salvando…" : "Salvar limite"}</Primary>
          {current && <button onClick={() => start(async () => { await setCategoryLimit(cat, 0); onClose() })} className="h-11 w-full text-[13px] text-mute hover:text-gravy">Remover limite</button>}
        </div>
      )}
    </Sheet>
  )
}

/* ---------------- peças ---------------- */

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-cotton py-3 first:border-0">
      <span className={`truncate pr-3 text-[14px] ${muted ? "text-smoke" : ""}`}>{label}</span>
      <span className={`num shrink-0 text-[15px] ${muted ? "text-smoke" : ""}`}>{value}</span>
    </div>
  )
}

function Empty({ icon, title, text, action, onClick }: { icon: React.ReactNode; title: string; text: string; action: string; onClick: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-[23px] bg-card px-6 py-8 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-cotton text-smoke">{icon}</span>
      <p className="ttl mt-3 text-[18px]">{title}</p>
      <p className="mt-1 text-[14px] text-smoke">{text}</p>
      <button onClick={onClick} className="mt-4 h-11 rounded-full bg-ink px-5 text-[14px] font-semibold text-cotton">{action}</button>
    </div>
  )
}
