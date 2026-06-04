"use client"

import { motion } from "framer-motion"
import { useFinance } from "@/lib/finance-context"
import { FileText, Plus } from "lucide-react"
import { formatCurrency } from "@/lib/format"

interface BillsScreenProps {
  onOpenNewBill: () => void
}

export function BillsScreen({ onOpenNewBill }: BillsScreenProps) {
  const { state } = useFinance()

  const totalBills = state.fixedBills.reduce((acc, bill) => acc + bill.amount, 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-32"
    >
      <div className="px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Contas Fixas</h1>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onOpenNewBill}
            className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Total */}
        {state.fixedBills.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-4 bg-warning/10 border border-warning/20 rounded-2xl mb-6"
          >
            <p className="text-xs font-semibold text-warning/80 mb-1">Total mensal</p>
            <p className="text-2xl font-bold text-warning font-mono">{formatCurrency(totalBills)}</p>
          </motion.div>
        )}

        {state.fixedBills.length > 0 ? (
          <motion.div className="space-y-3">
            {state.fixedBills.map((bill, index) => (
              <motion.div
                key={bill.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-card rounded-2xl border border-border flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{bill.name}</h3>
                  <p className="text-xs text-muted-foreground">Vence no dia {bill.dueDay}</p>
                </div>
                <p className="font-mono font-bold text-foreground">{formatCurrency(bill.amount)}</p>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            <p>Nenhuma conta fixa registrada</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
