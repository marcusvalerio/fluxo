// Cria (ou recria a senha de) uma conta admin.
// Uso: node --env-file=.env.local scripts/create-admin.mjs email@dominio.com "Nome"
import { neon } from "@neondatabase/serverless"
import { randomBytes, scryptSync } from "node:crypto"

const [email, name = "Admin"] = process.argv.slice(2)
if (!email) { console.error("Informe o e-mail."); process.exit(1) }
const sql = neon(process.env.DATABASE_URL)

const abc = "abcdefghjkmnpqrstuvwxyz23456789"
const c = [...randomBytes(12)].map((x) => abc[x % abc.length]).join("")
const password = `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}`
const salt = randomBytes(16)
const hash = `scrypt$${salt.toString("base64")}$${scryptSync(password, salt, 64).toString("base64")}`

const e = email.trim().toLowerCase()
const [existing] = await sql`select id from users where email = ${e}`
if (existing) {
  await sql`update users set password_hash = ${hash}, role = 'admin', active = true, must_change_password = true where id = ${existing.id}`
} else {
  const [space] = await sql`insert into spaces (name) values (${name}) returning id`
  await sql`insert into users (email, name, password_hash, role, space_id) values (${e}, ${name}, ${hash}, 'admin', ${space.id})`
}
console.log(`Admin pronto: ${e}\nSenha temporária: ${password}`)
