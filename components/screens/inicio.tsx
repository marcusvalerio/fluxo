"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState, useTransition } from "react"
import { Check, ChevronRight, Crown, Gamepad2, PanelBottom, TreePine, Gauge, MessageCircle, PiggyBank, Smile, Zap, Send, Bell, KeyRound, Shield, Smartphone, LayoutGrid, LogOut, TrendingUp, Plus, RotateCcw, Sparkles } from "lucide-react"
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
import { CaiuCard, ProximasEntradas } from "../entradas"
import { CountUp, StripeBars } from "../kpis"
import { RetroCard } from "../retro"
import { Planos } from "../planos"
import { isNatal, natalPref, setNatalPref, type NatalPref } from "@/lib/natal"
import { NatalCena } from "../natal-cena"
import { ComprasNatal } from "../compras-natal"
import { fxPrefs, type Deboche } from "../fluximetro"
import { PlanSheet } from "../plan-sheet"
import { Atalho } from "../atalho"
import { useNotificacoes } from "../notificacoes"
import { Convite } from "../convite"

/** A saudação muda com o momento do mês. */
function saudacao(snap: Snapshot, a: Analysis, nome: string) {
  const dia = Number(snap.today.slice(8, 10))
  const salario = snap.txs.some((t) => t.kind === "income" && t.date === snap.today && /sal[aá]rio|pagamento|holerite/i.test(t.description))
  if (salario) return `Dia de salário, ${nome}`
  if (a.free < 0) return `Segura firme, ${nome}`
  if (a.daysLeft <= 1 && a.free > 0) return `Mês no azul, ${nome}`
  if (a.budget > 0 && a.free / a.budget < 0.2) return `Faltam ${a.daysLeft} dias, ${nome}`
  if (dia === 1) return `Mês novo, ${nome}`
  const h = new Date().getHours()
  return `${h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"}, ${nome}`
}

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
  // modo Natal: cena e compras de fim de ano no topo
  const [natalOn, setNatalOn] = useState(false)
  useEffect(() => { const u = () => setNatalOn(isNatal(snap.today)); u(); window.addEventListener("fluxo:natal", u); return () => window.removeEventListener("fluxo:natal", u) }, [snap.today])

  return (
    <div className="px-4 pt-[max(52px,env(safe-area-inset-top))]">
      <motion.header {...rise} transition={spring} className="flex items-center justify-between px-1 pb-6">
        <div>
          <p className="text-[13px] text-mute first-letter:uppercase">{today}</p>
          <h1 suppressHydrationWarning className="ttl text-[30px] leading-tight">{saudacao(snap, a, first)}</h1>
        </div>
        <button onClick={() => setSettings(true)} className="ttl grid size-[46px] place-items-center rounded-full bg-card text-[16px]" aria-label="Ajustes">
          {first[0]?.toUpperCase()}
        </button>
      </motion.header>

      {/* acessos rápidos */}
      <motion.nav {...rise} transition={{ ...spring, delay: 0.03 }} aria-label="Acessos rápidos" className="no-scrollbar -mx-4 -mt-1 mb-5 flex gap-2 overflow-x-auto px-4">
        {([["Hoje", () => goAgenda("dia")], ["Contas a pagar", () => go("agenda")], ["Posso comprar?", () => window.dispatchEvent(new Event("fluxo:comprar"))], ["Metas", () => { try { sessionStorage.setItem("fluxo-seg", "metas") } catch {} go("carteira") }]] as const).map(([t, fn], i) => (
          <button key={t} onClick={fn} className={`shrink-0 rounded-full px-[18px] py-[11px] text-[14px] ${i === 0 ? "bg-ink font-semibold text-cotton" : "bg-card font-medium text-ink"}`}>{t}</button>
        ))}
      </motion.nav>

      <div className="flex flex-col gap-7">
        {/* Livre até o fim do mês */}
        <CaiuCard snap={snap} />

        <motion.div {...rise} transition={{ ...spring, delay: 0.05 }}><HeroCard snap={snap} a={a} score={hs.score} /></motion.div>

        <RetroCard snap={snap} />

        {natalOn && (
          <motion.div {...rise} transition={{ ...spring, delay: 0.06 }} className="flex flex-col gap-3">
            <NatalCena className="aspect-[1.5] w-full rounded-[24px]" />
            <ComprasNatal />
          </motion.div>
        )}

        {/* cartão do Fluximetro: ele mora aqui, pisca e recebe moeda; um toque e ele responde */}
        <motion.div {...rise} transition={{ ...spring, delay: 0.07 }}>
          <FluximetroCard tip={tips[0]} />
        </motion.div>

        <ProximasEntradas snap={snap} onOpen={() => { try { sessionStorage.setItem("fluxo-seg", "entradas") } catch {} ; go("carteira") }} />

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
            <p className="num text-[24px] leading-none text-[var(--c-pos)]"><CountUp value={Math.round(a.income)} prefix="+R$ " /></p>
          </div>
          <div className="flex flex-col gap-3.5 rounded-[26px] bg-card p-5">
            <span className="flex items-start justify-between gap-2 text-[13.5px] text-mute">Saiu
              {a.income > 0 && <span className="rounded-full bg-ink px-2.5 py-1 text-[11.5px] font-semibold text-cotton">{Math.round((a.expense / a.income) * 100)}%</span>}</span>
            <p className="num text-[24px] leading-none"><CountUp value={Math.round(a.expense)} prefix="−R$ " /></p>
          </div>
        </motion.div>

        {/* Para onde foi: colunas por categoria */}
        <motion.div {...rise} transition={{ ...spring, delay: 0.12 }}>
          <section className="rounded-[26px] bg-card p-5">
            <div className="flex items-baseline justify-between text-[14px] text-mute"><span>Para onde foi</span><button onClick={() => go("fluxo")} className="font-semibold">Ver fluxo</button></div>
            <p className="num mt-2.5 text-[34px] leading-none">{brl(a.expense, false)}</p>
            {a.categories.length === 0 ? <p className="mt-4 text-[14px] text-mute">Nenhum gasto este mês ainda.</p> : (
              <div className="mt-4"><StripeBars items={a.categories.map((c) => ({ name: c.name, value: c.value, delta: c.prev > 0 ? (c.value - c.prev * (a.dayOfMonth / a.dim)) / (c.prev * (a.dayOfMonth / a.dim)) : null }))} /></div>
            )}
          </section>
        </motion.div>

        {/* Contas */}
        <motion.div {...rise} transition={{ ...spring, delay: 0.18 }}>
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="ttl text-[17px]">Contas do mês <span className="num ml-1 text-[15px] text-mute">{brl(a.upcomingBills, false)}</span></p>
            <button onClick={() => setBillSheet(true)} className="flex h-8 items-center gap-1 text-[13px] font-semibold text-mute" aria-label="Adicionar conta fixa"><Plus size={14} /> Conta fixa</button>
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

export function BillRow({ b, day, ym }: { b: Bill; day: number; ym: string }) {
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
      <button onClick={() => start(() => deleteBill(b.id))} className="grid size-7 place-items-center text-[16px] text-faint hover:text-gravy" aria-label={`Remover ${b.name}`}>×</button>
    </div>
  )
}

