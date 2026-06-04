"use client"

import { motion } from "framer-motion"
import { useFinance } from "@/lib/finance-context"
import { formatCurrency, getGreeting } from "@/lib/format"
import { TransactionItem } from "../transaction-item"

interface HomeScreenProps {
  onOpenNewTransaction: (date?: string) => void
  onOpenLimitModal: () => void
}

export function HomeScreen({ onOpenNewTransaction, onOpenLimitModal }: HomeScreenProps) {
  const { state, getMonthStats } = useFinance()
  const stats = getMonthStats()
  const recentTransactions = state.transactions.slice(-5).reverse()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-32"
    >
      {/* Header */}
      <div className="px-6 py-8">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl font-bold text-foreground mb-2"
        >
          {getGreeting()}, {state.user}!
        </motion.h1>
        <p className="text-muted-foreground">Acompanhe suas finanças</p>
      </div>

      {/* Stats Cards */}
      <div className="px-6 space-y-3 mb-8">
        {/* Balance */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-gradient-to-r from-accent to-accent/80 rounded-2xl text-accent-foreground"
        >
          <p className="text-sm font-semibold opacity-80 mb-1">Saldo</p>
          <p className="text-3xl font-bold font-mono">{formatCurrency(stats.balance)}</p>
        </motion.div>

        {/* Income and Expense */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-success/10 border border-success/20 rounded-2xl"
          >
            <p className="text-xs font-semibold text-success/80 mb-2">Entradas</p>
            <p className="text-xl font-bold text-success font-mono">{formatCurrency(stats.income)}</p>
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl"
          >
            <p className="text-xs font-semibold text-destructive/80 mb-2">Saídas</p>
            <p className="text-xl font-bold text-destructive font-mono">{formatCurrency(stats.expense)}</p>
          </motion.div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Recentes</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onOpenNewTransaction()}
            className="text-accent font-semibold text-sm"
          >
            Ver tudo
          </motion.button>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border"
        >
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} compact />
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              Nenhuma transação ainda
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
