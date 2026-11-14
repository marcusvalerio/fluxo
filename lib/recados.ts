// Recados do Fluximetro pras notificações: um por dia, o que for mais importante agora.
import type { Snapshot } from "./types"
import type { Analysis } from "./finance"

const brl = (n: number) => "R$ " + Math.round(n).toLocaleString("pt-BR")
const pick = <T,>(a: T[], seed: number) => a[seed % a.length]

export function recadoDoDia(s: Snapshot, a: Analysis): { title: string; body: string } | null {
  const dia = Number(s.today.slice(8, 10))
  const semana = new Date(s.today + "T12:00:00Z").getUTCDay() // 0 dom … 5 sex
  const nome = s.space.name.split(" ")[0]
  const seed = dia + semana

  const vence = s.bills.filter((b) => !b.paid && (b.dueDay === dia || b.dueDay === dia + 1))
  if (vence.length) {
    const b = vence[0], hoje = b.dueDay === dia
    return { title: hoje ? `${b.name} vence hoje` : `${b.name} vence amanhã`, body: `${brl(b.amount)}. Eu lembro pra você poder esquecer. Mas não esquece.` }
  }
  const salario = s.txs.some((t) => t.kind === "income" && t.date === s.today && /sal[aá]rio|pagamento|holerite/i.test(t.description))
  if (salario) return { title: "Caiu o salário", body: `Opa, ${nome}! Separa o das metas antes que o iFood veja.` }
  if (a.budget > 0 && a.free < 0) return { title: "O mês passou do teto", body: pick([`Tá ${brl(-a.free)} acima. Bora segurar até o próximo salário? Eu seguro sua mão.`, `${brl(-a.free)} acima do teto. Hoje o almoço é marmita, combinado?`], seed) }
  if (a.budget > 0 && a.free / a.budget < 0.15) return { title: `Faltam ${a.daysLeft} dias`, body: `Dá uns ${brl(a.perDay)} por dia. Aperta, mas cabe. Eu confio em você. Mais ou menos.` }
  if (semana === 5) return { title: "Sexta-feira", body: pick(["Sextou. O motoboy já tá de capacete esperando seu pedido.", "Sexta! Lembra que o fim de semana também é do mês."], seed) }
  if (dia === 1) return { title: "Mês novo", body: `Página em branco, ${nome}. Bora fazer esse ser o mês que sobra.` }
  if (a.budget > 0) return { title: `Hoje cabem ${brl(a.perDay)}`, body: pick(["Gasta com carinho. Eu tô de olho.", "Tudo nos trilhos. Continua assim que eu fico quietinho.", "Seu dinheiro acordou bem hoje."], seed) }
  return null
}
