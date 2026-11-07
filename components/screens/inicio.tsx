"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState, useTransition } from "react"
import { ArrowDownLeft, ArrowUpRight, Check, ChevronRight, Gauge, KeyRound, Shield, Lightbulb, LogOut, Plus, RotateCcw, TriangleAlert, Sparkles } from "lucide-react"
import type { Bill, Snapshot } from "@/lib/types"
import { brl, CATEGORIES, insights, int, lastWeek, type Analysis } from "@/lib/finance"
import { labelMonth, relativeDay } from "@/lib/dates"
import { BigMoney, field, Label, Primary, rise, Sheet, spring } from "../ui"
import { TxList } from "../tx-list"
import { HealthCard } from "../health-card"
import { health } from "@/lib/plan"
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
  const paid = snap.bills.filter((b) => b.paid)
  const tips = insights(snap, a)
  const week = lastWeek(snap)
  const weekTotal = week.reduce((x, d) => x + d.total, 0)
  const weekPeak = Math.max(1, ...week.map((d) => d.total))
  const goals = snap.goals.filter((g) => g.saved < g.target).slice(0, 2)

  return (
    <div className="px-4 pt-[max(52px,env(safe-area-inset-top))]">
      <motion.header {...rise} transition={spring} className="flex items-center justify-between px-1 pb-6">
        <div>
          <p className="text-[13px] text-mute first-letter:uppercase">{today}</p>
          <h1 className="ttl text-[30px] leading-tight">Oi, {first}</h1>
        </div>
        <button onClick={() => setSettings(true)} className="lg ttl grid size-[46px] place-items-center rounded-full text-[16px]" aria-label="Ajustes">
          {first[0]?.toUpperCase()}
        </button>
      </motion.header>

      <div className="flex flex-col gap-6">
        {/* Livre até o fim do mês */}
        <motion.section {...rise} transition={{ ...spring, delay: 0.05 }} className="rounded-[23px] bg-paper p-1.5 shadow-[inset_0_1px_0_#fff,0_10px_30px_-18px_rgb(31_40_46/0.4)]">
          <div className="flex justify-between px-3 pb-3 pt-2.5 text-[14px] text-smoke">
            <span>{tight ? "Passou do teto" : `Livre até dia ${a.dim}`}</span>
            <span className="num text-[13px] text-mute">{a.daysLeft} {a.daysLeft === 1 ? "dia" : "dias"}</span>
          </div>
          <div className="rounded-[17px] bg-white p-[18px]">
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
                  style={{ background: i + 1 < a.dayOfMonth ? "var(--c-ink)" : i + 1 === a.dayOfMonth ? "#FF4E20" : "var(--c-sand)" }} />
              ))}
            </div>
            <div className="num mt-2 flex justify-between text-[11px] font-semibold text-mute">
              <span>1 {labelMonth(snap.today).slice(0, 3)}</span><span className="text-gravy">hoje</span><span>{a.dim} {labelMonth(snap.today).slice(0, 3)}</span>
            </div>
          </div>
        </motion.section>

        {/* Saúde financeira */}
        <motion.div {...rise} transition={{ ...spring, delay: 0.07 }}><HealthCard h={health(snap, a)} /></motion.div>

        {/* Entrou / saiu / semana */}
        <motion.div {...rise} transition={{ ...spring, delay: 0.08 }} className="grid grid-cols-2 gap-3">
          <div className="rounded-[23px] bg-white p-4">
            <span className="flex items-center gap-1.5 text-[13px] text-mute"><span className="grid size-6 place-items-center rounded-full bg-otan/12 text-gravy"><ArrowDownLeft size={13} /></span>Entrou</span>
            <p className="num mt-2 text-[22px] leading-none">{brl(a.income, false)}</p>
            <p className="mt-1 text-[11px] text-mute">neste mês</p>
          </div>
          <div className="rounded-[23px] bg-white p-4">
            <span className="flex items-center gap-1.5 text-[13px] text-mute"><span className="grid size-6 place-items-center rounded-full bg-cotton text-smoke"><ArrowUpRight size={13} /></span>Saiu</span>
            <p className="num mt-2 text-[22px] leading-none">{brl(a.expense, false)}</p>
            <p className="mt-1 text-[11px] text-mute">{a.income > 0 ? `${Math.round((a.expense / a.income) * 100)}% do que entrou` : "neste mês"}</p>
          </div>
          <div className="col-span-2 flex items-end gap-4 rounded-[23px] bg-white p-4">
            <div className="shrink-0">
              <p className="text-[13px] text-mute">Últimos 7 dias</p>
              <p className="num mt-1 text-[22px] leading-none">{brl(weekTotal, false)}</p>
              <p className="mt-1 text-[11px] text-mute">média R$ {int(weekTotal / 7)}/dia</p>
            </div>
            <div className="flex h-[58px] flex-1 items-end gap-1.5">
              {week.map((d, i) => (
                <div key={d.iso} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <motion.span initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.35 + i * 0.04, type: "spring", stiffness: 200, damping: 16 }}
                    className="w-[9px] origin-bottom rounded-full" style={{ height: `${Math.max(10, (d.total / weekPeak) * 100)}%`, background: i === 6 ? "#FF4E20" : d.total > a.dailyCap && a.dailyCap > 0 ? "var(--c-gravy)" : d.total ? "var(--c-ink)" : "var(--c-cotton)" }} />
                  <span className="text-[9px] uppercase text-faint">{["D","S","T","Q","Q","S","S"][new Date(d.iso + "T12:00:00Z").getUTCDay()]}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Leituras */}
        {tips.length > 0 && (
          <motion.div {...rise} transition={{ ...spring, delay: 0.1 }} className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4">
            {tips.map((t, i) => {
              const Icon = t.tone === "warn" ? TriangleAlert : t.tone === "good" ? Sparkles : Lightbulb
              return (
                <motion.div key={i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.15 + i * 0.05 }}
                  className={`w-[calc(50%-6px)] shrink-0 snap-start rounded-[23px] p-4 ${t.tone === "warn" ? "bg-ink text-cotton" : "bg-white"}`}>
                  <span className={`grid size-8 place-items-center rounded-full ${t.tone === "warn" ? "bg-otan text-white" : t.tone === "good" ? "bg-otan/12 text-gravy" : "bg-cotton text-smoke"}`}><Icon size={15} /></span>
                  <p className="ttl mt-3 text-[17px] leading-tight">{t.title}</p>
                  <p className={`mt-1 text-[13px] leading-snug ${t.tone === "warn" ? "text-[var(--c-on-ink-2)]" : "text-smoke"}`}>{t.text}</p>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Para onde foi */}
        <motion.div {...rise} transition={{ ...spring, delay: 0.12 }}>
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="ttl text-[17px]">Para onde foi</p>
            <button onClick={() => go("fluxo")} className="text-[13px] font-semibold text-mute">Ver fluxo</button>
          </div>
          <section className="rounded-[23px] bg-white p-5">
          <p className="num text-[30px] leading-none">{brl(a.expense, false)}</p>
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
                      <span><span className="num text-[15px]">{brl(c.value, false)}</span><span className="text-[12px] text-mute">{snap.limits[c.name] ? ` de ${brl(snap.limits[c.name], false)}` : ` · ${Math.round(c.share * 100)}%`}</span></span>
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
          </section>
        </motion.div>

        {/* Contas */}
        <motion.div {...rise} transition={{ ...spring, delay: 0.18 }}>
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="ttl text-[17px]">Pela frente <span className="num ml-1 text-[15px] text-mute">{brl(a.upcomingBills, false)}</span></p>
            <button onClick={() => setBillSheet(true)} className="flex h-8 items-center gap-1 text-[13px] font-semibold text-mute" aria-label="Adicionar conta fixa"><Plus size={14} /> Conta</button>
          </div>
          <section className="rounded-[23px] bg-white px-5 py-1">
          {upcoming.length === 0 ? <p className="py-4 text-[14px] text-mute">Nenhuma conta pendente este mês.</p> :
            upcoming.map((b) => <BillRow key={b.id} b={b} day={a.dayOfMonth} ym={a.ym} />)}
          {paid.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-cotton pb-3 pt-3">
              <span className="mr-1 self-center text-[12px] text-mute">Pagas:</span>
              {paid.map((b) => <PaidChip key={b.id} b={b} />)}
            </div>
          )}
          </section>
        </motion.div>

        {/* Metas */}
        {goals.length > 0 && (
          <motion.div {...rise} transition={{ ...spring, delay: 0.21 }}>
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="ttl text-[17px]">Metas</p>
              <button onClick={() => go("carteira")} className="text-[13px] font-semibold text-mute">Ver todas</button>
            </div>
            <section className="rounded-[23px] bg-white p-5">
            <div className="space-y-4">
              {goals.map((g, i) => {
                const pct = Math.min(1, g.saved / g.target)
                return (
                  <div key={g.id}>
                    <div className="flex items-baseline justify-between text-[14px]">
                      <span>{g.name}</span>
                      <span className="num text-[14px]">{Math.round(pct * 100)}%</span>
                    </div>
                    <div className="mt-1.5 flex h-2.5 gap-[2px]">
                      {Array.from({ length: 30 }, (_, k) => (
                        <span key={k} className="flex-1 rounded-[2px]" style={{ background: k < Math.round(pct * 30) ? (i === 0 ? "var(--c-ink)" : "#FF4E20") : "var(--c-cotton)" }} />
                      ))}
                    </div>
                    <p className="mt-1 text-[12px] text-mute">{brl(g.saved, false)} de {brl(g.target, false)}</p>
                  </div>
                )
              })}
            </div>
            </section>
          </motion.div>
        )}

        {/* Recentes */}
        {snap.txs.length > 0 && (
          <motion.div {...rise} transition={{ ...spring, delay: 0.24 }}>
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="ttl text-[17px]">Recentes</p>
              <button onClick={() => go("fluxo")} className="text-[13px] font-semibold text-mute">Ver tudo</button>
            </div>
            <section className="rounded-[23px] bg-white px-5 py-1">
              <TxList items={snap.txs.filter((t) => t.date <= snap.today).slice(0, 4)} meta={(t) => `${relativeDay(t.date, snap.today)} · ${t.category}`} />
            </section>
          </motion.div>
        )}
      </div>

      <SettingsSheet key={settings ? "o" : "c"} open={settings} onClose={() => setSettings(false)} limit={snap.space.limit} email={snap.user.email} admin={snap.user.role === "admin"} name={snap.user.name} />
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

function PaidChip({ b }: { b: Bill }) {
  const [pending, start] = useTransition()
  return (
    <button disabled={pending} onClick={() => start(() => toggleBill(b.id))} title="Desfazer pagamento" aria-label={`Desfazer pagamento de ${b.name}`}
      className={`flex h-8 items-center gap-1.5 rounded-full bg-cotton px-3 text-[12px] text-smoke ${pending ? "opacity-40" : ""}`}>
      <Check size={12} className="text-gravy" /> {b.name} <RotateCcw size={11} className="text-faint" />
    </button>
  )
}

function SettingsSheet({ open, onClose, limit, email, admin, name }: { open: boolean; onClose: () => void; limit: number; email: string; admin: boolean; name: string }) {
  const [v, setV] = useState(limit ? String(limit) : "")
  const [cur, setCur] = useState("")
  const [nxt, setNxt] = useState("")
  const [msg, setMsg] = useState("")
  const [panel, setPanel] = useState<"teto" | "senha" | null>(null)
  const [pending, start] = useTransition()
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [open, onClose])
  const row = "flex h-[52px] w-full items-center gap-3 px-4 text-left text-[15px]"
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-ink/10 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div role="dialog" aria-modal aria-label="Conta"
            initial={{ opacity: 0, scale: 0.6, y: -10, filter: "blur(8px)" }} animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.7, y: -8, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            style={{ transformOrigin: "calc(100% - 23px) -23px" }}
            className="fixed right-4 border border-white/70 bg-paper/92 shadow-[inset_0_1px_1px_#fff,0_24px_60px_-12px_rgb(31_40_46/0.35)] backdrop-blur-2xl backdrop-saturate-150 top-[max(108px,calc(env(safe-area-inset-top)+108px))] z-50 w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-[23px] bg-paper/80 sm:right-[max(16px,calc(50vw-224px))]">
            <div className="flex items-center gap-3 border-b border-white/60 px-4 py-4">
              <span className="ttl grid size-11 place-items-center rounded-full bg-ink text-[16px] text-cotton">{name[0]?.toUpperCase()}</span>
              <div className="min-w-0"><p className="ttl truncate text-[16px]">{name}</p><p className="truncate text-[12px] text-mute">{email}</p></div>
            </div>

            <button className={row} onClick={() => setPanel(panel === "teto" ? null : "teto")} aria-expanded={panel === "teto"}>
              <Gauge size={18} className="text-smoke" /><span className="flex-1">Teto do mês</span>
              <span className="num text-[14px] text-mute">{limit ? brl(limit, false) : "—"}</span>
            </button>
            <AnimatePresence initial={false}>
              {panel === "teto" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="flex gap-2 px-4 pb-3">
                    <input inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} aria-label="Teto mensal" className="num h-11 min-w-0 flex-1 rounded-[14px] bg-white px-3 text-[16px] outline-none focus-visible:outline-none focus:ring-2 focus:ring-otan" />
                    <button disabled={pending} onClick={() => start(async () => { await setLimit(Number(v.replace(/\./g, "").replace(",", ".")) || 0); setPanel(null) })}
                      className="h-11 rounded-[14px] bg-ink px-4 text-[14px] font-semibold text-cotton disabled:opacity-40">{pending ? "…" : "Salvar"}</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button className={row} onClick={() => setPanel(panel === "senha" ? null : "senha")} aria-expanded={panel === "senha"}>
              <KeyRound size={18} className="text-smoke" /><span className="flex-1">Trocar senha</span>
            </button>
            <AnimatePresence initial={false}>
              {panel === "senha" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="space-y-2 px-4 pb-3">
                    <input type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="Senha atual" className="h-11 w-full rounded-[14px] bg-white px-3 text-[16px] outline-none focus-visible:outline-none focus:ring-2 focus:ring-otan" />
                    <input type="password" autoComplete="new-password" value={nxt} onChange={(e) => setNxt(e.target.value)} placeholder="Nova senha (8+)" className="h-11 w-full rounded-[14px] bg-white px-3 text-[16px] outline-none focus-visible:outline-none focus:ring-2 focus:ring-otan" />
                    {msg && <p className="text-[13px] text-smoke">{msg}</p>}
                    <button disabled={pending || !cur || nxt.length < 8} onClick={() => start(async () => { const r = await changePassword(cur, nxt); setMsg(r.error ?? "Senha trocada."); if (!r.error) { setCur(""); setNxt("") } })}
                      className="h-11 w-full rounded-[14px] bg-ink text-[14px] font-semibold text-cotton disabled:opacity-40">Trocar</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {admin && <a href="/admin" className={row}><Shield size={18} className="text-smoke" /><span className="flex-1">Painel admin</span><ChevronRight size={16} className="text-faint" /></a>}
            <button onClick={() => start(() => logout())} className={`${row} border-t border-white/60 text-gravy`}><LogOut size={18} /><span>Sair</span></button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
