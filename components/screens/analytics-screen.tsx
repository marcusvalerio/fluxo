"use client"

import { motion } from "framer-motion"
import { useFinance } from "@/lib/finance-context"
import { TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/format"

export function AnalyticsScreen() {
  const { state, getMonthStats } = useFinance()
  const stats = getMonthStats()

  const expenseByCategory = state.transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      },
      {} as Record<string, number>
    )

  const topExpenses = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-32"
    >
      <div className="px-6 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Análise</h1>

        {/* Summary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="space-y-3 mb-8"
        >
          <div className="p-4 bg-success/10 border border-success/20 rounded-2xl">
            <p className="text-xs font-semibold text-success/80 mb-1">Total de Entradas</p>
            <p className="text-2xl font-bold text-success font-mono">{formatCurrency(stats.income)}</p>
          </div>
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
            <p className="text-xs font-semibold text-destructive/80 mb-1">Total de Saídas</p>
            <p className="text-2xl font-bold text-destructive font-mono">{formatCurrency(stats.expense)}</p>
          </div>
        </motion.div>

        {/* Top Expenses */}
        {topExpenses.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Despesas por Categoria
            </h2>

            <div className="space-y-3">
              {topExpenses.map(([category, amount], index) => {
                const percentage = (amount / stats.expense) * 100
                return (
                  <motion.div
                    key={category}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{category}</span>
                      <span className="text-sm font-bold text-destructive">{formatCurrency(amount)}</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-destructive"
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
