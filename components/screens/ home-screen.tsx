"use client"

import { motion } from "framer-motion"
import { useFinance } from "@/lib/finance-context"
import { formatCurrency, getGreeting } from "@/lib/format"
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, Plus, Sparkles, Shield } from "lucide-react"
import { TransactionItem } from "@/components/transaction-item"

interface HomeScreenProps {
  onOpenNewTransaction: () => void
  onOpenLimitModal: () => void
}

export function HomeScreen({ onOpenNewTransaction, onOpenLimitModal }: HomeScreenProps) {
  const { state, getMonthStats, getMonthTransactions } = useFinance()
  const { income, expense, balance } = getMonthStats()
  
  const recentTransactions = [...getMonthTransactions()]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const limitProgress = state.limit > 0 ? Math.min(100, (expense / state.limit) * 100) : 0
  const remainingLimit = state.limit - expense

  const getBalanceStatus = () => {
    if (balance > income * 0.3) return { label: "Excelente", color: "text-success" }
    if (balance > 0) return { label: "Saudavel", color: "text-warning" }
    return { label: "Atencao", color: "text-destructive" }
  }

  const balanceStatus = getBalanceStatus()

  return (
    <div className="flex flex-col gap-5 pb-28">
      {/* Header with greeting */}
      <header className="pt-14 px-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between"
        >
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              {getGreeting()}
            </p>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              {state.user || "Visitante"}
            </h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenLimitModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent bg-accent/10 rounded-full border border-accent/20 hover:bg-accent/15 transition-colors"
          >
            <Shield className="w-3 h-3" />
            Limite
          </motion.button>
        </motion.div>
      </header>

      {/* Hero Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-5"
      >
        <div className="relative overflow-hidden rounded-3xl p-6 gradient-border">
          {/* Animated background shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-20 -right-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-10 -left-10 w-32 h-32 bg-success/15 rounded-full blur-2xl"
            />
          </div>
          
          <div className="relative">
            {/* Balance label with status */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                </motion.div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Saldo atual
                </span>
              </div>
              <span className={`text-xs font-semibold ${balanceStatus.color}`}>
                {balanceStatus.label}
              </span>
            </div>
            
            {/* Balance amount */}
            <motion.p 
              key={balance}
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`font-mono text-5xl font-bold tracking-tighter tabular-nums ${
                balance < 0 ? "text-destructive" : balance > 0 ? "text-foreground" : "text-foreground"
              }`}
            >
              {formatCurrency(balance)}
            </motion.p>

            {/* Limit progress */}
            {state.limit > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-5 p-3 bg-secondary/50 rounded-xl"
              >
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    Limite do mes
                  </span>
                  <span className={`font-mono font-semibold tabular-nums ${
                    remainingLimit < 0 ? "text-destructive" : "text-foreground"
                  }`}>
                    {formatCurrency(remainingLimit)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${limitProgress}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className={`h-full rounded-full relative overflow-hidden ${
                      limitProgress >= 90 ? "bg-destructive" : limitProgress >= 70 ? "bg-warning" : "bg-accent"
                    }`}
                  >
                    <div className="absolute inset-0 shine" />
                  </motion.div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {limitProgress.toFixed(0)}% do limite utilizado
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 px-5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20 p-4 cursor-pointer"
        >
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -top-4 -right-4 w-16 h-16 bg-success/20 rounded-full blur-xl"
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-success/20 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-success" />
              </div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Entradas
              </span>
            </div>
            <motion.p 
              key={income}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className="font-mono text-xl font-bold text-success tabular-nums"
            >
              {formatCurrency(income)}
            </motion.p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20 p-4 cursor-pointer"
        >
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            className="absolute -top-4 -right-4 w-16 h-16 bg-destructive/20 rounded-full blur-xl"
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-destructive/20 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 text-destructive" />
              </div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Saidas
              </span>
            </div>
            <motion.p 
              key={expense}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className="font-mono text-xl font-bold text-destructive tabular-nums"
            >
              {formatCurrency(expense)}
            </motion.p>
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <section className="px-5">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mb-3"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">
              Movimentacoes recentes
            </h2>
          </div>
          {recentTransactions.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {recentTransactions.length} itens
            </span>
          )}
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl bg-card border border-border overflow-hidden"
        >
          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-success/10 flex items-center justify-center mb-4"
              >
                <Wallet className="w-7 h-7 text-accent" />
              </motion.div>
              <p className="text-base font-semibold text-foreground mb-1">
                Nenhuma movimentacao
              </p>
              <p className="text-sm text-muted-foreground mb-5 max-w-[200px]">
                Comece adicionando sua primeira receita ou despesa
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenNewTransaction}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-accent-foreground bg-gradient-to-r from-accent to-success rounded-xl shadow-lg shadow-accent/25"
              >
                <Plus className="w-4 h-4" />
                Novo lancamento
              </motion.button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentTransactions.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                >
                  <TransactionItem transaction={tx} compact />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </section>
    </div>
  )
}
