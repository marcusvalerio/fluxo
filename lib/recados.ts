// Recados do Fluximetro pras notificações: um por dia, o que for mais importante agora.
import type { Snapshot } from "./types"
import type { Analysis } from "./finance"
import { perguntaDeHoje } from "./entradas"

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
  // entrada programada pra hoje (ou atrasada) que ainda não foi confirmada
  const caiu = perguntaDeHoje(s)
  if (caiu && (s.entradas.find((e) => e.id === caiu.entradaId)?.perguntar ?? true))
    return { title: /sal[aá]rio/i.test(caiu.nome) ? "Caiu o salário?" : `Caiu ${caiu.nome}?`, body: `Era pra ser ${brl(caiu.valor)}${caiu.atrasada ? ` no dia ${caiu.dia}` : " hoje"}. Confirma no app que eu atualizo o mês.` }
  const salario = s.txs.some((t) => t.kind === "income" && t.date === s.today && /sal[aá]rio|pagamento|holerite/i.test(t.description))
  if (salario) return { title: "Caiu o salário", body: `Opa, ${nome}! Separa o das metas antes que o iFood veja.` }
  if (a.budget > 0 && a.free < 0) return { title: "O mês passou do teto", body: pick([`Tá ${brl(-a.free)} acima. Bora segurar até o próximo salário? Eu seguro sua mão.`, `${brl(-a.free)} acima do teto. Hoje o almoço é marmita, combinado?`], seed) }
  if (a.budget > 0 && a.free / a.budget < 0.15) return { title: `Faltam ${a.daysLeft} dias`, body: `Dá uns ${brl(a.perDay)} por dia. Aperta, mas cabe. Eu confio em você. Mais ou menos.` }
  if (semana === 5) return { title: "Sexta-feira", body: pick(["Sextou. O motoboy já tá de capacete esperando seu pedido.", "Sexta! Lembra que o fim de semana também é do mês."], seed) }
  if (dia === 1) return { title: "Mês novo", body: `Página em branco, ${nome}. Bora fazer esse ser o mês que sobra.` }
  if (a.budget > 0) return { title: `Hoje cabem ${brl(a.perDay)}`, body: pick(["Gasta com carinho. Eu tô de olho.", "Tudo nos trilhos. Continua assim que eu fico quietinho.", "Seu dinheiro acordou bem hoje."], seed) }
  return null
}

type Recado = { title: string; body: string; key: string }

/**
 * Tarde: só fala se algo está atrapalhando o mês (categoria passou ou chegando no limite,
 * categoria saindo bem mais que o normal, ou o dia de hoje já passou do que cabe).
 */
export function recadoDaTarde(s: Snapshot, a: Analysis): Recado | null {
  const by = (a.byCategory ?? {}) as Record<string, number>
  const lim = Object.entries(s.limits ?? {}).filter(([, v]) => v > 0)
  // passou do limite da categoria
  const over = lim.map(([c, l]) => ({ c, l, v: by[c] ?? 0 })).filter((x) => x.v > x.l).sort((x, y) => (y.v - y.l) - (x.v - x.l))[0]
  if (over) return { key: `lim:${over.c}`, title: `${over.c} passou do combinado`, body: `${brl(over.v - over.l)} acima do limite de ${brl(over.l)}. Segura um pouquinho até o fim do mês?` }
  // chegando no limite com muitos dias pela frente
  const near = lim.map(([c, l]) => ({ c, l, v: by[c] ?? 0 })).filter((x) => x.v >= x.l * 0.85 && a.daysLeft > 5).sort((x, y) => y.v / y.l - x.v / x.l)[0]
  if (near) return { key: `perto:${near.c}`, title: `${near.c} já usou ${Math.round((near.v / near.l) * 100)}% do limite`, body: `Sobram ${brl(near.l - near.v)} e ainda tem ${a.daysLeft} dias pela frente.` }
  // categoria saindo bem mais que no mesmo ponto do mês passado
  const fora = a.categories.filter((c) => c.name !== "Outros" && c.prev > 0).map((c) => {
    const esperado = c.prev * (a.dayOfMonth / a.dim)
    return { c: c.name, v: c.value, extra: c.value - esperado, r: esperado > 0 ? c.value / esperado : 0 }
  }).filter((x) => x.r > 1.4 && x.extra > 60).sort((x, y) => y.extra - x.extra)[0]
  if (fora) return { key: `ritmo:${fora.c}`, title: `${fora.c} tá saindo mais que o normal`, body: `${brl(fora.v)} até agora, uns ${brl(fora.extra)} a mais que nessa altura do mês passado.` }
  // o dia de hoje já passou do que cabe
  const hoje = a.days.find((d) => d.today)?.total ?? 0
  if (a.dailyCap > 0 && hoje > a.dailyCap * 1.3) return { key: "dia", title: `Hoje já saiu ${brl(hoje)}`, body: `O dia comporta uns ${brl(a.dailyCap)}. Dá pra segurar o resto do dia?` }
  return null
}

/** Noite: conta de amanhã, ou um fechamento do dia quando passou do que cabe. */
export function recadoDaNoite(s: Snapshot, a: Analysis): Recado | null {
  const dia = Number(s.today.slice(8, 10))
  // contas sempre lembram (de manhã e de noite), sem a trava de 3 dias: a chave leva a data
  const hojeVence = s.bills.filter((b) => !b.paid && b.dueDay === dia)
  if (hojeVence.length) {
    const total = hojeVence.reduce((x, b) => x + b.amount, 0)
    return { key: `conta:${s.today}`, title: hojeVence.length > 1 ? `${hojeVence.length} contas vencem hoje` : `${hojeVence[0].name} vence hoje`, body: `${brl(total)}. Já pagou? Se sim, marca no app pra eu parar de lembrar.` }
  }
  const amanha = s.bills.filter((b) => !b.paid && b.dueDay === dia + 1)
  if (amanha.length) {
    const total = amanha.reduce((x, b) => x + b.amount, 0)
    return { key: `conta:${s.today}`, title: amanha.length > 1 ? `Amanhã vencem ${amanha.length} contas` : `Amanhã vence ${amanha[0].name}`, body: `${brl(total)} no total. Já tá separado?` }
  }
  const hoje = a.days.find((d) => d.today)?.total ?? 0
  if (a.budget > 0 && a.free < 0 && hoje > 0) return { key: "teto", title: "Fechando o dia", body: `Hoje saíram ${brl(hoje)} e o mês tá ${brl(-a.free)} acima do teto. Amanhã é dia de segurar.` }
  if (a.dailyCap > 0 && hoje > a.dailyCap) return { key: "dia-noite", title: `Hoje saíram ${brl(hoje)}`, body: `Uns ${brl(hoje - a.dailyCap)} acima do que cabe no dia. Daqui pra frente cabem uns ${brl(a.perDay)} por dia.` }
  return null
}
