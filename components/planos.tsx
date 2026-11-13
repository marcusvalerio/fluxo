"use client"

import { Check } from "lucide-react"
import { Cofrinho } from "./cofrinho"
import { Sheet } from "./ui"

const PRO = ["Quanto ainda cabe, plano e metas", "Lançar do seu jeito, sem limite", "Retrospectiva a cada salário", "Fluximetro com IA: pergunte qualquer coisa"]
const MASTER = ["Tudo do Pro", "Pagar contas e fazer Pix pelo chat", "Contas do banco ligadas sozinhas", "Casa compartilhada: dividir contas com quem mora junto", "Retrospectiva em vídeo pra postar"]

function Lista({ itens, dark }: { itens: string[]; dark?: boolean }) {
  return (
    <ul className="flex flex-col gap-2.5 text-[14px]">
      {itens.map((t) => (
        <li key={t} className="flex items-start gap-2.5"><span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-otan text-white"><Check size={11} strokeWidth={3.5} /></span><span className={dark ? "text-cotton/90" : "text-smoke"}>{t}</span></li>
      ))}
    </ul>
  )
}

/** Planos: por enquanto, fase de testes com tudo liberado. Pro e Master chegam depois. */
export function Planos({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Planos">
      <div className="flex flex-col gap-4 px-1">
        <h1 className="ttl text-[32px] leading-[1.05]">Escolha seu<br />nível de controle</h1>
        <div className="flex items-center gap-3 rounded-[22px] bg-[#E3F3EA] p-4 dark:bg-[#173026]">
          <span className="w-11 shrink-0"><Cofrinho state="feliz" label="" /></span>
          <p className="text-[14px] leading-snug text-ink"><b>Fase de testes:</b> tudo liberado, sem pagar nada. Quando os planos chegarem, eu te aviso antes.</p>
        </div>
        <section className="flex flex-col gap-3 rounded-[26px] bg-card p-5">
          <h2 className="ttl flex items-center gap-2 text-[24px]">Pro <span className="rounded-full bg-otan px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">EM BREVE</span></h2>
          <p className="num text-[30px]">R$ —<span className="text-[14px] font-medium text-mute"> /mês</span></p>
          <Lista itens={PRO} />
        </section>
        <section className="flex flex-col gap-3 rounded-[26px] bg-ink p-5 text-cotton">
          <h2 className="ttl flex items-center gap-2 text-[24px]">Master <span className="rounded-full bg-otan px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">EM BREVE</span></h2>
          <p className="num text-[30px]">R$ —<span className="text-[14px] font-medium opacity-60"> /mês</span></p>
          <Lista itens={MASTER} dark />
        </section>
      </div>
    </Sheet>
  )
}
