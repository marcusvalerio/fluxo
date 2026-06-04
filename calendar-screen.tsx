"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { useFinance } from "@/lib/finance-context"
import { formatCurrency, formatFullDate, getMonthName, getDaysInMonth, getFirstDayOfMonth, isToday } from "@/lib/format"
import { ChevronLeft, ChevronRight, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { TransactionItem } from "@/components/transaction-item"

interface CalendarScreenProps {
  onOpenNewTransaction: (date?: string) => void
}

export function CalendarScreen({ onOpenNewTransaction }: CalendarScreenProps) {
  const { state, getMonthTransactions, getDayTransactions } = useFinance()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfMonth = getFirstDayOfMonth(year, month)

  const monthTransactions = getMonthTransactions(currentDate)

  // Calculate daily totals
  const dailyTotals = useMemo(() => {
    const totals: Record<number, { income: number; expense: number }> = {}
    monthTransactions.forEach(tx => {
      const day = new Date(tx.date + "T00:00:00").getDate()
      if (!totals[day]) totals[day] = { income: 0, expense: 0 }
      if (tx.type === "income") totals[day].income += tx.amount
      else totals[day].expense += tx.amount
    })
    return totals
  }, [monthTransactions])

  // Monthly summary
  const monthSummary = useMemo(() => {
    const income = monthTransactions.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0)
    const expense = monthTransactions.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0)
    const daysWithExpense = Object.keys(dailyTotals).filter(d => dailyTotals[parseInt(d)].expense > 0).length
    const avgExpense = daysWithExpense > 0 ? expense / daysWithExpense : 0
    return { income, expense, daysWithExpense, avgExpense }
  }, [monthTransactions, dailyTotals])

  const selectedDate = selectedDay 
    ? new Date(year, month, selectedDay)
    : null

  const selectedDayTransactions = selectedDate 
    ? getDayTransactions(selectedDate)
    : []

  const selectedDayStats = useMemo(() => {
    if (!selectedDay || !dailyTotals[selectedDay]) {
      return { income: 0, expense: 0, balance: 0 }
    }
    const { income, expense } = dailyTotals[selectedDay]
    return { income, expense, balance: income - expense }
  }, [selectedDay, dailyTotals])

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  const handleDayClick = (day: number) => {
    setSelectedDay(selectedDay === day ? null : day)
  }

  const handleAddOnDay = () => {
    if (!selectedDay) return
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    onOpenNewTransaction(dateStr)
  }

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <header className="pt-12 px-5 mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          Monitoramento diário
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Calendário
        </h1>
      </header>

      {/* Month Navigation */}
      <div className="flex items-center justify-between px-5 mb-4">
        <button
          onClick={prevMonth}
          className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="font-heading text-lg font-semibold capitalize text-foreground">
          {getMonthName(currentDate)}
        </h2>
        <button
          onClick={nextMonth}
          className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="px-5 mb-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-[10px] uppercase tracking-wider text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayDate = new Date(year, month, day)
            const isTodayDay = isToday(dayDate)
            const isSelected = selectedDay === day
            const dayTotal = dailyTotals[day]
            const hasTransactions = !!dayTotal
            const netExpense = dayTotal ? dayTotal.expense - dayTotal.income : 0

            return (
              <motion.button
                key={day}
                onClick={() => handleDayClick(day)}
                whileTap={{ scale: 0.9 }}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-sm transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : isTodayDay
                    ? "bg-accent/15 text-accent font-semibold"
                    : hasTransactions
                    ? "text-foreground hover:bg-secondary"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <span>{day}</span>
                {hasTransactions && (
                  <div className={`w-1 h-1 rounded-full ${
                    isSelected 
                      ? "bg-primary-foreground/60" 
                      : netExpense > 0 
                      ? "bg-destructive" 
                      : "bg-success"
                  }`} />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Month Summary */}
      <div className="mx-5 mb-4 p-4 rounded-xl bg-card border border-border">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Receitas</p>
            <p className="font-mono text-sm font-medium text-success tabular-nums">
              {formatCurrency(monthSummary.income)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Despesas</p>
            <p className="font-mono text-sm font-medium text-destructive tabular-nums">
              {formatCurrency(monthSummary.expense)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Dias</p>
            <p className="font-mono text-sm font-medium text-accent tabular-nums">
              {monthSummary.daysWithExpense}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Média</p>
            <p className="font-mono text-sm font-medium text-destructive tabular-nums">
              {formatCurrency(monthSummary.avgExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* Selected Day Detail */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-5"
        >
          {/* Day Header */}
          <div className="rounded-t-xl bg-gradient-to-br from-secondary to-card border border-border border-b-0 p-4">
            <p className="text-sm font-medium text-foreground capitalize mb-3">
              {formatFullDate(selectedDate)}
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Entrou</p>
                <p className="font-mono text-sm font-medium text-success tabular-nums">
                  {formatCurrency(selectedDayStats.income)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Saiu</p>
                <p className="font-mono text-sm font-medium text-destructive tabular-nums">
                  {formatCurrency(selectedDayStats.expense)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Saldo</p>
                <p className={`font-mono text-sm font-medium tabular-nums ${
                  selectedDayStats.balance > 0 ? "text-success" : selectedDayStats.balance < 0 ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {formatCurrency(selectedDayStats.balance)}
                </p>
              </div>
            </div>
          </div>

          {/* Day Transactions */}
          <div className="rounded-b-xl bg-card border border-border border-t-0 overflow-hidden">
            {selectedDayTransactions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Nenhum lançamento neste dia</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {selectedDayTransactions.map(tx => (
                  <TransactionItem key={tx.id} transaction={tx} compact />
                ))}
              </div>
            )}
            <button
              onClick={handleAddOnDay}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-accent bg-accent/5 border-t border-border hover:bg-accent/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar lançamento neste dia
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
