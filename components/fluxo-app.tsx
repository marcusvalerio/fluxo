"use client"

import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { BarChart3, CalendarDays, Check, House, Plus, Wallet } from "lucide-react"
import type { Snapshot } from "@/lib/types"
import { analyze } from "@/lib/finance"
import { InicioScreen } from "./screens/inicio"
import { FluxoScreen } from "./screens/fluxo"
import { AgendaScreen } from "./screens/agenda"
import { CarteiraScreen } from "./screens/carteira"
import { Lancar } from "./lancar"

export type Tab = "inicio" | "fluxo" | "agenda" | "carteira"
const TABS: { id: Tab; label: string; icon: typeof House }[] = [
  { id: "inicio", label: "Início", icon: House },
  { id: "fluxo", label: "Fluxo", icon: BarChart3 },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "carteira", label: "Carteira", icon: Wallet },
]

export function FluxoApp({ snap }: { snap: Snapshot }) {
  const [tab, setTab] = useState<Tab>("inicio")
  const [lancar, setLancar] = useState(false)
  const [done, setDone] = useState<{ id: number; amount: number; kind: "income" | "expense"; label: string; parts: number } | null>(null)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(null), 2600)
    return () => clearTimeout(t)
  }, [done])
  const a = useMemo(() => analyze(snap), [snap])

  useEffect(() => { window.scrollTo({ top: 0 }) }, [tab])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey))) { e.preventDefault(); setLancar(true) }
    }
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [])

  return (
    <div className="relative mx-auto min-h-dvh max-w-[480px] overflow-x-clip pb-32">
      <div className="blob pointer-events-none absolute -right-20 -top-16 size-64 rounded-full bg-[radial-gradient(circle,rgb(255_78_32/0.26),transparent_70%)]" />
      <AnimatePresence mode="wait">
        <motion.main key={tab} className="relative"
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6, filter: "blur(6px)" }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
          {tab === "inicio" && <InicioScreen snap={snap} a={a} go={setTab} />}
          {tab === "fluxo" && <FluxoScreen snap={snap} a={a} />}
          {tab === "agenda" && <AgendaScreen snap={snap} a={a} />}
          {tab === "carteira" && <CarteiraScreen snap={snap} a={a} />}
        </motion.main>
      </AnimatePresence>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] px-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 26 }}
          className="lg flex h-[66px] items-center justify-between rounded-[33px] px-1.5">
          <LayoutGroup>
            {TABS.map((t) => {
              const Icon = t.icon
              const on = tab === t.id
              return (
                <button key={t.id} onClick={() => setTab(t.id)} aria-current={on ? "page" : undefined} aria-label={t.label}
                  className="relative flex h-[54px] min-w-[50px] items-center justify-center gap-2 rounded-[27px] px-3.5 text-[13px] font-semibold">
                  {on && <motion.span layoutId="pill" className="lg-pill absolute inset-0 rounded-[27px]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <Icon size={19} strokeWidth={2} className={`relative ${on ? "text-otan" : "text-smoke"}`} />
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                        className="relative overflow-hidden whitespace-nowrap">{t.label}</motion.span>
                    )}
                  </AnimatePresence>
                </button>
              )
            })}
          </LayoutGroup>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setLancar(true)} aria-label="Lançar gasto"
            className="grid size-[54px] place-items-center rounded-full bg-otan text-white shadow-[inset_0_1px_1px_rgb(255_255_255/0.5),0_6px_16px_-4px_rgb(255_78_32/0.6)]">
            <Plus size={22} strokeWidth={2.4} />
          </motion.button>
        </motion.div>
      </nav>

      <Lancar open={lancar} onClose={() => setLancar(false)} snap={snap} a={a} onDone={(r) => setDone({ ...r, id: Date.now() })} />

      {/* confirmação: a cor enche a tela e um aviso de vidro aparece */}
      <AnimatePresence>
        {done && (
          <motion.div key={`f${done.id}`} className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <span className="absolute bottom-0 left-1/2 size-[260vmax] rounded-full"
              style={{ background: `radial-gradient(circle, ${done.kind === "income" ? "rgb(255 138 99 / 0.9)" : "rgb(255 78 32 / 0.9)"} 0%, rgb(255 78 32 / 0.25) 45%, transparent 70%)`, animation: "flood 900ms cubic-bezier(.2,.9,.2,1) forwards" }} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {done && (
          <motion.div key={`t${done.id}`} role="status"
            initial={{ opacity: 0, y: -30, scale: 0.9, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 30, delay: 0.25 }}
            className="lg fixed left-1/2 top-[max(16px,env(safe-area-inset-top))] z-[61] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3 rounded-full py-2 pl-2 pr-5">
            <span className="grid size-9 place-items-center rounded-full bg-otan text-white"><Check size={17} strokeWidth={2.6} /></span>
            <span className="min-w-0 truncate whitespace-nowrap text-[14px]">
              <span className="font-semibold">{done.kind === "income" ? "Entrada lançada" : "Lançado"}</span>
              <span className="text-mute"> · {done.label} · </span>
              <span className="num">{done.parts > 1 ? `${done.parts}x de ${(done.amount / done.parts).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : done.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
