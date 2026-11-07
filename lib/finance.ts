import type { Snapshot, Tx } from "./types"
import { addDays, daysInMonth, diffDays } from "./dates"

export const brl = (n: number, cents = true) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })

export const compact = (n: number) =>
  Math.abs(n) >= 1000 ? `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k` : Math.round(n).toString()

export const CATEGORIES = {
  expense: ["Alimentação", "Mercado", "Delivery", "Transporte", "Moradia", "Contas", "Saúde", "Lazer", "Compras", "Assinaturas", "Educação", "Cartão", "Outros"],
  income: ["Salário", "Freelance", "Investimentos", "Vendas", "Presente", "Outros"],
} as const

export const CAT_HUE: Record<string, number> = {
  Alimentação: 28, Mercado: 95, Delivery: 12, Transporte: 205, Moradia: 260, Contas: 230, Saúde: 160,
  Lazer: 320, Compras: 290, Assinaturas: 345, Educação: 185, Cartão: 0, Outros: 60,
  Salário: 150, Freelance: 170, Investimentos: 135, Vendas: 120, Presente: 300,
}
export const catColor = (c: string, l = 72, ch = 0.16) => `oklch(${l}% ${ch} ${CAT_HUE[c] ?? 60})`

const inMonth = (t: Tx, ym: string) => t.date.startsWith(ym)

export function analyze(s: Snapshot) {
  const ym = s.today.slice(0, 7)
  const month = s.txs.filter((t) => inMonth(t, ym))
  const income = month.filter((t) => t.kind === "income").reduce((a, t) => a + t.amount, 0)
  const expense = month.filter((t) => t.kind === "expense").reduce((a, t) => a + t.amount, 0)
  const balance = income - expense

  const dim = daysInMonth(s.today)
  const dayOfMonth = Number(s.today.slice(8, 10))
  const daysLeft = dim - dayOfMonth

  const unpaid = s.bills.filter((b) => !b.paid)
  const upcomingBills = unpaid.reduce((a, b) => a + b.amount, 0)

  // ritmo diário dos gastos variáveis (sem contas fixas registradas)
  const billNames = new Set(s.bills.map((b) => b.name))
  const variable = month.filter((t) => t.kind === "expense" && !billNames.has(t.description) && t.category !== "Moradia")
  const pace = variable.reduce((a, t) => a + t.amount, 0) / Math.max(1, dayOfMonth)
  const projectedEnd = balance - upcomingBills - pace * daysLeft

  // saúde 0 (crítico) → 1 (tranquilo)
  const limit = s.space.limit
  const limitUse = limit > 0 ? (expense + upcomingBills + pace * daysLeft) / limit : 0
  const runway = income > 0 ? projectedEnd / income : projectedEnd > 0 ? 0.5 : -0.5
  let health = 0.55 + runway * 1.4
  if (limit > 0) health -= Math.max(0, limitUse - 0.75) * 1.6
  health = Math.min(1, Math.max(0, health))

  // gasto por categoria (mês) e comparação com mês anterior
  const prevYm = addDays(ym + "-01", -1).slice(0, 7)
  const byCat = new Map<string, number>()
  const prevByCat = new Map<string, number>()
  for (const t of s.txs) {
    if (t.kind !== "expense") continue
    if (inMonth(t, ym)) byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount)
    else if (inMonth(t, prevYm)) prevByCat.set(t.category, (prevByCat.get(t.category) ?? 0) + t.amount)
  }
  const categories = [...byCat.entries()].map(([name, value]) => ({ name, value, prev: prevByCat.get(name) ?? 0 }))
    .sort((a, b) => b.value - a.value)

  // série diária do saldo do mês + projeção
  const series: { date: string; value: number; future: boolean }[] = []
  let running = 0
  for (let d = 1; d <= dim; d++) {
    const iso = `${ym}-${String(d).padStart(2, "0")}`
    if (d <= dayOfMonth) {
      for (const t of month) if (t.date === iso) running += t.kind === "income" ? t.amount : -t.amount
    } else {
      running -= pace
      for (const b of unpaid) if (b.dueDay === d || (d === dim && b.dueDay > dim)) running -= b.amount
    }
    series.push({ date: iso, value: running, future: d > dayOfMonth })
  }

  return { ym, income, expense, balance, pace, projectedEnd, upcomingBills, daysLeft, dayOfMonth, dim, health, limitUse, categories, series }
}

export type Analysis = ReturnType<typeof analyze>

export function insights(s: Snapshot, a: Analysis): { tone: "good" | "warn" | "info"; text: string }[] {
  const out: { tone: "good" | "warn" | "info"; text: string }[] = []
  for (const c of a.categories.slice(0, 6)) {
    if (c.prev > 80 && a.dayOfMonth >= 10) {
      // compara proporcionalmente ao ponto do mês
      const expected = c.prev * (a.dayOfMonth / a.dim)
      const delta = (c.value - expected) / expected
      if (delta > 0.25 && delta < 2.5) out.push({ tone: "warn", text: `${c.name} está ${Math.round(delta * 100)}% acima do ritmo do mês passado.` })
      else if (delta < -0.3) out.push({ tone: "good", text: `${c.name} caiu ${Math.round(-delta * 100)}% comparado ao mês passado.` })
    }
  }
  const nextBill = s.bills.filter((b) => !b.paid && b.dueDay >= a.dayOfMonth).sort((x, y) => x.dueDay - y.dueDay)[0]
  if (nextBill) {
    const d = nextBill.dueDay - a.dayOfMonth
    out.push({ tone: "info", text: `${nextBill.name} vence ${d === 0 ? "hoje" : d === 1 ? "amanhã" : `em ${d} dias`} — ${brl(nextBill.amount)}.` })
  }
  if (a.projectedEnd > 0) out.push({ tone: "good", text: `No ritmo atual você fecha o mês com ${brl(a.projectedEnd, false)} sobrando.` })
  else out.push({ tone: "warn", text: `No ritmo atual o mês fecha ${brl(Math.abs(a.projectedEnd), false)} no vermelho.` })
  const near = s.goals.find((g) => g.saved / g.target >= 0.75 && g.saved < g.target)
  if (near) out.push({ tone: "good", text: `Faltam ${brl(near.target - near.saved, false)} para “${near.name}”.` })
  return out
}

export function goalPlan(target: number, saved: number, deadline: string | null, today: string) {
  if (!deadline) return null
  const months = Math.max(1, diffDays(today, deadline) / 30.4)
  return Math.max(0, (target - saved) / months)
}
