"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useState, useTransition } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import { Orb } from "./orb"
import { createSpace } from "@/app/actions"

const LINES = ["Seu dinheiro não é uma planilha.", "Ele tem ritmo.", "Ele respira."]

export function Onboarding() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [limit, setLimit] = useState("")
  const [pending, start] = useTransition()
  const go = (demo: boolean) =>
    start(() => createSpace({ name: name || "Você", limit: Number(limit.replace(/\D/g, "")) || 0, demo }))

  const health = step === 0 ? 0.15 : step === 1 ? 0.55 : 0.95

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-6">
      <Orb health={health} className="pointer-events-none absolute left-1/2 top-[30%] size-[min(115vw,720px)] -translate-x-1/2 -translate-y-1/2" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--color-ink)_75%)]" />

      <div className="relative z-10 mt-[46vh] w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="0" exit={{ opacity: 0, y: -20, filter: "blur(8px)" }} className="text-center">
              {LINES.map((l, i) => (
                <motion.p
                  key={l}
                  initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.3 + i * 0.7, duration: 0.9 }}
                  className={i === 2 ? "font-serif text-5xl italic text-acid" : "font-serif text-4xl"}
                >
                  {l}
                </motion.p>
              ))}
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6 }}
                onClick={() => setStep(1)}
                className="mx-auto mt-12 flex items-center gap-2 rounded-full border border-line-2 px-6 py-3 text-sm text-fg-2 transition hover:border-acid hover:text-acid"
              >
                Começar <ArrowRight size={14} />
              </motion.button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.form
              key="1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              onSubmit={(e) => { e.preventDefault(); setStep(2) }}
              className="space-y-8"
            >
              <div>
                <p className="eyebrow mb-3">01 — quem é você</p>
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome"
                  className="w-full border-b border-line-2 bg-transparent pb-3 font-serif text-5xl outline-none focus:border-acid" />
              </div>
              <div>
                <p className="eyebrow mb-3">02 — quanto quer gastar por mês</p>
                <div className="flex items-baseline gap-2 border-b border-line-2 pb-3 focus-within:border-acid">
                  <span className="num text-2xl text-fg-3">R$</span>
                  <input inputMode="numeric" value={limit}
                    onChange={(e) => setLimit(e.target.value.replace(/\D/g, "") ? Number(e.target.value.replace(/\D/g, "")).toLocaleString("pt-BR") : "")}
                    placeholder="6.000" className="num w-full bg-transparent text-5xl outline-none" />
                </div>
                <p className="mt-2 text-xs text-fg-3">Opcional. O orbe usa isso para sentir a pressão do mês.</p>
              </div>
              <button className="flex w-full items-center justify-between rounded-2xl bg-acid px-6 py-4 font-medium text-ink">
                Continuar <ArrowRight size={18} />
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 text-center">
              <p className="mb-6 font-serif text-4xl">Prazer, <span className="italic text-acid">{name || "você"}</span>.</p>
              <button disabled={pending} onClick={() => go(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-acid py-4 font-medium text-ink disabled:opacity-50">
                <Sparkles size={16} /> {pending ? "Acordando o orbe…" : "Entrar com dados de exemplo"}
              </button>
              <button disabled={pending} onClick={() => go(false)}
                className="w-full rounded-2xl border border-line-2 py-4 text-fg-2 disabled:opacity-50">
                Começar do zero
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
