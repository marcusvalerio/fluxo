"use client"

import { Plus, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

interface FloatingActionButtonProps {
  onClick: () => void
  visible?: boolean
}

export function FloatingActionButton({ onClick, visible = true }: FloatingActionButtonProps) {
  if (!visible) return null

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0, rotate: -180 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: 0, opacity: 0, rotate: 180 }}
      whileHover={{ scale: 1.1, rotate: 90 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed right-5 bottom-24 w-14 h-14 rounded-2xl flex items-center justify-center z-40 group overflow-hidden"
    >
      {/* Animated gradient background */}
      <motion.div
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-accent via-success to-accent bg-[length:200%_100%]"
      />
      
      {/* Glow effect */}
      <div className="absolute inset-0 glow-accent opacity-50" />
      
      {/* Shine overlay */}
      <div className="absolute inset-0 shine" />
      
      {/* Floating sparkles */}
      <motion.div
        animate={{ y: [-2, 2, -2], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute -top-1 -right-1"
      >
        <Sparkles className="w-3 h-3 text-white/60" />
      </motion.div>
      
      {/* Plus icon */}
      <Plus className="w-6 h-6 text-accent-foreground relative z-10 transition-transform group-hover:rotate-90" />
    </motion.button>
  )
}
