"use client"

import { useEffect, useRef } from "react"

/**
 * Campo de palitos: colunas verticais cuja altura segue duas ondas que se cruzam.
 * É o elemento visual da marca (o mês inteiro em movimento). Canvas, pra ficar leve.
 */
export function StickField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext("2d")
    if (!ctx) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    const draw = (t: number) => {
      const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1)
      const W = Math.round(r.width * d), H = Math.round(r.height * d)
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H }
      ctx.clearRect(0, 0, W, H)
      const cols = Math.max(24, Math.round(r.width / 9)), gap = W / cols
      ctx.lineCap = "round"; ctx.lineWidth = gap * 0.36
      for (let i = 0; i < cols; i++) {
        const u = i / cols
        const a = Math.sin(u * Math.PI * 4 + t * 1.1) * 0.5 + Math.sin(u * Math.PI * 2.2 - t * 0.7) * 0.5
        const k = a * 0.5 + 0.5
        const h = H * (0.18 + 0.42 * k)
        const yc = H * 0.5 + Math.sin(u * Math.PI * 2 + t * 0.5) * H * 0.1
        ctx.strokeStyle = `rgba(${Math.round(143 + 104 * k)},${Math.round(164 + 83 * k)},${Math.round(208 + 39 * k)},${0.3 + 0.7 * k})`
        ctx.beginPath(); ctx.moveTo(gap * (i + 0.5), yc - h / 2); ctx.lineTo(gap * (i + 0.5), yc + h / 2); ctx.stroke()
      }
    }
    const loop = (ms: number) => { draw(ms / 1000); raf = requestAnimationFrame(loop) }
    if (reduced) draw(1)
    else raf = requestAnimationFrame(loop)
    const onResize = () => reduced && draw(1)
    window.addEventListener("resize", onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize) }
  }, [])
  return <canvas ref={ref} aria-hidden className={className} />
}
