"use client"

import { useEffect, useState, useTransition } from "react"
import { Check, Copy, RotateCcw } from "lucide-react"
import { Cofrinho } from "./cofrinho"
import { Sheet } from "./ui"
import { getShortcutToken } from "@/app/actions"

/** Link do atalho pronto no iCloud. Enquanto estiver vazio, a página mostra o passo a passo pra montar. */
export const ATALHO_ICLOUD = ""

const PASSOS = [
  "Abra o app Atalhos e toque em Automação, depois no +.",
  "Escolha Carteira. Marque os cartões e deixe em Executar imediatamente.",
  "Adicione a ação Obter conteúdo do URL e cole o seu endereço (logo acima).",
  "Em Método escolha POST e em Corpo da solicitação escolha JSON.",
  "Adicione três campos de texto: valor com Quantia, local com Comerciante e cartao com Cartão ou Passe.",
  "Pronto. A próxima compra no Apple Pay já aparece no Fluxo.",
]

/** Atalho do Apple Pay: cada compra feita com o iPhone entra sozinha no Fluxo. */
export function Atalho({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [token, setToken] = useState("")
  const [copied, setCopied] = useState(false)
  const [pending, start] = useTransition()
  useEffect(() => { if (open && !token) start(async () => setToken(await getShortcutToken())) }, [open, token])
  const url = token ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/atalho?t=${token}` : ""
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {} }
  return (
    <Sheet open={open} onClose={onClose} title="Atalho do Apple Pay">
      <div className="flex flex-col gap-4 px-1">
        <div className="flex items-end gap-3">
          <span className="w-16 shrink-0"><Cofrinho state="moeda" label="" /></span>
          <p className="mb-2 rounded-[18px] rounded-bl-[6px] bg-card px-4 py-3 text-[14px] leading-snug">Pagou com o iPhone, eu anoto sozinho. Você nem precisa abrir o app. Eu, por outro lado, vou ver tudo.</p>
        </div>

        <section className="flex flex-col gap-2 rounded-[22px] bg-card p-4">
          <p className="text-[13px] font-semibold text-mute">Seu endereço secreto</p>
          <p className="num select-all break-all rounded-[14px] bg-cotton px-3 py-2.5 text-[13px]">{url || (pending ? "Gerando…" : "")}</p>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button disabled={!url} onClick={copy} className="flex h-11 items-center justify-center gap-2 rounded-[14px] bg-ink text-[14px] font-semibold text-cotton disabled:opacity-40">{copied ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar endereço</>}</button>
            <button disabled={pending} onClick={() => start(async () => setToken(await getShortcutToken(true)))} aria-label="Gerar endereço novo" title="Gerar endereço novo (o antigo para de funcionar)" className="grid size-11 place-items-center rounded-[14px] bg-cotton text-smoke"><RotateCcw size={16} /></button>
          </div>
          <p className="text-[12px] leading-snug text-mute">Quem tiver esse endereço consegue lançar gastos no seu Fluxo. Não mande pra ninguém. Se vazar, toque na setinha pra gerar outro.</p>
        </section>

        {ATALHO_ICLOUD && (
          <a href={ATALHO_ICLOUD} target="_blank" rel="noopener" className="flex h-14 items-center justify-center rounded-[28px] bg-otan font-semibold text-white">Instalar o atalho</a>
        )}

        <section className="rounded-[22px] bg-card px-4 py-2">
          <p className="py-2 text-[13px] font-semibold text-mute">{ATALHO_ICLOUD ? "Depois de instalar" : "Como montar (uma vez só)"}</p>
          <ol className="flex flex-col">
            {PASSOS.map((p, i) => (
              <li key={i} className="flex gap-3 border-t border-cotton py-3 text-[14px] leading-snug text-smoke"><span className="num grid size-6 shrink-0 place-items-center rounded-full bg-otan/12 text-[12px] font-bold text-otan">{i + 1}</span>{p}</li>
            ))}
          </ol>
        </section>
        <p className="px-2 text-center text-[12px] text-mute">A categoria sai do nome da loja. Se o nome do cartão bater com um da sua Carteira, a compra entra na fatura dele.</p>
      </div>
    </Sheet>
  )
}
