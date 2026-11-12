import type { AvatarDefinition } from "open-bot-avatar"

// Fluximetro: o mascote (e futuro agente) do Fluxo.
// Um medidor de painel com dois terminais, no formato do open-bot-avatar:
// um caminho SVG numa caixa 0 0 100 100 e a posição dos olhos. Cor, volume e
// movimento ficam por conta do motor do avatar.
export const FLUXIMETRO: AvatarDefinition = {
  version: 1,
  id: "fluximetro",
  name: "Fluximetro",
  body: {
    path:
      // corpo do medidor (contorno no sentido horário)
      "M28 20H72A16 16 0 0 1 88 36V56A16 16 0 0 1 72 72H28A16 16 0 0 1 12 56V36A16 16 0 0 1 28 20Z" +
      // terminal esquerdo
      "M29 68H35A3 3 0 0 1 38 71V80A3 3 0 0 1 35 83H29A3 3 0 0 1 26 80V71A3 3 0 0 1 29 68Z" +
      // terminal direito
      "M65 68H71A3 3 0 0 1 74 71V80A3 3 0 0 1 71 83H65A3 3 0 0 1 62 80V71A3 3 0 0 1 65 68Z",
  },
  eyes: { x: 50, y: 45, spacing: 18, scale: 1.15 },
}

/** O laranja do Fluxo. */
export const FLUXIMETRO_COLOR = "#FF4E20"

export type FluximetroMood = "idle" | "thinking" | "happy"
