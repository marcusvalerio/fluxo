"use client"

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion"
import { useTransition } from "react"
import { Trash2 } from "lucide-react"
import type { Tx } from "@/lib/types"
import { brl } from "@/lib/finance"
import { deleteTransaction } from "@/app/actions"

export function TxRow({ tx, meta }: { tx: Tx; meta: string }) {
  const x = useMotionValue(0)
  const reveal = useTransform(x, [-110, -30, 0], [1, 0.3, 0])
  const [pending, start] = useTransition()
  const income = tx.kind === "income"
  return (
    <motion.li layout exit={{ opacity: 0, height: 0 }} className={`relative overflow-hidden ${pending ? "opacity-30" : ""}`}>
      <motion.div style={{ opacity: reveal }} className="absolute inset-0 flex items-center justify-end pr-3 text-gravy"><Trash2 size={18} /></motion.div>
      <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.5, right: 0 }} style={{ x }}
        onDragEnd={(_, i) => i.offset.x < -100 && start(() => deleteTransaction(tx.id))}
        className="relative flex items-center gap-3 bg-white py-3">
        <span className="ttl grid size-10 shrink-0 place-items-center rounded-full bg-cotton text-[14px] text-smoke">{tx.description[0]?.toUpperCase()}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px]">{tx.description}</span>
          <span className="block text-[12px] text-mute">{meta}</span>
        </span>
        <span className={`num text-[16px] ${income ? "text-gravy" : ""}`}>{income ? "+" : "−"}{brl(tx.amount)}</span>
      </motion.div>
    </motion.li>
  )
}

export function TxList({ items, meta }: { items: Tx[]; meta: (t: Tx) => string }) {
  return (
    <ul className="divide-y divide-cotton">
      <AnimatePresence initial={false}>{items.map((t) => <TxRow key={t.id} tx={t} meta={meta(t)} />)}</AnimatePresence>
    </ul>
  )
}
