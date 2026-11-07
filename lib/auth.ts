import "server-only"
import { cookies } from "next/headers"
import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import { sql } from "./db"

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>
export const SESSION_COOKIE = "fluxo_session"
const SESSION_DAYS = 30

export async function hashPassword(pw: string) {
  const salt = randomBytes(16)
  const key = await scrypt(pw, salt, 64)
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`
}

export async function verifyPassword(pw: string, stored: string) {
  const [alg, s, k] = stored.split("$")
  if (alg !== "scrypt" || !s || !k) return false
  const expected = Buffer.from(k, "base64")
  const got = await scrypt(pw, Buffer.from(s, "base64"), expected.length)
  return timingSafeEqual(got, expected)
}

/** Senha temporária legível: 3 grupos de 4, sem caracteres ambíguos. */
export function tempPassword() {
  const abc = "abcdefghjkmnpqrstuvwxyz23456789"
  const chars = [...randomBytes(12)].map((x) => abc[x % abc.length]).join("")
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`
}

const sha = (t: string) => createHash("sha256").update(t).digest("hex")

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url")
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5)
  await sql`insert into sessions (token_hash, user_id, expires_at) values (${sha(token)}, ${userId}, ${expires.toISOString()})`
  await sql`update users set last_login_at = now() where id = ${userId}`
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", expires, path: "/",
  })
}

export async function endSession() {
  const jar = await cookies()
  const t = jar.get(SESSION_COOKIE)?.value
  if (t) await sql`delete from sessions where token_hash = ${sha(t)}`
  jar.delete(SESSION_COOKIE)
}

export interface CurrentUser {
  id: string
  email: string
  name: string
  role: "admin" | "user"
  spaceId: string
  mustChangePassword: boolean
}

export async function currentUser(): Promise<CurrentUser | null> {
  const t = (await cookies()).get(SESSION_COOKIE)?.value
  if (!t) return null
  const [u] = await sql`
    select u.id, u.email, u.name, u.role, u.space_id, u.must_change_password
    from sessions s join users u on u.id = s.user_id
    where s.token_hash = ${sha(t)} and s.expires_at > now() and u.active`
  if (!u) return null
  return { id: u.id, email: u.email, name: u.name, role: u.role, spaceId: u.space_id, mustChangePassword: u.must_change_password }
}

export async function requireUser() {
  const u = await currentUser()
  if (!u) throw new Error("Não autenticado")
  return u
}

export async function requireAdmin() {
  const u = await requireUser()
  if (u.role !== "admin") throw new Error("Acesso negado")
  return u
}
