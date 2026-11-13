"use client"

import { useState, useTransition } from "react"
import type { Snapshot } from "@/lib/types"
import { brl } from "@/lib/finance"
import { savePlan } from "@/app/actions"
import { DEFAULT_PLAN, GoalSplitEditor, SaveEditor, goalSplitOf } from "./plan-editor"
import { Primary, Sheet } from "./ui"

/** Ajustes do plano: renda, quanto guardar e como dividir entre as metas. Muda o que foi definido no onboarding. */
export function PlanSheet({ open, onClose, snap }: { open: boolean; onClose: () => void; snap: Snapshot }) {
  const goals = snap.goals.filter((g) => g.saved < g.target)
  const start0 = snap.space.plan ?? { ...DEFAULT_PLAN, income: snap.space.limit > 0 ? Math.round(snap.space.limit / 0.8) : 0 }
  const [plan, setPlan] = useState(start0)
  const [income, setIncome] = useState(start0.income ? start0.income.toLocaleString("pt-BR") : "")
  const [split, setSplit] = useState(() => goalSplitOf(snap.space.plan, goals))
  const [tab, setTab] = useState<"guardar" | "metas">("guardar")
  const [pending, start] = useTransition()
  const inc = Number(income.replace(/\D/g, "")) || 0
  const saveAmount = (inc * plan.save) / 100

  const salvar = () => start(async () => {
    await savePlan({ ...plan, income: inc, goals: Object.fromEntries(goals.map((g, i) => [String(g.id), split[i]])) })
    onClose()
  })

  return (
    <Sheet open={open} onClose={onClose} title="Seu plano">
      <div className="flex flex-col gap-5 px-1">
        <div role="tablist" className="flex gap-1 rounded-full bg-sand p-1">
          {([["guardar", "Quanto guardar"], ["metas", "Divisão entre metas"]] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`h-10 flex-1 rounded-full text-[13.5px] font-semibold ${tab === k ? "bg-card text-ink shadow-[0_1px_3px_rgb(0_0_0/0.08)]" : "text-mute"}`}>{l}</button>
          ))}
        </div>

        {tab === "guardar" ? (
          <>
            <label className="block">
              <span className="mb-1.5 block px-1 text-[13px] text-mute">Quanto entra por mês</span>
              <div className="flex items-baseline gap-2 rounded-[18px] border border-sand bg-card px-4 py-3 focus-within:border-otan">
                <span className="num text-[18px] text-faint">R$</span>
                <input inputMode="numeric" value={income} aria-label="Renda mensal" placeholder="0"
                  onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, "")); setIncome(n ? n.toLocaleString("pt-BR") : "") }}
                  className="num w-full bg-transparent text-[24px] outline-none focus-visible:outline-none" />
              </div>
            </label>
            <SaveEditor plan={{ ...plan, income: inc }} onChange={(p) => setPlan(p)} />
            {inc > 0 && <p className="px-1 text-[13px] text-mute">Seu teto do mês passa a ser <b className="num text-ink">{brl(inc - saveAmount, false)}</b>: tudo o que entra, menos o que você guarda.</p>}
          </>
        ) : (
          <>
            <p className="px-1 text-[14px] text-mute">Pra onde vão os <b className="num text-ink">{brl(saveAmount, false)}</b> que você guarda todo mês.</p>
            <GoalSplitEditor goals={goals} values={split} saveAmount={saveAmount} onChange={setSplit} />
          </>
        )}

        <Primary onClick={salvar} disabled={pending}>{pending ? "Salvando…" : "Salvar plano"}</Primary>
      </div>
    </Sheet>
  )
}
