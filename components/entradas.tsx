"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useState, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"
import type { Entrada, EntradaParte, Snapshot } from "@/lib/types"
import { brl } from "@/lib/finance"
import { diaDaParte, perguntaDeHoje, previstas } from "@/lib/entradas"
import { confirmarEntrada, deleteEntrada, saveEntrada } from "@/app/actions"
import { field, Label, Primary, Sheet, spring } from "./ui"
import { Icon } from "./icons"

type Modo = "fixo" | "util" | "dividido" | "varia"
const MODOS: { id: Modo; t: string; s: string }[] = [
  { id: "fixo", t: "Dia fixo", s: "todo dia 5" },
  { id: "util", t: "Dia útil", s: "5º dia útil" },
  { id: "dividido", t: "Dividido", s: "em duas ou mais" },
  { id: "varia", t: "Varia", s: "valor e data mudam" },
]
const quando = (p: EntradaParte) => (p.util ? `${p.dia}º dia útil` : `dia ${p.dia}`)

/** Aba Entradas da Carteira: o que deve cair no mês, numa linha do tempo, e a lista programada. */
export function Entradas({ snap }: { snap: Snapshot }) {
  const [edit, setEdit] = useState<Entrada | "nova" | null>(null)
  const prev = previstas(snap)
  const total = prev.reduce((a, p) => a + p.valor, 0)
  const ym = snap.today.slice(0, 7), hoje = Number(snap.today.slice(8, 10))
  const dim = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0).getDate()
  const max = Math.max(1, ...prev.map((p) => p.valor))

  return (
    <div className="flex flex-col gap-4">
      {snap.entradas.length === 0 ? (
        <div className="flex flex-col items-center rounded-[23px] bg-card px-6 py-8 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-cotton text-[#3E8A6A]"><Icon name="salary" size={24} active /></span>
          <p className="ttl mt-3 text-[18px]">Programe o que entra</p>
          <p className="mt-1 text-[14px] text-smoke">Salário, adiantamento, freela. O Fluxo já conta com esse dinheiro e, no dia, pergunta se caiu.</p>
          <button onClick={() => setEdit("nova")} className="mt-4 h-11 rounded-full bg-ink px-5 text-[14px] font-semibold text-cotton">Programar entrada</button>
        </div>
      ) : (
        <>
          <div className="rounded-[23px] bg-card p-4">
            <div className="flex items-end justify-between">
              <div><p className="text-[12px] text-mute">Esperado neste mês</p><p className="num text-[30px] leading-none">{brl(total, false)}</p></div>
              <span className="rounded-full bg-[#3E8A6A]/12 px-2.5 py-1 text-[11.5px] font-semibold text-[#3E8A6A]">{prev.length} {prev.length === 1 ? "entrada" : "entradas"}</span>
            </div>
            {/* linha do tempo: um palito por dia; as entradas sobem do tamanho do valor */}
            <div className="mt-4 grid h-[44px] items-end gap-[2px]" style={{ gridTemplateColumns: `repeat(${dim},1fr)` }}>
              {Array.from({ length: dim }, (_, i) => {
                const d = i + 1, e = prev.filter((p) => p.dia === d)
                const v = e.reduce((a, p) => a + p.valor, 0)
                return (
                  <motion.i key={d} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ ...spring, delay: i * 0.012 }} style={{ originY: 1, height: e.length ? `${30 + 70 * (v / max)}%` : d === hoje ? "100%" : "18%" }}
                    className={`block rounded-[3px] ${e.length ? (e.every((p) => p.recebida) ? "bg-[#3E8A6A]" : e.some((p) => p.varia) ? "bg-[repeating-linear-gradient(-45deg,#3E8A6A_0_2px,transparent_2px_5px)] shadow-[inset_0_0_0_1.5px_#3E8A6A]" : "bg-[#3E8A6A]/55") : d === hoje ? "mx-auto w-[3px] bg-otan" : "bg-sand"}`} />
                )
              })}
            </div>
            <div className="mt-1.5 flex justify-between text-[10.5px] text-faint"><span>1</span><span>hoje</span><span>{dim}</span></div>
          </div>

          <div className="rounded-[23px] bg-card px-4 py-1">
            {snap.entradas.map((e) => {
              const ps = prev.filter((p) => p.entradaId === e.id)
              const soma = e.partes.reduce((a, p) => a + p.valor, 0)
              return (
                <button key={e.id} onClick={() => setEdit(e)} className="flex w-full items-center gap-3 border-b border-sand py-3 text-left last:border-0">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#3E8A6A]/12 text-[#3E8A6A]"><Icon name="salary" size={20} /></span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[14px] font-semibold">{e.nome}</b>
                    <span className="mt-0.5 flex flex-wrap gap-1">
                      {e.partes.map((p, i) => (
                        <span key={i} className={`rounded-full px-2 py-0.5 text-[11px] ${ps[i]?.recebida ? "bg-[#3E8A6A]/12 text-[#3E8A6A]" : "bg-sand text-smoke"}`}>{quando(p)}{e.partes.length > 1 ? ` · ${brl(p.valor, false)}` : ""}{ps[i]?.recebida ? " ✓" : ""}</span>
                      ))}
                      {e.tipo === "varia" && <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] text-smoke">valor varia</span>}
                    </span>
                  </span>
                  <span className="num shrink-0 text-[15px] text-[#3E8A6A]">{e.tipo === "varia" ? "~" : "+"}{brl(soma, false)}</span>
                </button>
              )
            })}
          </div>
          <button onClick={() => setEdit("nova")} className="flex h-12 items-center justify-center gap-2 rounded-full border border-dashed border-sand-3 text-[14px] font-semibold text-ink"><Plus size={17} />Programar outra entrada</button>
        </>
      )}
      <EntradaSheet key={edit === "nova" ? "nova" : edit ? edit.id : "x"} entrada={edit} onClose={() => setEdit(null)} />
    </div>
  )
}

