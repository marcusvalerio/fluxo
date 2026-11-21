import { sql } from "@/lib/db"
import { snapshotOf } from "@/lib/space"
import { analyze } from "@/lib/finance"
import { recadoDaNoite, recadoDaTarde, recadoDoDia } from "@/lib/recados"
import { ensurePushTable, pushReady, sendTo } from "@/lib/push"

export const dynamic = "force-dynamic"

type Turno = "manha" | "tarde" | "noite"
// os horários batem com vercel.json (UTC): 9h17, 14h43 e 20h07 em Brasília
const PELO_HORARIO: Record<string, Turno> = { "17 12 * * *": "manha", "43 17 * * *": "tarde", "7 23 * * *": "noite" }

let logTable: Promise<unknown> | null = null
const ensureLog = () => (logTable ??= sql`create table if not exists push_log (
  space_id uuid not null, key text not null, sent_on date not null default current_date, primary key (space_id, key, sent_on)
)`.catch((e) => { logTable = null; throw e }))

/**
 * Até 3 recados por dia. Manhã: o recado do dia (sempre que tiver algo). Tarde e noite: só quando algo
 * está atrapalhando o mês, e o mesmo alerta não se repete em menos de 3 dias.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Sem acesso", { status: 401 })
  if (!pushReady()) return Response.json({ sent: 0, reason: "sem chaves" })
  const url = new URL(req.url)
  const turno: Turno = (url.searchParams.get("turno") as Turno) || PELO_HORARIO[req.headers.get("x-vercel-cron-schedule") ?? ""] || "manha"
  await ensurePushTable(); await ensureLog()
  const spaces = await sql`select distinct p.space_id, s.name from push_subs p join spaces s on s.id = p.space_id`
  let sent = 0
  for (const sp of spaces) {
    try {
      const id = String(sp.space_id)
      const snap = await snapshotOf(id, { name: sp.name, email: "", role: "user", mustChangePassword: false })
      if (!snap) continue
      const a = analyze(snap)
      if (turno === "manha") {
        const msg = recadoDoDia(snap, a)
        if (msg) sent += await sendTo(id, msg)
        continue
      }
      const r = turno === "tarde" ? recadoDaTarde(snap, a) : recadoDaNoite(snap, a)
      if (!r) continue
      const rep = await sql`select 1 from push_log where space_id = ${id} and key = ${r.key} and sent_on > current_date - 3 limit 1`
      if (rep.length) continue
      const n = await sendTo(id, { title: r.title, body: r.body, url: "/" })
      if (n) { sent += n; await sql`insert into push_log (space_id, key) values (${id}, ${r.key}) on conflict do nothing` }
    } catch (e) { console.warn("recado falhou", turno, e) }
  }
  return Response.json({ turno, sent })
}
