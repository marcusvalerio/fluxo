import { redirect } from "next/navigation"
import { currentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { todayISO } from "@/lib/dates"
import { AdminPanel, type AdminData } from "@/components/admin-panel"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const me = await currentUser()
  if (!me) redirect("/")
  if (me.role !== "admin") redirect("/")

  const ym = todayISO().slice(0, 7)
  const [users, feed, [totals], daily] = await Promise.all([
    sql`
      select u.id, u.name, u.email, u.role, u.active, u.must_change_password, u.created_at, u.last_login_at, s.onboarded,
        coalesce(sum(t.amount) filter (where t.kind = 'expense' and to_char(t.occurred_on,'YYYY-MM') = ${ym}), 0) as gasto,
        coalesce(sum(t.amount) filter (where t.kind = 'income' and to_char(t.occurred_on,'YYYY-MM') = ${ym}), 0) as entrada,
        count(t.id) filter (where t.created_at > now() - interval '30 days') as lancamentos,
        max(t.created_at) as ultimo_lancamento
      from users u join spaces s on s.id = u.space_id
      left join transactions t on t.space_id = u.space_id
      group by u.id, s.onboarded
      order by u.created_at desc`,
    sql`
      select t.id, t.kind, t.amount, t.description, t.category, t.occurred_on, t.created_at, u.name
      from transactions t join users u on u.space_id = t.space_id
      order by t.created_at desc limit 40`,
    sql`
      select
        (select count(*) from users) as usuarios,
        (select count(*) from users where last_login_at > now() - interval '7 days') as ativos7,
        (select count(*) from transactions where created_at > now() - interval '30 days') as lanc30,
        (select coalesce(sum(amount),0) from transactions where kind = 'expense' and to_char(occurred_on,'YYYY-MM') = ${ym}) as gasto_mes,
        (select coalesce(sum(amount),0) from transactions where kind = 'income' and to_char(occurred_on,'YYYY-MM') = ${ym}) as entrada_mes`,
    sql`
      select to_char(d, 'YYYY-MM-DD') as day, coalesce(count(t.id), 0) as n
      from generate_series(current_date - 29, current_date, interval '1 day') d
      left join transactions t on t.created_at::date = d::date
      group by d order by d`,
  ])

  const data: AdminData = {
    me: me.id,
    totals: {
      usuarios: Number(totals.usuarios), ativos7: Number(totals.ativos7), lanc30: Number(totals.lanc30),
      gastoMes: Number(totals.gasto_mes), entradaMes: Number(totals.entrada_mes),
    },
    daily: daily.map((d) => ({ day: d.day, n: Number(d.n) })),
    users: users.map((u) => ({
      id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, pending: u.must_change_password,
      onboarded: u.onboarded, createdAt: new Date(u.created_at).toISOString(),
      lastLogin: u.last_login_at ? new Date(u.last_login_at).toISOString() : null,
      lastTx: u.ultimo_lancamento ? new Date(u.ultimo_lancamento).toISOString() : null,
      gasto: Number(u.gasto), entrada: Number(u.entrada), lancamentos: Number(u.lancamentos),
    })),
    feed: feed.map((t) => ({
      id: Number(t.id), kind: t.kind, amount: Number(t.amount), description: t.description, category: t.category,
      createdAt: new Date(t.created_at).toISOString(), user: t.name,
    })),
  }
  return <AdminPanel data={data} />
}