export function PaidChip({ b }: { b: Bill }) {
  const [pending, start] = useTransition()
  return (
    <button disabled={pending} onClick={() => start(() => toggleBill(b.id))} title="Desfazer pagamento" aria-label={`Desfazer pagamento de ${b.name}`}
      className={`flex h-8 items-center gap-1.5 rounded-full bg-cotton px-3 text-[12px] text-smoke ${pending ? "opacity-40" : ""}`}>
      <Check size={12} className="text-gravy" /> {b.name} <RotateCcw size={11} className="text-faint" />
    </button>
  )
}

function SettingsSheet({ open, onClose, limit, email, admin, name, onPlan, onPlanos }: { open: boolean; onClose: () => void; limit: number; email: string; admin: boolean; name: string; onPlan: () => void; onPlanos: () => void }) {
  const [sub, setSub] = useState<"atalho" | "convite" | null>(null)
  const [bar, setBar] = useState(() => { try { return localStorage.getItem("fluxo-barra") === "solid" ? "solid" : "glass" } catch { return "glass" } })
  const [natal, setNatal] = useState<NatalPref>(() => natalPref())
  const toggleBar = () => { const v = bar === "solid" ? "glass" : "solid"; setBar(v); try { localStorage.setItem("fluxo-barra", v) } catch {}; if (v === "solid") document.documentElement.dataset.bar = "solid"; else delete document.documentElement.dataset.bar }
  const nextNatal = () => { const v: NatalPref = natal === "auto" ? "on" : natal === "on" ? "off" : "auto"; setNatal(v); setNatalPref(v) }
  const [nivel, setNivel] = useState<Deboche>(() => fxPrefs.nivel())
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

            <NotifRow row={row} />
            <button className={row} onClick={() => setSub("atalho")}>
              <Zap size={18} className="text-smoke" /><span className="flex-1">Atalho do Apple Pay</span><span className="text-[13px] text-mute">lança sozinho</span><ChevronRight size={16} className="text-faint" />
            </button>
            <button className={row} onClick={() => setSub("convite")}>
              <Send size={18} className="text-smoke" /><span className="flex-1">Chamar amigos</span><ChevronRight size={16} className="text-faint" />
            </button>
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
            <button className={row} role="switch" aria-checked={talk} onClick={() => { fxPrefs.setTalk(!talk); setTalk(!talk) }}>
              <MessageCircle size={18} className="text-smoke" /><span className="flex-1">Comentar lançamentos</span><Toggle on={talk} />
            </button>
            {admin && <a href="/admin" className={row}><Shield size={18} className="text-smoke" /><span className="flex-1">Painel admin</span><ChevronRight size={16} className="text-faint" /></a>}
            <button onClick={() => start(() => logout())} className={`${row} border-t border-cotton text-gravy`}><LogOut size={18} /><span>Sair</span></button>
          </div>
      <Atalho open={sub === "atalho"} onClose={() => setSub(null)} />
      <Convite open={sub === "convite"} onClose={() => setSub(null)} nome={name} />
    </Sheet>
  )
}

