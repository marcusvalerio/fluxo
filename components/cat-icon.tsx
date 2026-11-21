import { CircleDashed, GraduationCap, PartyPopper, Repeat, Tag, TrendingUp, Utensils, type LucideIcon } from "lucide-react"
import { Icon, type IconName } from "./icons"

// categorias com ícone de traço animado da marca; o resto usa um traço parecido
const NOSSOS: Record<string, IconName> = {
  Mercado: "cart", Delivery: "bag", Transporte: "car", Moradia: "home", Contas: "bolt", Saúde: "health",
  Compras: "bag", Cartão: "wallet", Salário: "salary", Freelance: "salary", Presente: "goal", Trabalho: "salary",
}
const OUTROS: Record<string, LucideIcon> = { Alimentação: Utensils, Lazer: PartyPopper, Assinaturas: Repeat, Educação: GraduationCap, Investimentos: TrendingUp, Vendas: Tag }

/** Ícone da categoria num azulejo arredondado: entradas em verde, saídas em névoa. Mexe quando o dedo passa. */
export function CatIcon({ category, income, size = 40 }: { category: string; income?: boolean; size?: number }) {
  const n = NOSSOS[category]
  const L = OUTROS[category] ?? CircleDashed
  const s = Math.round(size * 0.5)
  return (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-[34%]"
      style={{ width: size, height: size, background: income ? "rgb(62 138 106 / 0.13)" : "var(--c-sand)", color: income ? "var(--c-pos)" : "var(--c-ink)" }}>
      {n ? <Icon name={n} size={s} /> : <L size={s} strokeWidth={2} />}
    </span>
  )
}
