import { CATEGORIES } from "./finance"
import { addDays } from "./dates"
import type { Kind } from "./types"

const KEYWORDS: [RegExp, string][] = [
  [/ifood|delivery|rappi|pizza|hamb|lanche|sushi/i, "Delivery"],
  [/mercado|supermercado|feira|atacad|hortifruti/i, "Mercado"],
  [/almo[cç]o|jantar|caf[eé]|restaurante|padaria|comida|bar\b/i, "Alimentação"],
  [/uber|99|taxi|t[aá]xi|gasolina|combust|[oô]nibus|metr[oô]|estacionamento|ped[aá]gio/i, "Transporte"],
  [/aluguel|condom[ií]nio|iptu/i, "Moradia"],
  [/luz|energia|[aá]gua|internet|telefone|conta de celular|g[aá]s/i, "Contas"],
  [/farm[aá]cia|m[eé]dico|academia|dentista|rem[eé]dio|consulta/i, "Saúde"],
  [/cinema|show|viagem|passeio|jogo|festa|ingresso/i, "Lazer"],
  [/netflix|spotify|prime|disney|youtube|icloud|assinatura|hbo/i, "Assinaturas"],
  [/curso|livro|faculdade|escola|udemy/i, "Educação"],
  [/roupa|t[eê]nis|loja|shopping|amazon|presente pra/i, "Compras"],
  [/cart[aã]o|fatura/i, "Cartão"],
  [/sal[aá]rio|pagamento empresa/i, "Salário"],
  [/freela|freelance|projeto|cliente/i, "Freelance"],
  [/dividendo|rendimento|juros|invest/i, "Investimentos"],
  [/vendi|venda/i, "Vendas"],
]

const INCOME_HINT = /^\+|recebi|ganhei|sal[aá]rio|freela|entrada|dividendo|rendimento|vendi|pix recebido/i

export interface Parsed {
  kind: Kind
  amount: number | null
  description: string
  category: string
  date: string
}

/** "almoço 42,90 ontem" → despesa de R$ 42,90 em Alimentação, data de ontem. */
export function parseEntry(raw: string, today: string): Parsed {
  let s = " " + raw.trim() + " "
  let date = today
  const rel: [RegExp, number][] = [[/\banteontem\b/i, -2], [/\bontem\b/i, -1], [/\bhoje\b/i, 0], [/\bamanh[ãa]\b/i, 1]]
  for (const [re, n] of rel) if (re.test(s)) { date = addDays(today, n); s = s.replace(re, " ") }
  const dm = s.match(/\b(?:dia\s+)?(\d{1,2})\/(\d{1,2})\b/)
  if (dm) {
    const y = today.slice(0, 4)
    date = `${y}-${dm[2].padStart(2, "0")}-${dm[1].padStart(2, "0")}`
    s = s.replace(dm[0], " ")
  }

  let amount: number | null = null
  const am = s.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(k|mil)?/i)
  if (am) {
    let n = am[1]
    n = n.includes(",") ? n.replace(/\./g, "").replace(",", ".") : /\.\d{3}$/.test(n) ? n.replace(/\./g, "") : n
    amount = parseFloat(n) * (am[2] ? 1000 : 1)
    s = s.replace(am[0], " ")
  }

  const kind: Kind = INCOME_HINT.test(raw.trim()) ? "income" : "expense"
  let description = s.replace(/^\s*\+/, "").replace(/\b(gastei|paguei|recebi|ganhei|com|no|na|de|reais|r\$)\b/gi, " ").replace(/\s+/g, " ").trim()
  description = description ? description[0].toUpperCase() + description.slice(1) : kind === "income" ? "Entrada" : "Gasto"

  let category: string = "Outros"
  for (const [re, c] of KEYWORDS) if (re.test(raw)) { category = c; break }
  const allowed = CATEGORIES[kind] as readonly string[]
  if (!allowed.includes(category)) category = kind === "income" ? "Outros" : category === "Salário" ? "Outros" : category

  return { kind, amount, description, category, date }
}
