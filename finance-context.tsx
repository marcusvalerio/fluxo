"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"

export interface Transaction {
  id: number
  type: "income" | "expense"
  amount: number
  desc: string
  category: string
  date: string
}

export interface Goal {
  id: number
  name: string
  total: number
  saved: number
}

export interface FixedBill {
  id: number
  name: string
  amount: number
  dueDay: number
  paid: boolean
}

export interface FinanceState {
  user: string
  limit: number
  transactions: Transaction[]
  goals: Goal[]
  fixedBills: FixedBill[]
  onboarded: boolean
}

const INCOME_CATEGORIES = ["Salário", "Freelance", "Projeto", "Venda", "Investimento", "Outro"]
const EXPENSE_CATEGORIES = ["Moradia", "Alimentação", "Transporte", "Saúde", "Lazer", "Roupa", "Assinatura", "Educação", "Pet", "Outro"]

interface FinanceContextType {
  state: FinanceState
  incomeCategories: string[]
  expenseCategories: string[]
  addTransaction: (tx: Omit<Transaction, "id">) => void
  updateTransaction: (id: number, tx: Partial<Transaction>) => void
  deleteTransaction: (id: number) => void
  addGoal: (goal: Omit<Goal, "id">) => void
  updateGoal: (id: number, goal: Partial<Goal>) => void
  deleteGoal: (id: number) => void
  addFixedBill: (bill: Omit<FixedBill, "id" | "paid">) => void
  updateFixedBill: (id: number, bill: Partial<FixedBill>) => void
  deleteFixedBill: (id: number) => void
  toggleBillPaid: (id: number) => void
  setUser: (name: string) => void
  setLimit: (limit: number) => void
  completeOnboarding: () => void
  getMonthTransactions: (date?: Date) => Transaction[]
  getMonthStats: (date?: Date) => { income: number; expense: number; balance: number }
  getDayTransactions: (date: Date) => Transaction[]
}

const defaultState: FinanceState = {
  user: "",
  limit: 0,
  transactions: [],
  goals: [],
  fixedBills: [],
  onboarded: false,
}

const FinanceContext = createContext<FinanceContextType | null>(null)

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("fluxo_data")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setState({ ...defaultState, ...parsed })
      } catch {
        setState(defaultState)
      }
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("fluxo_data", JSON.stringify(state))
    }
  }, [state, isLoaded])

  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    setState(prev => ({
      ...prev,
      transactions: [...prev.transactions, { ...tx, id: Date.now() }]
    }))
  }, [])

  const updateTransaction = useCallback((id: number, tx: Partial<Transaction>) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === id ? { ...t, ...tx } : t)
    }))
  }, [])

  const deleteTransaction = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }))
  }, [])

  const addGoal = useCallback((goal: Omit<Goal, "id">) => {
    setState(prev => ({
      ...prev,
      goals: [...prev.goals, { ...goal, id: Date.now() }]
    }))
  }, [])

  const updateGoal = useCallback((id: number, goal: Partial<Goal>) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, ...goal } : g)
    }))
  }, [])

  const deleteGoal = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id)
    }))
  }, [])

  const addFixedBill = useCallback((bill: Omit<FixedBill, "id" | "paid">) => {
    setState(prev => ({
      ...prev,
      fixedBills: [...prev.fixedBills, { ...bill, id: Date.now(), paid: false }]
    }))
  }, [])

  const updateFixedBill = useCallback((id: number, bill: Partial<FixedBill>) => {
    setState(prev => ({
      ...prev,
      fixedBills: prev.fixedBills.map(b => b.id === id ? { ...b, ...bill } : b)
    }))
  }, [])

  const deleteFixedBill = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      fixedBills: prev.fixedBills.filter(b => b.id !== id)
    }))
  }, [])

  const toggleBillPaid = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      fixedBills: prev.fixedBills.map(b => b.id === id ? { ...b, paid: !b.paid } : b)
    }))
  }, [])

  const setUser = useCallback((name: string) => {
    setState(prev => ({ ...prev, user: name }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setState(prev => ({ ...prev, limit }))
  }, [])

  const completeOnboarding = useCallback(() => {
    setState(prev => ({ ...prev, onboarded: true }))
  }, [])

  const getMonthTransactions = useCallback((date?: Date) => {
    const d = date || new Date()
    return state.transactions.filter(t => {
      const txDate = new Date(t.date + "T00:00:00")
      return txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear()
    })
  }, [state.transactions])

  const getMonthStats = useCallback((date?: Date) => {
    const txs = getMonthTransactions(date)
    const income = txs.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0)
    const expense = txs.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0)
    return { income, expense, balance: income - expense }
  }, [getMonthTransactions])

  const getDayTransactions = useCallback((date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return state.transactions.filter(t => t.date === dateStr)
  }, [state.transactions])

  if (!isLoaded) {
    return null
  }

  return (
    <FinanceContext.Provider value={{
      state,
      incomeCategories: INCOME_CATEGORIES,
      expenseCategories: EXPENSE_CATEGORIES,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addGoal,
      updateGoal,
      deleteGoal,
      addFixedBill,
      updateFixedBill,
      deleteFixedBill,
      toggleBillPaid,
      setUser,
      setLimit,
      completeOnboarding,
      getMonthTransactions,
      getMonthStats,
      getDayTransactions,
    }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider")
  return ctx
}
