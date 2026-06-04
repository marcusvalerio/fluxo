"use client"

import { motion } from "framer-motion"
import { useFinance } from "@/lib/finance-context"
import { Target, Plus } from "lucide-react"

interface GoalsScreenProps {
  onOpenNewGoal: () => void
  onUpdateGoal: (goal: any) => void
}

export function GoalsScreen({ onOpenNewGoal, onUpdateGoal }: GoalsScreenProps) {
  const { state } = useFinance()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-32"
    >
      <div className="px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Metas</h1>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onOpenNewGoal}
            className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>

        {state.goals.length > 0 ? (
          <motion.div className="space-y-3">
            {state.goals.map((goal, index) => {
              const progress = (goal.saved / goal.total) * 100
              return (
                <motion.div
                  key={goal.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onUpdateGoal(goal)}
                  className="p-4 bg-card rounded-2xl border border-border cursor-pointer hover:bg-card/80 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-foreground">{goal.name}</h3>
                    <Target className="w-4 h-4 text-accent" />
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-accent"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    R$ {goal.saved.toFixed(2)} de R$ {goal.total.toFixed(2)} ({progress.toFixed(0)}%)
                  </p>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            <p>Nenhuma meta criada</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
