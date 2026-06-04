"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useFinance, type Transaction } from "@/lib/finance-context"
import { TransactionItem } from "@/components/transaction-item"
import { LayoutGrid, Wallet, Plus } from "lucide-react"

type FilterType = "all" | "income" | "expense"

interface TransactionsScreenProps {
  onEdit: (tx: Transaction) => void
  onDelete: (id: number) => void
  onOpenNewTransaction: () => void
}

export function TransactionsScreen({ onEdit, onDelete, onOpenNewTransaction }: TransactionsScreenProps) {
  const { getMonthTransactions } = useFinance()
  const [filter, setFilter] = useState<FilterType>("all")

  const transactions = getMonthTransactions()
  const filtered = filter === "all" 
    ? transactions 
    : transactions.filter(t => t.type === filter)
  
  const sorted = [...filtered].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "income", label: "Receitas" },
    { key: "expense", label: "Despesas" },
  ]

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <header className="pt-12 px-5 mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          Este mês
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Lançamentos
        </h1>
      </header>

      {/* Filter */}
      <div className="px-5 mb-4">
        <div className="grid grid-cols-3 gap-2">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`py-2.5 px-3 text-xs font-medium rounded-lg border transition-all ${
                filter === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <section className="px-5">
        {sorted.length === 0 ? (
          <div className="rounded-xl bg-card border border-border">
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                <LayoutGrid className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Nada aqui
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Nenhum lançamento nessa categoria
              </p>
              <button
                onClick={onOpenNewTransaction}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Novo lançamento
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-card border border-border overflow-hidden divide-y divide-border">
            {sorted.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <TransactionItem
                  transaction={tx}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
