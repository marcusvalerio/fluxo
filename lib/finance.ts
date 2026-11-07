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
export const TONES = ["var(--c-ink)", "var(--c-smoke)", "var(--c-faint)", "var(--c-sand-3)"] as const
export const ACCENT = "#FF4E20"
export const GRAVY = "var(--c-gravy)"

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
  const unpaidSubs = s.subs.filter((x) => x.dueThisMonth && !x.paid)
  const upcomingBills = unpaid.reduce((a, b) => a + b.amount, 0) + unpaidSubs.reduce((a, x) => a + x.amount, 0)

  // Quanto ainda cabe: teto (limite, ou o que entrou) menos o que saiu e as contas que faltam.
  const budget = s.space.limit > 0 ? s.space.limit : income
  const free = budget - expense - upcomingBills
  const perDay = Math.max(0, free) / Math.max(1, daysLeft)
  const fixed = s.bills.reduce((a, b) => a + b.amount, 0) + s.subs.filter((x) => x.dueThisMonth).reduce((a, x) => a + x.amount, 0)
  const dailyCap = budget > 0 ? Math.max(0, budget - fixed) / dim : 0

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

  const byCategory = Object.fromEntries(byCat)
  return { byCategory, prevExpense, ym, income, expense, free, perDay, dailyCap, budget, upcomingBills, daysLeft, dayOfMonth, dim, categories, days, vsPrev }
}

export type Analysis = ReturnType<typeof analyze>

export type Insight = { tone: "good" | "warn" | "info"; title: string; text: string }

/** Leituras curtas do mês, em linguagem de gente. */
export function insights(s: Snapshot, a: Analysis): Insight[] {
  const out: Insight[] = []
  if (a.vsPrev !== null && Math.abs(a.vsPrev) >= 0.05) {
    out.push(a.vsPrev < 0
      ? { tone: "good", title: `${Math.round(-a.vsPrev * 100)}% a menos`, text: "que no mesmo ponto do mês passado. Bom ritmo." }
      : { tone: "warn", title: `${Math.round(a.vsPrev * 100)}% a mais`, text: "que no mesmo ponto do mês passado." })
  }
  for (const c of a.categories) {
    if (c.name === "Outros" || c.prev < 50 || a.dayOfMonth < 7) continue
    const expected = c.prev * (a.dayOfMonth / a.dim)
    const d = (c.value - expected) / expected
    if (d > 0.3 && d < 3) { out.push({ tone: "warn", title: c.name, text: `${Math.round(d * 100)}% acima do ritmo do mês passado.` }); break }
  }
  const next = s.bills.filter((b) => !b.paid && b.dueDay >= a.dayOfMonth).sort((x, y) => x.dueDay - y.dueDay)[0]
  if (next) {
    const d = next.dueDay - a.dayOfMonth
    out.push({ tone: "info", title: d === 0 ? "Vence hoje" : d === 1 ? "Vence amanhã" : `Em ${d} dias`, text: `${next.name} · ${brl(next.amount)}` })
  }
  const late = s.bills.filter((b) => !b.paid && b.dueDay < a.dayOfMonth)
  if (late.length) out.push({ tone: "warn", title: late.length === 1 ? "1 conta atrasada" : `${late.length} contas atrasadas`, text: late.map((b) => b.name).join(", ") })
  const month = s.txs.filter((t) => t.kind === "expense" && t.date.startsWith(a.ym))
  const big = month.reduce<Tx | null>((m, t) => (!m || t.amount > m.amount ? t : m), null)
  if (big) out.push({ tone: "info", title: "Maior gasto", text: `${big.description} · ${brl(big.amount, false)}` })
  for (const [cat, lim] of Object.entries(s.limits)) {
    const v = a.byCategory[cat] ?? 0
    if (v >= lim) { out.unshift({ tone: "warn", title: `${cat} estourou`, text: `${brl(v - lim, false)} acima do limite de ${brl(lim, false)}.` }); break }
    if (v >= lim * 0.8) { out.unshift({ tone: "warn", title: `${cat}: ${Math.round((v / lim) * 100)}%`, text: `Restam ${brl(lim - v, false)} do limite do mês.` }); break }
  }
  const subTotal = s.subs.reduce((x, y) => x + (y.cycle === "yearly" ? y.amount / 12 : y.amount), 0)
  if (subTotal > 0) out.push({ tone: "info", title: `${brl(subTotal * 12, false)}/ano`, text: `em ${s.subs.length} assinaturas.` })
  const near = s.goals.find((g) => g.saved / g.target >= 0.75 && g.saved < g.target)
  if (near) out.push({ tone: "good", title: "Quase lá", text: `Faltam ${brl(near.target - near.saved, false)} para ${near.name}.` })
  if (a.budget > 0 && a.free < 0) out.push({ tone: "warn", title: "Acima do teto", text: `${brl(-a.free, false)} além do que você planejou.` })
  return out
}

/** Últimos 7 dias de gasto, do mais antigo para hoje. */
export function lastWeek(s: Snapshot) {
  return Array.from({ length: 7 }, (_, i) => {
    const iso = addDays(s.today, i - 6)
    const total = s.txs.filter((t) => t.kind === "expense" && t.date === iso).reduce((x, t) => x + t.amount, 0)
    return { iso, total }
  })
}
