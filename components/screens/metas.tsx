"use client"

import { motion } from "framer-motion"
import { useState, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"
import type { Goal, Snapshot } from "@/lib/types"
import { brl, int } from "@/lib/finance"
import { diffDays, labelDay } from "@/lib/dates"
import { field, Label, Primary, rise, Sheet, spring } from "../ui"
import { addGoal, contributeGoal, deleteGoal } from "@/app/actions"

const COLORS = ["#1F282E", "#FF4E20", "#414E58", "#8A939A"]

function monthlyNeed(g: Goal, today: string) {
  if (!g.deadline) return null
  const months = Math.max(1, diffDays(today, g.deadline) / 30.4)
  return Math.max(0, (g.target - g.saved) / months)
}

function hint(g: Goal, today: string) {
  const left = g.target - g.saved
  if (left <= 0) return "Meta batida. Que tal a próxima?"
  const need = monthlyNeed(g, today)
  if (need !== null) return `Guardando R$ ${int(need)} por mês você chega lá.`
  if (g.saved / g.target >= 0.75) return `Falta pouco: ${brl(left, false)}.`
  return `Faltam ${brl(left, false)}.`
}

export function MetasScreen({ snap }: { snap: Snapshot }) {
  const [creating, setCreating] = useState(false)
  const [active, setActive] = useState<Goal | null>(null)
  const total = snap.goals.reduce((s, g) => s + g.saved, 0)
  const target = snap.goals.reduce((s, g) => s + g.target, 0)

  return (
    <div className="px-3 pt-[max(56px,env(safe-area-inset-top))]">
      <motion.header {...rise} transition={spring} className="flex items-end justify-between px-2 pb-4">
        <div>
          <p className="text-[13px] text-mute">O que você está construindo</p>
          <h1 className="ttl text-[34px] leading-tight">Metas</h1>
        </div>
        <button onClick={() => setCreating(true)} className="lg grid size-[46px] place-items-center rounded-full" aria-label="Nova meta"><Plus size={19} /></button>
      </motion.header>

      <div className="flex flex-col gap-3">
        <motion.section {...rise} transition={{ ...spring, delay: 0.05 }} className="flex items-end justify-between rounded-[30px] bg-ink p-5 text-cotton">
          <div>
            <p className="text-[13px] text-[#A9B1B7]">Guardado no total</p>
            <p className="num mt-1 text-[34px] leading-none">{brl(total, false)}</p>
          </div>
          {target > 0 && <p className="text-right text-[13px] text-[#A9B1B7]">de {brl(target, false)}<br /><span className="num text-[#FF7A50]">{Math.round((total / target) * 100)}%</span> do caminho</p>}
        </motion.section>

        {snap.goals.map((g, i) => {
          const pct = Math.min(1, g.saved / g.target)
          const color = COLORS[i % COLORS.length]
          const filled = Math.round(pct * 40)
          return (
            <motion.button key={g.id} {...rise} transition={{ ...spring, delay: 0.1 + i * 0.06 }} whileTap={{ scale: 0.98 }}
              onClick={() => setActive(g)} className="block w-full rounded-[30px] bg-white p-[18px] text-left">
              <span className="flex items-baseline justify-between">
                <span className="text-[15px] font-semibold">{g.name}</span>
                <span className="text-[12px] text-mute">{g.deadline ? labelDay(g.deadline) : "Sem prazo"}</span>
              </span>
              <span className="mt-2 flex items-baseline gap-1.5">
                <span className="num text-[26px]">{brl(g.saved, false)}</span>
                <span className="text-[13px] text-mute">de {brl(g.target, false)}</span>
                <span className={`num ml-auto text-[15px] ${color === "#FF4E20" ? "text-gravy" : ""}`}>{Math.round(pct * 100)}%</span>
              </span>
              <span className="mt-3 flex h-3.5 gap-[3px]" aria-hidden>
                {Array.from({ length: 40 }, (_, k) => (
                  <motion.span key={k} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.3 + i * 0.1 + k * 0.012, type: "spring", stiffness: 500, damping: 14 }}
                    className="flex-1 origin-bottom rounded-[3px]" style={{ background: k < filled ? color : "#E4E3DC" }} />
                ))}
              </span>
              <span className="mt-2.5 block text-[13px] text-smoke">{hint(g, snap.today)}</span>
            </motion.button>
          )
        })}

        {snap.goals.length === 0 && (
          <button onClick={() => setCreating(true)} className="h-28 rounded-[30px] border-2 border-dashed border-sand-2 text-[15px] font-semibold text-smoke">Criar sua primeira meta</button>
        )}
      </div>

      <ContributeSheet goal={active} onClose={() => setActive(null)} />
      <NewGoalSheet open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}

function ContributeSheet({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  const [v, setV] = useState("")
  const [pending, start] = useTransition()
  const n = Number(v.replace(/\./g, "").replace(",", ".")) || 0
  const act = (sign: 1 | -1) => goal && start(async () => { await contributeGoal(goal.id, sign * n); setV(""); onClose() })
  return (
    <Sheet open={!!goal} onClose={onClose} title={goal?.name}>
      {goal && (
        <div className="space-y-4 px-1">
          <div className="flex gap-2">
            {[50, 100, 250, 500].map((q) => (
              <button key={q} onClick={() => setV(String(q))} className="num h-11 flex-1 rounded-full bg-white text-[15px]">+{q}</button>
            ))}
          </div>
          <label className="block"><Label>Valor</Label>
            <input inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} placeholder="0,00" className={`${field} num text-[24px]`} />
          </label>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Primary disabled={pending || !n} onClick={() => act(1)}>Guardar</Primary>
            <button disabled={pending || !n} onClick={() => act(-1)} className="h-14 rounded-[28px] bg-white px-6 text-[15px] font-semibold text-smoke disabled:opacity-30">Retirar</button>
          </div>
          <button onClick={() => start(async () => { await deleteGoal(goal.id); onClose() })} className="flex h-11 w-full items-center justify-center gap-2 text-[13px] text-mute hover:text-gravy">
            <Trash2 size={13} /> Excluir meta
          </button>
        </div>
      )}
    </Sheet>
  )
}

function NewGoalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("")
  const [target, setTarget] = useState("")
  const [deadline, setDeadline] = useState("")
  const [pending, start] = useTransition()
  return (
    <Sheet open={open} onClose={onClose} title="Nova meta">
      <form className="space-y-3 px-1" onSubmit={(e) => {
        e.preventDefault()
        start(async () => { await addGoal({ name, target: Number(target.replace(/\./g, "").replace(",", ".")), emoji: "", deadline: deadline || null }); setName(""); setTarget(""); setDeadline(""); onClose() })
      }}>
        <label className="block"><Label>Nome</Label><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Viagem para o Japão" className={field} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><Label>Quanto</Label><input required inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="20.000" className={`${field} num`} /></label>
          <label className="block"><Label>Até quando</Label><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={field} /></label>
        </div>
        <div className="pt-2"><Primary type="submit" disabled={pending}>{pending ? "Criando…" : "Criar meta"}</Primary></div>
      </form>
    </Sheet>
  )
}
