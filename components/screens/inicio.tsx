"use client"

import { motion } from "framer-motion"
import { useState, useTransition } from "react"
import { Check, ChevronRight, LogOut, Plus } from "lucide-react"
import type { Bill, Snapshot } from "@/lib/types"
import { brl, CATEGORIES, int, type Analysis } from "@/lib/finance"
import { labelMonth, relativeDay } from "@/lib/dates"
import { BigMoney, field, Label, Primary, rise, Sheet, spring } from "../ui"
import { TxList } from "../tx-list"
import { addBill, changePassword, deleteBill, logout, setLimit, toggleBill } from "@/app/actions"
import type { Tab } from "../fluxo-app"

const WEEK = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })

export function InicioScreen({ snap, a, go }: { snap: Snapshot; a: Analysis; go: (t: Tab) => void }) {
  const [settings, setSettings] = useState(false)
  const [billSheet, setBillSheet] = useState(false)
  const first = snap.space.name.split(" ")[0]
  const today = WEEK.format(new Date(snap.today + "T12:00:00Z"))
  const upcoming = snap.bills.filter((b) => !b.paid).sort((x, y) => x.dueDay - y.dueDay)
  const tight = a.free < 0

  return (
    <div className="px-3 pt-[max(56px,env(safe-area-inset-top))]">
      <motion.header {...rise} transition={spring} className="flex items-center justify-between px-2 pb-4">
        <div>
          <p className="text-[13px] text-mute first-letter:uppercase">{today}</p>
          <h1 className="ttl text-[30px] leading-tight">Oi, {first}</h1>
        </div>
        <button onClick={() => setSettings(true)} className="lg ttl grid size-[46px] place-items-center rounded-full text-[16px]" aria-label="Ajustes">
          {first[0]?.toUpperCase()}
        </button>
      </motion.header>

      <div className="flex flex-col gap-3">
        {/* Livre até o fim do mês */}
        <motion.section {...rise} transition={{ ...spring, delay: 0.05 }} className="rounded-[30px] bg-paper p-1.5 shadow-[inset_0_1px_0_#fff,0_10px_30px_-18px_rgb(31_40_46/0.4)]">
          <div className="flex justify-between px-3 pb-3 pt-2.5 text-[14px] text-smoke">
            <span>{tight ? "Passou do teto" : `Livre até dia ${a.dim}`}</span>
            <span className="num text-[13px] text-mute">{a.daysLeft} {a.daysLeft === 1 ? "dia" : "dias"}</span>
          </div>
          <div className="rounded-[24px] bg-white p-[18px]">
            <BigMoney value={a.free} />
            <p className="mt-2.5 text-[14px] text-smoke">
              {a.budget <= 0 ? "Defina um teto mensal nos ajustes para ver quanto cabe." :
                tight ? <>Você está <span className="num text-gravy">{brl(-a.free, false)}</span> acima do teto do mês.</> :
                <>Dá uns <span className="num text-ink">R$ {int(a.perDay)}</span> por dia sem apertar.</>}
            </p>
            <div className="mt-[18px] flex h-4 gap-[3px]" aria-hidden>
              {Array.from({ length: a.dim }, (_, i) => (
                <motion.span key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                  transition={{ delay: 0.3 + i * 0.02, type: "spring", stiffness: 500, damping: 14 }}
                  className="flex-1 origin-bottom rounded-[3px]"
                  style={{ background: i + 1 < a.dayOfMonth ? "#1F282E" : i + 1 === a.dayOfMonth ? "#FF4E20" : "#DAD8CF" }} />
              ))}
            </div>
            <div className="num mt-2 flex justify-between text-[11px] font-semibold text-mute">
              <span>1 {labelMonth(snap.today).slice(0, 3)}</span><span className="text-gravy">hoje</span><span>{a.dim} {labelMonth(snap.today).slice(0, 3)}</span>
            </div>
          </div>
        </motion.section>

        {/* Para onde foi */}
        <motion.section {...rise} transition={{ ...spring, delay: 0.12 }} className="rounded-[30px] bg-white p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[14px] text-mute">Para onde foi</p>
              <p className="num mt-1 text-[30px]">{brl(a.expense, false)}</p>
            </div>
            <button onClick={() => go("fluxo")} className="lg grid size-11 place-items-center rounded-full" aria-label="Ver o fluxo do mês"><ChevronRight size={18} /></button>
          </div>
          {a.categories.length === 0 ? (
            <p className="mt-4 text-[14px] text-mute">Nenhum gasto este mês ainda.</p>
          ) : (
            <>
              <div className="mt-4 flex h-2.5 gap-[3px] overflow-hidden rounded-full">
                {a.categories.map((c, i) => (
                  <motion.span key={c.name} initial={{ flexGrow: 0 }} animate={{ flexGrow: c.share }} transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 70, damping: 16 }}
                    className="basis-0" style={{ background: c.color }} />
                ))}
              </div>
              <div className="mt-[18px] flex flex-col gap-3.5">
                {a.categories.map((c, i) => (
                  <div key={c.name}>
                    <div className="mb-1.5 flex items-baseline justify-between text-[14px]">
                      <span className="flex items-center gap-2"><span className="size-2 rounded-[2px]" style={{ background: c.color }} />{c.name}</span>
                      <span><span className="num text-[15px]">{brl(c.value, false)}</span><span className="text-[12px] text-mute"> · {Math.round(c.share * 100)}%</span></span>
                    </div>
                    <div className="hatch h-2 overflow-hidden rounded">
                      <motion.div className="h-full origin-left rounded" style={{ background: c.color, width: `${(c.value / a.categories[0].value) * 100}%` }}
                        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.35 + i * 0.06, duration: 1, ease: [0.2, 0.9, 0.2, 1] }} />
                    </div>
                    {c.prev > 0 && a.dayOfMonth >= 8 && c.value > c.prev * (a.dayOfMonth / a.dim) * 1.3 && (
                      <p className="mt-1.5 text-[12px] text-gravy">Acima do ritmo do mês passado.</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.section>

        {/* Contas */}
        <motion.section {...rise} transition={{ ...spring, delay: 0.18 }} className="rounded-[30px] bg-white px-5 py-2">
          <div className="flex items-center justify-between pb-1 pt-3">
            <p className="text-[14px] text-mute">Pela frente · <span className="num text-ink">{brl(a.upcomingBills, false)}</span></p>
            <button onClick={() => setBillSheet(true)} className="flex h-9 items-center gap-1 rounded-full px-2 text-[13px] font-semibold text-smoke" aria-label="Adicionar conta fixa"><Plus size={14} /> Conta</button>
          </div>
          {upcoming.length === 0 ? <p className="pb-4 pt-1 text-[14px] text-mute">Nenhuma conta pendente este mês.</p> :
            upcoming.map((b) => <BillRow key={b.id} b={b} day={a.dayOfMonth} ym={a.ym} />)}
        </motion.section>

        {/* Recentes */}
        {snap.txs.length > 0 && (
          <motion.section {...rise} transition={{ ...spring, delay: 0.24 }} className="rounded-[30px] bg-white px-5 py-2">
            <p className="pb-1 pt-3 text-[14px] text-mute">Recentes</p>
            <TxList items={snap.txs.slice(0, 4)} meta={(t) => `${relativeDay(t.date, snap.today)} · ${t.category}`} />
          </motion.section>
        )}
      </div>

      <SettingsSheet open={settings} onClose={() => setSettings(false)} limit={snap.space.limit} email={snap.user.email} admin={snap.user.role === "admin"} />
      <BillSheet open={billSheet} onClose={() => setBillSheet(false)} />
    </div>
  )
}

function BillRow({ b, day, ym }: { b: Bill; day: number; ym: string }) {
  const [pending, start] = useTransition()
  const d = b.dueDay - day
  const when = d < 0 ? "Atrasada" : d === 0 ? "Vence hoje" : d === 1 ? "Amanhã" : `Em ${d} dias`
  return (
    <div className={`group flex items-center gap-3.5 border-t border-cotton py-3 first:border-0 ${pending ? "opacity-40" : ""}`}>
      <div className="num flex size-10 flex-col items-center justify-center rounded-xl bg-cotton leading-none">
        <span className="text-[15px]">{String(b.dueDay).padStart(2, "0")}</span>
        <span className="mt-0.5 text-[9px] uppercase text-mute">{["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"][Number(ym.slice(5)) - 1]}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px]">{b.name}</p>
        <p className={`text-[12px] ${d < 0 ? "text-gravy" : "text-mute"}`}>{when}</p>
      </div>
      <span className="num text-[15px]">{brl(b.amount)}</span>
      <button disabled={pending} onClick={() => start(() => toggleBill(b.id))} aria-label={`Marcar ${b.name} como paga`}
        className="grid size-9 place-items-center rounded-full border border-sand text-mute transition hover:border-ink hover:bg-ink hover:text-cotton">
        <Check size={15} />
      </button>
      <button onClick={() => start(() => deleteBill(b.id))} className="hidden text-[12px] text-mute hover:text-gravy group-hover:block" aria-label={`Remover ${b.name}`}>×</button>
    </div>
  )
}

function SettingsSheet({ open, onClose, limit, email, admin }: { open: boolean; onClose: () => void; limit: number; email: string; admin: boolean }) {
  const [v, setV] = useState(limit ? String(limit) : "")
  const [cur, setCur] = useState("")
  const [nxt, setNxt] = useState("")
  const [msg, setMsg] = useState("")
  const [pending, start] = useTransition()
  return (
    <Sheet open={open} onClose={onClose} title="Ajustes">
      <div className="space-y-4 px-1">
        <label className="block"><Label>Teto de gastos por mês (R$)</Label>
          <input inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} className={`${field} num text-[22px]`} />
        </label>
        <Primary disabled={pending} onClick={() => start(async () => { await setLimit(Number(v.replace(/\./g, "").replace(",", ".")) || 0); onClose() })}>
          {pending ? "Salvando…" : "Salvar"}
        </Primary>
        <div className="space-y-2 pt-3">
          <Label>Trocar senha</Label>
          <input type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="Senha atual" className={field} />
          <input type="password" autoComplete="new-password" value={nxt} onChange={(e) => setNxt(e.target.value)} placeholder="Nova senha (8+ caracteres)" className={field} />
          {msg && <p className="px-1 text-[13px] text-smoke">{msg}</p>}
          <button disabled={pending || !cur || nxt.length < 8} onClick={() => start(async () => { const r = await changePassword(cur, nxt); setMsg(r.error ?? "Senha trocada."); if (!r.error) { setCur(""); setNxt("") } })}
            className="h-12 w-full rounded-[24px] bg-white text-[14px] font-semibold disabled:opacity-40">Trocar senha</button>
        </div>
        {admin && <a href="/admin" className="flex h-12 w-full items-center justify-center rounded-[24px] bg-white text-[14px] font-semibold">Abrir painel admin</a>}
        <button onClick={() => start(() => logout())} className="flex h-12 w-full items-center justify-center gap-2 text-[14px] text-mute hover:text-gravy">
          <LogOut size={15} /> Sair · {email}
        </button>
      </div>
    </Sheet>
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
      <form className="space-y-3 px-1" onSubmit={(e) => {
        e.preventDefault()
        start(async () => { await addBill({ name, amount: Number(amount.replace(/\./g, "").replace(",", ".")), dueDay: Number(due), category: cat }); setName(""); setAmount(""); onClose() })
      }}>
        <label className="block"><Label>Nome</Label><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Internet" className={field} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><Label>Valor</Label><input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="129,90" className={`${field} num`} /></label>
          <label className="block"><Label>Vence dia</Label><input required type="number" min={1} max={31} value={due} onChange={(e) => setDue(e.target.value)} className={`${field} num`} /></label>
        </div>
        <label className="block"><Label>Categoria</Label>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${field} appearance-none`}>
            {CATEGORIES.expense.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <div className="pt-2"><Primary type="submit" disabled={pending}>{pending ? "Salvando…" : "Adicionar"}</Primary></div>
      </form>
    </Sheet>
  )
}
