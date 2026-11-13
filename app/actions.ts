"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "node:crypto"
import { sql } from "@/lib/db"
import { ensurePlanColumn, requireSpaceId, monthKey } from "@/lib/space"
import { endSession, hashPassword, requireUser, startSession, verifyPassword } from "@/lib/auth"
import { addDays, todayISO } from "@/lib/dates"
import type { Kind, Plan } from "@/lib/types"

const done = () => revalidatePath("/")
const money = (n: unknown) => {
  const v = Math.round(Number(n) * 100) / 100
  if (!Number.isFinite(v) || v <= 0 || v > 1e11) throw new Error("Valor inválido")
  return v
}
const text = (s: unknown, max = 80) => {
  const v = String(s ?? "").trim().slice(0, max)
  if (!v) throw new Error("Campo obrigatório")
  return v
}
const isoDate = (s: unknown) => {
  const v = String(s ?? "")
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : todayISO()
}

// ---------- conta ----------

/** Confere o plano vindo do app: porcentagens inteiras que somam 100. */
function cleanPlan(p: Plan): Plan {
  const pct = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)))
  const income = Math.max(0, Math.round(Number(p.income) || 0))
  const fixed = pct(p.fixed), variable = pct(p.variable), save = pct(p.save)
  if (fixed + variable + save !== 100 || income > 1e9) throw new Error("Plano inválido")
  const goals: Record<string, number> = {}
  for (const [k, v] of Object.entries(p.goals ?? {}).slice(0, 50)) if (/^\d+$/.test(k)) goals[k] = pct(v)
  return { income, fixed, variable, save, goals }
}
const tetoDoPlano = (p: Plan) => Math.round((p.income * (p.fixed + p.variable)) / 100)

export async function login(email: string, password: string): Promise<{ error?: string }> {
  const e = String(email ?? "").trim().toLowerCase()
  const [u] = await sql`select id, password_hash, active from users where email = ${e}`
  // mesma resposta para e-mail inexistente e senha errada
  if (!u || !u.active || !(await verifyPassword(String(password ?? ""), u.password_hash))) {
    await new Promise((r) => setTimeout(r, 400))
    return { error: "E-mail ou senha incorretos." }
  }
  await startSession(u.id)
  done()
  return {}
}

export async function logout() {
  await endSession()
  done()
}

export async function changePassword(current: string, next: string): Promise<{ error?: string }> {
  const user = await requireUser()
  if (String(next).length < 8) return { error: "A nova senha precisa de pelo menos 8 caracteres." }
  const [u] = await sql`select password_hash from users where id = ${user.id}`
  if (!(await verifyPassword(String(current ?? ""), u.password_hash))) return { error: "Senha atual incorreta." }
  await sql`update users set password_hash = ${await hashPassword(next)}, must_change_password = false where id = ${user.id}`
  return {}
}

/** Fim do onboarding: nome, teto, senha nova (se for a temporária) e dados de exemplo opcionais. */
export async function completeOnboarding(input: { name: string; limit: number; demo: boolean; password?: string; plan?: Plan | null }): Promise<{ error?: string }> {
  const user = await requireUser()
  if (user.mustChangePassword) {
    if (!input.password || input.password.length < 8) return { error: "Crie uma senha com pelo menos 8 caracteres." }
    await sql`update users set password_hash = ${await hashPassword(input.password)}, must_change_password = false where id = ${user.id}`
  }
  const name = text(input.name, 40)
  const plan = input.plan && input.plan.income > 0 ? cleanPlan(input.plan) : null
  const limit = plan ? tetoDoPlano(plan) : Math.max(0, Number(input.limit) || 0)
  await sql`update users set name = ${name} where id = ${user.id}`
  await ensurePlanColumn()
  await sql`update spaces set name = ${name}, monthly_limit = ${limit}, onboarded = true, plan = ${plan ? JSON.stringify(plan) : null}::jsonb where id = ${user.spaceId}`
  if (input.demo) {
    const [{ n }] = await sql`select count(*)::int as n from transactions where space_id = ${user.spaceId}`
    if (n === 0) await seedDemo(user.spaceId)
  }
  done()
  return {}
}

