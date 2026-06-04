"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useFinance, type Goal } from "@/lib/finance-context"
import { X } from "lucide-react"

interface GoalModalProps {
  isOpen: boolean
  onClose: () => void
  editingGoal?: Goal | null
}

export function GoalModal({ isOpen, onClose, editingGoal }: GoalModalProps) {
  const { addGoal, updateGoal } = useFinance()
  
  const [name, setName] = useState("")
  const [total, setTotal] = useState("")
  const [saved, setSaved] = useState("")

  useEffect(() => {
    if (isOpen) {
      if (editingGoal) {
        setName(editingGoal.name)
        setTotal(String(editingGoal.total))
        setSaved(String(editingGoal.saved))
      } else {
        setName("")
        setTotal("")
        setSaved("")
      }
    }
  }, [isOpen, editingGoal])

  const handleSubmit = () => {
    if (!name.trim()) return
    const totalNum = parseFloat(total)
    const savedNum = parseFloat(saved) || 0
    if (isNaN(totalNum) || totalNum <= 0) return

    if (editingGoal) {
      updateGoal(editingGoal.id, { name: name.trim(), total: totalNum, saved: savedNum })
    } else {
      addGoal({ name: name.trim(), total: totalNum, saved: savedNum })
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300]"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl border-t border-border z-[301] safe-bottom"
          >
            <div className="p-6">
              {/* Handle */}
              <div className="w-9 h-1 bg-border rounded-full mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-bold text-foreground">
                  {editingGoal ? "Editar Meta" : "Nova Meta"}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  Nome da meta
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Viagem para Europa"
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>

              {/* Total */}
              <div className="mb-4">
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  Valor total (R$)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder="Ex: 5000"
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all font-mono tabular-nums"
                />
              </div>

              {/* Saved */}
              <div className="mb-6">
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  Já guardou? (R$)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={saved}
                  onChange={(e) => setSaved(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all font-mono tabular-nums"
                />
              </div>

              {/* Submit */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="w-full py-4 text-base font-medium text-primary-foreground bg-primary rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
              >
                {editingGoal ? "Atualizar" : "Criar meta"}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
