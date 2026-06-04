"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useFinance, type Transaction } from "@/lib/finance-context"
import { X, ArrowUpRight, ArrowDownRight, Sparkles, Calendar, Tag, FileText, Check } from "lucide-react"

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  editingTransaction?: Transaction | null
  prefilledDate?: string | null
}

export function TransactionModal({ isOpen, onClose, editingTransaction, prefilledDate }: TransactionModalProps) {
  const { incomeCategories, expenseCategories, addTransaction, updateTransaction } = useFinance()
  
  const [type, setType] = useState<"income" | "expense">("income")
  const [amount, setAmount] = useState("")
  const [desc, setDesc] = useState("")
  const [category, setCategory] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type)
      setAmount(String(editingTransaction.amount))
      setDesc(editingTransaction.desc)
      setCategory(editingTransaction.category)
      setDate(editingTransaction.date)
    } else {
      setType("expense")
      setAmount("")
      setDesc("")
      setCategory("")
      setDate(prefilledDate || new Date().toISOString().split("T")[0])
    }
  }, [editingTransaction, prefilledDate, isOpen])

  const categories = type === "income" ? incomeCategories : expenseCategories

  const handleSubmit = () => {
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) return
    if (!date) return

    const txData = {
      type,
      amount: amountNum,
      desc: desc || category || "Lancamento",
      category: category || "Outro",
      date,
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, txData)
    } else {
      addTransaction(txData)
    }

    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300]"
          />

          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.5 }}
            transition={{ type: "spring", damping: 35, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-[2rem] border-t border-border z-[301] max-h-[92vh] overflow-y-auto safe-bottom"
          >
            {/* Decorative glow */}
            <div className={`absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-20 rounded-full blur-3xl pointer-events-none ${
              type === "income" ? "bg-success/20" : "bg-destructive/20"
            }`} />

            <div className="relative p-6 pb-8">
              {/* Handle */}
              <div className="w-10 h-1.5 bg-border rounded-full mx-auto mb-5" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Sparkles className="w-5 h-5 text-accent" />
                  </motion.div>
                  <h2 className="font-heading text-xl font-bold text-foreground">
                    {editingTransaction ? "Editar" : "Novo Lancamento"}
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Type Toggle */}
              <div className="relative grid grid-cols-2 gap-1 p-1.5 bg-secondary/80 rounded-2xl mb-8">
                <motion.div
                  layoutId="type-indicator"
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-4px)] rounded-xl ${
                    type === "income" ? "bg-success/20 left-1.5" : "bg-destructive/20 right-1.5 left-auto"
                  }`}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
                <button
                  onClick={() => setType("income")}
                  className={`relative flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-colors z-10 ${
                    type === "income" ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Entrada
                </button>
                <button
                  onClick={() => setType("expense")}
                  className={`relative flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-colors z-10 ${
                    type === "expense" ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  Saida
                </button>
              </div>

              {/* Amount */}
              <div className="mb-8">
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
                  <span className="w-5 h-5 rounded-md bg-accent/10 flex items-center justify-center">
                    <span className="text-accent font-bold">R$</span>
                  </span>
                  Valor
                </label>
                <div className="relative">
                  <motion.div
                    animate={{ opacity: amount ? 1 : 0 }}
                    className={`absolute -inset-1 rounded-2xl blur-sm ${
                      type === "income" ? "bg-success/20" : "bg-destructive/20"
                    }`}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className={`relative w-full font-mono text-5xl font-bold text-center bg-secondary/50 rounded-2xl border-2 py-6 placeholder:text-muted-foreground/30 focus:outline-none transition-all tabular-nums ${
                      type === "income" 
                        ? "border-success/30 focus:border-success text-success" 
                        : "border-destructive/30 focus:border-destructive text-destructive"
                    }`}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-5">
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  <FileText className="w-4 h-4" />
                  Descricao
                </label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Ex: Almoco, Salario..."
                  className="w-full px-4 py-3.5 bg-secondary/50 border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-all"
                />
              </div>

              {/* Category */}
              <div className="mb-5">
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
                  <Tag className="w-4 h-4" />
                  Categoria
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat, index) => (
                    <motion.button
                      key={cat}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCategory(cat)}
                      className={`relative px-4 py-2.5 text-xs font-semibold rounded-xl border-2 transition-all ${
                        category === cat
                          ? "bg-accent/15 border-accent text-accent"
                          : "bg-secondary/50 border-border text-muted-foreground hover:border-accent/50"
                      }`}
                    >
                      {category === cat && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center"
                        >
                          <Check className="w-2.5 h-2.5 text-accent-foreground" />
                        </motion.span>
                      )}
                      {cat}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div className="mb-8">
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  Data
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3.5 bg-secondary/50 border-2 border-border rounded-xl text-foreground focus:outline-none focus:border-accent transition-all"
                />
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!amount || parseFloat(amount) <= 0}
                className="relative w-full py-4 text-base font-bold rounded-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {/* Animated gradient */}
                <motion.div
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className={`absolute inset-0 bg-[length:200%_100%] ${
                    type === "income"
                      ? "bg-gradient-to-r from-success via-accent to-success"
                      : "bg-gradient-to-r from-accent via-success to-accent"
                  }`}
                />
                <div className="absolute inset-0 shine" />
                <span className="relative flex items-center justify-center gap-2 text-accent-foreground">
                  <Sparkles className="w-4 h-4" />
                  {editingTransaction ? "Atualizar" : "Salvar lancamento"}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
