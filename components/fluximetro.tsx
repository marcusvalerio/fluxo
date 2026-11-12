"use client"

import { useEffect, useRef } from "react"
import type { MountedAvatar } from "open-bot-avatar/dom"
import { FLUXIMETRO, FLUXIMETRO_COLOR, type FluximetroMood } from "@/lib/fluximetro"

export interface FluximetroProps {
  size?: number
  mood?: FluximetroMood
  /** Para onde ele olha: x e y de -1 a 1. Sem isso, ele fica parado olhando para a frente. */
  look?: { x: number; y: number } | null
  /** Nome para leitores de tela. "" marca como decorativo. */
  label?: string
  className?: string
}

/**
 * O Fluximetro vivo. O motor do avatar é carregado só no navegador (import dinâmico),
 * então não pesa no servidor nem na primeira pintura do app.
 */
export function Fluximetro({ size = 96, mood = "idle", look = null, label = "Fluximetro", className }: FluximetroProps) {
  const host = useRef<HTMLDivElement>(null)
  const avatar = useRef<MountedAvatar | null>(null)
  const lx = look?.x
  const ly = look?.y
  const lookAt = lx === undefined || ly === undefined ? null : { x: lx, y: ly }

  // o que valer quando o motor terminar de carregar
  const latest = useRef({ mood, lookAt, label })
  latest.current = { mood, lookAt, label }

  useEffect(() => {
    let dead = false
    import("open-bot-avatar/dom").then(({ mountAvatar }) => {
      if (dead || !host.current) return
      avatar.current = mountAvatar(host.current, { definition: FLUXIMETRO, color: FLUXIMETRO_COLOR, ...latest.current })
    })
    return () => {
      dead = true
      avatar.current?.destroy()
      avatar.current = null
    }
  }, [])

  useEffect(() => {
    avatar.current?.update({ mood, lookAt: lx === undefined || ly === undefined ? null : { x: lx, y: ly }, label })
  }, [mood, lx, ly, label])

  return <div ref={host} className={className} style={{ width: size, aspectRatio: "1" }} />
}
