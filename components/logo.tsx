"use client"

import { useEffect, useRef } from "react"

const N = 28

/** Desenha o anel: 28 palitos em volta de um círculo; o comprimento segue uma onda. */
function paths(color: string, phase: number, grow = 1) {
  let o = ""
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2
    const v = Math.max(0, Math.min(1, grow * N * 1.15 - i)) // palitos nascem um a um
    if (v <= 0.01) continue
    const len = (10 + 7 * Math.sin(a * 2 + phase)) * v
    const r1 = 22, r2 = r1 + Math.max(1.5, len)
    const p = (r: number) => `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`
    o += `<path d="M${p(r1)} L${p(r2)}" stroke="${color}" stroke-width="3.3" stroke-linecap="round" opacity="${Math.min(1, v * 1.4).toFixed(2)}"/>`
  }
  return o
}

/**
 * O anel Onda do Fluxo. A onda corre devagar o tempo todo (para quem não pediu menos movimento).
 * `intro` faz os palitos nascerem um a um antes da onda começar.
 */
export function LogoRing({ size = 28, color = "currentColor", speed = 1.3, intro = false, className = "" }: { size?: number; color?: string; speed?: number; intro?: boolean; className?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) { el.innerHTML = paths(color, 1); return }
    let raf = 0
    const t0 = performance.now()
    const loop = (t: number) => {
      const s = (t - t0) / 1000
      const grow = intro ? Math.min(1, s / 0.7) : 1
      const wave = intro ? Math.max(0, s - 0.6) : s
      el.innerHTML = paths(color, wave * speed + 1, grow)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [color, speed, intro])
  return <svg ref={ref} viewBox="0 0 100 100" width={size} height={size} aria-hidden className={className} style={{ overflow: "visible" }} dangerouslySetInnerHTML={{ __html: paths(color, 1, intro ? 0 : 1) }} />
}

/** Anel + nome, lado a lado. */
export function Wordmark({ size = 22, color = "currentColor", className = "" }: { size?: number; color?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`} style={{ gap: size * 0.34, color }}>
      <LogoRing size={size * 1.3} color={color} />
      <span className="ttl leading-none" style={{ fontSize: size }}>fluxo</span>
    </span>
  )
}
