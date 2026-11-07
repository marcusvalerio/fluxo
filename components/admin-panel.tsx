"use client"

import { motion } from "framer-motion"
import { useState, useTransition } from "react"
import { ArrowLeft, Check, Copy, KeyRound, LogOut, Plus, Power } from "lucide-react"
import { brl, int } from "@/lib/finance"
import { createUser, resetPassword, setActive } from "@/app/admin/actions"
import { logout } from "@/app/actions"
import { field, Label, Primary, rise, Sheet, spring } from "./ui"

export interface AdminData {
  me: string
  totals: { usuarios: number; ativos7: number; lanc30: number; gastoMes: number; entradaMes: number }
  daily: { day: string; n: number }[]
  users: {
    id: string; name: string; email: string; role: "admin" | "user"; active: boolean; pending: boolean; onboarded: boolean
    createdAt: string; lastLogin: string | null; lastTx: string | null; gasto: number; entrada: number; lancamentos: number
  }[]
  feed: { id: number; kind: "income" | "expense"; amount: number; description: string; category: string; createdAt: string; user: string }[]
}

const rel = (iso: string | null) => {
  if (!iso) return "nunca"
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return "agora"
  if (m < 60) return `há ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  return d === 1 ? "ontem" : `há ${d} dias`
}

export function AdminPanel({ data }: { data: AdminData }) {
  const [creating, setCreating] = useState(false)
  const [secret, setSecret] = useState<{ name: string; email: string; password: string } | null>(null)
  const [pending, start] = useTransition()
  const peak = Math.max(1, ...data.daily.map((d) => d.n))

  const reset = (u: AdminData["users"][number]) => start(async () => {
    if (!confirm(`Gerar uma nova senha temporária para ${u.name}? A senha atual deixa de funcionar.`)) return
    const r = await resetPassword(u.id)
    setSecret({ name: u.name, email: u.email, password: r.password })
  })
  const toggle = (u: AdminData["users"][number]) => start(async () => {
    if (u.active && !confirm(`Desativar ${u.name}? A pessoa perde o acesso até você reativar.`)) return
    const r = await setActive(u.id, !u.active)
    if (r.error) alert(r.error)
  })

  return (
    <div className="relative mx-auto min-h-dvh max-w-[1100px] overflow-x-clip px-4 pb-16 pt-[max(28px,env(safe-area-inset-top))] sm:px-8">
      <div className="blob pointer-events-none absolute -right-20 -top-16 size-72 rounded-full bg-[radial-gradient(circle,rgb(255_78_32/0.22),transparent_70%)]" />

      <motion.header {...rise} transition={spring} className="relative flex flex-wrap items-center justify-between gap-3 pb-6">
        <div className="flex items-center gap-3">
          <a href="/" className="lg grid size-11 place-items-center rounded-full" aria-label="Voltar ao app"><ArrowLeft size={18} /></a>
          <div>
            <p className="text-[13px] text-mute">fluxo · admin</p>
            <h1 className="ttl text-[30px] leading-tight">Movimentação</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setCreating(true)} className="flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-semibold text-cotton">
            <Plus size={16} /> Nova conta
          </motion.button>
          <button onClick={() => start(() => logout())} className="lg grid size-11 place-items-center rounded-full" aria-label="Sair"><LogOut size={17} /></button>
        </div>
      </motion.header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Contas", int(data.totals.usuarios), `${data.totals.ativos7} entraram nos últimos 7 dias`],
          ["Lançamentos", int(data.totals.lanc30), "nos últimos 30 dias"],
          ["Saiu no mês", brl(data.totals.gastoMes, false), "somando todas as contas"],
          ["Entrou no mês", brl(data.totals.entradaMes, false), "somando todas as contas"],
        ].map(([t, v, s], i) => (
          <motion.section key={t} {...rise} transition={{ ...spring, delay: 0.04 * i }} className="rounded-[26px] bg-white p-5">
            <p className="text-[13px] text-mute">{t}</p>
            <p className="num mt-1 text-[28px] leading-tight">{v}</p>
            <p className="mt-1 text-[12px] text-mute">{s}</p>
          </motion.section>
        ))}
      </div>

      <motion.section {...rise} transition={{ ...spring, delay: 0.15 }} className="mt-3 rounded-[26px] bg-white p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[14px] font-semibold">Lançamentos por dia</p>
          <p className="text-[12px] text-mute">últimos 30 dias</p>
        </div>
        <div className="mt-4 flex h-28 items-end gap-[3px]">
          {data.daily.map((d, i) => (
            <motion.span key={d.day} title={`${d.day}: ${d.n}`} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
              transition={{ delay: 0.2 + i * 0.015, type: "spring", stiffness: 160, damping: 18 }}
              className="flex-1 origin-bottom rounded-full"
              style={{ height: `${Math.max(4, (d.n / peak) * 100)}%`, background: i === data.daily.length - 1 ? "#FF4E20" : d.n ? "var(--c-ink)" : "var(--c-cotton)" }} />
          ))}
        </div>
      </motion.section>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <motion.section {...rise} transition={{ ...spring, delay: 0.2 }} className="rounded-[26px] bg-white p-2">
          <p className="px-3 pb-1 pt-3 text-[14px] font-semibold">Contas</p>
          <ul>
            {data.users.map((u) => (
              <li key={u.id} className={`flex flex-wrap items-center gap-3 rounded-[20px] px-3 py-3 hover:bg-cotton/50 ${u.active ? "" : "opacity-50"}`}>
                <span className="ttl grid size-10 shrink-0 place-items-center rounded-full bg-cotton text-[14px] text-smoke">{u.name[0]?.toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-[15px]">
                    {u.name}
                    {u.role === "admin" && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-cotton">admin</span>}
                    {u.pending && <span className="rounded-full bg-cotton px-2 py-0.5 text-[10px] font-semibold text-gravy">senha temporária</span>}
                    {!u.active && <span className="rounded-full bg-cotton px-2 py-0.5 text-[10px] font-semibold text-mute">desativada</span>}
                  </p>
                  <p className="truncate text-[12px] text-mute">{u.email} · entrou {rel(u.lastLogin)} · lançou {rel(u.lastTx)}</p>
                </div>
                <div className="text-right">
                  <p className="num text-[15px]">{brl(u.gasto, false)}</p>
                  <p className="text-[11px] text-mute">{u.lancamentos} lanç. em 30 dias</p>
                </div>
                <div className="flex gap-1">
                  <button disabled={pending} onClick={() => reset(u)} className="grid size-9 place-items-center rounded-full text-smoke hover:bg-cotton" aria-label={`Nova senha para ${u.name}`} title="Gerar nova senha"><KeyRound size={16} /></button>
                  {u.id !== data.me && (
                    <button disabled={pending} onClick={() => toggle(u)} className={`grid size-9 place-items-center rounded-full hover:bg-cotton ${u.active ? "text-smoke" : "text-gravy"}`}
                      aria-label={u.active ? `Desativar ${u.name}` : `Reativar ${u.name}`} title={u.active ? "Desativar" : "Reativar"}><Power size={16} /></button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section {...rise} transition={{ ...spring, delay: 0.25 }} className="rounded-[26px] bg-white p-2">
          <p className="px-3 pb-1 pt-3 text-[14px] font-semibold">Últimos lançamentos</p>
          {data.feed.length === 0 && <p className="px-3 py-4 text-[14px] text-mute">Nada por aqui ainda.</p>}
          <ul className="max-h-[560px] overflow-y-auto">
            {data.feed.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className={`size-2 shrink-0 rounded-full ${t.kind === "income" ? "bg-gravy" : "bg-ink"}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px]"><span className="font-semibold">{t.user}</span> · {t.description}</p>
                  <p className="text-[11px] text-mute">{t.category} · {rel(t.createdAt)}</p>
                </div>
                <span className={`num text-[14px] ${t.kind === "income" ? "text-gravy" : ""}`}>{t.kind === "income" ? "+" : "−"}{brl(t.amount, false)}</span>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>

      <NewUserSheet open={creating} onClose={() => setCreating(false)} onCreated={(s) => { setCreating(false); setSecret(s) }} />
      <SecretSheet secret={secret} onClose={() => setSecret(null)} />
    </div>
  )
}

function NewUserSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (s: { name: string; email: string; password: string }) => void }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"user" | "admin">("user")
  const [error, setError] = useState("")
  const [pending, start] = useTransition()
  return (
    <Sheet open={open} onClose={onClose} title="Nova conta">
      <form className="space-y-3 px-1" onSubmit={(e) => {
        e.preventDefault(); setError("")
        start(async () => {
          const r = await createUser({ name, email, role })
          if (r.error) return setError(r.error)
          onCreated({ name, email: email.trim().toLowerCase(), password: r.password! })
          setName(""); setEmail(""); setRole("user")
        })
      }}>
        <label className="block"><Label>Nome</Label><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana Souza" className={field} /></label>
        <label className="block"><Label>E-mail</Label><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ana@email.com" className={field} /></label>
        <div className="flex gap-2 pt-1">
          {(["user", "admin"] as const).map((r) => (
            <button type="button" key={r} onClick={() => setRole(r)} className={`h-10 flex-1 rounded-full text-[13px] font-semibold ${role === r ? "bg-ink text-cotton" : "bg-white text-smoke"}`}>
              {r === "user" ? "Usuário" : "Admin"}
            </button>
          ))}
        </div>
        {error && <p className="px-1 text-[13px] text-gravy">{error}</p>}
        <div className="pt-2"><Primary type="submit" disabled={pending}>{pending ? "Criando…" : "Criar e gerar senha"}</Primary></div>
      </form>
    </Sheet>
  )
}

function SecretSheet({ secret, onClose }: { secret: { name: string; email: string; password: string } | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const msg = secret ? `Oi, ${secret.name.split(" ")[0]}! Seu acesso ao Fluxo:\n${typeof window !== "undefined" ? window.location.origin : ""}\nE-mail: ${secret.email}\nSenha temporária: ${secret.password}\nNo primeiro acesso você cria a sua senha.` : ""
  return (
    <Sheet open={!!secret} onClose={() => { setCopied(false); onClose() }} title="Acesso criado">
      {secret && (
        <div className="space-y-4 px-1">
          <p className="text-[14px] text-smoke">Envie para <b>{secret.name}</b>. Esta senha <b>só aparece agora</b>; no primeiro acesso a pessoa cria a própria.</p>
          <div className="rounded-[20px] bg-white p-4">
            <p className="text-[12px] text-mute">{secret.email}</p>
            <p className="num mt-1 select-all text-[26px] tracking-wide">{secret.password}</p>
          </div>
          <Primary onClick={async () => { await navigator.clipboard.writeText(msg); setCopied(true) }}>
            <span className="inline-flex items-center gap-2">{copied ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar mensagem de acesso</>}</span>
          </Primary>
        </div>
      )}
    </Sheet>
  )
}
