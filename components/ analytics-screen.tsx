"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { useFinance } from "@/lib/finance-context"
import { formatCurrency, getMonthName } from "@/lib/format"
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react"

export function AnalyticsScreen() {
  const { state, getMonthStats } = useFinance()
  const { income, expense } = getMonthStats()

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const now = new Date()
    const monthTxs = state.transactions.filter(t => {
      const d = new Date(t.date + "T00:00:00")
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === "expense"
    })

    const byCategory: Record<string, number> = {}
    monthTxs.forEach(tx => {
      byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount
    })

    const sorted = Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

    const maxAmount = sorted[0]?.amount || 1
    return sorted.map(item => ({
      ...item,
      percentage: (item.amount / maxAmount) * 100,
    }))
  }, [state.transactions])

  // Last 4 months history
  const monthHistory = useMemo(() => {
    const months: { date: Date; income: number; expense: number }[] = []
    const now = new Date()

    for (let i = 3; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const txs = state.transactions.filter(t => {
        const d = new Date(t.date + "T00:00:00")
        return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
      })
      const income = txs.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0)
      const expense = txs.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0)
      months.push({ date, income, expense })
    }

    return months
  }, [state.transactions])

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <header className="pt-12 px-5 mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          Visão geral
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Análise
        </h1>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative overflow-hidden rounded-xl bg-card border border-success/20 p-4"
        >
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-success/10 rounded-full blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowUpRight className="w-3.5 h-3.5 text-success" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Receitas
              </span>
            </div>
            <p className="font-mono text-lg font-medium text-success tabular-nums">
              {formatCurrency(income)}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-xl bg-card border border-destructive/20 p-4"
        >
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-destructive/10 rounded-full blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowDownRight className="w-3.5 h-3.5 text-destructive" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Despesas
              </span>
            </div>
            <p className="font-mono text-lg font-medium text-destructive tabular-nums">
              {formatCurrency(expense)}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      <section className="px-5 mb-6">
        <div className="rounded-xl bg-card border border-border p-4">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
            Por categoria
          </h2>
          
          {categoryBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma despesa registrada
            </p>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((item, i) => (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs text-muted-foreground w-24 truncate">
                    {item.category}
                  </span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.05 }}
                      className="h-full rounded-full bg-destructive"
                    />
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground w-20 text-right tabular-nums">
                    {formatCurrency(item.amount)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Month History */}
      <section className="px-5">
        <div className="rounded-xl bg-card border border-border p-4">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
            Últimos 4 meses
          </h2>
          
          <div className="space-y-2">
            {monthHistory.map((month, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <span className="text-sm text-muted-foreground capitalize">
                  {month.date.toLocaleDateString("pt-BR", { month: "short" })}
                </span>
                <div className="flex gap-4">
                  <span className="font-mono text-xs text-success tabular-nums">
                    +{formatCurrency(month.income)}
                  </span>
                  <span className="font-mono text-xs text-destructive tabular-nums">
                    -{formatCurrency(month.expense)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
