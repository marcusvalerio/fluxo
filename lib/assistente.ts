// Assistente do Fluxo: entende frases curtas sem IA externa.
// Tudo aqui é puro (sem banco, sem rede): recebe texto e devolve rascunhos
// que a interface mostra para a pessoa confirmar antes de gravar.

export type Kind = "income" | "expense"

export interface Draft {
  kind: Kind
  amount: number
  description: string
  category: string
  date: string // AAAA-MM-DD
  installments: number // 1 = à vista
  card?: string // nome do cartão citado, se houver
}

export interface Purchase {
  description: string
  total?: number
  installments?: number
  card?: string
}

// ---------- categorias por palavra-chave ----------
const KEYWORDS: [string, Kind, string[]][] = [
  ["Salário", "income", ["salario", "salário", "pagamento da empresa", "holerite"]],
  ["Freelance", "income", ["freela", "freelance", "projeto", "job", "cliente pagou"]],
  ["Investimentos", "income", ["rendimento", "dividendo", "cdb", "tesouro"]],
  ["Vendas", "income", ["vendi", "venda"]],
  ["Presente", "income", ["presente", "pix da mae", "pix da mãe", "ganhei"]],
  ["Delivery", "expense", ["ifood", "i-food", "rappi", "delivery", "pizza", "lanche", "hamburguer", "hambúrguer", "sushi", "japones", "japonês"]],
  ["Transporte", "expense", ["uber", "99", "taxi", "táxi", "onibus", "ônibus", "metro", "metrô", "gasolina", "combustivel", "combustível", "estacionamento", "pedagio", "pedágio"]],
  ["Mercado", "expense", ["mercado", "supermercado", "feira", "hortifruti", "atacadão", "assai", "assaí", "padaria"]],
  ["Alimentação", "expense", ["almoço", "almoco", "jantar", "cafe", "café", "restaurante", "lanchonete"]],
  ["Moradia", "expense", ["aluguel", "condominio", "condomínio", "iptu"]],
  ["Contas", "expense", ["luz", "energia", "agua", "água", "internet", "celular", "telefone", "gas", "gás"]],
  ["Saúde", "expense", ["farmacia", "farmácia", "remedio", "remédio", "medico", "médico", "consulta", "academia", "dentista", "exame"]],
  ["Lazer", "expense", ["cinema", "show", "bar", "cerveja", "viagem", "ingresso", "balada", "festa"]],
  ["Assinaturas", "expense", ["netflix", "spotify", "prime", "disney", "hbo", "youtube", "icloud", "chatgpt", "assinatura"]],
  ["Educação", "expense", ["curso", "livro", "faculdade", "escola", "mensalidade"]],
  ["Compras", "expense", ["roupa", "tenis", "tênis", "notebook", "celular novo", "fone", "presente pra", "shopping", "amazon", "shopee", "mercado livre"]],
]
const INCOME_VERBS = ["recebi", "caiu", "entrou", "ganhei", "vendi", "me pagaram", "pagaram"]

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

export function guessCategory(text: string, kind?: Kind): { kind: Kind; category: string } {
  const t = norm(text)
  const isIncome = kind === "income" || INCOME_VERBS.some((v) => t.includes(norm(v)))
  for (const [cat, k, words] of KEYWORDS) {
    if (isIncome && k !== "income") continue
    // palavras de entrada só valem com verbo de entrada, exceto salário
    if (!isIncome && k === "income" && cat !== "Salário") continue
    if (words.some((w) => new RegExp(`(^|[^a-z0-9])${norm(w)}([^a-z0-9]|$)`).test(t))) return { kind: k, category: cat }
  }
  return { kind: isIncome ? "income" : "expense", category: "Outros" }
}

// ---------- números ----------
/** "23,50" "R$ 1.200" "1,2 mil" "4.500,00" "45" -> número */
export function parseMoney(raw: string): number | null {
  let s = raw.toLowerCase().replace(/r\$\s*/g, "").trim()
  let mult = 1
  const mil = s.match(/^(.*?)\s*(mil|k)$/)
  if (mil) { s = mil[1]; mult = 1000 }
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".")
  else if (/^\d+(,\d{1,2})$/.test(s)) s = s.replace(",", ".")
  else if (/^\d+,\d+$/.test(s) && mult > 1) s = s.replace(",", ".")
  else if (!/^\d+(\.\d{1,2})?$/.test(s)) return null
  const n = Number(s) * mult
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null
}

