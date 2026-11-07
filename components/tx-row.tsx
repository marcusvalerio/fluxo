"use client"

import { motion, useMotionValue, useTransform } from "framer-motion"
import { useTransition } from "react"
import { Trash2 } from "lucide-react"
import type { Tx } from "@/lib/types"
import { brl, catColor } from "@/lib/finance"
import { deleteTransaction } from "@/app/actions"

export function TxRow({ tx, meta }: { tx: Tx; meta?: string }) {
  const x = useMotionValue(0)
  const bg = useTransform(x, [-120, -40, 0], [1, 0.4, 0])
  const [pending, start] = useTransition()
  const income = tx.kind === "income"
  return (
    <motion.li layout exit={{ opacity: 0, height: 0 }} className={`relative overflow-hidden rounded-2xl ${pending ? "opacity-30" : ""}`}>
      <motion.div style={{ opacity: bg }} className="absolute inset-0 flex items-center justify-end rounded-2xl bg-rose/20 pr-5 text-rose">
        <Trash2 size={18} />
      </motion.div>
      <motion.div
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.5, right: 0 }} style={{ x }}
        onDragEnd={(_, i) => i.offset.x < -110 && start(() => deleteTransaction(tx.id))}
        className="relative flex items-center gap-4 bg-ink px-1 py-3"
      >
        <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl border border-line" style={{ background: `${catColor(tx.category, 70, 0.15)}18` }}>
          <span className="size-2.5 rounded-full" style={{ background: catColor(tx.category), boxShadow: `0 0 12px ${catColor(tx.category)}` }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate">{tx.description}</p>
          <p className="text-xs text-fg-3">{meta ?? tx.category}</p>
        </div>
        <p className={`num text-[15px] ${income ? "text-mint" : ""}`}>{income ? "+" : "−"}{brl(tx.amount)}</p>
      </motion.div>
    </motion.li>
  )
}
