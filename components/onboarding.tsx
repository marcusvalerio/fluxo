"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useState, useTransition } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { completeOnboarding } from "@/app/actions"
import { int } from "@/lib/finance"
import { spring } from "./ui"

const TOTAL = 4

export function Onboarding({ name: initialName, needsPassword }: { name: string; needsPassword: boolean }) {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [name, setName] = useState(initialName)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [limit, setLimit] = useState("")
  const [pending, start] = useTransition()
  const limitN = Number(limit.replace(/\D/g, "")) || 0

  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n) }
  const finish = (demo: boolean) => start(async () => {
    setError("")
    const r = await completeOnboarding({ name: name.trim() || "Você", limit: limitN, demo, password: needsPassword ? password : undefined })
    if (r.error) { setError(r.error); setStep(1) }
  })
  const blocked = step === 1 && needsPassword && password.length < 8

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col overflow-hidden px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))]">
      <div className="blob pointer-events-none absolute -right-24 -top-20 size-72 rounded-full bg-[radial-gradient(circle,rgb(255_78_32/0.25),transparent_70%)]" />

      <header className="relative flex h-12 items-center justify-between">
        <AnimatePresence>
          {step > 0 && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => go(step - 1)} className="lg grid size-11 place-items-center rounded-full" aria-label="Voltar">
              <ArrowLeft size={18} />
            </motion.button>
          )}
        </AnimatePresence>
        <div className="lg absolute left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full px-3 py-2.5" aria-label={`Passo ${step + 1} de ${TOTAL}`}>
          {Array.from({ length: TOTAL }, (_, i) => (
            <motion.span key={i} animate={{ width: i === step ? 22 : 7, backgroundColor: i <= step ? "#1F282E" : "#CFCDC3" }} transition={spring} className="h-[7px] rounded-full" />
          ))}
        </div>
      </header>

      <div className="relative flex flex-1 flex-col">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.section
            key={step} custom={dir}
            initial={{ opacity: 0, x: dir * 60, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: dir * -60, filter: "blur(8px)" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="flex flex-1 flex-col"
          >
            {step === 0 && <Welcome />}
            {step === 1 && (
              <Ask title="Como a gente te chama?" sub={needsPassword ? "E crie a sua senha. A que você recebeu era só para entrar." : "É só para o app falar com você."}>
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !blocked && go(2)}
                  placeholder="Seu nome" maxLength={40}
                  className="ttl w-full border-b-2 border-sand bg-transparent pb-3 text-[40px] outline-none focus-visible:outline-none focus:border-otan" aria-label="Seu nome" />
                {needsPassword && (
                  <label className="mt-8 block">
                    <span className="mb-2 block text-[13px] text-mute">Sua nova senha (mínimo 8 caracteres)</span>
                    <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !blocked && go(2)}
                      className="h-14 w-full rounded-[22px] bg-white px-5 text-[16px] outline-none ring-otan focus:ring-2 focus-visible:outline-none" />
                  </label>
                )}
                {error && <p role="alert" className="mt-3 text-[14px] text-gravy">{error}</p>}
              </Ask>
            )}
            {step === 2 && (
              <Ask title="Quanto você quer gastar por mês?" sub="Seu teto. Dá para mudar depois, e pode deixar em branco.">
                <div className="flex items-baseline gap-2 border-b-2 border-sand pb-3 focus-within:border-otan">
                  <span className="num text-[24px] text-faint">R$</span>
                  <input autoFocus inputMode="numeric" value={limit} aria-label="Limite mensal"
                    onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, "")); setLimit(n ? n.toLocaleString("pt-BR") : "") }}
                    onKeyDown={(e) => e.key === "Enter" && go(3)}
                    placeholder="6.000" className="num w-full bg-transparent text-[48px] outline-none focus-visible:outline-none" />
                </div>
                <AnimatePresence>
                  {limitN > 0 && (
                    <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 text-[15px] text-smoke">
                      Isso dá uns <span className="num text-ink">R$ {int(limitN / 30)}</span> por dia.
                    </motion.p>
                  )}
                </AnimatePresence>
              </Ask>
            )}
            {step === 3 && (
              <Ask title={`Tudo pronto${name.trim() ? `, ${name.trim().split(" ")[0]}` : ""}.`} sub="Quer ver o app funcionando com dados de exemplo, ou começar do seu jeito?">
                <div className="mt-2 space-y-3">
                  <Choice disabled={pending} onClick={() => finish(true)} title="Ver com exemplo" text="Um mês já preenchido para você explorar." />
                  <Choice disabled={pending} onClick={() => finish(false)} title="Começar do zero" text="Você lança os seus primeiros gastos." />
                </div>
                {pending && <p className="mt-4 text-center text-sm text-mute">Preparando seu mês…</p>}
              </Ask>
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      {step < 3 && (
        <motion.button whileTap={{ scale: 0.97 }} disabled={blocked} onClick={() => go(step + 1)}
          className="disabled:opacity-30 relative flex h-14 w-full items-center justify-center gap-2 rounded-[28px] bg-ink font-semibold text-cotton">
          {step === 0 ? "Começar" : step === 2 && !limitN ? "Pular" : "Continuar"} <ArrowRight size={18} />
        </motion.button>
      )}
    </main>
  )
}

function Welcome() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-10">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ...spring }}
        className="rounded-[30px] bg-paper p-1.5 shadow-[inset_0_1px_0_#fff,0_20px_40px_-24px_rgb(31_40_46/0.5)]">
        <div className="flex justify-between px-3 pb-3 pt-2.5 text-sm text-smoke"><span>Livre até dia 30</span><span className="num text-mute">23 dias</span></div>
        <div className="rounded-[24px] bg-white p-5">
          <p className="num text-[44px] leading-none"><span className="mr-1 text-[20px] text-faint">R$</span>3.272<span className="text-[20px] text-faint">,40</span></p>
          <div className="mt-5 flex h-4 gap-[3px]">
            {Array.from({ length: 30 }, (_, i) => (
              <motion.span key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                transition={{ delay: 0.4 + i * 0.025, type: "spring", stiffness: 500, damping: 14 }}
                className="flex-1 origin-bottom rounded-[3px]" style={{ background: i < 6 ? "#1F282E" : i === 6 ? "#FF4E20" : "#DAD8CF" }} />
            ))}
          </div>
        </div>
      </motion.div>
      <div>
        <h1 className="ttl text-[40px] leading-[1.02]">Quanto ainda cabe<br />no seu mês.</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-smoke">Sem planilha. O Fluxo mostra todo dia quanto você pode gastar sem apertar.</p>
      </div>
    </div>
  )
}

function Ask({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col pt-14">
      <h1 className="ttl text-[34px] leading-[1.05]">{title}</h1>
      <p className="mb-10 mt-2 text-[15px] text-smoke">{sub}</p>
      {children}
    </div>
  )
}

function Choice({ title, text, onClick, disabled }: { title: string; text: string; onClick: () => void; disabled: boolean }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} disabled={disabled} onClick={onClick}
      className="flex w-full items-center justify-between rounded-[26px] bg-white p-5 text-left transition disabled:opacity-40">
      <span>
        <span className="ttl block text-[18px]">{title}</span>
        <span className="mt-0.5 block text-sm text-mute">{text}</span>
      </span>
      <span className="grid size-10 place-items-center rounded-full bg-cotton"><ArrowRight size={16} /></span>
    </motion.button>
  )
}
