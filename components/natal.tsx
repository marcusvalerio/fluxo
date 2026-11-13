"use client"

import { useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"
import { BULBS, bulb, lightsBack, lightsFront } from "@/lib/natal"

// moeda do Fluximetro desenhada em SVG puro (pra animar quadro a quadro na abertura)
function coinSvg(happy: boolean, t: number) {
  const eyes = happy
    ? `<path d="M33 46q6-8 12 0M55 46q6-8 12 0" stroke="#fff" stroke-width="3.6" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="40" cy="46" rx="6" ry="6.5" fill="#fff"/><ellipse cx="60" cy="46" rx="6" ry="6.5" fill="#fff"/><circle cx="40" cy="48" r="2.8" fill="#1F282E"/><circle cx="60" cy="48" r="2.8" fill="#1F282E"/>`
  const sw = Math.sin(t * 6) * 25
  return `<rect x="35" y="72" width="8" height="13" rx="4" fill="#E2401C" transform="rotate(${sw} 39 72)"/><rect x="57" y="72" width="8" height="13" rx="4" fill="#E2401C" transform="rotate(${-sw} 61 72)"/>
  ${lightsBack(50, 46, 32)}<circle cx="50" cy="48" r="32" fill="#C7361A"/><circle cx="50" cy="46" r="32" fill="#FF4E20"/><circle cx="50" cy="46" r="26" fill="none" stroke="#B83312" stroke-opacity=".5" stroke-width="2.4"/>${eyes}${lightsFront(50, 46, 32, 1)}`
}

/**
 * Abertura de Natal: o Fluximetro está atrás do notch pendurando o pisca-pisca, escorrega,
 * cai e fica preso no fio no meio da tela, de cabeça pra baixo e de lado, sorrindo.
 */
export function NatalDrop() {
  const svg = useRef<SVGSVGElement>(null)
  const reduced = !!useReducedMotion()
  useEffect(() => {
    const el = svg.current!
    const W = el.clientWidth, H = el.clientHeight, cx = W / 2
    el.setAttribute("viewBox", `0 0 ${W} ${H}`)
    const top = Math.max(10, (window.visualViewport ? 0 : 0) + 12)
    const isl = { y: top, w: 112, h: 32 }
    const R = 46, stopY = H * 0.4
    const fio: [number, number][] = []
    for (let i = 0; i <= 10; i++) { const u = i / 10; fio.push([cx - W * 0.46 + W * 0.92 * u, isl.y + isl.h + 6 + Math.sin(u * Math.PI * 5) * 5 + (Math.abs(u - 0.5) < 0.12 ? -10 : 0)]) }
    const lerp = (a: number, b: number, k: number) => a + (b - a) * k
    const t0 = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const t = reduced ? 3.2 : (now - t0) / 1000
      let h = ""
      const lit = Math.min(1, t / 1.4)
      let d = "M" + fio[0]
      for (let i = 1; i < fio.length; i++) { const [x0, y0] = fio[i - 1], [x1, y1] = fio[i]; d += ` Q${(x0 + x1) / 2} ${Math.max(y0, y1) + 9} ${x1} ${y1}` }
      h += `<path d="${d}" stroke="#2B3A2B" stroke-width="1.4" fill="none" stroke-dasharray="${W * 1.2}" stroke-dashoffset="${W * 1.2 * (1 - lit)}"/>`
      fio.forEach((p, i) => { if (i / 10 <= lit && i > 0 && i < 10) h += bulb(p[0] + (i % 2 ? 3 : -3), p[1] + 6, BULBS[i % BULBS.length], 3, i, i % 2 ? 12 : -12) })
      let x = cx, y: number, rot: number
      if (t < 1.6) { y = isl.y + isl.h - 6 + Math.sin(t * 8) * 2 - (1 - Math.min(1, t / 0.5)) * 30; rot = Math.sin(t * 5) * 8 }
      else {
        const f = Math.min(1, (t - 1.6) / 0.55)
        y = lerp(isl.y + isl.h, stopY, f * f); rot = lerp(0, 160, 1 - Math.pow(1 - f, 3))
        const k = Math.max(0, t - 2.15)
        if (f >= 1) { y = stopY + Math.sin(k * 9) * 28 * Math.exp(-k * 3); rot = 152 + Math.sin(k * 2.4) * 14 * Math.exp(-k * 0.5) }
        x = cx + Math.sin(k * 2.4) * 22 * Math.exp(-k * 0.4)
        const mx = (cx + x) / 2 + (x - cx) * 0.4, my = (isl.y + isl.h + y) / 2
        h += `<path d="M${cx} ${isl.y + isl.h} Q${mx} ${my} ${x} ${y - R * 0.9}" stroke="#2B3A2B" stroke-width="1.4" fill="none"/>`
        for (let i = 1; i < 7; i++) { const u = i / 7; const bx = (1 - u) ** 2 * cx + 2 * (1 - u) * u * mx + u * u * x, by = (1 - u) ** 2 * (isl.y + isl.h) + 2 * (1 - u) * u * my + u * u * (y - R * 0.9); h += bulb(bx + (i % 2 ? 3 : -3), by, BULBS[(i + 3) % BULBS.length], 3, i + 3, i % 2 ? 14 : -14) }
      }
      h += `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${R / 40}) translate(-50 -48)">${coinSvg(t > 2.7, t)}</g>`
      h += `<rect x="${cx - isl.w / 2}" y="${isl.y}" width="${isl.w}" height="${isl.h}" rx="${isl.h / 2}" fill="#000"/>`
      el.innerHTML = h
      if (t < 4.6 && !reduced) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [reduced])
  return <svg ref={svg} aria-hidden className="absolute inset-0 h-full w-full overflow-visible" />
}

/** Neve caindo pelo app (quando o mês aperta no modo Natal). */
export function Neve() {
  const cv = useRef<HTMLCanvasElement>(null)
  const reduced = !!useReducedMotion()
  useEffect(() => {
    if (reduced) return
    const c = cv.current!, ctx = c.getContext("2d")!
    let W = 0, H = 0
    const size = () => { W = c.width = innerWidth * 2; H = c.height = innerHeight * 2 }
    size(); addEventListener("resize", size)
    const flakes = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 2 + Math.random() * 5, v: 0.6 + Math.random() * 1.6, d: Math.random() * 6 }))
    let raf = 0
    const f = (t: number) => {
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = "rgba(255,255,255,.95)"; ctx.shadowColor = "rgba(31,40,46,.25)"; ctx.shadowBlur = 4
      for (const k of flakes) { k.y += k.v * 2; k.x += Math.sin(t / 900 + k.d) * 0.8; if (k.y > H + 10) { k.y = -10; k.x = Math.random() * W } ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, 7); ctx.fill() }
      raf = requestAnimationFrame(f)
    }
    raf = requestAnimationFrame(f)
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", size) }
  }, [reduced])
  return <canvas ref={cv} aria-hidden className="pointer-events-none fixed inset-0 z-[25] h-full w-full" />
}
