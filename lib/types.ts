export type Kind = "income" | "expense"

export interface Tx {
  id: number
  kind: Kind
  amount: number
  description: string
  category: string
  date: string // YYYY-MM-DD
  cardId: number | null
  installment: { no: number; total: number } | null
}

export interface Goal {
  id: number
  name: string
  target: number
  saved: number
  emoji: string
  deadline: string | null
}

export interface Bill {
  id: number
  name: string
  amount: number
  dueDay: number
  category: string
  paid: boolean
}

export interface Card {
  id: number
  name: string
  closingDay: number
  dueDay: number
  limit: number
}

export interface Subscription {
  id: number
  name: string
  amount: number
  billingDay: number
  cycle: "monthly" | "yearly"
  billingMonth: number | null
  cardId: number | null
  /** cobra neste mês (mensal sempre; anual só no mês dela) */
  dueThisMonth: boolean
  paid: boolean
}

/** Plano do mês, em porcentagens da renda. `goals` divide o que é guardado entre as metas (id da meta → %). */
export interface Plan {
  income: number
  fixed: number
  variable: number
  save: number
  goals: Record<string, number>
}

export interface Space {
  id: string
  name: string
  limit: number
  onboarded: boolean
  plan: Plan | null
}

/** Uma parte de uma entrada programada: dia fixo do mês ou N-ésimo dia útil. */
export interface EntradaParte { dia: number; util: boolean; valor: number; rotulo?: string }
export interface Entrada {
  id: number
  nome: string
  /** fixa: valor certo; varia: valor é uma média e a pessoa confirma quanto caiu */
  tipo: "fixa" | "varia"
  partes: EntradaParte[]
  perguntar: boolean
  /** chaves "YYYY-MM:parte" já confirmadas */
  recebidas: string[]
}

export interface Snapshot {
  space: Space
  user: { name: string; email: string; role: "admin" | "user"; mustChangePassword: boolean }
  txs: Tx[]
  goals: Goal[]
  bills: Bill[]
  cards: Card[]
  subs: Subscription[]
  limits: Record<string, number>
  entradas: Entrada[]
  today: string
}
