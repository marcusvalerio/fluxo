"use client"

import { motion } from "framer-motion"
import { useState, useTransition } from "react"
import { ArrowDownLeft, ArrowUpRight, Gauge, LogOut, Settings2 } from "lucide-react"
import type { Snapshot } from "@/lib/types"
import { brl, compact, insights, type Analysis } from "@/lib/finance"
import { labelMonth, relativeDay } from "@/lib/dates"
import { Orb } from "../orb"
import { Money, Sheet, Field, inputCls, Primary } from "../ui"
import { Projection } from "../projection"
import { TxRow } from "../tx-row"
import { leaveSpace, setLimit } from "@/app/actions"
import type { Tab } from "../fluxo-app"

function mood(h: number) {
  if (h > 0.8) return ["Tudo fluindo.", "O mês respira com folga."]
  if (h > 0.6) return ["Em equilíbrio.", "Ritmo saudável, siga assim."]
  if (h > 0.4) return ["Atenção ao ritmo.", "Os gastos estão acelerando."]
  if (h > 0.2) return ["Pressão alta.", "O mês está apertando."]
  return ["Zona crítica.", "Hora de segurar os gastos."]
}

const healthColor = (h: number) => `oklch(${80 + h * 8}% ${0.17} ${h > 0.5 ? 100 + (h - 0.5) * 120 : 10 + h * 180})`

export function NowScreen({ snap, a, go }: { snap: Snapshot; a: Analysis; go: (t: Tab) => void }) {
  const [settings, setSettings] = useState(false)
  const [title, sub] = mood(a.health)
  const hour = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date()))
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"
  const tips = insights(snap, a)

  return (
    <div style={{ ["--health" as string]: healthColor(a.health) }}>
      {/* cabeçalho */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-[max(24px,env(safe-area-inset-top))]">
        <div>
          <p className="eyebrow">{labelMonth(snap.today)} · dia {a.dayOfMonth}/{a.dim}</p>
          <p className="mt-1 text-fg-2">{greet}, <span className="text-fg">{snap.space.name}</span></p>
        </div>
        <button onClick={() => setSettings(true)} className="glass grid size-11 place-items-center rounded-full text-fg-2" aria-label="Ajustes">
          <Settings2 size={18} />
        </button>
      </header>

      {/* orbe + saldo */}
      <section className="relative -mt-10 h-[500px]">
        <Orb health={a.health} className="absolute inset-x-[-20%] top-0 h-[360px] w-[140%]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-6">
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-[30px] italic leading-none" style={{ color: "var(--health)" }}>
            {title}
          </motion.p>
          <p className="mt-1 text-sm text-fg-3">{sub}</p>
          <div className="mt-5">
            <p className="eyebrow mb-2">Saldo do mês</p>
            <Money value={a.balance} />
          </div>
        </div>
      </section>

      {/* métricas */}
      <section className="mt-6 grid grid-cols-3 gap-2 px-6">
        <Stat icon={<ArrowDownLeft size={14} />} label="Entrou" value={compact(a.income)} tone="text-mint" />
        <Stat icon={<ArrowUpRight size={14} />} label="Saiu" value={compact(a.expense)} tone="text-ember" />
        <Stat icon={<Gauge size={14} />} label="Ritmo/dia" value={compact(a.pace)} tone="text-fg" />
      </section>

      {/* projeção */}
      <section className="glass mx-6 mt-3 overflow-hidden rounded-[28px] p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Previsão · fim do mês</p>
            <p className={`num mt-2 text-3xl ${a.projectedEnd < 0 ? "text-rose" : ""}`}>{brl(a.projectedEnd, false)}</p>
          </div>
          <p className="text-right text-xs text-fg-3">{a.daysLeft} dias restantes<br />{brl(a.upcomingBills, false)} em contas</p>
        </div>
        <div className="-mx-1 mt-4"><Projection a={a} /></div>
        {snap.space.limit > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-fg-3">
              <span>Limite mensal</span>
              <span className="num">{Math.round((a.expense / snap.space.limit) * 100)}% de {brl(snap.space.limit, false)}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
              <motion.div className="h-full rounded-full" style={{ background: a.expense > snap.space.limit ? "var(--color-rose)" : "var(--health)" }}
                initial={{ width: 0 }} animate={{ width: `${Math.min(100, (a.expense / snap.space.limit) * 100)}%` }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
            </div>
          </div>
        )}
      </section>

      {/* insights */}
      <section className="mt-8">
        <p className="eyebrow mb-3 px-6">Leituras</p>
        <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-6 pb-2">
          {tips.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }}
              className="glass w-[240px] shrink-0 snap-start rounded-3xl p-5">
              <span className={`mb-4 block size-2 rounded-full ${t.tone === "good" ? "bg-mint" : t.tone === "warn" ? "bg-ember" : "bg-sky"}`} />
              <p className="font-serif text-[21px] leading-[1.15]">{t.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* recentes */}
      <section className="mt-8 px-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow">Recentes</p>
          <button onClick={() => go("timeline")} className="text-xs text-fg-3 hover:text-acid">Ver fluxo →</button>
        </div>
        {snap.txs.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line-2 p-6 text-center text-sm text-fg-3">
            Nada por aqui ainda. Toque no <span className="text-acid">+</span> ou aperte <kbd className="rounded border border-line px-1">/</kbd> e escreva “café 8”.
          </p>
        ) : (
          <ul>{snap.txs.slice(0, 5).map((t) => <TxRow key={t.id} tx={t} meta={`${t.category} · ${relativeDay(t.date, snap.today)}`} />)}</ul>
        )}
      </section>

      <SettingsSheet open={settings} onClose={() => setSettings(false)} limit={snap.space.limit} />
    </div>
  )
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="glass rounded-3xl p-4">
      <p className={`flex items-center gap-1.5 text-xs ${tone}`}>{icon}<span className="text-fg-3">{label}</span></p>
      <p className="num mt-2 text-xl">{value}</p>
    </div>
  )
}

function SettingsSheet({ open, onClose, limit }: { open: boolean; onClose: () => void; limit: number }) {
  const [v, setV] = useState(String(limit || ""))
  const [pending, start] = useTransition()
  return (
    <Sheet open={open} onClose={onClose} title="Ajustes">
      <div className="space-y-5">
        <Field label="Limite de gastos mensal (R$)">
          <input inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} className={`${inputCls} num text-xl`} />
        </Field>
        <Primary disabled={pending} onClick={() => start(async () => { await setLimit(Number(v.replace(",", ".")) || 0); onClose() })}>
          {pending ? "Salvando…" : "Salvar"}
        </Primary>
        <button onClick={() => start(() => leaveSpace())} className="flex w-full items-center justify-center gap-2 py-3 text-sm text-fg-3 hover:text-rose">
          <LogOut size={14} /> Sair deste espaço
        </button>
      </div>
    </Sheet>
  )
}