export function BillSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
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

function NotifRow({ row }: { row: string }) {
  const n = useNotificacoes()
  const [busy, setBusy] = useState(false)
  const on = n.estado === "ligado"
  const sub = { carregando: "", "sem-suporte": "Este aparelho não recebe notificações do app", instalar: "Adicione o Fluxo à tela de início pra ligar", negado: "Bloqueadas. Libere em Ajustes do iPhone, Notificações, Fluxo", ligado: "Um recado por dia, no estilo dele", desligado: "Um recado por dia, no estilo dele" }[n.estado]
  const can = n.estado === "ligado" || n.estado === "desligado"
  return (
    <button className={row} role="switch" aria-checked={on} disabled={!can || busy}
      onClick={async () => { setBusy(true); try { if (on) await n.desligar(); else await n.ligar() } finally { setBusy(false) } }}>
      <Bell size={18} className="text-smoke" /><span className="flex-1">Recados do Fluximetro<small className="block text-[12px] font-normal text-mute">{sub}</small></span>
      {can && <Toggle on={on} />}
    </button>
  )
}

/** Cartão baixinho do Fluximetro: o cofrinho azul pula, pisca e recebe moeda; ao lado, o recado e os atalhos. */
function FluximetroCard({ tip }: { tip?: { tone?: string; title: string; text: string } }) {
  const tight = tip?.tone === "warn"
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-[var(--glass-edge)] bg-card py-2.5 pl-2.5 pr-3.5">
      <button onClick={() => window.dispatchEvent(new Event("fluxo:conversa"))} aria-label="Conversar com o Fluximetro"
        className="grid size-[64px] shrink-0 place-items-center overflow-hidden rounded-[16px] bg-[linear-gradient(180deg,#F7F7F7,#D3DCEA)]">
        <svg viewBox="0 0 100 84" className="fx-pig w-[52px] overflow-visible" aria-hidden>
          <circle className="fx-coin" cx="50" cy="6" r="5.5" fill="#F7F7F7" stroke="#8FA4D0" strokeWidth="2" />
          <g className="fx-body">
            <ellipse cx="50" cy="48" rx="32" ry="25" fill="#3B5285" />
            <ellipse cx="82" cy="47" rx="6" ry="7" fill="#3B5285" />
            <ellipse cx="38" cy="37" rx="10" ry="5" fill="rgb(255 255 255/.2)" />
            <rect x="41" y="20" width="18" height="4.5" rx="2.2" fill="#1B2440" />
            <g className="fx-eyes">
              <ellipse cx="42" cy={tight ? 49 : 46} rx="3.6" ry={tight ? 2.4 : 4.8} fill="#F7F7F7" />
              <ellipse cx="58" cy={tight ? 49 : 46} rx="3.6" ry={tight ? 2.4 : 4.8} fill="#F7F7F7" />
            </g>
            <rect x="27" y="68" width="8" height="11" rx="4" fill="#2D4170" />
            <rect x="63" y="68" width="8" height="11" rx="4" fill="#2D4170" />
          </g>
        </svg>
      </button>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] leading-snug text-smoke">
          {tip ? <><b className="font-semibold text-ink">{tip.title}</b> {tip.text}</> : <>Tudo tranquilo. Se o dinheiro aprontar, eu dedo-duro na hora.</>}
        </p>
        <div className="mt-1.5 flex gap-1.5">
          <button onClick={() => window.dispatchEvent(new Event("fluxo:comprar"))} className="rounded-full bg-ink px-2.5 py-1 text-[12px] font-semibold text-cotton">Posso comprar?</button>
          <button onClick={() => window.dispatchEvent(new Event("fluxo:conversa"))} className="rounded-full border border-[var(--glass-edge)] px-2.5 py-1 text-[12px] font-semibold text-ink">Conversar</button>
        </div>
      </div>
    </div>
  )
}
