"use client"

import { motion } from "framer-motion"
import { useFinance, type Transaction } from "@/lib/finance-context"
import { TransactionItem } from "../transaction-item"

interface TransactionsScreenProps {
  onEdit: (tx: Transaction) => void
  onDelete: (id: number) => void
  onOpenNewTransaction: (date?: string) => void
}

export function TransactionsScreen({
  onEdit,
  onDelete,
  onOpenNewTransaction,
}: TransactionsScreenProps) {
  const { state } = useFinance()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-32"
    >
      <div className="px-6 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Histórico</h1>

        {state.transactions.length > 0 ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border"
          >
            {[...state.transactions].reverse().map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            <p>Nenhuma transação registrada</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