export async function addTransaction(input: { kind: Kind; amount: number; description: string; category: string; date: string; cardId?: number | null; installments?: number }) {
  const id = await requireSpaceId()
  const kind = input.kind === "income" ? "income" : "expense"
  const total = money(input.amount)
  const desc = text(input.description)
  const cat = text(input.category, 30)
  const date = isoDate(input.date)
  let cardId: number | null = null
  if (kind === "expense" && input.cardId) {
    const [c] = await sql`select id from cards where id = ${input.cardId} and space_id = ${id}`
    cardId = c ? Number(c.id) : null
  }
  const n = cardId ? Math.min(48, Math.max(1, Math.round(Number(input.installments) || 1))) : 1
  if (n === 1) {
    await sql`insert into transactions (space_id, kind, amount, description, category, occurred_on, card_id)
              values (${id}, ${kind}, ${total}, ${desc}, ${cat}, ${date}, ${cardId})`
  } else {
    // parcela em centavos; a primeira absorve a diferença do arredondamento
    const cents = Math.round(total * 100)
    const base = Math.floor(cents / n)
    const group = randomUUID()
    for (let i = 0; i < n; i++) {
      const v = (i === 0 ? cents - base * (n - 1) : base) / 100
      const d = new Date(date + "T12:00:00Z")
      const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + i, 1))
      const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
      target.setUTCDate(Math.min(d.getUTCDate(), last))
      await sql`insert into transactions (space_id, kind, amount, description, category, occurred_on, card_id, installment_group, installment_no, installment_total)
                values (${id}, 'expense', ${v}, ${desc}, ${cat}, ${target.toISOString().slice(0, 10)}, ${cardId}, ${group}, ${i + 1}, ${n})`
    }
  }
  done()
}

// ---------- cartões ----------

const dayOf = (n: unknown) => Math.min(31, Math.max(1, Math.round(Number(n) || 1)))

export async function addCard(input: { name: string; closingDay: number; dueDay: number; limit: number }) {
  const id = await requireSpaceId()
  await sql`insert into cards (space_id, name, closing_day, due_day, credit_limit)
            values (${id}, ${text(input.name, 30)}, ${dayOf(input.closingDay)}, ${dayOf(input.dueDay)}, ${Math.max(0, Number(input.limit) || 0)})`
  done()
}

export async function deleteCard(cardId: number) {
  const id = await requireSpaceId()
  await sql`delete from cards where id = ${cardId} and space_id = ${id}`
  done()
}

// ---------- assinaturas ----------

export async function addSubscription(input: { name: string; amount: number; billingDay: number; cycle: "monthly" | "yearly"; billingMonth?: number | null; cardId?: number | null }) {
  const id = await requireSpaceId()
  const cycle = input.cycle === "yearly" ? "yearly" : "monthly"
  const bm = cycle === "yearly" ? Math.min(12, Math.max(1, Math.round(Number(input.billingMonth) || 1))) : null
  let cardId: number | null = null
  if (input.cardId) {
    const [c] = await sql`select id from cards where id = ${input.cardId} and space_id = ${id}`
    cardId = c ? Number(c.id) : null
  }
  await sql`insert into subscriptions (space_id, name, amount, billing_day, cycle, billing_month, card_id)
            values (${id}, ${text(input.name, 40)}, ${money(input.amount)}, ${dayOf(input.billingDay)}, ${cycle}, ${bm}, ${cardId})`
  done()
}

export async function deleteSubscription(subId: number) {
  const id = await requireSpaceId()
  await sql`delete from subscriptions where id = ${subId} and space_id = ${id}`
  done()
}

/** Marcar como cobrada lança a despesa (no cartão, se tiver); desmarcar remove. */
export async function toggleSubscription(subId: number) {
  const id = await requireSpaceId()
  const mk = monthKey()
  const [x] = await sql`select name, amount, card_id, paid_month from subscriptions where id = ${subId} and space_id = ${id}`
  if (!x) return
  if (x.paid_month === mk) {
    await sql`update subscriptions set paid_month = null where id = ${subId}`
    await sql`delete from transactions where id = (
      select id from transactions where space_id = ${id} and description = ${x.name} and amount = ${x.amount}
      and category = 'Assinaturas' and to_char(occurred_on, 'YYYY-MM') = ${mk} order by id desc limit 1)`
  } else {
    await sql`update subscriptions set paid_month = ${mk} where id = ${subId}`
    await sql`insert into transactions (space_id, kind, amount, description, category, occurred_on, card_id)
              values (${id}, 'expense', ${x.amount}, ${x.name}, 'Assinaturas', ${todayISO()}, ${x.card_id})`
  }
  done()
}

