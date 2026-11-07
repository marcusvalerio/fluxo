import "server-only"
import { cookies } from "next/headers"
import { sql } from "./db"
import type { Snapshot } from "./types"
import { todayISO } from "./dates"

export const COOKIE = "fluxo_space"
const UUID = /^[0-9a-f-]{36}$/i

export async function currentSpaceId(): Promise<string | null> {
  const id = (await cookies()).get(COOKIE)?.value
  return id && UUID.test(id) ? id : null
}

export async function requireSpaceId(): Promise<string> {
  const id = await currentSpaceId()
  if (!id) throw new Error("Sem espaço ativo")
  return id
}

export const monthKey = () => todayISO().slice(0, 7)

const num = (v: unknown) => Number(v)
const day = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10))

export async function loadSnapshot(): Promise<Snapshot | null> {
  const id = await currentSpaceId()
  if (!id) return null
  const [spaces, txs, goals, bills] = await Promise.all([
    sql`select id, name, monthly_limit from spaces where id = ${id}`,
    sql`select id, kind, amount, description, category, occurred_on from transactions
        where space_id = ${id} and occurred_on > now() - interval '400 days'
        order by occurred_on desc, id desc`,
    sql`select id, name, target, saved, emoji, deadline from goals where space_id = ${id} order by created_at`,
    sql`select id, name, amount, due_day, category, paid_month from bills where space_id = ${id} order by due_day`,
  ])
  const s = spaces[0]
  if (!s) return null
  const mk = monthKey()
  return {
    space: { id: s.id, name: s.name, limit: num(s.monthly_limit) },
    txs: txs.map((t) => ({
      id: num(t.id), kind: t.kind, amount: num(t.amount), description: t.description,
      category: t.category, date: day(t.occurred_on),
    })),
    goals: goals.map((g) => ({
      id: num(g.id), name: g.name, target: num(g.target), saved: num(g.saved), emoji: g.emoji,
      deadline: g.deadline ? day(g.deadline) : null,
    })),
    bills: bills.map((b) => ({
      id: num(b.id), name: b.name, amount: num(b.amount), dueDay: num(b.due_day),
      category: b.category, paid: b.paid_month === mk,
    })),
    today: todayISO(),
  }
}
