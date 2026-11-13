"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState, useTransition } from "react"
import { Check, ChevronRight, Crown, Gamepad2, PanelBottom, TreePine, Gauge, MessageCircle, PiggyBank, Smile, Image as ImageIcon, KeyRound, Shield, Smartphone, LayoutGrid, LogOut, TrendingUp, Plus, RotateCcw, Sparkles } from "lucide-react"
import type { Bill, Snapshot } from "@/lib/types"
import { brl, CATEGORIES, insights, int, type Analysis } from "@/lib/finance"
import { labelMonth, relativeDay } from "@/lib/dates"
import { BigMoney, field, Label, Primary, rise, Sheet, spring } from "../ui"
import { TxList } from "../tx-list"
import { HeroCard } from "../hero-card"
import { health } from "@/lib/plan"
import { addBill, changePassword, deleteBill, logout, setLimit, toggleBill } from "@/app/actions"
import type { AgendaView, Tab } from "../fluxo-app"
import { useRitmo } from "../ritmo"
import { Cofrinho } from "../cofrinho"
import { RetroCard } from "../retro"
import { Planos } from "../planos"
import { natalPref, setNatalPref, type NatalPref } from "@/lib/natal"
import { ICONES, iconeAtual, setIcone, type Icone } from "@/lib/icone"
import { fxPrefs, type Deboche } from "../fluximetro"
import { PlanSheet } from "../plan-sheet"

const WEEK = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })

