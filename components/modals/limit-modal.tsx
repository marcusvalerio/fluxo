"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useFinance } from "@/lib/finance-context"
import { X } from "lucide-react"

interface LimitModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LimitModal({ isOpen, onClose }: LimitModalProps) {
  const { state, setLimit } = useFinance()
  const [value, setValue] = useState("")

  useEffect(() => {
    if (isOpen) {
      setValue(state.limit > 0 ? String(state.limit) : "")
    }
  }, [isOpen, state.limit])

  const handleSubmit = () => {
    const limitNum = parseFloat(value)
    if (isNaN(limitNum) || limitNum < 0) return
    setLimit(limitNum)
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
                  Limite Mensal
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Defina um teto para suas despesas mensais e acompanhe o progresso.
              </p>

              {/* Value Input */}
              <div className="mb-6">
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  Limite de gastos (R$)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Ex: 3000"
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-transparent"
                />
              </div>

              {/* Submit */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="w-full py-4 text-base font-medium text-primary-foreground bg-primary rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
              >
                Salvar limite
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
