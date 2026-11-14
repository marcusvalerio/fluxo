import { sql } from "@/lib/db"
import { snapshotOf } from "@/lib/space"
import { analyze } from "@/lib/finance"
import { recadoDoDia } from "@/lib/recados"
import { ensurePushTable, pushReady, sendTo } from "@/lib/push"

export const dynamic = "force-dynamic"

/** Roda uma vez por dia (Vercel Cron): cada espaço com notificação ligada recebe o recado do dia. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Sem acesso", { status: 401 })
  if (!pushReady()) return Response.json({ sent: 0, reason: "sem chaves" })
  await ensurePushTable()
  const spaces = await sql`select distinct p.space_id, s.name from push_subs p join spaces s on s.id = p.space_id`
  let sent = 0
  for (const sp of spaces) {
    try {
      const snap = await snapshotOf(String(sp.space_id), { name: sp.name, email: "", role: "user", mustChangePassword: false })
      if (!snap) continue
      const msg = recadoDoDia(snap, analyze(snap))
      if (msg) sent += await sendTo(String(sp.space_id), msg)
    } catch { /* um espaço com problema não para os outros */ }
  }
  return Response.json({ sent })
}
