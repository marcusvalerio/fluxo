"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useFinance, type Transaction } from "@/lib/finance-context"
import { formatCurrency, formatDate } from "@/lib/format"
import { ArrowUpRight, ArrowDownRight, Pencil, Trash2, ChevronRight } from "lucide-react"

interface TransactionItemProps {
  transaction: Transaction
  compact?: boolean
  onEdit?: (tx: Transaction) => void
  onDelete?: (id: number) => void
}

export function TransactionItem({ transaction, compact = false, onEdit, onDelete }: TransactionItemProps) {
  const [expanded, setExpanded] = useState(false)
  const isIncome = transaction.type === "income"

  const handleClick = () => {
    if (!compact) {
      setExpanded(!expanded)
    }
  }

  return (
    <motion.div
      layout
      onClick={handleClick}
      whileHover={!compact ? { backgroundColor: "var(--secondary)" } : {}}
      className={`flex items-center gap-3 px-4 py-3.5 ${
        !compact ? "cursor-pointer active:bg-secondary/80" : ""
      } transition-colors`}
    >
      {/* Icon with animated background */}
      <motion.div 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isIncome ? "bg-gradient-to-br from-success/20 to-success/5" : "bg-gradient-to-br from-destructive/20 to-destructive/5"
        }`}
      >
        {/* Glow */}
        <div className={`absolute inset-0 rounded-xl ${
          isIncome ? "bg-success/10" : "bg-destructive/10"
        } blur-md`} />
        
        {isIncome ? (
          <ArrowUpRight className="w-4 h-4 text-success relative z-10" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-destructive relative z-10" />
        )}
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {transaction.desc}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
            isIncome ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}>
            {transaction.category}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatDate(transaction.date)}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2">
        <p className={`font-mono text-sm font-bold tabular-nums whitespace-nowrap ${
          isIncome ? "text-success" : "text-destructive"
        }`}>
          {isIncome ? "+" : "-"}{formatCurrency(transaction.amount)}
        </p>
        
        {!compact && (
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        )}
      </div>

      {/* Action buttons */}
      <AnimatePresence>
        {expanded && !compact && (
          <motion.div
            initial={{ opacity: 0, width: 0, marginLeft: 0 }}
            animate={{ opacity: 1, width: "auto", marginLeft: 8 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
            className="flex gap-2 overflow-hidden"
          >
            {onEdit && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(transaction)
                }}
                className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center hover:bg-accent/20 transition-colors border border-accent/20"
              >
                <Pencil className="w-4 h-4 text-accent" />
              </motion.button>
            )}
            {onDelete && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(transaction.id)
                }}
                className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors border border-destructive/20"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
