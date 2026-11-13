import "server-only"
import { randomBytes } from "node:crypto"
import { sql } from "@/lib/db"

// Atalho do Apple Pay: cada espaço tem um endereço secreto que recebe as compras do iPhone.
let col: Promise<unknown> | null = null
export const ensureTokenColumn = () => (col ??= sql`alter table spaces add column if not exists shortcut_token text unique`.catch((e) => { col = null; throw e }))

export async function tokenOf(spaceId: string, reset = false) {
  await ensureTokenColumn()
  if (!reset) {
    const [r] = await sql`select shortcut_token from spaces where id = ${spaceId}`
    if (r?.shortcut_token) return String(r.shortcut_token)
  }
  const t = randomBytes(18).toString("base64url")
  await sql`update spaces set shortcut_token = ${t} where id = ${spaceId}`
  return t
}

export async function spaceOfToken(t: string) {
  if (!t || t.length < 16) return null
  await ensureTokenColumn()
  const [r] = await sql`select id from spaces where shortcut_token = ${t}`
  return r ? String(r.id) : null
}