// ---------- limites por categoria ----------

export async function setCategoryLimit(category: string, amount: number) {
  const id = await requireSpaceId()
  const cat = text(category, 30)
  const v = Math.round(Number(amount) * 100) / 100
  if (!v || v <= 0) await sql`delete from category_limits where space_id = ${id} and category = ${cat}`
  else await sql`insert into category_limits (space_id, category, amount) values (${id}, ${cat}, ${v})
                 on conflict (space_id, category) do update set amount = excluded.amount`
  done()
}

export async function deleteTransaction(txId: number) {
  const id = await requireSpaceId()
  await sql`delete from transactions where id = ${txId} and space_id = ${id}`
  done()
}

/** Salva o plano (quanto guardar e a divisão entre metas). O teto do mês passa a ser o que sobra depois de guardar. */
export async function savePlan(input: Plan) {
  const id = await requireSpaceId()
  const plan = cleanPlan(input)
  await ensurePlanColumn()
  if (plan.income > 0) await sql`update spaces set plan = ${JSON.stringify(plan)}::jsonb, monthly_limit = ${tetoDoPlano(plan)} where id = ${id}`
  else await sql`update spaces set plan = ${JSON.stringify(plan)}::jsonb where id = ${id}`
  done()
}

export async function setLimit(limit: number) {
  const id = await requireSpaceId()
  await sql`update spaces set monthly_limit = ${Math.max(0, Number(limit) || 0)} where id = ${id}`
  done()
}

export async function addGoal(input: { name: string; target: number; emoji: string; deadline: string | null }) {
  const id = await requireSpaceId()
  const deadline = input.deadline && /^\d{4}-\d{2}-\d{2}$/.test(input.deadline) ? input.deadline : null
  await sql`insert into goals (space_id, name, target, emoji, deadline)
            values (${id}, ${text(input.name, 40)}, ${money(input.target)}, ${(input.emoji || "✦").slice(0, 4)}, ${deadline})`
  done()
}

export async function contributeGoal(goalId: number, amount: number) {
  const id = await requireSpaceId()
  const v = Math.round(Number(amount) * 100) / 100
  if (!Number.isFinite(v) || v === 0) return
  await sql`update goals set saved = greatest(0, saved + ${v}) where id = ${goalId} and space_id = ${id}`
  done()
}

export async function deleteGoal(goalId: number) {
  const id = await requireSpaceId()
  await sql`delete from goals where id = ${goalId} and space_id = ${id}`
  done()
}

export async function addBill(input: { name: string; amount: number; dueDay: number; category: string }) {
  const id = await requireSpaceId()
  const dueDay = Math.min(31, Math.max(1, Math.round(Number(input.dueDay) || 1)))
  await sql`insert into bills (space_id, name, amount, due_day, category)
            values (${id}, ${text(input.name, 40)}, ${money(input.amount)}, ${dueDay}, ${text(input.category || "Contas", 30)})`
  done()
}

/** Marcar como paga também lança a despesa — a conta vira transação real. */
export async function toggleBill(billId: number) {
  const id = await requireSpaceId()
  const mk = monthKey()
  const [b] = await sql`select name, amount, category, paid_month from bills where id = ${billId} and space_id = ${id}`
  if (!b) return
  if (b.paid_month === mk) {
    await sql`update bills set paid_month = null where id = ${billId}`
    await sql`delete from transactions where id = (
      select id from transactions where space_id = ${id} and description = ${b.name} and amount = ${b.amount}
      and to_char(occurred_on, 'YYYY-MM') = ${mk} order by id desc limit 1)`
  } else {
    await sql`update bills set paid_month = ${mk} where id = ${billId}`
    await sql`insert into transactions (space_id, kind, amount, description, category, occurred_on)
              values (${id}, 'expense', ${b.amount}, ${b.name}, ${b.category}, ${todayISO()})`
  }
  done()
}

export async function deleteBill(billId: number) {
  const id = await requireSpaceId()
  await sql`delete from bills where id = ${billId} and space_id = ${id}`
  done()
}

