"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useFinance } from "@/lib/finance-context"
import { formatCurrency } from "@/lib/format"

export function OnboardingScreen() {
  const { setUser, completeOnboarding } = useFinance()
  const [name, setName] = useState("")

  const handleStart = () => {
    if (name.trim()) {
      setUser(name.trim())
      completeOnboarding()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full text-center">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl font-bold text-primary-foreground mb-4"
        >
          Fluxo
        </motion.h1>
        <motion.p
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-primary-foreground/80 mb-8"
        >
          Gerencie suas finanças de forma simples e elegante
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleStart()}
            placeholder="Qual é seu nome?"
            className="w-full px-4 py-3 rounded-xl bg-white/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-white/40"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            disabled={!name.trim()}
            className="w-full py-3 rounded-xl bg-white text-primary font-semibold disabled:opacity-50 transition-all"
          >
            Começar
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  )
}
