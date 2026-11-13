"use client"

import { motion } from "framer-motion"
import { useRef, type ComponentType } from "react"
import { CreditCard, PiggyBank, Pin, Plane, Shield, Target } from "lucide-react"
import type { Goal, Plan } from "@/lib/types"
import { brl } from "@/lib/finance"
import { Cofrinho } from "./cofrinho"

export interface Part { key: string; label: string; value: number; color: string; icon?: ComponentType<{ size?: number; className?: string }> }

const STEP = 5, MIN = 5

/** Barra dividida em partes que somam 100%. Arraste as divisórias (ou use as setas do teclado). */
export function SplitBar({ parts, onChange, height = 64 }: { parts: Part[]; onChange: (values: number[]) => void; height?: number }) {
  const box = useRef<HTMLDivElement>(null)
  const move = (i: number, pos: number) => {
    const vals = parts.map((p) => p.value)
    const before = vals.slice(0, i).reduce((a, b) => a + b, 0)
    const pair = vals[i] + vals[i + 1]
    const a = Math.max(MIN, Math.min(pair - MIN, Math.round((pos - before) / STEP) * STEP))
    if (a === vals[i]) return
    vals[i] = a; vals[i + 1] = pair - a
    if (navigator.vibrate) navigator.vibrate(3)
    onChange(vals)
  }
  let acc = 0
  return (
    <div ref={box} className="relative flex touch-none select-none overflow-hidden rounded-[18px]" style={{ height }}>
      {parts.map((p) => (
        <motion.div key={p.key} layout transition={{ type: "spring", stiffness: 500, damping: 40 }}
          className="flex min-w-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap text-white" style={{ flexGrow: p.value, flexBasis: 0, background: p.color }}>
          {p.icon && p.value >= 20 && <p.icon size={16} className="opacity-85" />}
          <span className="num text-[17px]">{p.value}%</span>
        </motion.div>
      ))}
      {parts.slice(0, -1).map((p, i) => {
        acc += p.value
        const at = acc
        return (
          <div key={p.key} role="slider" tabIndex={0} aria-label={`Divisória entre ${p.label} e ${parts[i + 1].label}`}
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={at}
            className="absolute inset-y-0 z-10 -ml-[14px] grid w-7 cursor-ew-resize place-items-center focus-visible:outline-none [&:focus-visible>span]:ring-2 [&:focus-visible>span]:ring-ink"
            style={{ left: `${at}%` }}
            onPointerDown={(e) => {
              e.preventDefault(); const el = e.currentTarget; el.setPointerCapture(e.pointerId)
              const mv = (ev: PointerEvent) => { const r = box.current!.getBoundingClientRect(); move(i, ((ev.clientX - r.left) / r.width) * 100) }
              const up = () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up) }
              el.addEventListener("pointermove", mv); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up)
            }}
            onKeyDown={(e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); move(i, at + (e.key === "ArrowRight" ? STEP : -STEP)) } }}>
            <span className="h-[30px] w-[5px] rounded-full bg-white shadow-[0_1px_4px_rgb(0_0_0/0.25)]" />
          </div>
        )
      })}
    </div>
  )
}

export const DEFAULT_PLAN: Plan = { income: 0, fixed: 50, variable: 30, save: 20, goals: {} }

const FALAS: [number, string][] = [
  [10, "Já é começo. Devagar e sempre, igual parcela de geladeira."],
  [15, "Tá ficando sério isso aí."],
  [20, "Guardar 20% é o clássico. Seu eu do futuro já mandou um joinha."],
  [25, "Respeito. O iFood vai sentir sua falta."],
  [30, "Você é do tipo que tem pilha reserva em casa."],
  [35, "Isso tudo? Vou começar a te chamar de cofrinho."],
  [101, "Só não esquece de comer, tá?"],
]

