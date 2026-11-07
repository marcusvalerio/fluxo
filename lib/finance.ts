import type { Snapshot, Tx } from "./types"
import { addDays, daysInMonth } from "./dates"

export const brl = (n: number, cents = true) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })

export const int = (n: number) => Math.round(n).toLocaleString("pt-BR")

export const CATEGORIES = {
  expense: ["Alimentação", "Mercado", "Delivery", "Transporte", "Moradia", "Contas", "Saúde", "Lazer", "Compras", "Assinaturas", "Educação", "Cartão", "Outros"],
  income: ["Salário", "Freelance", "Investimentos", "Vendas", "Presente", "Outros"],
} as const

/** Tons da paleta, do mais forte ao mais fraco. A maior categoria ganha o grafite. */
export const TONES = ["#1F282E", "#414E58", "#8A939A", "#B9B7AE"] as const
export const ACCENT = "#FF4E20"
export const GRAVY = "#B83312"

const inMonth = (t: Tx, ym: string) => t.date.startsWith(ym)

export interface CatSlice { name: string; value: number; prev: number; color: string; share: number }
export interface DayBar { iso: string; day: number; total: number; future: boolean; today: boolean; over: boolean; segments: { name: string; value: number; color: string }[] }

export function analyze(s: Snapshot) {
  const ym = s.today.slice(0, 7)
  const month = s.txs.filter((t) => inMonth(t, ym))
  const income = month.filter((t) => t.kind === "income").reduce((a, t) => a + t.amount, 0)
  const expense = month.filter((t) => t.kind === "expense").reduce((a, t) => a + t.amount, 0)

  const dim = daysInMonth(s.today)
  const dayOfMonth = Number(s.today.slice(8, 10))
  const daysLeft = dim - dayOfMonth + 1 // inclui hoje

  const unpaid = s.bills.filter((b) => !b.paid)
  const upcomingBills = unpaid.reduce((a, b) => a + b.amount, 0)

  // Quanto ainda cabe: teto (limite, ou o que entrou) menos o que saiu e as contas que faltam.
  const budget = s.space.limit > 0 ? s.space.limit : income
  const free = budget - expense - upcomingBills
  const perDay = Math.max(0, free) / Math.max(1, daysLeft)
  const dailyCap = budget > 0 ? (budget - s.bills.reduce((a, b) => a + b.amount, 0)) / dim : 0

  // categorias do mês e do mês anterior
  const prevYm = addDays(ym + "-01", -1).slice(0, 7)
  const byCat = new Map<string, number>()
  const prevByCat = new Map<string, number>()
  for (const t of s.txs) {
    if (t.kind !== "expense") continue
    if (inMonth(t, ym)) byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount)
    else if (inMonth(t, prevYm)) prevByCat.set(t.category, (prevByCat.get(t.category) ?? 0) + t.amount)
  }
  const sorted = [...byCat.entries()].sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, 3)
  const rest = sorted.slice(3).reduce((a, [, v]) => a + v, 0)
  const categories: CatSlice[] = top.map(([name, value], i) => ({ name, value, prev: prevByCat.get(name) ?? 0, color: TONES[i], share: expense ? value / expense : 0 }))
  if (rest > 0) categories.push({ name: "Outros", value: rest, prev: 0, color: TONES[3], share: rest / expense })
  const colorOf = (cat: string) => categories.find((c) => c.name === cat)?.color ?? TONES[3]

  const prevExpense = s.txs.filter((t) => t.kind === "expense" && inMonth(t, prevYm)).reduce((a, t) => a + t.amount, 0)
  const prevSamePoint = prevExpense * (dayOfMonth / dim)
  const vsPrev = prevSamePoint > 0 ? (expense - prevSamePoint) / prevSamePoint : null

  // barras do mês empilhadas por categoria
  const days: DayBar[] = []
  for (let d = 1; d <= dim; d++) {
    const iso = `${ym}-${String(d).padStart(2, "0")}`
    const list = month.filter((t) => t.kind === "expense" && t.date === iso)
    const segMap = new Map<string, number>()
    for (const t of list) {
      const key = categories.some((c) => c.name === t.category) ? t.category : "Outros"
      segMap.set(key, (segMap.get(key) ?? 0) + t.amount)
    }
    const segments = categories.filter((c) => segMap.has(c.name)).map((c) => ({ name: c.name, value: segMap.get(c.name)!, color: colorOf(c.name) }))
    const total = list.reduce((a, t) => a + t.amount, 0)
    days.push({ iso, day: d, total, future: d > dayOfMonth, today: d === dayOfMonth, over: dailyCap > 0 && total > dailyCap, segments })
  }

  return { ym, income, expense, free, perDay, dailyCap, budget, upcomingBills, daysLeft, dayOfMonth, dim, categories, days, vsPrev }
}

export type Analysis = ReturnType<typeof analyze>
