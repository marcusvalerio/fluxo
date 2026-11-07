"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"
import { hashPassword, requireAdmin, tempPassword } from "@/lib/auth"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Cria a conta e o espaço da pessoa. Devolve a senha temporária — ela só aparece uma vez. */
export async function createUser(input: { name: string; email: string; role: "admin" | "user" }): Promise<{ error?: string; password?: string }> {
  await requireAdmin()
  const email = String(input.email ?? "").trim().toLowerCase()
  const name = String(input.name ?? "").trim().slice(0, 40)
  if (!EMAIL.test(email)) return { error: "E-mail inválido." }
  if (!name) return { error: "Informe o nome." }
  const [exists] = await sql`select 1 from users where email = ${email}`
  if (exists) return { error: "Já existe uma conta com esse e-mail." }
  const password = tempPassword()
  const [space] = await sql`insert into spaces (name) values (${name}) returning id`
  await sql`insert into users (email, name, password_hash, role, space_id)
            values (${email}, ${name}, ${await hashPassword(password)}, ${input.role === "admin" ? "admin" : "user"}, ${space.id})`
  revalidatePath("/admin")
  return { password }
}

export async function resetPassword(userId: string): Promise<{ password: string }> {
  await requireAdmin()
  const password = tempPassword()
  await sql`update users set password_hash = ${await hashPassword(password)}, must_change_password = true where id = ${userId}`
  await sql`delete from sessions where user_id = ${userId}`
  revalidatePath("/admin")
  return { password }
}

export async function setActive(userId: string, active: boolean): Promise<{ error?: string }> {
  const me = await requireAdmin()
  if (me.id === userId) return { error: "Você não pode desativar a própria conta." }
  await sql`update users set active = ${active} where id = ${userId}`
  if (!active) await sql`delete from sessions where user_id = ${userId}`
  revalidatePath("/admin")
  return {}
}
