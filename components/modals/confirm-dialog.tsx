"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  variant?: "danger" | "warning" | "default"
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const colors = {
    danger: "bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20",
    warning: "bg-warning/10 border-warning/20 text-warning hover:bg-warning/20",
    default: "bg-accent/10 border-accent/20 text-accent hover:bg-accent/20",
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[400]"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-card rounded-2xl border border-border z-[401] p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
              <button
                onClick={onCancel}
                className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-6">{message}</p>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
              >
                {cancelLabel}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors ${colors[variant]}`}
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
