"use client"

import { useState } from "react"
import { Check, Copy, Share } from "lucide-react"
import { Cofrinho } from "./cofrinho"
import { Sheet } from "./ui"
import { compartilhar, conviteGeral } from "@/lib/convite"

/** Chamar amigos: a mensagem do Fluximetro pronta pra mandar. */
export function Convite({ open, onClose, nome }: { open: boolean; onClose: () => void; nome: string }) {
  const msg = conviteGeral(nome.split(" ")[0])
  const [st, setSt] = useState("")
  const copiar = async () => { try { await navigator.clipboard.writeText(msg); setSt("Copiado") } catch { setSt("Não deu pra copiar. Segura no texto pra selecionar.") } }
  return (
    <Sheet open={open} onClose={() => { setSt(""); onClose() }} title="Chamar amigos">
      <div className="flex flex-col gap-4 px-1">
        <div className="flex items-end gap-3">
          <span className="w-16 shrink-0"><Cofrinho state="feliz" label="" /></span>
          <p className="mb-2 rounded-[18px] rounded-bl-[6px] bg-card px-4 py-3 text-[14px] leading-snug">Deixa que eu me apresento. Escrevi isso aqui, é só mandar.</p>
        </div>
        <p className="select-text whitespace-pre-wrap rounded-[22px] bg-card p-4 text-[14px] leading-relaxed text-smoke">{msg}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={copiar} className="flex h-14 items-center justify-center gap-2 rounded-[28px] bg-card font-semibold">{st === "Copiado" ? <Check size={17} /> : <Copy size={17} />} {st === "Copiado" ? "Copiado" : "Copiar"}</button>
          <button onClick={async () => { const r = await compartilhar(msg); if (r === "copied") setSt("Copiado") }} className="flex h-14 items-center justify-center gap-2 rounded-[28px] bg-ink font-semibold text-cotton"><Share size={17} /> Enviar</button>
        </div>
        {st && st !== "Copiado" && <p className="text-center text-[13px] text-mute">{st}</p>}
      </div>
    </Sheet>
  )
}
