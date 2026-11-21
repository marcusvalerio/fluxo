// Entradas programadas: salário, adiantamento, freela, aluguel recebido...
import type { Entrada, EntradaParte, Snapshot } from "./types"
import { daysInMonth } from "./dates"

/** N-ésimo dia útil (seg a sex) do mês de `ym` (YYYY-MM). Sem feriados, por enquanto. */
export function diaUtil(ym: string, n: number) {
  const dim = daysInMonth(ym + "-01")
  let c = 0
  for (let d = 1; d <= dim; d++) {
    const w = new Date(`${ym}-${String(d).padStart(2, "0")}T12:00:00Z`).getUTCDay()
    if (w !== 0 && w !== 6 && ++c === n) return d
  }
  return dim
}

/** Dia do mês em que uma parte cai (dia fixo vira o último dia em meses curtos). */
export function diaDaParte(p: EntradaParte, ym: string) {
  return p.util ? diaUtil(ym, p.dia) : Math.min(p.dia, daysInMonth(ym + "-01"))
}

export interface Prevista { entradaId: number; parte: number; nome: string; rotulo: string; dia: number; iso: string; valor: number; varia: boolean; recebida: boolean; atrasada: boolean }

/** Tudo que deve entrar no mês de `today`, com o que já foi confirmado. */
export function previstas(s: Snapshot): Prevista[] {
  const ym = s.today.slice(0, 7), hoje = Number(s.today.slice(8, 10))
  const out: Prevista[] = []
  for (const e of s.entradas ?? []) {
    e.partes.forEach((p, i) => {
      const dia = diaDaParte(p, ym)
      const recebida = (e.recebidas ?? []).includes(`${ym}:${i}`)
      out.push({ entradaId: e.id, parte: i, nome: e.nome, rotulo: e.partes.length > 1 ? (p.rotulo || `${i + 1}ª parte`) : "", dia, iso: `${ym}-${String(dia).padStart(2, "0")}`, valor: p.valor, varia: e.tipo === "varia", recebida, atrasada: !recebida && dia < hoje })
    })
  }
  return out.sort((a, b) => a.dia - b.dia)
}

/** Quanto ainda vai entrar este mês (não confirmado e ainda por vir ou atrasado). */
export const aEntrar = (s: Snapshot) => previstas(s).filter((p) => !p.recebida).reduce((a, p) => a + p.valor, 0)

/** A que vence hoje (ou atrasada) e ainda não foi confirmada: o Fluxo pergunta "Caiu?". */
export const perguntaDeHoje = (s: Snapshot) => previstas(s).find((p) => !p.recebida && p.dia <= Number(s.today.slice(8, 10)))

export type { Entrada }
