import {
  Bike, Briefcase, Car, CircleDashed, CreditCard, Gift, GraduationCap, HeartPulse, House, Laptop,
  PartyPopper, Receipt, Repeat, ShoppingBag, ShoppingCart, Tag, TrendingUp, Utensils, Wallet, type LucideIcon,
} from "lucide-react"

const ICONS: Record<string, LucideIcon> = {
  Alimentação: Utensils, Mercado: ShoppingCart, Delivery: Bike, Transporte: Car, Moradia: House, Contas: Receipt,
  Saúde: HeartPulse, Lazer: PartyPopper, Compras: ShoppingBag, Assinaturas: Repeat, Educação: GraduationCap,
  Cartão: CreditCard, Salário: Wallet, Freelance: Laptop, Investimentos: TrendingUp, Vendas: Tag, Presente: Gift,
  Trabalho: Briefcase,
}

/** Ícone da categoria num azulejo: entradas em tom quente, saídas em areia. */
export function CatIcon({ category, income, size = 40 }: { category: string; income?: boolean; size?: number }) {
  const Icon = ICONS[category] ?? CircleDashed
  return (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, background: income ? "rgb(255 78 32 / 0.12)" : "var(--c-cotton)", color: income ? "var(--c-gravy)" : "var(--c-smoke)" }}>
      <Icon size={Math.round(size * 0.45)} strokeWidth={1.9} />
    </span>
  )
}
