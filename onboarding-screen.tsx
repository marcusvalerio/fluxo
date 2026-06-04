"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useFinance } from "@/lib/finance-context"
import { Sparkles, ArrowRight, Zap } from "lucide-react"

export function OnboardingScreen() {
  const [name, setName] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const { setUser, completeOnboarding } = useFinance()

  const handleEnter = (anonymous = false) => {
    setUser(anonymous ? "Visitante" : name.trim() || "Visitante")
    completeOnboarding()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 overflow-hidden relative">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-success/15 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            y: [0, -40, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-warning/10 rounded-full blur-2xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm flex flex-col gap-10 relative z-10"
      >
        {/* Brand */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block"
          >
            <h1 className="font-heading text-6xl font-black tracking-tighter gradient-text">
              fluxo
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center justify-center gap-2 mt-2"
          >
            <Zap className="w-3 h-3 text-accent" />
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-medium">
              Controle Financeiro
            </p>
            <Zap className="w-3 h-3 text-accent" />
          </motion.div>
        </motion.div>

        {/* Question */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <p className="text-2xl font-medium text-foreground leading-snug">
              Como podemos te chamar?
            </p>
            <p className="text-sm text-muted-foreground">
              Personalize sua experiencia no app
            </p>
          </div>

          <div className="relative">
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute -inset-1 bg-gradient-to-r from-accent/20 via-success/20 to-accent/20 rounded-2xl blur-sm"
                />
              )}
            </AnimatePresence>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Seu nome ou apelido"
              maxLength={24}
              className="relative w-full px-5 py-4 text-lg bg-card border-2 border-border rounded-2xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent transition-all duration-300"
            />
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleEnter(false)}
            className="group relative w-full py-4 text-base font-semibold rounded-2xl overflow-hidden"
          >
            {/* Animated gradient background */}
            <motion.div
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-accent via-success to-accent bg-[length:200%_100%]"
            />
            {/* Shine effect */}
            <div className="absolute inset-0 shine" />
            {/* Content */}
            <span className="relative flex items-center justify-center gap-2 text-accent-foreground">
              <Sparkles className="w-4 h-4" />
              Comecar agora
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => handleEnter(true)}
            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-secondary/50"
          >
            Continuar como visitante
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center justify-center gap-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <p className="text-xs text-muted-foreground">
            100% offline - seus dados ficam no seu dispositivo
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
