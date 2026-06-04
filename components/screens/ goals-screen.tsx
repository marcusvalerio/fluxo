"use client"

import { motion } from "framer-motion"
import { useFinance, type Goal } from "@/lib/finance-context"
import { formatCurrency } from "@/lib/format"
import { Target, Plus, Trash2, Coins } from "lucide-react"

interface GoalsScreenProps {
  onOpenNewGoal: () => void
  onUpdateGoal: (goal: Goal) => void
}

export function GoalsScreen({ onOpenNewGoal, onUpdateGoal }: GoalsScreenProps) {
  const { state, deleteGoal, updateGoal } = useFinance()
  const goals = state.goals

  const handleAddToGoal = (goal: Goal, amount: number) => {
    updateGoal(goal.id, { saved: goal.saved + amount })
  }

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <header className="pt-12 px-5 mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          Seus objetivos
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Metas
        </h1>
      </header>

      {/* Goals List */}
      <section className="px-5 space-y-3">
        {goals.length === 0 ? (
          <div className="rounded-xl bg-card border border-border">
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Sem metas
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Crie sua primeira meta financeira
              </p>
            </div>
          </div>
        ) : (
          goals.map((goal, i) => {
            const progress = Math.min(100, (goal.saved / goal.total) * 100)
            const isComplete = progress >= 100

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl border p-5 ${
                  isComplete 
                    ? "bg-success/5 border-success/20" 
                    : "bg-card border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{goal.name}</h3>
                    {isComplete && (
                      <span className="px-2 py-0.5 text-[10px] font-medium text-success bg-success/10 rounded-full">
                        Completa
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-sm font-medium text-accent tabular-nums">
                    {progress.toFixed(0)}%
                  </span>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Guardado: <strong className="text-foreground font-mono tabular-nums">{formatCurrency(goal.saved)}</strong></span>
                  <span>Meta: <strong className="text-foreground font-mono tabular-nums">{formatCurrency(goal.total)}</strong></span>
                </div>

                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${isComplete ? "bg-success" : "bg-accent"}`}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateGoal(goal)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-accent bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    Adicionar valor
                  </button>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="w-10 h-10 flex items-center justify-center text-destructive bg-destructive/10 rounded-lg hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })
        )}

        {/* Add Button */}
        <button
          onClick={onOpenNewGoal}
          className="w-full flex items-center justify-center gap-2 py-4 text-sm font-medium text-muted-foreground bg-card border border-dashed border-border rounded-xl hover:bg-secondary transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova meta
        </button>
      </section>
    </div>
  )
}
