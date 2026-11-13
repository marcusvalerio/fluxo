import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"
import { spaceOfToken } from "@/lib/atalho"
import { guessCategory, parseMoney } from "@/lib/assistente"
import { todayISO } from "@/lib/dates"

export const dynamic = "force-dynamic"

const pick = (o: Record<string, unknown>, ...k: string[]) => { for (const x of k) if (o[x] != null && o[x] !== "") return String(o[x]); return "" }
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const FALAS = [
  (l: string, v: string) => `Anotado: ${l}, ${v}. Eu vi tudo.`,
  (l: string, v: string) => `${l}, ${v}. Já tá no Fluxo. Seu dinheiro saiu pra passear.`,
  (l: string, v: string) => `Plim. ${v} em ${l}. Não conto pra ninguém.`,
]

/** Recebe uma compra do atalho do Apple Pay: { valor, local, cartao } (aceita também amount/merchant/card). */
export async function POST(req: Request) {
  const url = new URL(req.url)
  const spaceId = await spaceOfToken(url.searchParams.get("t") ?? req.headers.get("x-fluxo-token") ?? "")
  if (!spaceId) return new Response("Atalho sem acesso. Copie de novo o seu endereço nos Ajustes do Fluxo.", { status: 401 })
  let body: Record<string, unknown> = {}
  const raw = await req.text()
  try { body = JSON.parse(raw) } catch { body = Object.fromEntries(new URLSearchParams(raw)) }
  const valorTxt = pick(body, "valor", "amount", "quantia").replace(/[^\d.,]/g, "")
  const valor = parseMoney(valorTxt) ?? Number(valorTxt)
  if (!valor || !Number.isFinite(valor) || valor <= 0 || valor > 1e7) return new Response("Não entendi o valor da compra.", { status: 400 })
  const local = pick(body, "local", "merchant", "comerciante", "nome").trim().slice(0, 80) || "Compra no Apple Pay"
  const cartao = pick(body, "cartao", "card", "cartão").trim()
  const { category } = guessCategory(local, "expense")
  let cardId: number | null = null
  if (cartao) {
    const [c] = await sql`select id from cards where space_id = ${spaceId} and (lower(name) = lower(${cartao}) or position(lower(name) in lower(${cartao})) > 0) limit 1`
    cardId = c ? Number(c.id) : null
  }
  await sql`insert into transactions (space_id, kind, amount, description, category, occurred_on, card_id)
            values (${spaceId}, 'expense', ${Math.round(valor * 100) / 100}, ${local}, ${category}, ${todayISO()}, ${cardId})`
  revalidatePath("/")
  const fala = FALAS[Math.floor(Math.random() * FALAS.length)](local, brl(valor))
  return new Response(fala, { headers: { "content-type": "text/plain; charset=utf-8" } })
}