export function InicioScreen({ snap, a, go, goAgenda }: { snap: Snapshot; a: Analysis; go: (t: Tab) => void; goAgenda: (v: AgendaView) => void }) {
  const r = useRitmo(snap, a)
  const [settings, setSettings] = useState(false)
  const [billSheet, setBillSheet] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [planosOpen, setPlanosOpen] = useState(false)
  const first = snap.space.name.split(" ")[0]
  const today = WEEK.format(new Date(snap.today + "T12:00:00Z"))
  const upcoming = snap.bills.filter((b) => !b.paid).sort((x, y) => x.dueDay - y.dueDay)
  const tight = a.free < 0
  const hs = health(snap, a)
  const paid = snap.bills.filter((b) => b.paid)
  const tips = insights(snap, a)

  return (
    <div className="px-4 pt-[max(52px,env(safe-area-inset-top))]">
      <motion.header {...rise} transition={spring} className="flex items-center justify-between px-1 pb-6">
        <div>
          <p className="text-[13px] text-mute first-letter:uppercase">{today}</p>
          <h1 className="ttl text-[30px] leading-tight">Oi, {first}</h1>
        </div>
        <button onClick={() => setSettings(true)} className="ttl grid size-[46px] place-items-center rounded-full bg-card text-[16px]" aria-label="Ajustes">
          {first[0]?.toUpperCase()}
        </button>
      </motion.header>

      <div className="flex flex-col gap-7">
        {/* Livre até o fim do mês */}
        <motion.div {...rise} transition={{ ...spring, delay: 0.05 }}><HeroCard snap={snap} a={a} score={hs.score} /></motion.div>

        <RetroCard snap={snap} />

        {/* recado do Fluximetro: a leitura mais importante do mês, e o atalho pra simular uma compra */}
        <motion.div {...rise} transition={{ ...spring, delay: 0.07 }} className="flex items-center gap-4 rounded-[26px] bg-card py-4 pl-3 pr-5">
          <button onClick={() => window.dispatchEvent(new Event("fluxo:conversa"))} aria-label="Conversar com o Fluximetro" className="w-[58px] shrink-0"><Cofrinho state={tips[0]?.tone === "warn" ? "apertado" : tips[0]?.tone === "good" ? "feliz" : "normal"} label="" /></button>
          <span className="min-w-0 text-[14px] leading-snug text-smoke">
            <span className="mb-1 block text-[11.5px] font-semibold text-faint">Fluximetro</span>
            {tips[0] ? <><b className="font-semibold text-ink">{tips[0].title}</b> {tips[0].text}</> : "Tudo tranquilo por aqui. Eu aviso se algo mudar."}
            <button onClick={() => window.dispatchEvent(new Event("fluxo:comprar"))} className="mt-2.5 block rounded-full bg-ink px-3.5 py-1.5 text-[12.5px] font-semibold text-cotton">Posso comprar algo?</button>
          </span>
        </motion.div>

        {/* atalhos pros gráficos da Agenda */}
        <motion.div {...rise} transition={{ ...spring, delay: 0.08 }} className="-mt-2 grid grid-cols-2 gap-3">
          {([["ritmo", "Ritmo do mês", r.hitDay !== null && a.budget > 0 ? `teto no dia ${r.hitDay}` : "dentro do teto", TrendingUp], ["dia", "Gastos por dia", `${brl(r.last7, false)} na semana`, LayoutGrid]] as const).map(([k, t, sub, Icon]) => (
            <motion.button key={k} whileTap={{ scale: 0.97 }} onClick={() => goAgenda(k)} className="flex items-center gap-2.5 rounded-full bg-card py-2 pl-2 pr-4 text-left">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-otan/12 text-otan"><Icon size={17} /></span>
              <span className="min-w-0"><b className="block truncate text-[13px] font-semibold">{t}</b><span className="block truncate text-[11.5px] text-mute">{sub}</span></span>
            </motion.button>
          ))}
        </motion.div>

        {/* Entrou / saiu */}
        <motion.div {...rise} transition={{ ...spring, delay: 0.09 }} className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-3.5 rounded-[26px] bg-card p-5">
            <span className="flex items-start justify-between gap-2 text-[13.5px] text-mute">Entrou
<span className="text-[11.5px]">neste mês</span></span>
            <p className="num text-[24px] leading-none">{brl(a.income, false)}</p>
          </div>
          <div className="flex flex-col gap-3.5 rounded-[26px] bg-card p-5">
            <span className="flex items-start justify-between gap-2 text-[13.5px] text-mute">Saiu
              {a.income > 0 && <span className="rounded-full bg-ink px-2.5 py-1 text-[11.5px] font-semibold text-cotton">{Math.round((a.expense / a.income) * 100)}%</span>}</span>
            <p className="num text-[24px] leading-none">{brl(a.expense, false)}</p>
          </div>
        </motion.div>

        {/* Para onde foi: colunas por categoria */}
        <motion.div {...rise} transition={{ ...spring, delay: 0.12 }}>
          <section className="rounded-[26px] bg-card p-5">
            <div className="flex items-baseline justify-between text-[14px] text-mute"><span>Para onde foi</span><button onClick={() => go("fluxo")} className="font-semibold">Ver fluxo</button></div>
            <p className="num mt-2.5 text-[34px] leading-none">{brl(a.expense, false)}</p>
            {a.categories.length === 0 ? <p className="mt-4 text-[14px] text-mute">Nenhum gasto este mês ainda.</p> : (
              <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${a.categories.length}, minmax(0,1fr))` }}>
                {a.categories.map((c, i) => {
                  const h = Math.max(22, (c.value / a.categories[0].value) * 92)
                  const top = i === 0
                  const hot = c.prev > 0 && a.dayOfMonth >= 8 && c.value > c.prev * (a.dayOfMonth / a.dim) * 1.3
                  return (
                    <div key={c.name} className="flex flex-col items-center gap-2">
                      <span className={`text-[11.5px] ${hot ? "font-semibold text-gravy" : "text-mute"}`}>{Math.round(c.share * 100)}%</span>
                      <div className="relative h-[120px] w-full overflow-hidden rounded-[14px] bg-paper">
                        <motion.div className="absolute inset-x-0 bottom-0 origin-bottom rounded-[12px]" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 160, damping: 20 }}
                          style={{ height: `${h}%`, background: top ? "linear-gradient(180deg,#FF8A63,#FF4E20)" : "repeating-linear-gradient(-45deg,#FFB89E 0 2px,transparent 2px 6px),#FFE1D6" }} />
                        <span className={`num absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] shadow-[0_1px_3px_rgb(0_0_0/0.08)] ${top ? "bg-ink text-cotton" : "bg-card text-ink"}`}
                          style={{ bottom: `calc(${h}% - 26px)` }}>{int(c.value)}</span>
                      </div>
                      <span className={`max-w-full truncate text-[12px] ${top ? "font-semibold text-ink" : "text-mute"}`}>{c.name}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </motion.div>

        {/* Contas */}
        <motion.div {...rise} transition={{ ...spring, delay: 0.18 }}>
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="ttl text-[17px]">Pela frente <span className="num ml-1 text-[15px] text-mute">{brl(a.upcomingBills, false)}</span></p>
            <button onClick={() => setBillSheet(true)} className="flex h-8 items-center gap-1 text-[13px] font-semibold text-mute" aria-label="Adicionar conta fixa"><Plus size={14} /> Conta</button>
          </div>
          <section className="rounded-[23px] bg-card px-5 py-1">
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

        {/* Recentes */}
        {snap.txs.length > 0 && (
          <motion.div {...rise} transition={{ ...spring, delay: 0.24 }}>
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="ttl text-[17px]">Recentes</p>
              <button onClick={() => go("fluxo")} className="text-[13px] font-semibold text-mute">Ver tudo</button>
            </div>
            <section className="rounded-[23px] bg-card px-5 py-1">
              <TxList items={snap.txs.filter((t) => t.date <= snap.today).slice(0, 4)} meta={(t) => `${relativeDay(t.date, snap.today)} · ${t.category}`} />
            </section>
          </motion.div>
        )}
      </div>

      <SettingsSheet key={settings ? "o" : "c"} open={settings} onClose={() => setSettings(false)} limit={snap.space.limit} email={snap.user.email} admin={snap.user.role === "admin"} name={snap.user.name} onPlan={() => { setSettings(false); setPlanOpen(true) }} onPlanos={() => { setSettings(false); setPlanosOpen(true) }} />
      <Planos open={planosOpen} onClose={() => setPlanosOpen(false)} />
      <PlanSheet key={planOpen ? "po" : "pc"} open={planOpen} onClose={() => setPlanOpen(false)} snap={snap} />
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

function SettingsSheet({ open, onClose, limit, email, admin, name, onPlan, onPlanos }: { open: boolean; onClose: () => void; limit: number; email: string; admin: boolean; name: string; onPlan: () => void; onPlanos: () => void }) {
  const [bar, setBar] = useState(() => { try { return localStorage.getItem("fluxo-barra") === "solid" ? "solid" : "glass" } catch { return "glass" } })
  const [natal, setNatal] = useState<NatalPref>(() => natalPref())
  const toggleBar = () => { const v = bar === "solid" ? "glass" : "solid"; setBar(v); try { localStorage.setItem("fluxo-barra", v) } catch {}; if (v === "solid") document.documentElement.dataset.bar = "solid"; else delete document.documentElement.dataset.bar }
  const nextNatal = () => { const v: NatalPref = natal === "auto" ? "on" : natal === "on" ? "off" : "auto"; setNatal(v); setNatalPref(v) }
  const [nivel, setNivel] = useState<Deboche>(() => fxPrefs.nivel())
  const [icone, setIc] = useState<Icone>(() => iconeAtual())
  const [talk, setTalk] = useState(() => fxPrefs.talk())
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
  const row = "flex min-h-[52px] py-2.5 w-full items-center gap-3 px-4 text-left text-[15px]"
  return (
    <Sheet open={open} onClose={onClose} title="Ajustes">
          <div className="overflow-hidden rounded-[23px] bg-card">
            <div className="flex items-center gap-3 border-b border-cotton px-4 py-4">
              <span className="ttl grid size-11 place-items-center rounded-full bg-ink text-[16px] text-cotton">{name[0]?.toUpperCase()}</span>
              <div className="min-w-0"><p className="ttl truncate text-[16px]">{name}</p><p className="truncate text-[12px] text-mute">{email}</p></div>
            </div>

            <button className={row} onClick={onPlan}>
              <PiggyBank size={18} className="text-smoke" /><span className="flex-1">Seu plano</span><span className="text-[13px] text-mute">guardar e metas</span><ChevronRight size={16} className="text-faint" />
            </button>
            <button className={row} onClick={() => setPanel(panel === "teto" ? null : "teto")} aria-expanded={panel === "teto"}>
              <Gauge size={18} className="text-smoke" /><span className="flex-1">Teto do mês</span>
              <span className="num text-[14px] text-mute">{limit ? brl(limit, false) : "—"}</span>
            </button>
            <AnimatePresence initial={false}>
              {panel === "teto" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="flex gap-2 px-4 pb-3">
                    <input inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} aria-label="Teto mensal" className="num h-11 min-w-0 flex-1 rounded-[14px] bg-card px-3 text-[16px] outline-none focus-visible:outline-none focus:ring-2 focus:ring-otan" />
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
                    <input type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="Senha atual" className="h-11 w-full rounded-[14px] bg-card px-3 text-[16px] outline-none focus-visible:outline-none focus:ring-2 focus:ring-otan" />
                    <input type="password" autoComplete="new-password" value={nxt} onChange={(e) => setNxt(e.target.value)} placeholder="Nova senha (8+)" className="h-11 w-full rounded-[14px] bg-card px-3 text-[16px] outline-none focus-visible:outline-none focus:ring-2 focus:ring-otan" />
                    {msg && <p className="text-[13px] text-smoke">{msg}</p>}
                    <button disabled={pending || !cur || nxt.length < 8} onClick={() => start(async () => { const r = await changePassword(cur, nxt); setMsg(r.error ?? "Senha trocada."); if (!r.error) { setCur(""); setNxt("") } })}
                      className="h-11 w-full rounded-[14px] bg-ink text-[14px] font-semibold text-cotton disabled:opacity-40">Trocar</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button className={row} onClick={() => { onClose(); window.dispatchEvent(new Event("fluxo:install")) }}>
              <Smartphone size={18} className="text-smoke" /><span className="flex-1">Instalar no iPhone</span><ChevronRight size={16} className="text-faint" />
            </button>
            <button className={row} onClick={() => { onClose(); window.dispatchEvent(new Event("fluxo:fluximetro")) }}>
              <Sparkles size={18} className="text-smoke" /><span className="flex-1">Conhecer o Fluximetro</span><ChevronRight size={16} className="text-faint" />
            </button>
            <button className={row} onClick={onPlanos}>
              <Crown size={18} className="text-smoke" /><span className="flex-1">Assinatura</span><span className="text-[13px] text-mute">fase de testes</span><ChevronRight size={16} className="text-faint" />
            </button>
            <button className={row} role="switch" aria-checked={bar === "glass"} onClick={toggleBar}>
              <PanelBottom size={18} className="text-smoke" /><span className="flex-1">Barra translúcida</span><Toggle on={bar === "glass"} />
            </button>
            <button className={row} onClick={nextNatal}>
              <TreePine size={18} className="text-smoke" /><span className="flex-1">Modo Natal</span><span className="text-[13px] font-semibold text-mute">{natal === "auto" ? "Automático" : natal === "on" ? "Ligado" : "Desligado"}</span>
            </button>
            <button className={row} onClick={() => { onClose(); window.dispatchEvent(new Event("fluxo:jogo")) }}>
              <Gamepad2 size={18} className="text-smoke" /><span className="flex-1">Jogar com o Fluximetro</span><ChevronRight size={16} className="text-faint" />
            </button>
            <div className={`${row} flex-col !items-stretch gap-2.5`}>
              <span className="flex items-center gap-3"><Smile size={18} className="text-smoke" /><span className="flex-1">Nível de deboche<small className="block text-[12px] font-normal text-mute">Quanto o Fluximetro pode zoar seus gastos</small></span></span>
              <div className="grid grid-cols-3 gap-1 rounded-[14px] bg-cotton p-1">
                {([["educado", "Educado"], ["sincero", "Sincero"], ["semfiltro", "Sem filtro"]] as const).map(([k, t]) => (
                  <button key={k} onClick={() => { fxPrefs.setNivel(k); setNivel(k) }} aria-pressed={nivel === k}
                    className={`h-9 rounded-[11px] text-[13px] font-semibold ${nivel === k ? "bg-card text-ink shadow-sm" : "text-mute"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className={`${row} flex-col !items-stretch gap-2.5`}>
              <span className="flex items-center gap-3"><ImageIcon size={18} className="text-smoke" /><span className="flex-1">Ícone do app<small className="block text-[12px] font-normal text-mute">Vale quando você adicionar o app de novo à tela inicial</small></span></span>
              <div className="grid grid-cols-3 gap-2">
                {ICONES.map((k) => (
                  <button key={k} onClick={() => { setIcone(k); setIc(k) }} aria-pressed={icone === k}
                    className={`flex flex-col items-center gap-1.5 rounded-[14px] p-2 text-[12px] font-semibold capitalize ${icone === k ? "bg-card text-ink ring-2 ring-otan" : "text-mute"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/icons/${k}-180.png`} alt="" className="size-12 rounded-[12px]" />{k}
                  </button>
                ))}
              </div>
            </div>
            <button className={row} role="switch" aria-checked={talk} onClick={() => { fxPrefs.setTalk(!talk); setTalk(!talk) }}>
              <MessageCircle size={18} className="text-smoke" /><span className="flex-1">Comentar lançamentos</span><Toggle on={talk} />
            </button>
            {admin && <a href="/admin" className={row}><Shield size={18} className="text-smoke" /><span className="flex-1">Painel admin</span><ChevronRight size={16} className="text-faint" /></a>}
            <button onClick={() => start(() => logout())} className={`${row} border-t border-cotton text-gravy`}><LogOut size={18} /><span>Sair</span></button>
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

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors ${on ? "bg-otan" : "bg-sand-2"}`}>
      <span className={`absolute top-[3px] size-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-[21px]" : "translate-x-[3px]"}`} />
    </span>
  )
}
