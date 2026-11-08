import type { Card, Snapshot, Subscription } from "./types"
import { daysInMonth } from "./dates"
import type { Analysis } from "./finance"

const ym = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`
const shift = (key: string, n: number) => {
  const [y, m] = key.split("-").map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return ym(d.getUTCFullYear(), d.getUTCMonth() + 1)
}
const clampDay = (key: string, d: number) => Math.min(d, daysInMonth(key + "-01"))

/** Mês (YYYY-MM) em que vence a fatura que recebe uma compra feita em `date`. */
export function invoiceKey(card: Card, date: string) {
  const key = date.slice(0, 7)
  const day = Number(date.slice(8, 10))
  const closeKey = day > card.closingDay ? shift(key, 1) : key
  return card.dueDay > card.closingDay ? closeKey : shift(closeKey, 1)
}

export interface Invoice { key: string; due: string; closes: string; total: number; open: boolean }

/** Fatura aberta (a que vence a seguir) e a próxima. */
export function cardSummary(s: Snapshot, card: Card) {
  const cur = invoiceKey(card, s.today)
  const txs = s.txs.filter((t) => t.cardId === card.id && t.kind === "expense")
  const sumFor = (key: string) => txs.filter((t) => invoiceKey(card, t.date) === key).reduce((a, t) => a + t.amount, 0)
  const mk = (key: string, open: boolean): Invoice => {
    const closeKey = card.dueDay > card.closingDay ? key : shift(key, -1)
    return { key, due: `${key}-${String(clampDay(key, card.dueDay)).padStart(2, "0")}`, closes: `${closeKey}-${String(clampDay(closeKey, card.closingDay)).padStart(2, "0")}`, total: sumFor(key), open }
  }
  const used = txs.filter((t) => invoiceKey(card, t.date) >= cur).reduce((a, t) => a + t.amount, 0)
  const future = Array.from({ length: 6 }, (_, i) => mk(shift(cur, i + 1), false)).filter((f) => f.total > 0)
  const prev = mk(shift(cur, -1), false)
  const closed = prev.due >= s.today && prev.total > 0 ? prev : null
  return { closed, current: mk(cur, true), next: mk(shift(cur, 1), false), used: used + (closed?.total ?? 0), available: card.limit > 0 ? card.limit - used - (closed?.total ?? 0) : null, future }
}

export const subMonthly = (x: Subscription) => (x.cycle === "yearly" ? x.amount / 12 : x.amount)

export function subsSummary(s: Snapshot) {
  const monthly = s.subs.reduce((a, x) => a + subMonthly(x), 0)
  return { monthly, yearly: monthly * 12, count: s.subs.length }
}

export interface DayEvent { kind: "income" | "bill" | "sub" | "invoice"; label: string; amount: number; done: boolean }

/** Eventos de cada dia do mês corrente: entradas, contas, assinaturas e vencimentos de fatura. */
export function monthEvents(s: Snapshot, a: Analysis) {
  const map = new Map<number, DayEvent[]>()
  const push = (d: number, e: DayEvent) => map.set(d, [...(map.get(d) ?? []), e])
  for (const t of s.txs) if (t.kind === "income" && t.date.startsWith(a.ym)) push(Number(t.date.slice(8)), { kind: "income", label: t.description, amount: t.amount, done: true })
  for (const b of s.bills) push(clampDay(a.ym, b.dueDay), { kind: "bill", label: b.name, amount: b.amount, done: b.paid })
  for (const x of s.subs) if (x.dueThisMonth) push(clampDay(a.ym, x.billingDay), { kind: "sub", label: x.name, amount: x.amount, done: x.paid })
  for (const c of s.cards) {
    const inv = cardSummary(s, c)
    for (const i of [inv.closed, inv.current, inv.next]) if (i) if (i.due.startsWith(a.ym) && i.total > 0) push(Number(i.due.slice(8)), { kind: "invoice", label: `Fatura ${c.name}`, amount: i.total, done: i.due < s.today })
  }
  return map
}

export interface Health { score: number; label: string; factors: { name: string; points: number; max: number; tip: string }[] }

/** Nota de 0 a 100 a partir de cinco hábitos. */
export function health(s: Snapshot, a: Analysis): Health {
  if (a.income === 0 && a.expense === 0) return { score: -1, label: "Sem dados", factors: [] }
  const f: Health["factors"] = []
  // 1. quanto do que entrou ficou
  const rate = a.income > 0 ? (a.income - a.expense) / a.income : 0
  f.push({ name: "Sobra do mês", max: 30, points: Math.round(Math.max(0, Math.min(1, rate / 0.3)) * 30),
    tip: rate >= 0.2 ? `Você guarda ${Math.round(rate * 100)}% do que entra.` : a.income > 0 ? `Só ${Math.max(0, Math.round(rate * 100))}% do que entra está sobrando.` : "Lance suas entradas para medir." })
  // 2. dentro do teto
  const inside = a.budget > 0 ? a.free >= 0 : true
  f.push({ name: "Dentro do teto", max: 25, points: a.budget <= 0 ? 12 : inside ? 25 : Math.max(0, Math.round(25 * (1 + a.free / a.budget))),
    tip: a.budget <= 0 ? "Defina um teto mensal." : inside ? "O mês cabe no planejado." : "O mês passou do teto." })
  // 3. contas e assinaturas em dia
  const late = s.bills.filter((b) => !b.paid && b.dueDay < a.dayOfMonth).length + s.subs.filter((x) => x.dueThisMonth && !x.paid && x.billingDay < a.dayOfMonth).length
  f.push({ name: "Contas em dia", max: 15, points: Math.max(0, 15 - late * 5), tip: late ? `${late} ${late === 1 ? "conta atrasada" : "contas atrasadas"}.` : "Nada atrasado." })
  // 4. limites por categoria
  const lims = Object.entries(s.limits)
  const over = lims.filter(([c, v]) => (a.byCategory[c] ?? 0) > v).length
  f.push({ name: "Limites", max: 15, points: lims.length ? Math.round(15 * (1 - over / lims.length)) : 8,
    tip: !lims.length ? "Crie limites por categoria." : over ? `${over} ${over === 1 ? "categoria estourou" : "categorias estouraram"}.` : "Todas as categorias no limite." })
  // 5. reserva (meses de gasto guardados em metas)
  const saved = s.goals.reduce((x, g) => x + g.saved, 0)
  const monthCost = Math.max(1, a.prevExpense || a.expense / Math.max(1, a.dayOfMonth) * a.dim)
  const months = saved / monthCost
  f.push({ name: "Reserva", max: 15, points: Math.round(Math.min(1, months / 6) * 15), tip: `${months.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} meses de gastos guardados.` })
  // hábitos sem dados ainda não contam: a nota é proporcional aos que dá para medir
  const has: Record<string, boolean> = { "Sobra do mês": a.income > 0, "Dentro do teto": a.budget > 0, "Contas em dia": true, Limites: Object.keys(s.limits).length > 0, Reserva: s.goals.length > 0 }
  for (const x of f) if (!has[x.name]) x.points = -1
  const counted = f.filter((x) => x.points >= 0)
  const score = Math.round((counted.reduce((x, y) => x + y.points, 0) / Math.max(1, counted.reduce((x, y) => x + y.max, 0))) * 100)
  const label = score >= 80 ? "Ótima" : score >= 60 ? "Boa" : score >= 40 ? "Atenção" : "Crítica"
  return { score, label, factors: f }
}

/**
 * Quanto deve sobrar em cada um dos próximos meses, sem compras novas.
 * Estimativa: orçamento do mês − contas fixas − assinaturas − parcelas já agendadas
 * (pelo mês da fatura) − gasto do dia a dia (o do mês passado, sem parcelas).
 * O mês atual usa o "livre" de verdade.
 */
export function monthRoom(s: Snapshot, a: Analysis, months = 24) {
  const prevYm = shift(a.ym, -1)
  const prevIncome = s.txs.filter((t) => t.kind === "income" && t.date.startsWith(prevYm)).reduce((x, t) => x + t.amount, 0)
  const budget = s.space.limit > 0 ? s.space.limit : Math.max(a.income, prevIncome)
  const fixed = s.bills.reduce((x, b) => x + b.amount, 0) + s.subs.reduce((x, v) => x + subMonthly(v), 0)
  const variable = s.txs.filter((t) => t.kind === "expense" && !t.installment && t.date.startsWith(prevYm)).reduce((x, t) => x + t.amount, 0)
  const cards = new Map(s.cards.map((c) => [c.id, c]))
  const scheduled = new Map<string, number>()
  for (const t of s.txs) {
    if (t.kind !== "expense" || !t.installment) continue
    const c = t.cardId ? cards.get(t.cardId) : undefined
    const key = c ? invoiceKey(c, t.date) : t.date.slice(0, 7)
    scheduled.set(key, (scheduled.get(key) ?? 0) + t.amount)
  }
  return Array.from({ length: months }, (_, i) => {
    const key = shift(a.ym, i)
    const free = i === 0 ? a.free : budget - fixed - variable - (scheduled.get(key) ?? 0)
    return { key, free: Math.round(free * 100) / 100 }
  })
}
