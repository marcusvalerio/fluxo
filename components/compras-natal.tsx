"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { brl } from "@/lib/finance"

type Item = { nome: string; valor: number; ok: boolean }
const KEY = "fluxo-compras-natal"
const PADRAO: Item[] = [{ nome: "Ceia", valor: 300, ok: false }]

/** Compras de fim de ano: quanto separar pros presentes e pra ceia, e quem ainda falta. Fica guardado no aparelho. */
export function ComprasNatal() {
  const [itens, setItens] = useState<Item[]>(PADRAO)
  const [nome, setNome] = useState(""), [valor, setValor] = useState("")
  useEffect(() => { try { const v = localStorage.getItem(KEY); if (v) setItens(JSON.parse(v)) } catch {} }, [])
  const salvar = (v: Item[]) => { setItens(v); try { localStorage.setItem(KEY, JSON.stringify(v)) } catch {} }
  const total = itens.reduce((a, i) => a + i.valor, 0), gasto = itens.filter((i) => i.ok).reduce((a, i) => a + i.valor, 0)
  const falta = itens.filter((i) => !i.ok).length
  const fala = !itens.length ? "Monta a lista que eu fico de olho." : falta === 0 ? "Lista fechada! Papai Noel ficou com inveja." : falta === 1 ? "Só falta 1. Bora fechar essa lista." : `Faltam ${falta}. Tá dentro, sem pânico.`
  return (
    <section className="relative flex flex-col gap-3 overflow-hidden rounded-[24px] bg-[linear-gradient(160deg,#24345A,#1B2440)] p-4 text-[#F7F7F7]">
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0,rgb(242_194_94/0.18),transparent_50%)]" />
      <div className="relative flex items-start justify-between">
        <div><small className="text-[12px] text-[#B9C8DD]">Compras de fim de ano</small>
          <p className="num text-[30px] leading-tight">{brl(gasto, false)}</p>
          <small className="text-[12px] text-[#B9C8DD]">de {brl(total, false)} planejados</small></div>
        <svg viewBox="0 0 60 70" className="w-[52px] origin-bottom animate-[nt-wob_3s_ease-in-out_infinite]" aria-hidden><rect x="6" y="26" width="48" height="40" rx="6" fill="#C24B3C" /><rect x="2" y="18" width="56" height="12" rx="4" fill="#E06A5B" /><rect x="26" y="18" width="8" height="48" fill="#F2C25E" /><path d="M30 18 q-16 -18 -20 -2 q12 6 20 2 q16 -18 20 -2 q-12 6 -20 2" fill="#F2C25E" /></svg>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-white/10"><i className="block h-full rounded-full bg-[linear-gradient(90deg,#F2C25E,#C24B3C)] transition-[width] duration-700" style={{ width: `${total ? (gasto / total) * 100 : 0}%` }} /></div>
      <ul className="relative flex flex-col">
        {itens.map((it, i) => (
          <li key={i} className="flex items-center gap-2.5 border-t border-white/10 py-2">
            <button onClick={() => salvar(itens.map((x, j) => (j === i ? { ...x, ok: !x.ok } : x)))} aria-label={`Marcar ${it.nome}`}
              className={`grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] text-[12px] ${it.ok ? "border-[#7CC4A2] bg-[#7CC4A2] text-[#0F1524]" : "border-white/30"}`}>{it.ok ? "✓" : ""}</button>
            <span className={`flex-1 text-[14px] ${it.ok ? "line-through opacity-55" : ""}`}>{it.nome}</span>
            <span className="num text-[13.5px] text-[#B9C8DD]">{brl(it.valor, false)}</span>
            <button onClick={() => salvar(itens.filter((_, j) => j !== i))} aria-label={`Tirar ${it.nome}`} className="px-1 text-[15px] text-white/40">×</button>
          </li>
        ))}
      </ul>
      <form className="relative flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = Number(valor.replace(/\./g, "").replace(",", ".")); if (!nome.trim() || !v) return; salvar([...itens, { nome: nome.trim().slice(0, 30), valor: v, ok: false }]); setNome(""); setValor("") }}>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Presente pra…" aria-label="Pra quem" className="min-w-0 flex-1 rounded-full bg-white/10 px-3.5 py-2 text-[14px] text-white outline-none placeholder:text-white/40" />
        <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="R$" aria-label="Valor" className="num w-20 rounded-full bg-white/10 px-3 py-2 text-[14px] text-white outline-none placeholder:text-white/40" />
        <button type="submit" aria-label="Adicionar" className="grid size-9 shrink-0 place-items-center rounded-full bg-[#F7F7F7] text-[#1B2440]"><Plus size={17} /></button>
      </form>
      <p className="relative text-[13px] text-[#B9C8DD]"><b className="text-white">Fluximetro:</b> {fala}</p>
    </section>
  )
}
