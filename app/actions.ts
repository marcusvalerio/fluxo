"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"
import { COOKIE, requireSpaceId, monthKey } from "@/lib/space"
import { addDays, todayISO } from "@/lib/dates"
import type { Kind } from "@/lib/types"

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

export async function createSpace(input: { name: string; limit: number; demo: boolean }) {
  const name = text(input.name, 40)
  const limit = Math.max(0, Number(input.limit) || 0)
  const [row] = await sql`insert into spaces (name, monthly_limit) values (${name}, ${limit}) returning id`
  const id: string = row.id
  if (input.demo) await seedDemo(id)
  ;(await cookies()).set(COOKIE, id, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 400, path: "/",
  })
  done()
}

export async function leaveSpace() {
  ;(await cookies()).delete(COOKIE)
  done()
}

export async function addTransaction(input: { kind: Kind; amount: number; description: string; category: string; date: string }) {
  const id = await requireSpaceId()
  const kind = input.kind === "income" ? "income" : "expense"
  await sql`insert into transactions (space_id, kind, amount, description, category, occurred_on)
            values (${id}, ${kind}, ${money(input.amount)}, ${text(input.description)}, ${text(input.category, 30)}, ${isoDate(input.date)})`
  done()
}

export async function deleteTransaction(txId: number) {
  const id = await requireSpaceId()
  await sql`delete from transactions where id = ${txId} and space_id = ${id}`
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
  await sql`insert into bills (space_id, name, amount, due_day, category) values
    (${id}, 'Internet', 129.9, 10, 'Contas'),
    (${id}, 'Energia', 214, 15, 'Contas'),
    (${id}, 'Academia', 119, 5, 'Saúde'),
    (${id}, 'Cartão de crédito', 1840, 25, 'Cartão'),
    (${id}, 'Condomínio', 650, 28, 'Moradia')`
}