/** Quanto guardar: divide a renda entre gastos fixos, variáveis e o que vai guardar. */
export function SaveEditor({ plan, onChange }: { plan: Plan; onChange: (p: Plan) => void }) {
  const parts: Part[] = [
    { key: "fixed", label: "Gastos fixos", value: plan.fixed, color: "var(--c-ink)", icon: Pin },
    { key: "variable", label: "Gastos variáveis", value: plan.variable, color: "var(--c-faint)", icon: CreditCard },
    { key: "save", label: "Guardar", value: plan.save, color: "#FF4E20", icon: PiggyBank },
  ]
  const fala = FALAS.find(([lim]) => plan.save <= lim)![1]
  const money = (pct: number) => (plan.income > 0 ? brl((plan.income * pct) / 100, false) : `${pct}%`)
  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="relative mb-2 h-7 text-[12.5px] text-mute">
          <span className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center gap-1 whitespace-nowrap" style={{ left: "80%" }}>
            Recomendado<span className="h-2 w-[1.5px] bg-otan" />
          </span>
        </div>
        <SplitBar parts={parts} onChange={([fixed, variable, save]) => onChange({ ...plan, fixed, variable, save })} />
        <p className="mt-3 text-center text-[13px] text-mute">Arraste as divisórias para ajustar</p>
      </div>
      <div className="rounded-[23px] bg-card px-5">
        {[parts[2], parts[0], parts[1]].map((p) => (
          <div key={p.key} className="flex items-center gap-3 border-b border-cotton py-3.5 text-[15px] last:border-0">
            <span className="size-3 rounded-[4px]" style={{ background: p.color }} />
            <span className="flex-1">{p.label} <span className="text-[14px] text-faint">({p.value}%)</span></span>
            <span className="num text-[16px]">{money(p.value)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 rounded-[20px] bg-card py-3 pl-2.5 pr-4 text-[13.5px] leading-snug text-smoke">
        <span className="w-11 shrink-0"><Cofrinho state={plan.save >= 25 ? "feliz" : "normal"} label="" /></span>
        <span>{fala}</span>
      </div>
    </div>
  )
}

const GOAL_COLORS = ["#1F8A5B", "#FF4E20", "var(--c-ink)", "var(--c-faint)", "#B83312", "var(--c-smoke)"]
const goalIcon = (g: Goal) => (/reserva|emerg/i.test(g.name) ? Shield : /viag|trip|férias|ferias/i.test(g.name) ? Plane : Target)

/** Divisão sugerida: quem está mais longe da meta recebe mais. */
export function recommendedGoalSplit(goals: Goal[]): number[] {
  if (!goals.length) return []
  const need = goals.map((g) => Math.max(1, g.target - g.saved))
  const total = need.reduce((a, b) => a + b, 0)
  const raw = need.map((n) => Math.max(MIN, Math.round(((n / total) * 100) / STEP) * STEP))
  let diff = 100 - raw.reduce((a, b) => a + b, 0)
  for (let i = 0; diff !== 0; i = (i + 1) % raw.length) {
    const d = Math.sign(diff) * STEP
    if (raw[i] + d >= MIN) { raw[i] += d; diff -= d }
  }
  return raw
}

export function goalSplitOf(plan: Plan | null, goals: Goal[]): number[] {
  const saved = goals.map((g) => plan?.goals?.[String(g.id)] ?? 0)
  return saved.reduce((a, b) => a + b, 0) === 100 ? saved : recommendedGoalSplit(goals)
}

/** Pra onde vai o que você guarda: divide entre as metas abertas. */
export function GoalSplitEditor({ goals, values, saveAmount, onChange }: { goals: Goal[]; values: number[]; saveAmount: number; onChange: (v: number[]) => void }) {
  if (goals.length === 0) return <p className="rounded-[20px] bg-card p-5 text-[14px] text-mute">Crie uma meta na Carteira e depois volte aqui pra dividir o que você guarda.</p>
  const parts: Part[] = goals.map((g, i) => ({ key: String(g.id), label: g.name, value: values[i], color: GOAL_COLORS[i % GOAL_COLORS.length] }))
  return (
    <div className="flex flex-col gap-4">
      {goals.length > 1 && <SplitBar parts={parts} onChange={onChange} />}
      {goals.length > 1 && <button onClick={() => onChange(recommendedGoalSplit(goals))} className="self-start text-[14px] font-semibold text-otan underline underline-offset-4">Usar divisão recomendada</button>}
      <div className="rounded-[23px] bg-card px-4">
        {goals.map((g, i) => {
          const Icon = goalIcon(g)
          const per = (saveAmount * values[i]) / 100
          const left = g.target - g.saved
          const months = per > 0 ? Math.ceil(left / per) : null
          return (
            <div key={g.id} className="flex items-center gap-3 border-b border-cotton py-3.5 last:border-0">
              <span className="grid size-11 shrink-0 place-items-center rounded-[14px] text-white" style={{ background: parts[i].color }}><Icon size={19} /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[15px]">{g.name}</span>
                <span className="block text-[12.5px] text-mute">{months === null ? "sem previsão" : months <= 1 ? "termina no próximo mês" : `termina em ${months} meses`}</span></span>
              <span className="text-right"><span className="num block text-[16px]">{brl(per, false)}</span><span className="block text-[12.5px] text-faint">{values[i]}%</span></span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
