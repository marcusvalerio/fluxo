"use client"

import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { useEffect, useMemo, useState, useTransition } from "react"
import { Delete } from "lucide-react"
import type { Kind, Snapshot } from "@/lib/types"
import { brl, CATEGORIES, int, type Analysis } from "@/lib/finance"
import { addDays } from "@/lib/dates"
import { parseEntry } from "@/lib/parse"
import { addTransaction } from "@/app/actions"
import { Sheet, spring } from "./ui"

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "del"]

export function Lancar({ open, onClose, snap, a }: { open: boolean; onClose: () => void; snap: Snapshot; a: Analysis }) {
  const [kind, setKind] = useState<Kind>("expense")
  const [cents, setCents] = useState("") // dígitos digitados
  const [desc, setDesc] = useState("")
  const [cat, setCat] = useState<string | null>(null)
  const [when, setWhen] = useState<0 | -1>(0)
  const [cardId, setCardId] = useState<number | null>(null)
  const [parts, setParts] = useState(1)
  const [pending, start] = useTransition()

  useEffect(() => {
    if (open) { setKind("expense"); setCents(""); setDesc(""); setCat(null); setWhen(0); setCardId(null); setParts(1) }
  }, [open])

  const amount = (Number(cents) || 0) / 100
  const guessed = useMemo(() => (desc ? parseEntry(desc, snap.today).category : null), [desc, snap.today])
  const cats = CATEGORIES[kind] as readonly string[]
  const category = cat && cats.includes(cat) ? cat : guessed && cats.includes(guessed) ? guessed : cats[0]
  const after = kind === "expense" ? a.free - (cardId ? amount / parts : amount) : a.free + (snap.space.limit > 0 ? 0 : amount)
  const perDay = Math.max(0, after) / Math.max(1, a.daysLeft)

  const press = (k: string) => {
    if (navigator.vibrate) navigator.vibrate(6)
    if (k === "del") return setCents((c) => c.slice(0, -1))
    if (k === ",") return
    setCents((c) => (c.length >= 9 ? c : (c + k).replace(/^0+/, "")))
  }

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input")) return
      if (/^\d$/.test(e.key)) press(e.key)
      if (e.key === "Backspace") press("del")
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [open])

  const submit = () => {
    if (!amount || pending) return
    start(async () => {
      await addTransaction({ kind, amount, description: desc.trim() || category, category, date: addDays(snap.today, when), cardId: kind === "expense" ? cardId : null, installments: cardId ? parts : 1 })
      if (navigator.vibrate) navigator.vibrate([8, 40, 12])
      onClose()
    })
  }

  const intPart = Math.floor(amount).toLocaleString("pt-BR")
  const decPart = String(Math.round((amount % 1) * 100)).padStart(2, "0")

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex flex-col">
        <div className="flex justify-center">
          <div className="lg flex gap-0.5 rounded-[22px] p-1">
            <LayoutGroup id="kind">
              {(["expense", "income"] as Kind[]).map((k) => (
                <button key={k} onClick={() => setKind(k)} className={`relative rounded-[18px] px-4 py-2 text-[14px] ${kind === k ? "font-semibold" : "text-smoke"}`}>
                  {kind === k && <motion.span layoutId="kindpill" className="absolute inset-0 rounded-[18px] bg-ink" transition={spring} />}
                  <span className={`relative ${kind === k ? "text-cotton" : ""}`}>{k === "expense" ? "Saída" : "Entrada"}</span>
                </button>
              ))}
            </LayoutGroup>
          </div>
        </div>

        <div className="pb-2 pt-6 text-center">
          <p className="num text-[60px] leading-none" aria-live="polite">
            <span className="mr-1.5 text-[26px] text-faint">R$</span>
            <motion.span key={intPart} initial={{ y: 8, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} transition={spring} className={amount ? "" : "text-faint"}>{intPart}</motion.span>
            <span className="text-faint">,{decPart}</span>
          </p>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição (ex.: almoço com a Ana)" maxLength={80}
            aria-label="Descrição" className="mt-3 w-full bg-transparent text-center text-[16px] text-smoke outline-none focus-visible:outline-none" />
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-2">
          {([0, -1] as const).map((d) => (
            <button key={d} onClick={() => setWhen(d)} className={`h-10 shrink-0 rounded-full px-4 text-[13px] font-medium ${when === d ? "bg-ink text-cotton" : "bg-white text-smoke"}`}>{d === 0 ? "Hoje" : "Ontem"}</button>
          ))}
          <span className="mx-1 w-px shrink-0 bg-sand" />
          {[category, ...cats.filter((c) => c !== category)].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`h-10 shrink-0 rounded-full px-4 text-[13px] font-medium transition ${c === category ? "bg-ink text-cotton" : "bg-white text-smoke"}`}>{c}</button>
          ))}
        </div>

        {kind === "expense" && snap.cards.length > 0 && (
          <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-2">
            <span className="shrink-0 text-[12px] text-mute">Pagar com</span>
            {[{ id: null as number | null, name: "Débito/Pix" }, ...snap.cards].map((c) => (
              <button key={String(c.id)} onClick={() => { setCardId(c.id); if (!c.id) setParts(1) }}
                className={`h-10 shrink-0 rounded-full px-4 text-[13px] font-medium ${cardId === c.id ? "bg-ink text-cotton" : "bg-white text-smoke"}`}>{c.name}</button>
            ))}
          </div>
        )}
        <AnimatePresence>
          {kind === "expense" && cardId && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-1 flex items-center justify-between rounded-[20px] bg-white px-2 py-1.5">
                <button onClick={() => setParts((p) => Math.max(1, p - 1))} className="grid size-10 place-items-center rounded-full text-[20px]" aria-label="Menos parcelas">−</button>
                <span className="text-[14px]">{parts === 1 ? "À vista" : <><span className="num">{parts}x</span> de <span className="num">{brl(amount / parts)}</span></>}</span>
                <button onClick={() => setParts((p) => Math.min(24, p + 1))} className="grid size-10 place-items-center rounded-full text-[20px]" aria-label="Mais parcelas">+</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {amount > 0 && a.budget > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-2 flex items-center justify-between rounded-[20px] bg-white px-4 py-3">
                <span className="text-[13px] text-smoke">Depois disso, {after < 0 ? "passa do teto em" : "sobram"}</span>
                <span className={`num text-[14px] ${after < 0 ? "text-gravy" : ""}`}>{brl(Math.abs(after), false)}{after >= 0 && <span className="text-mute"> · R$ {int(perDay)}/dia</span>}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {KEYS.map((k) => (
            <motion.button key={k} whileTap={{ scale: 0.92, backgroundColor: "var(--c-sand)" }} onClick={() => press(k)} aria-label={k === "del" ? "Apagar" : k}
              disabled={k === ","}
              className={`num grid h-[58px] place-items-center rounded-[18px] text-[24px] ${k === "del" || k === "," ? "bg-transparent" : "bg-white"} ${k === "," ? "opacity-0" : ""}`}>
              {k === "del" ? <Delete size={22} /> : k}
            </motion.button>
          ))}
        </div>

        <motion.button whileTap={{ scale: 0.97 }} disabled={!amount || pending} onClick={submit}
          className="mt-2.5 h-[58px] rounded-[29px] bg-otan text-[16px] font-semibold text-white shadow-[inset_0_1px_1px_rgb(255_255_255/0.4),0_10px_24px_-10px_rgb(255_78_32/0.8)] disabled:opacity-35">
          {pending ? "Lançando…" : amount ? `Lançar ${brl(amount)}` : "Digite o valor"}
        </motion.button>
      </div>
    </Sheet>
  )
}
