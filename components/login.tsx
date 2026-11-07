"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useState, useTransition } from "react"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import { login } from "@/app/actions"
import { spring } from "./ui"

export function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const [pending, start] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    start(async () => {
      const r = await login(email, password)
      if (r.error) setError(r.error)
    })
  }

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col overflow-hidden px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(56px,env(safe-area-inset-top))]">
      <div className="blob pointer-events-none absolute -right-24 -top-20 size-72 rounded-full bg-[radial-gradient(circle,rgb(255_78_32/0.25),transparent_70%)]" />

      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="ttl relative text-[22px]">
        fluxo<span className="text-otan">.</span>
      </motion.p>

      <motion.div initial={{ opacity: 0, y: 20, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ ...spring, delay: 0.08 }}
        className="relative mt-auto">
        <h1 className="ttl text-[38px] leading-[1.03]">Bom te ver<br />de novo.</h1>
        <p className="mt-2 text-[15px] text-smoke">Entre com o e-mail e a senha que você recebeu.</p>
      </motion.div>

      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.16 }}
        className="relative mt-8 space-y-3">
        <label className="block">
          <span className="sr-only">E-mail</span>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
            className="h-14 w-full rounded-[22px] bg-card px-5 text-[16px] outline-none ring-otan transition focus:ring-2 focus-visible:outline-none" />
        </label>
        <label className="relative block">
          <span className="sr-only">Senha</span>
          <input type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha"
            className="h-14 w-full rounded-[22px] bg-card pl-5 pr-14 text-[16px] outline-none ring-otan transition focus:ring-2 focus-visible:outline-none" />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Esconder senha" : "Mostrar senha"}
            className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-mute">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </label>
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} role="alert" className="px-2 text-[14px] text-gravy">{error}</motion.p>
          )}
        </AnimatePresence>
        <motion.button whileTap={{ scale: 0.97 }} disabled={pending}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[28px] bg-ink font-semibold text-cotton disabled:opacity-50">
          {pending ? "Entrando…" : <>Entrar <ArrowRight size={18} /></>}
        </motion.button>
        <p className="pt-2 text-center text-[13px] text-mute">Esqueceu a senha? Peça uma nova para quem te deu acesso.</p>
      </motion.form>
    </main>
  )
}
