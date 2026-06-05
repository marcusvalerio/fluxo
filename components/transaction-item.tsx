"use client"

import { motion } from "framer-motion"
import { useFinance, type Transaction } from "@/lib/finance-context"
import { formatCurrency, formatDate } from "@/lib/format"
import { ChevronRight, Trash2 } from "lucide-react"

interface TransactionItemProps {
  transaction: Transaction
  compact?: boolean
  onEdit?: (tx: Transaction) => void
  onDelete?: (id: number) => void
}

const categoryIcons: Record<string, string> = {
  "Alimentação": "🍽️",
  "Transporte": "🚗",
  "Saúde": "💊",
  "Educação": "📚",
  "Lazer": "🎮",
  "Compras": "🛍️",
  "Trabalho": "💼",
  "Outro": "📌",
}

export function TransactionItem({
  transaction,
  compact = false,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const { state } = useFinance()
  const isIncome = transaction.type === "income"
  const sign = isIncome ? "+" : "-"
  const icon = categoryIcons[transaction.category] || "📌"

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
      className="p-4 flex items-center justify-between group hover:bg-secondary/30 transition-colors"
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <p className="font-medium text-foreground">{transaction.description}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(transaction.date)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p
            className={`font-bold font-mono ${
              isIncome ? "text-success" : "text-destructive"
            }`}
          >
            {sign} {formatCurrency(transaction.amount)}
          </p>
        </div>

        {!compact && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onEdit(transaction)}
                className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}
            {onDelete && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(transaction.id)}
                className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