const MONEY_RE = /(r\$\s*)?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?(?:\s*(?:mil|k)\b)?|(r\$\s*)?\d+(?:[.,]\d{1,2})?(?:\s*(?:mil|k)\b)?/gi

/** Valores em dinheiro numa frase, ignorando datas ("dia 12", "12/03") e parcelas ("10x"). */
function moneyIn(text: string) {
  const out: { raw: string; n: number }[] = []
  for (const m of text.matchAll(MONEY_RE)) {
    const raw = m[0]; const at = m.index ?? 0
    const before = text.slice(Math.max(0, at - 5), at).toLowerCase()
    const after = text.slice(at + raw.length, at + raw.length + 9).toLowerCase()
    if (/dia\s+$/.test(before) || /^\s*(x\b|vezes|parcela)/.test(after) || /^\//.test(after) || /\/$/.test(before)) continue
    if (/^\d{1,2}$/.test(raw.trim()) && /\bem\s+$/.test(before) && !/^\s*(reais|r\$|mil)/.test(after)) continue // "em 10"
    const n = parseMoney(raw); if (n !== null) out.push({ raw, n })
  }
  return out
}

// ---------- datas ----------
const WEEKDAYS = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"]
function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10)
}
export function parseDate(text: string, today: string): string {
  const t = norm(text)
  if (/\banteontem\b/.test(t)) return addDays(today, -2)
  if (/\bontem\b/.test(t)) return addDays(today, -1)
  if (/\bamanha\b/.test(t)) return addDays(today, 1)
  const dm = t.match(/\bdia\s+(\d{1,2})(?:\/(\d{1,2}))?\b/) || t.match(/\b(\d{1,2})\/(\d{1,2})\b/)
  if (dm) {
    const day = Number(dm[1]); const month = dm[2] ? Number(dm[2]) : Number(today.slice(5, 7))
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      let year = Number(today.slice(0, 4))
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      if (iso > addDays(today, 31)) year -= 1
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    }
  }
  const wd = WEEKDAYS.findIndex((w) => new RegExp(`\\b${w}(-feira)?\\b`).test(t))
  if (wd >= 0) {
    const cur = new Date(today + "T12:00:00Z").getUTCDay()
    const back = (cur - wd + 7) % 7 || 7 // última ocorrência passada
    return addDays(today, -back)
  }
  return today
}

// ---------- parcelas e cartão ----------
export function parseInstallments(text: string): number | undefined {
  const t = norm(text)
  const m = t.match(/\b(\d{1,2})\s*(x|vezes|parcelas?)\b/) || t.match(/\bem\s+(\d{1,2})\b(?!\s*(reais|r\$|mil))/)
  if (m) { const n = Number(m[1]); if (n >= 1 && n <= 48) return n }
  if (/\ba vista\b|\bavista\b|\bno pix\b|\bno debito\b/.test(t)) return 1
  return undefined
}
export function findCard(text: string, cards: string[]): string | undefined {
  const t = norm(text)
  return cards.find((c) => t.includes(norm(c)))
}

// ---------- frases de lançamento ----------
/** "uber 23,50 hoje e almoço 38 ontem" -> dois rascunhos */
export function parseEntries(text: string, today: string, cards: string[] = []): Draft[] {
  const parts = text
    .split(/\s*(?:;|\n|,\s+(?=\D)|\s+e\s+(?=[^\d]*\d)|\s+\+\s+)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean)
  const out: Draft[] = []
  for (const part of parts) {
    const amounts = moneyIn(part)
    if (!amounts.length) continue
    const amount = amounts[amounts.length - 1].n as number
    const { kind, category } = guessCategory(part)
    const description = cleanDescription(part, amounts.map((a) => a.raw), cards) || category
    const installments = parseInstallments(part) ?? 1
    out.push({ kind, amount, description, category, date: parseDate(part, today), installments, card: findCard(part, cards) })
  }
  return out
}

