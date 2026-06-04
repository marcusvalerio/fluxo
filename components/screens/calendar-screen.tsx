"use client"

import { motion } from "framer-motion"
import { useFinance } from "@/lib/finance-context"
import { Calendar, Plus } from "lucide-react"
import { getDaysInMonth, getFirstDayOfMonth } from "@/lib/format"

interface CalendarScreenProps {
  onOpenNewTransaction: (date: string) => void
}

export function CalendarScreen({ onOpenNewTransaction }: CalendarScreenProps) {
  const { state } = useFinance()
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDay }, (_, i) => i)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-32"
    >
      <div className="px-6 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Calendário</h1>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="grid grid-cols-7 gap-2">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {blanks.map((_, i) => (
              <div key={`blank-${i}`} />
            ))}

            {days.map((day) => {
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const txCount = state.transactions.filter((t) => t.date === dateStr).length

              return (
                <motion.button
                  key={day}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onOpenNewTransaction(dateStr)}
                  className="aspect-square flex flex-col items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors relative"
                >
                  <span className="text-sm font-semibold">{day}</span>
                  {txCount > 0 && (
                    <span className="text-xs text-accent font-bold">{txCount}</span>
                  )}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
