"use client"

import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { Activity, Orbit, Plus, Target, Waves } from "lucide-react"
import type { Snapshot } from "@/lib/types"
import { analyze } from "@/lib/finance"
import { NowScreen } from "./screens/now"
import { TimelineScreen } from "./screens/timeline"
import { GoalsScreen } from "./screens/goals"
import { PulseScreen } from "./screens/pulse"
import { Composer } from "./composer"

export type Tab = "now" | "timeline" | "goals" | "pulse"

const TABS: { id: Tab; label: string; icon: typeof Orbit }[] = [
  { id: "now", label: "Agora", icon: Orbit },
  { id: "timeline", label: "Fluxo", icon: Waves },
  { id: "goals", label: "Metas", icon: Target },
  { id: "pulse", label: "Pulso", icon: Activity },
]

export function FluxoApp({ snap }: { snap: Snapshot }) {
  const [tab, setTab] = useState<Tab>("now")
  const [composer, setComposer] = useState(false)
  const a = useMemo(() => analyze(snap), [snap])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input,textarea")
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault()
        setComposer(true)
      }
      if (!typing && !e.metaKey && ["1", "2", "3", "4"].includes(e.key)) setTab(TABS[Number(e.key) - 1].id)
    }
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [])

  useEffect(() => { window.scrollTo({ top: 0 }) }, [tab])

  return (
    <div className="relative mx-auto min-h-dvh max-w-[520px] overflow-x-clip pb-36">
      <AnimatePresence mode="wait">
        <motion.main
          key={tab}
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === "now" && <NowScreen snap={snap} a={a} go={setTab} />}
          {tab === "timeline" && <TimelineScreen snap={snap} a={a} />}
          {tab === "goals" && <GoalsScreen snap={snap} />}
          {tab === "pulse" && <PulseScreen snap={snap} a={a} />}
        </motion.main>
      </AnimatePresence>

      {/* Dock */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-ink via-ink/80 to-transparent" />
        <LayoutGroup>
          <div className="glass relative flex items-center gap-1 rounded-full p-1.5">
            {TABS.slice(0, 2).map((t) => <DockItem key={t.id} t={t} active={tab === t.id} onClick={() => setTab(t.id)} />)}
            <motion.button
              whileTap={{ scale: 0.9 }} whileHover={{ rotate: 90 }}
              onClick={() => setComposer(true)}
              className="mx-1 grid size-12 place-items-center rounded-full bg-acid text-ink shadow-[0_0_30px_-4px_var(--color-acid)]"
              aria-label="Novo lançamento (⌘K)"
            >
              <Plus size={22} strokeWidth={2.4} />
            </motion.button>
            {TABS.slice(2).map((t) => <DockItem key={t.id} t={t} active={tab === t.id} onClick={() => setTab(t.id)} />)}
          </div>
        </LayoutGroup>
      </nav>

      <Composer open={composer} onClose={() => setComposer(false)} today={snap.today} />
    </div>
  )
}

function DockItem({ t, active, onClick }: { t: (typeof TABS)[number]; active: boolean; onClick: () => void }) {
  const Icon = t.icon
  return (
    <button onClick={onClick} className="relative flex h-12 items-center gap-2 rounded-full px-4 text-sm" aria-current={active ? "page" : undefined}>
      {active && <motion.span layoutId="dock" className="absolute inset-0 rounded-full bg-white/10" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
      <Icon size={18} className={`relative ${active ? "text-acid" : "text-fg-3"}`} />
      <AnimatePresence initial={false}>
        {active && (
          <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="relative overflow-hidden whitespace-nowrap">
            {t.label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