async function seedDemo(id: string) {
  const t = todayISO()
  const rows: [string, number, string, string, number][] = [
    ["income", 8400, "Salário", "Salário", -6],
    ["income", 1250, "Projeto freelance", "Freelance", -12],
    ["expense", 42.9, "Almoço", "Alimentação", 0],
    ["expense", 18.5, "Café", "Alimentação", -1],
    ["expense", 236.4, "Mercado", "Mercado", -2],
    ["expense", 64, "Uber", "Transporte", -3],
    ["expense", 89.9, "Delivery japonês", "Delivery", -4],
    ["expense", 55.9, "Spotify + Netflix", "Assinaturas", -5],
    ["expense", 320, "Tênis de corrida", "Compras", -7],
    ["expense", 47, "Delivery pizza", "Delivery", -9],
    ["expense", 180, "Farmácia", "Saúde", -10],
    ["expense", 132.7, "Bar com amigos", "Lazer", -11],
    ["expense", 210.3, "Mercado", "Mercado", -14],
    ["expense", 78, "Combustível", "Transporte", -16],
    ["expense", 1900, "Aluguel", "Moradia", -20],
    ["income", 8400, "Salário", "Salário", -36],
    ["expense", 1900, "Aluguel", "Moradia", -50],
    ["expense", 612, "Mercado do mês", "Mercado", -40],
    ["expense", 410, "Delivery", "Delivery", -44],
    ["expense", 380, "Restaurantes", "Alimentação", -38],
    ["expense", 260, "Transporte", "Transporte", -42],
    ["expense", 540, "Viagem fim de semana", "Lazer", -47],
    ["income", 8400, "Salário", "Salário", -66],
    ["expense", 1900, "Aluguel", "Moradia", -80],
    ["expense", 1350, "Gastos do mês", "Compras", -70],
  ]
  for (const [kind, amount, description, category, offset] of rows) {
    await sql`insert into transactions (space_id, kind, amount, description, category, occurred_on)
              values (${id}, ${kind}, ${amount}, ${description}, ${category}, ${addDays(t, offset)})`
  }
  await sql`insert into goals (space_id, name, target, saved, emoji, deadline) values
    (${id}, 'Reserva de emergência', 30000, 18400, '', null),
    (${id}, 'Japão 2027', 22000, 6100, '', ${addDays(t, 300)}),
    (${id}, 'MacBook novo', 14000, 11200, '', ${addDays(t, 90)})`
  const [nu] = await sql`insert into cards (space_id, name, closing_day, due_day, credit_limit) values (${id}, 'Nubank', 3, 10, 8000) returning id`
  await sql`insert into cards (space_id, name, closing_day, due_day, credit_limit) values (${id}, 'Inter', 20, 27, 4000)`
  await sql`insert into subscriptions (space_id, name, amount, billing_day, cycle, billing_month, card_id) values
    (${id}, 'Netflix', 44.9, 12, 'monthly', null, ${nu.id}),
    (${id}, 'Spotify', 21.9, 5, 'monthly', null, ${nu.id}),
    (${id}, 'iCloud', 14.9, 18, 'monthly', null, ${nu.id}),
    (${id}, 'ChatGPT', 110, 22, 'monthly', null, ${nu.id}),
    (${id}, 'Amazon Prime', 166.8, 9, 'yearly', 3, ${nu.id})`
  await sql`insert into category_limits (space_id, category, amount) values
    (${id}, 'Delivery', 400), (${id}, 'Mercado', 1200), (${id}, 'Lazer', 500), (${id}, 'Transporte', 450)`
  const g = randomUUID()
  for (let i = 0; i < 6; i++) {
    await sql`insert into transactions (space_id, kind, amount, description, category, occurred_on, card_id, installment_group, installment_no, installment_total)
              values (${id}, 'expense', 349.9, 'Fone de ouvido', 'Compras', ${addDays(t, -25 + i * 30)}, ${nu.id}, ${g}, ${i + 1}, 6)`
  }
  await sql`insert into bills (space_id, name, amount, due_day, category) values
    (${id}, 'Internet', 129.9, 10, 'Contas'),
    (${id}, 'Energia', 214, 15, 'Contas'),
    (${id}, 'Academia', 119, 5, 'Saúde'),
    (${id}, 'Cartão de crédito', 1840, 25, 'Cartão'),
    (${id}, 'Condomínio', 650, 28, 'Moradia')`
}