const STOP = /\b(hoje|ontem|anteontem|amanha|amanhã|dia\s+\d{1,2}(\/\d{1,2})?|\d{1,2}\/\d{1,2}|reais|real|r\$|no|na|em|de|do|da|com|pelo|pela|gastei|paguei|comprei|recebi|caiu|entrou|ganhei|\d{1,2}\s*(x|vezes|parcelas?)|a vista|à vista|no pix|no debito|no débito|no credito|no crédito|segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)(-feira)?\b/gi
function cleanDescription(part: string, amounts: string[], cards: string[] = []) {
  let s = part
  for (const a of amounts) s = s.replace(a, " ")
  for (const c of cards) s = s.replace(new RegExp(c, "i"), " ")
  s = s.replace(STOP, " ").replace(/\s+/g, " ").trim().replace(/^(o|a|os|as|um|uma)\s+/i, "")
  return s ? s[0].toUpperCase() + s.slice(1) : ""
}

// ---------- compra planejada ----------
/** "quero comprar um notebook de 4.500 em 10x no nubank" */
export function parsePurchase(text: string, cards: string[] = []): Purchase | null {
  const t = norm(text)
  if (!/(comprar|compra|parcelar|pensando em|planejando|vale a pena|quero)/.test(t)) return null
  const what = t.match(/(?:comprar|compra de|compra do|compra da|parcelar)\s+(?:um|uma|o|a)?\s*([a-z0-9 ]+?)(?=\s+(?:de|por|em|no|na|que|custando|r\$|\d)|$)/)
  const amounts = moneyIn(text)
  const total = amounts.length ? (amounts[amounts.length - 1].n as number) : undefined
  const desc = what?.[1]?.trim()
  return {
    description: desc ? desc[0].toUpperCase() + desc.slice(1) : "Compra",
    total,
    installments: parseInstallments(text),
    card: findCard(text, cards),
  }
}

// ---------- simulação mês a mês ----------
export interface CardRule { name: string; closingDay: number; dueDay: number }
export interface MonthRoom { key: string; free: number } // quanto sobra no mês sem a compra

const shiftKey = (key: string, n: number) => {
  const [y, m] = key.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return d.toISOString().slice(0, 7)
}
/** Em qual mês de fatura cai uma compra feita em `date` neste cartão. */
export function firstInvoice(card: CardRule, date: string) {
  const key = date.slice(0, 7); const day = Number(date.slice(8, 10))
  const closeKey = day > card.closingDay ? shiftKey(key, 1) : key
  return card.dueDay > card.closingDay ? closeKey : shiftKey(closeKey, 1)
}

export interface Simulation {
  perInstallment: number
  months: { key: string; parcel: number; freeBefore: number; freeAfter: number; tight: boolean }[]
  tightMonths: number
  verdict: "tranquilo" | "aperta" | "nao-cabe"
}

/** Distribui as parcelas a partir da primeira fatura e compara com o que sobra em cada mês. */
export function simulate(total: number, n: number, card: CardRule, today: string, room: MonthRoom[]): Simulation {
  const cents = Math.round(total * 100); const base = Math.floor(cents / n); const rest = cents - base * n
  const first = firstInvoice(card, today)
  const months = Array.from({ length: n }, (_, i) => {
    const key = shiftKey(first, i)
    const parcel = (base + (i < rest ? 1 : 0)) / 100
    const freeBefore = room.find((r) => r.key === key)?.free ?? room[room.length - 1]?.free ?? 0
    const freeAfter = Math.round((freeBefore - parcel) * 100) / 100
    return { key, parcel, freeBefore, freeAfter, tight: freeAfter < freeBefore * 0.2 }
  })
  const tightMonths = months.filter((m) => m.tight).length
  const verdict = months.some((m) => m.freeAfter < 0) ? "nao-cabe" : tightMonths ? "aperta" : "tranquilo"
  return { perInstallment: base / 100 + (rest ? 0.01 : 0), months, tightMonths, verdict }
}

/** Compara algumas opções de parcelamento para a mesma compra. */
export function compareOptions(total: number, card: CardRule, today: string, room: MonthRoom[], options = [1, 3, 6, 10, 12]) {
  return options.map((n) => ({ n, sim: simulate(total, n, card, today, room) }))
}
