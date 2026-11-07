export type Kind = "income" | "expense"

export interface Tx {
  id: number
  kind: Kind
  amount: number
  description: string
  category: string
  date: string // YYYY-MM-DD
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

export interface Space {
  id: string
  name: string
  limit: number
  onboarded: boolean
}

export interface Snapshot {
  space: Space
  user: { name: string; email: string; role: "admin" | "user"; mustChangePassword: boolean }
  txs: Tx[]
  goals: Goal[]
  bills: Bill[]
  today: string
}
