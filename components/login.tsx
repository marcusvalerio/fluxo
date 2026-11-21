"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useState, useTransition } from "react"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import { login } from "@/app/actions"
import { spring } from "./ui"
import { Wordmark } from "./logo"

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
      else window.location.href = "/"
    })
  }

  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-[#1B2440] text-[#F7F7F7]" style={{ colorScheme: "dark" }}>
      {/* aura com as cores da paleta, passando devagar */}
      <div aria-hidden className="aura pointer-events-none absolute inset-[-20%] -z-10"><i className="a1" /><i className="a2" /><i className="a3" /><i className="a4" /></div>
      <div aria-hidden className="grain-bg pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]">
        <motion.a href="/" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="self-start" aria-label="Fluxo, página inicial">
          <Wordmark size={22} color="#F7F7F7" />
        </motion.a>

        <motion.div initial={{ opacity: 0, y: 20, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ ...spring, delay: 0.08 }}
          className="mt-auto pb-6">
          <h1 className="ttl text-[clamp(30px,8.2vw,42px)] leading-[1.02]">Quanto ainda cabe<br />no seu mês,<br /><span className="text-[#D3DCEA]">todo dia.</span></h1>
          <p className="mt-3 text-[15px] text-[#F7F7F7]/70">Bom te ver de novo. Entre com o e-mail e a senha que você recebeu.</p>
        </motion.div>

        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.16 }}
          className="space-y-2.5 rounded-[30px] border border-white/15 bg-white/[0.08] p-3.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_30px_60px_-30px_#000] backdrop-blur-[22px]">
          <label className="block">
            <span className="sr-only">E-mail</span>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
              className="h-13 w-full rounded-[16px] border border-white/12 bg-white/[0.06] px-4 py-3.5 text-[16px] text-[#F7F7F7] outline-none transition placeholder:text-[#F7F7F7]/45 focus:border-[#8FA4D0]" />
          </label>
          <label className="relative block">
            <span className="sr-only">Senha</span>
            <input type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha"
              className="w-full rounded-[16px] border border-white/12 bg-white/[0.06] py-3.5 pl-4 pr-14 text-[16px] text-[#F7F7F7] outline-none transition placeholder:text-[#F7F7F7]/45 focus:border-[#8FA4D0]" />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Esconder senha" : "Mostrar senha"}
              className="absolute right-1.5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-[#B9C8DD]">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </label>
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} role="alert" className="px-2 text-[14px] text-[#FFC9B8]">{error}</motion.p>
            )}
          </AnimatePresence>
          <motion.button whileTap={{ scale: 0.97 }} disabled={pending}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#F7F7F7] font-semibold text-[#1B2440] disabled:opacity-50">
            {pending ? "Entrando…" : <>Entrar <ArrowRight size={18} /></>}
          </motion.button>
        </motion.form>
        <p className="pt-4 text-center text-[12.5px] text-[#F7F7F7]/55">Esqueceu a senha? Peça uma nova para quem te deu acesso.</p>
      </div>
    </main>
  )
}
