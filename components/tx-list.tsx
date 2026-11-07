"use client"

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion"
import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import type { Tx } from "@/lib/types"
import { brl } from "@/lib/finance"
import { deleteTransaction } from "@/app/actions"
import { CatIcon } from "./cat-icon"
import { Sheet } from "./ui"

const FULL = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })

export function TxRow({ tx, meta, onOpen }: { tx: Tx; meta: string; onOpen: () => void }) {
  const x = useMotionValue(0)
  const reveal = useTransform(x, [-110, -30, 0], [1, 0.3, 0])
  const [pending, start] = useTransition()
  const income = tx.kind === "income"
  return (
    <motion.li layout exit={{ opacity: 0, height: 0 }} className={`relative overflow-hidden ${pending ? "opacity-30" : ""}`}>
      <motion.div style={{ opacity: reveal }} className="absolute inset-0 flex items-center justify-end pr-3 text-gravy"><Trash2 size={18} /></motion.div>
      <motion.button drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.5, right: 0 }} style={{ x }}
        onDragEnd={(_, i) => i.offset.x < -100 && start(() => deleteTransaction(tx.id))}
        onTap={onOpen} aria-label={`${tx.description}, ${brl(tx.amount)}`}
        className="relative flex w-full items-center gap-3 bg-card py-3 text-left">
        <CatIcon category={tx.category} income={income} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px]">{tx.description}</span>
          <span className="block text-[12px] text-mute">{meta}</span>
        </span>
        <span className={`num text-[16px] ${income ? "text-gravy" : ""}`}>{income ? "+" : "−"}{brl(tx.amount)}</span>
      </motion.button>
    </motion.li>
  )
}

export function TxList({ items, meta }: { items: Tx[]; meta: (t: Tx) => string }) {
  const [open, setOpen] = useState<Tx | null>(null)
  const [pending, start] = useTransition()
  return (
    <>
      <ul className="divide-y divide-cotton">
        <AnimatePresence initial={false}>{items.map((t) => <TxRow key={t.id} tx={t} meta={meta(t)} onOpen={() => setOpen(t)} />)}</AnimatePresence>
      </ul>
      <Sheet open={!!open} onClose={() => setOpen(null)}>
        {open && (
          <div className="px-1">
            <div className="flex flex-col items-center pb-5 pt-2 text-center">
              <CatIcon category={open.category} income={open.kind === "income"} size={56} />
              <p className="mt-3 text-[15px] text-smoke">{open.description}</p>
              <p className={`num mt-1 text-[40px] leading-none ${open.kind === "income" ? "text-gravy" : ""}`}>{open.kind === "income" ? "+" : "−"}{brl(open.amount)}</p>
            </div>
            <dl className="rounded-[22px] bg-card px-4">
              {[
                ["Tipo", open.kind === "income" ? "Entrada" : "Saída"],
                ["Categoria", open.category],
                ["Data", FULL.format(new Date(open.date + "T12:00:00Z"))],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-cotton py-3.5 text-[15px] last:border-0">
                  <dt className="text-mute">{k}</dt><dd className="first-letter:uppercase">{v}</dd>
                </div>
              ))}
            </dl>
            <button disabled={pending} onClick={() => start(async () => { await deleteTransaction(open.id); setOpen(null) })}
              className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-[28px] bg-card text-[15px] font-semibold text-gravy disabled:opacity-40">
              <Trash2 size={16} /> {pending ? "Apagando…" : "Apagar lançamento"}
            </button>
          </div>
        )}
      </Sheet>
    </>
  )
}
