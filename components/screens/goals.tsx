"use client"

import { motion } from "framer-motion"
import { useState, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"
import type { Goal, Snapshot } from "@/lib/types"
import { brl, goalPlan } from "@/lib/finance"
import { labelDay } from "@/lib/dates"
import { Field, inputCls, Primary, Sheet, Ticker } from "../ui"
import { addGoal, contributeGoal, deleteGoal } from "@/app/actions"

const HUES = [160, 95, 205, 300, 28, 345]

/** Uma cápsula de vidro que enche de líquido conforme a meta avança. */
function Vessel({ pct, hue, id }: { pct: number; hue: number; id: number }) {
  const level = 100 - Math.min(1, pct) * 100
  const c = `oklch(82% 0.17 ${hue})`
  return (
    <svg viewBox="0 0 100 140" className="h-full w-full">
      <defs>
        <clipPath id={`v${id}`}><rect x="6" y="6" width="88" height="128" rx="44" /></clipPath>
        <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={c} stopOpacity=".95" />
          <stop offset="1" stopColor={c} stopOpacity=".25" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#v${id})`}>
        <motion.g initial={{ y: 140 }} animate={{ y: 6 + (level / 100) * 128 - 6 }} transition={{ type: "spring", stiffness: 40, damping: 12 }}>
          <path fill={`url(#g${id})`} d="M-100 6 Q -75 0 -50 6 T 0 6 T 50 6 T 100 6 T 150 6 T 200 6 V 200 H -100 Z">
            <animateTransform attributeName="transform" type="translate" from="0 0" to="100 0" dur="3.2s" repeatCount="indefinite" />
          </path>
          <path fill={c} opacity=".35" d="M-100 8 Q -75 14 -50 8 T 0 8 T 50 8 T 100 8 T 150 8 T 200 8 V 200 H -100 Z">
            <animateTransform attributeName="transform" type="translate" from="100 0" to="0 0" dur="4.6s" repeatCount="indefinite" />
          </path>
        </motion.g>
        {[18, 42, 70].map((x, i) => (
          <circle key={x} cx={x + 6} r={1.6 + i * 0.4} fill="white" opacity=".5">
            <animate attributeName="cy" values="134;20" dur={`${3 + i}s`} begin={`${i * 0.8}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;.6;0" dur={`${3 + i}s`} begin={`${i * 0.8}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </g>
      <rect x="6" y="6" width="88" height="128" rx="44" fill="none" stroke="white" strokeOpacity=".14" />
      <rect x="18" y="20" width="6" height="40" rx="3" fill="white" opacity=".12" />
    </svg>
  )
}

export function GoalsScreen({ snap }: { snap: Snapshot }) {
  const [creating, setCreating] = useState(false)
  const [active, setActive] = useState<Goal | null>(null)
  const total = snap.goals.reduce((s, g) => s + g.saved, 0)
  const target = snap.goals.reduce((s, g) => s + g.target, 0)

  return (
    <div className="px-6 pt-[max(24px,env(safe-area-inset-top))]">
      <p className="eyebrow">Metas</p>
      <h1 className="mt-1 font-serif text-[44px] leading-none">O que você <span className="italic text-acid">está construindo</span></h1>
      {snap.goals.length > 0 && (
        <p className="mt-4 text-fg-2">
          <Ticker className="num text-fg" value={total} format={(n) => brl(n, false)} /> guardados de <span className="num">{brl(target, false)}</span>
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3">
        {snap.goals.map((g, i) => {
          const pct = g.saved / g.target
          const hue = HUES[i % HUES.length]
          return (
            <motion.button key={g.id} layoutId={`goal-${g.id}`} onClick={() => setActive(g)}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="glass flex flex-col items-center rounded-[32px] p-4 pb-5 text-left">
              <div className="relative h-40 w-28">
                <Vessel pct={pct} hue={hue} id={g.id} />
                <span className="num absolute inset-0 grid place-items-center text-2xl text-white [text-shadow:0_1px_12px_rgb(0_0_0/.6)]">{Math.round(pct * 100)}%</span>
              </div>
              <p className="mt-3 w-full truncate text-center"><span className="mr-1 opacity-60">{g.emoji}</span>{g.name}</p>
              <p className="num w-full text-center text-xs text-fg-3">{brl(g.saved, false)} / {brl(g.target, false)}</p>
            </motion.button>
          )
        })}
        <button onClick={() => setCreating(true)}
          className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-[32px] border border-dashed border-line-2 text-fg-3 transition hover:border-acid hover:text-acid">
          <span className="grid size-12 place-items-center rounded-full border border-current"><Plus size={20} /></span>
          Nova meta
        </button>
      </div>

      <ContributeSheet goal={active} today={snap.today} onClose={() => setActive(null)} />
      <NewGoalSheet open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}

function ContributeSheet({ goal, today, onClose }: { goal: Goal | null; today: string; onClose: () => void }) {
  const [v, setV] = useState("")
  const [pending, start] = useTransition()
  const g = goal
  const monthly = g ? goalPlan(g.target, g.saved, g.deadline, today) : null
  const act = (sign: 1 | -1) => g && start(async () => { await contributeGoal(g.id, sign * Number(v.replace(",", "."))); setV(""); onClose() })
  return (
    <Sheet open={!!g} onClose={onClose} title={g?.name}>
      {g && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-line p-4"><p className="eyebrow">Falta</p><p className="num mt-1 text-xl">{brl(Math.max(0, g.target - g.saved), false)}</p></div>
            <div className="rounded-2xl border border-line p-4">
              <p className="eyebrow">{g.deadline ? `Até ${labelDay(g.deadline)}` : "Sem prazo"}</p>
              <p className="num mt-1 text-xl">{monthly !== null ? `${brl(monthly, false)}/mês` : "—"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[50, 100, 250, 500].map((n) => (
              <button key={n} onClick={() => setV(String(n))} className="num flex-1 rounded-full border border-line py-2 text-sm text-fg-2 hover:border-acid">+{n}</button>
            ))}
          </div>
          <Field label="Valor">
            <input inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} placeholder="0,00" className={`${inputCls} num text-2xl`} />
          </Field>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Primary disabled={pending || !Number(v.replace(",", "."))} onClick={() => act(1)}>Guardar</Primary>
            <button disabled={pending || !Number(v.replace(",", "."))} onClick={() => act(-1)} className="rounded-2xl border border-line-2 px-5 text-sm text-fg-2 disabled:opacity-30">Retirar</button>
          </div>
          <button onClick={() => start(async () => { await deleteGoal(g.id); onClose() })} className="flex w-full items-center justify-center gap-2 text-xs text-fg-3 hover:text-rose">
            <Trash2 size={12} /> Excluir meta
          </button>
        </div>
      )}
    </Sheet>
  )
}

const EMOJIS = ["✦", "✈", "◎", "⌘", "⌂", "♫", "⚑", "❖"]

function NewGoalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("")
  const [target, setTarget] = useState("")
  const [deadline, setDeadline] = useState("")
  const [emoji, setEmoji] = useState("✦")
  const [pending, start] = useTransition()
  return (
    <Sheet open={open} onClose={onClose} title="Nova meta">
      <form className="space-y-4" onSubmit={(e) => {
        e.preventDefault()
        start(async () => { await addGoal({ name, target: Number(target.replace(",", ".")), emoji, deadline: deadline || null }); setName(""); setTarget(""); setDeadline(""); onClose() })
      }}>
        <div className="flex gap-2">
          {EMOJIS.map((em) => (
            <button type="button" key={em} onClick={() => setEmoji(em)} className={`grid size-10 place-items-center rounded-full border text-lg ${emoji === em ? "border-acid text-acid" : "border-line text-fg-3"}`}>{em}</button>
          ))}
        </div>
        <Field label="Nome"><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Viagem para o Japão" className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor alvo"><input required inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="20000" className={`${inputCls} num`} /></Field>
          <Field label="Prazo"><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={`${inputCls} [color-scheme:dark]`} /></Field>
        </div>
        <Primary type="submit" disabled={pending}>{pending ? "Criando…" : "Criar meta"}</Primary>
      </form>
    </Sheet>
  )
}
