"use client"

import { motion } from "framer-motion"
import { useFinance, type FixedBill } from "@/lib/finance-context"
import { formatCurrency } from "@/lib/format"
import { FileText, Plus, Check, Trash2, AlertTriangle, Clock } from "lucide-react"

interface BillsScreenProps {
  onOpenNewBill: () => void
}

export function BillsScreen({ onOpenNewBill }: BillsScreenProps) {
  const { state, toggleBillPaid, deleteFixedBill } = useFinance()
  const bills = state.fixedBills

  const today = new Date().getDate()

  const totalAmount = bills.reduce((a, b) => a + b.amount, 0)
  const paidAmount = bills.filter(b => b.paid).reduce((a, b) => a + b.amount, 0)

  const getBillStatus = (bill: FixedBill) => {
    if (bill.paid) return "paid"
    if (bill.dueDay < today) return "overdue"
    if (bill.dueDay - today <= 3) return "soon"
    return "pending"
  }

  const sortedBills = [...bills].sort((a, b) => {
    const statusOrder = { overdue: 0, soon: 1, pending: 2, paid: 3 }
    return statusOrder[getBillStatus(a)] - statusOrder[getBillStatus(b)]
  })

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <header className="pt-12 px-5 mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          Mês atual
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Contas Fixas
        </h1>
      </header>

      {/* Summary Card */}
      <div className="mx-5 mb-4 p-4 rounded-xl bg-gradient-to-br from-card to-secondary/30 border border-border">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total do mês</p>
            <p className="font-mono text-xl font-medium text-foreground tabular-nums">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Pago</p>
            <p className="font-mono text-xl font-medium text-success tabular-nums">
              {formatCurrency(paidAmount)}
            </p>
          </div>
        </div>
        {totalAmount > 0 && (
          <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(paidAmount / totalAmount) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-success"
            />
          </div>
        )}
      </div>

      {/* Bills List */}
      <section className="px-5 space-y-3">
        {bills.length === 0 ? (
          <div className="rounded-xl bg-card border border-border">
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Sem contas fixas
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Adicione suas contas recorrentes
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-card border border-border overflow-hidden divide-y divide-border">
            {sortedBills.map((bill, i) => {
              const status = getBillStatus(bill)
              
              return (
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <button
                    onClick={() => toggleBillPaid(bill.id)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      bill.paid
                        ? "bg-success border-success"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    {bill.paid && <Check className="w-3.5 h-3.5 text-success-foreground" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${bill.paid ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {bill.name}
                      </p>
                      {status === "overdue" && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium text-destructive bg-destructive/10 rounded flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Atrasada
                        </span>
                      )}
                      {status === "soon" && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium text-warning bg-warning/10 rounded flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          Em breve
                        </span>
                      )}
                      {status === "paid" && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium text-success bg-success/10 rounded">
                          Paga
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Vence dia {bill.dueDay}
                    </p>
                  </div>

                  <p className={`font-mono text-sm font-medium tabular-nums ${bill.paid ? "text-muted-foreground" : "text-foreground"}`}>
                    {formatCurrency(bill.amount)}
                  </p>

                  <button
                    onClick={() => deleteFixedBill(bill.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={onOpenNewBill}
          className="w-full flex items-center justify-center gap-2 py-4 text-sm font-medium text-muted-foreground bg-card border border-dashed border-border rounded-xl hover:bg-secondary transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar conta fixa
        </button>
      </section>
    </div>
  )
}
