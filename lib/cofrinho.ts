// Fluximetro: o mascote do Fluxo, em forma de cofrinho.
// Ele muda de forma para mostrar o que está acontecendo (vira moeda, calendário, cartão, pontinhos...)
// e volta a ser cofrinho. Todas as formas ficam numa caixa 0 0 100 100.

export type CofrinhoState =
  | "normal" | "feliz" | "pensando" | "carregando" | "guardou"
  | "moeda" | "conta" | "fatura" | "ideia" | "apertado"

const C = (cx: number, cy: number, r: number) => `M${cx} ${cy - r}A${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}Z`
const RR = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`

export const COFRE = "M50 18C72 18 86 31 86 48C86 63 74 74 54 75H46C26 74 14 63 14 48C14 31 28 18 50 18Z"
const SQUASH = "M50 34C76 34 94 42 94 56C94 68 78 75 54 75H46C22 75 6 68 6 56C6 42 24 34 50 34Z"
const TALL = "M50 6C68 6 78 22 78 44C78 64 68 75 54 75H46C32 75 22 64 22 44C22 22 32 6 50 6Z"

export interface ShapeSpec {
  body: string[]
  eyes: "open" | "happy" | "tight" | "none"
  eyeY?: number
  legs: boolean
  deco?: "slot" | "ring" | "cal" | "card" | "spark"
}

export const SHAPES: Record<CofrinhoState, ShapeSpec> = {
  normal: { body: [COFRE], eyes: "open", legs: true, deco: "slot" },
  feliz: { body: [TALL], eyes: "happy", legs: true, deco: "slot" },
  pensando: { body: [C(24, 48, 10), C(50, 48, 10), C(76, 48, 10)], eyes: "none", legs: false },
  carregando: { body: ["M50 16A32 32 0 1 1 18 48H30A20 20 0 1 0 50 28Z"], eyes: "none", legs: false },
  guardou: { body: [COFRE], eyes: "happy", legs: true, deco: "slot" },
  moeda: { body: [C(50, 46, 32)], eyes: "happy", legs: true, deco: "ring" },
  conta: { body: [RR(16, 24, 68, 52, 10)], eyes: "open", eyeY: 56, legs: true, deco: "cal" },
  fatura: { body: [RR(6, 30, 88, 44, 9)], eyes: "open", eyeY: 58, legs: true, deco: "card" },
  ideia: { body: [COFRE], eyes: "open", legs: true, deco: "spark" },
  apertado: { body: [SQUASH], eyes: "tight", eyeY: 58, legs: true },
}

export const COFRINHO_COLOR = "#FF4E20"
export const COFRINHO_DARK = "#B83312"
export const COFRINHO_LEGS = "#E2401C"