function EntradaSheet({ entrada, onClose }: { entrada: Entrada | "nova" | null; onClose: () => void }) {
  const e = entrada && entrada !== "nova" ? entrada : null
  const modo0: Modo = !e ? "fixo" : e.tipo === "varia" ? "varia" : e.partes.length > 1 ? "dividido" : e.partes[0]?.util ? "util" : "fixo"
  const [nome, setNome] = useState(e?.nome ?? "Salário")
  const [modo, setModo] = useState<Modo>(modo0)
  const [partes, setPartes] = useState<EntradaParte[]>(e?.partes.length ? e.partes : [{ dia: 5, util: false, valor: 0 }])
  const [perguntar, setPerguntar] = useState(e?.perguntar ?? true)
  const [erro, setErro] = useState("")
  const [pending, start] = useTransition()

  const trocar = (m: Modo) => {
    setModo(m)
    if (m === "dividido" && partes.length < 2) setPartes([{ dia: 20, util: false, valor: 0, rotulo: "Adiantamento" }, { dia: 5, util: true, valor: 0, rotulo: "Restante" }])
    if (m !== "dividido") setPartes([{ ...partes[0], util: m === "util", rotulo: "" }])
  }
  const set = (i: number, k: Partial<EntradaParte>) => setPartes(partes.map((p, j) => (j === i ? { ...p, ...k } : p)))
  const salvar = () => start(async () => {
    setErro("")
    const r = await saveEntrada({ id: e?.id, nome, tipo: modo === "varia" ? "varia" : "fixa", partes, perguntar })
    if (r.error) setErro(r.error); else onClose()
  })
  const apagar = () => e && start(async () => { await deleteEntrada(e.id); onClose() })

  return (
    <Sheet open={!!entrada} onClose={onClose} title={e ? "Editar entrada" : "Nova entrada"}>
      <div className="flex flex-col gap-5 pb-6">
        <label><Label>Nome</Label><input className={field} value={nome} onChange={(ev) => setNome(ev.target.value)} placeholder="Salário, freela, aluguel…" /></label>
        <div>
          <Label>Como cai?</Label>
          <div className="grid grid-cols-2 gap-2">
            {MODOS.map((m) => (
              <button key={m.id} type="button" onClick={() => trocar(m.id)}
                className={`rounded-[16px] border bg-card px-3 py-2.5 text-left transition ${modo === m.id ? "border-[var(--c-ink)] shadow-[inset_0_0_0_1.5px_var(--c-ink)]" : "border-sand"}`}>
                <b className="block text-[14px] font-semibold">{m.t}</b><span className="text-[12px] text-mute">{m.s}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>{modo === "dividido" ? "Partes" : modo === "varia" ? "Média e dia aproximado" : "Valor e dia"}</Label>
          <AnimatePresence initial={false}>
            {partes.map((p, i) => (
              <motion.div key={i} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-2 rounded-[18px] border border-sand bg-card p-3">
                {modo === "dividido" && <input className="bg-transparent text-[14px] font-semibold outline-none" value={p.rotulo ?? ""} onChange={(ev) => set(i, { rotulo: ev.target.value })} placeholder={`${i + 1}ª parte`} aria-label="Nome da parte" />}
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-mute">R$</span>
                  <input inputMode="decimal" className="num w-full min-w-0 bg-transparent text-[22px] outline-none" value={p.valor || ""} onChange={(ev) => set(i, { valor: Number(ev.target.value.replace(/\./g, "").replace(",", ".")) || 0 })} placeholder="0" aria-label="Valor" />
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  {modo === "dividido" && (
                    <select className="rounded-full bg-sand px-2.5 py-1.5" value={p.util ? "u" : "f"} onChange={(ev) => set(i, { util: ev.target.value === "u" })} aria-label="Tipo de dia">
                      <option value="f">dia</option><option value="u">dia útil</option>
                    </select>
                  )}
                  <span className="text-mute">{(modo === "util" || p.util) ? "" : "dia"}</span>
                  <input type="number" min={1} max={p.util ? 23 : 31} className="w-16 rounded-full bg-sand px-3 py-1.5 text-center" value={p.dia} onChange={(ev) => set(i, { dia: Number(ev.target.value) || 1 })} aria-label="Dia" />
                  {(modo === "util" || p.util) && <span className="text-mute">º dia útil</span>}
                  {modo === "dividido" && partes.length > 2 && <button type="button" onClick={() => setPartes(partes.filter((_, j) => j !== i))} className="ml-auto text-mute" aria-label="Remover parte"><Trash2 size={16} /></button>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {modo === "dividido" && partes.length < 6 && <button type="button" onClick={() => setPartes([...partes, { dia: 15, util: false, valor: 0 }])} className="self-start px-1 text-[13px] font-semibold text-otan">+ Adicionar parte</button>}
          {modo === "varia" && <p className="px-1 text-[12.5px] text-mute">Use uma média. No dia, você confirma quanto caiu de verdade.</p>}
        </div>
        <button type="button" onClick={() => setPerguntar(!perguntar)} className="flex items-center justify-between gap-3 rounded-[18px] bg-card p-4 text-left" aria-pressed={perguntar}>
          <span><b className="block text-[14px] font-semibold">Perguntar antes de lançar</b><span className="text-[12.5px] text-mute">No dia, o Fluxo pergunta se caiu e quanto.</span></span>
          <span className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition ${perguntar ? "bg-ink" : "bg-sand-2"}`}><span className={`absolute top-[3px] size-5 rounded-full bg-cotton transition-all ${perguntar ? "left-[21px]" : "left-[3px]"}`} /></span>
        </button>
        {erro && <p role="alert" className="px-1 text-[14px] text-gravy">{erro}</p>}
        <Primary onClick={salvar} disabled={pending}>{pending ? "Salvando…" : "Salvar entrada"}</Primary>
        {e && <button type="button" onClick={apagar} className="text-[14px] font-semibold text-mute">Apagar entrada</button>}
      </div>
    </Sheet>
  )
}

/** No dia (ou depois, se atrasou): cartão "Caiu?" no Início. Confirmar lança a entrada com o valor certo. */
export function CaiuCard({ snap }: { snap: Snapshot }) {
  const p = perguntaDeHoje(snap)
  const [valor, setValor] = useState(p ? String(p.valor) : "")
  const [mexer, setMexer] = useState(false)
  const [oculto, setOculto] = useState(false)
  const [pending, start] = useTransition()
  if (!p || oculto) return null
  const e = snap.entradas.find((x) => x.id === p.entradaId)
  if (e && !e.perguntar) return null
  const v = Number(valor.replace(/\./g, "").replace(",", ".")) || p.valor
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring}
      className="flex flex-col gap-3 rounded-[24px] bg-[linear-gradient(160deg,#5A72A8,#3B5285_55%,#24345A)] p-4 text-[#F7F7F7]">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-[14px] bg-white/15"><Icon name="salary" size={22} active /></span>
        <div className="min-w-0"><b className="ttl block text-[18px] leading-tight">Caiu {/sal[aá]rio/i.test(p.nome) ? "o salário" : p.nome.toLowerCase()}?</b>
          <span className="text-[12.5px] text-[#D3DCEA]">{p.rotulo ? `${p.rotulo} · ` : ""}{p.atrasada ? `era pro dia ${p.dia}` : "era pra hoje"}{p.varia ? " · valor varia" : ""}</span></div>
      </div>
      <div className="flex items-baseline justify-between rounded-[16px] bg-white/10 px-3.5 py-2.5">
        {mexer
          ? <input autoFocus inputMode="decimal" className="num w-full bg-transparent text-[26px] text-white outline-none" value={valor} onChange={(ev) => setValor(ev.target.value)} aria-label="Quanto caiu" />
          : <span className="num text-[26px]">{brl(v)}</span>}
        {!mexer && <button onClick={() => setMexer(true)} className="shrink-0 text-[12.5px] font-semibold text-[#D3DCEA]">Mudar valor</button>}
      </div>
      <div className="grid grid-cols-[1fr_1.4fr] gap-2">
        <button onClick={() => setOculto(true)} className="h-11 rounded-full border border-white/25 text-[14px] font-semibold">Ainda não</button>
        <button disabled={pending} onClick={() => start(async () => { await confirmarEntrada(p.entradaId, p.parte, v); setOculto(true) })}
          className="h-11 rounded-full bg-[#F7F7F7] text-[14px] font-semibold text-[#1B2440] disabled:opacity-60">{pending ? "Lançando…" : "Sim, caiu"}</button>
      </div>
    </motion.div>
  )
}

/** Próximas entradas do mês, pra lista do Início. */
export function ProximasEntradas({ snap, onOpen }: { snap: Snapshot; onOpen: () => void }) {
  const lista = previstas(snap).filter((p) => !p.recebida).slice(0, 3)
  if (!lista.length) return null
  const hoje = Number(snap.today.slice(8, 10))
  return (
    <div className="rounded-[23px] bg-card px-4 py-1">
      <div className="flex items-center justify-between pb-1 pt-3"><b className="text-[13px] font-semibold text-mute">Próximas entradas</b><button onClick={onOpen} className="text-[12.5px] font-semibold text-otan">Ver todas</button></div>
      {lista.map((p) => (
        <div key={`${p.entradaId}-${p.parte}`} className="flex items-center gap-3 border-b border-sand py-2.5 last:border-0">
          <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-[#3E8A6A]/12 text-[#3E8A6A]"><Icon name="salary" size={19} /></span>
          <span className="min-w-0 flex-1"><b className="block truncate text-[13.5px] font-medium">{p.nome}{p.rotulo ? ` · ${p.rotulo}` : ""}</b><span className="text-[12px] text-faint">dia {p.dia}{p.dia > hoje ? ` · em ${p.dia - hoje} ${p.dia - hoje === 1 ? "dia" : "dias"}` : p.dia === hoje ? " · hoje" : " · atrasada"}</span></span>
          <span className="num text-[14px] text-[#3E8A6A]">{p.varia ? "~" : "+"}{brl(p.valor, false)}</span>
        </div>
      ))}
    </div>
  )
}

export { diaDaParte }
