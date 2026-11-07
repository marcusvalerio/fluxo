"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { ArrowDownLeft, ArrowUpRight, CornerDownLeft } from "lucide-react"
import { Sheet } from "./ui"
import { parseEntry } from "@/lib/parse"
import { brl, CATEGORIES, catColor } from "@/lib/finance"
import { relativeDay } from "@/lib/dates"
import { addTransaction } from "@/app/actions"
import type { Kind } from "@/lib/types"

const EXAMPLES = ["almoço 42,90", "uber 23 ontem", "recebi 1.200 freela", "mercado 318,40", "netflix 55,90"]

export function Composer({ open, onClose, today }: { open: boolean; onClose: () => void; today: string }) {
  const [raw, setRaw] = useState("")
  const [kindOverride, setKind] = useState<Kind | null>(null)
  const [catOverride, setCat] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [flash, setFlash] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setRaw(""); setKind(null); setCat(null)
      setTimeout(() => input.current?.focus(), 250)
    }
  }, [open])

  const p = useMemo(() => parseEntry(raw, today), [raw, today])
  const kind = kindOverride ?? p.kind
  const cats = CATEGORIES[kind] as readonly string[]
  const category = catOverride && cats.includes(catOverride) ? catOverride : cats.includes(p.category) ? p.category : "Outros"
  const ready = !!p.amount && p.amount > 0

  const submit = () => {
    if (!ready || pending) return
    start(async () => {
      await addTransaction({ kind, amount: p.amount!, description: p.description, category, date: p.date })
      setFlash(true)
      if (navigator.vibrate) navigator.vibrate(12)
      setTimeout(() => { setFlash(false); onClose() }, 520)
    })
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="relative">
        <div className="flex items-center gap-3 rounded-[22px] border border-line-2 bg-white/[0.03] px-4 py-1 focus-within:border-acid/50">
          <span className="num text-acid">›</span>
          <input
            ref={input} value={raw} onChange={(e) => setRaw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="almoço 42 ontem…"
            className="h-14 flex-1 bg-transparent text-xl outline-none"
            aria-label="Descreva o lançamento"
          />
          <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 text-[10px] text-fg-3 sm:block">ENTER</kbd>
        </div>

        {!raw && (
          <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
            {EXAMPLES.map((e) => (
              <button key={e} onClick={() => setRaw(e)} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-sm text-fg-2 hover:border-line-2">
                {e}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence>
          {raw && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="pt-5">
                {/* prévia viva */}
                <motion.div layout className="relative overflow-hidden rounded-3xl border border-line p-5"
                  style={{ background: `radial-gradient(120% 120% at 0% 0%, ${catColor(category, 70, 0.14)}22, transparent 60%)` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="eyebrow">{relativeDay(p.date, today)} · {category}</p>
                      <p className="mt-2 text-lg">{p.description}</p>
                    </div>
                    <div className="flex rounded-full bg-white/5 p-1 text-xs">
                      {(["expense", "income"] as Kind[]).map((k) => (
                        <button key={k} onClick={() => setKind(k)}
                          className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition ${kind === k ? (k === "income" ? "bg-mint text-ink" : "bg-ember text-ink") : "text-fg-3"}`}>
                          {k === "income" ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          {k === "income" ? "Entrada" : "Saída"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className={`num mt-6 text-5xl ${ready ? (kind === "income" ? "text-mint" : "text-fg") : "text-fg-3"}`}>
                    {ready ? `${kind === "income" ? "+" : "−"}${brl(p.amount!)}` : "R$ —"}
                  </p>
                </motion.div>

                <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
                  {cats.map((c) => (
                    <button key={c} onClick={() => setCat(c)}
                      className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${c === category ? "border-transparent bg-fg text-ink" : "border-line text-fg-2"}`}>
                      <span className="size-2 rounded-full" style={{ background: catColor(c) }} />{c}
                    </button>
                  ))}
                </div>

                <motion.button whileTap={{ scale: 0.97 }} disabled={!ready || pending} onClick={submit}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-acid py-4 font-medium text-ink disabled:opacity-30">
                  {pending ? "Lançando…" : <>Lançar <CornerDownLeft size={16} /></>}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {flash && (
            <motion.div className="pointer-events-none absolute inset-0 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ scale: 0.2 }} animate={{ scale: 6, opacity: 0 }} transition={{ duration: 0.6 }} className="size-24 rounded-full bg-acid/50 blur-xl" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  )
}
