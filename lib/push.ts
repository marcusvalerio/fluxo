import "server-only"
import webpush from "web-push"
import { sql } from "@/lib/db"

// Notificações do Fluximetro (Web Push). Funcionam no iPhone com o app instalado na tela de início.
let table: Promise<unknown> | null = null
export const ensurePushTable = () => (table ??= sql`create table if not exists push_subs (
  endpoint text primary key, space_id uuid not null, p256dh text not null, auth text not null, created_at timestamptz default now()
)`.catch((e) => { table = null; throw e }))

export const pushReady = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
let configured = false
function setup() {
  if (configured) return
  webpush.setVapidDetails("mailto:avisos@fluxofinanca.app", process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!)
  configured = true
}

export interface PushSub { endpoint: string; keys: { p256dh: string; auth: string } }

export async function saveSub(spaceId: string, s: PushSub) {
  await ensurePushTable()
  await sql`insert into push_subs (endpoint, space_id, p256dh, auth) values (${s.endpoint}, ${spaceId}, ${s.keys.p256dh}, ${s.keys.auth})
            on conflict (endpoint) do update set space_id = excluded.space_id, p256dh = excluded.p256dh, auth = excluded.auth`
}
export async function removeSub(endpoint: string) {
  await ensurePushTable()
  await sql`delete from push_subs where endpoint = ${endpoint}`
}

/** Manda um recado pra todos os aparelhos de um espaço. Tira da lista os que não existem mais. */
export async function sendTo(spaceId: string, msg: { title: string; body: string; url?: string }) {
  if (!pushReady()) return 0
  setup(); await ensurePushTable()
  const subs = await sql`select endpoint, p256dh, auth from push_subs where space_id = ${spaceId}`
  let ok = 0
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(msg), { TTL: 60 * 60 * 6 })
      ok++
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode
      if (code === 404 || code === 410) await removeSub(s.endpoint)
    }
  }
  return ok
}
