"use client"

import { useEffect, useId, useRef } from "react"
import { useReducedMotion } from "framer-motion"
import { lightsBack, lightsFront } from "@/lib/natal"
import { MOEDA, COFRINHO_COLOR, COFRINHO_DARK, COFRINHO_LEGS, SHAPES, type CofrinhoState, type ShapeSpec } from "@/lib/cofrinho"

type Interp = (t: number) => string
type Flubber = {
  interpolate: (a: string, b: string, o?: object) => Interp
  separate: (a: string, b: string[], o?: object) => Interp[]
  combine: (a: string[], b: string, o?: object) => Interp[]
}
let flubber: Flubber | null = null
const loadFlubber = () => (flubber ? Promise.resolve(flubber) : import("flubber").then((m) => (flubber = (m.default ?? m) as Flubber)))

function decoMarkup(d: ShapeSpec["deco"]) {
  if (d === "slot") return `<rect x="40" y="23" width="20" height="4" rx="2" fill="${COFRINHO_DARK}"/>`
  if (d === "ring") return `<circle cx="50" cy="46" r="26" fill="none" stroke="${COFRINHO_DARK}" stroke-opacity=".5" stroke-width="2.4"/>`
  if (d === "cal") return `<rect x="30" y="17" width="5" height="12" rx="2.5" fill="${COFRINHO_DARK}"/><rect x="65" y="17" width="5" height="12" rx="2.5" fill="${COFRINHO_DARK}"/><rect x="16" y="34" width="68" height="4" fill="${COFRINHO_DARK}"/>`
  if (d === "card") return `<rect x="6" y="40" width="88" height="7" fill="${COFRINHO_DARK}"/><rect x="72" y="62" width="14" height="6" rx="3" fill="#fff" opacity=".6"/>`
  if (d === "spark") {
    let h = ""
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, r = i % 2 ? 52 : 56
      h += `<circle class="cf-sp" cx="${50 + r * Math.cos(a)}" cy="${48 + r * Math.sin(a)}" r="${i % 2 ? 2.2 : 3.2}" fill="currentColor" data-d="${i * 60}"/>`
    }
    return h
  }
  return ""
}

export interface CofrinhoProps {
  state?: CofrinhoState
  /** Balança as perninhas o tempo todo. */
  swing?: boolean
  /** Os olhos seguem o dedo ou o mouse. */
  follow?: boolean
  className?: string
  label?: string
  /** Enrolado no pisca-pisca (modo Natal). */
  lights?: boolean
}

/** O Fluximetro. Troca de forma de um jeito contínuo, sem saltos, quando `state` muda. */
export function Cofrinho({ state = "normal", swing = false, follow = false, className, label = "Fluximetro", lights = false }: CofrinhoProps) {
  const reduced = !!useReducedMotion()
  const svg = useRef<SVGSVGElement>(null)
  const body = useRef<SVGGElement>(null)
  const deco = useRef<SVGGElement>(null)
  const eyes = useRef<SVGGElement>(null)
  const open = useRef<SVGGElement>(null)
  const happy = useRef<SVGGElement>(null)
  const legs = useRef<SVGGElement>(null)
  const coin = useRef<SVGGElement>(null)
  const cur = useRef<CofrinhoState>("normal")
  const run = useRef(0)
  const spin = useRef(0)
  const blur = useRef<SVGFEGaussianBlurElement>(null)
  const gooId = "goo" + useId().replace(/:/g, "")

  // piscar e olhar
  useEffect(() => {
    let raf = 0, px: number | null = null, py: number | null = null
    const move = (e: PointerEvent) => { px = e.clientX; py = e.clientY }
    if (follow) window.addEventListener("pointermove", move, { passive: true })
    const loop = (t: number) => {
      const o = open.current, s = svg.current
      if (o && s) {
        const r = s.getBoundingClientRect()
        let x = Math.sin(t / 2100) * 0.5, y = -0.3
        if (follow && px !== null && py !== null) {
          x = Math.max(-1, Math.min(1, (px - (r.left + r.width / 2)) / 180))
          y = Math.max(-1, Math.min(1, (py - (r.top + r.height / 2)) / 180))
        }
        const blink = t % 4200 < 130 ? 0.12 : 1
        o.setAttribute("transform", `translate(${x * 3.5} ${y * 2.5}) translate(0 46) scale(1 ${blink}) translate(0 -46)`)
      }
      raf = requestAnimationFrame(loop)
    }
    if (!reduced) raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", move) }
  }, [follow, reduced])

  // transformação
  useEffect(() => {
    const target = state
    const s = SHAPES[target]
    const g = body.current!
    const id = ++run.current
    cancelAnimationFrame(spin.current)
    const paths = () => [...g.querySelectorAll("path")] as SVGPathElement[]
    const setPaths = (ds: string[]) => { g.innerHTML = ds.map((d) => `<path d="${d}" fill="${COFRINHO_COLOR}"/>`).join("") }
    paths().forEach((p) => p.getAnimations().forEach((a) => a.cancel()))

    const startSpin = () => {
      if (target !== "carregando" || reduced) return
      const t1 = performance.now()
      const r = (n: number) => { if (run.current !== id) return; g.setAttribute("transform", `rotate(${(n - t1) / 3} 50 48)`); spin.current = requestAnimationFrame(r) }
      spin.current = requestAnimationFrame(r)
    }
    const after = () => {
      if (target === "pensando" && !reduced)
        paths().forEach((p, i) => p.animate([{ transform: "translateY(0)" }, { transform: "translateY(-8px)" }, { transform: "translateY(0)" }], { duration: 700, delay: i * 140, iterations: Infinity, easing: "ease-in-out" }))
      startSpin()
    }

    // decoração: some, troca no meio e volta
    const d = deco.current!
    d.getAnimations().forEach((a) => a.cancel())
    const fadeOut = d.animate([{ opacity: getComputedStyle(d).opacity }, { opacity: 0 }], { duration: reduced ? 1 : 200, fill: "forwards" })
    const decoTimer = setTimeout(() => {
      if (run.current !== id) return
      d.innerHTML = decoMarkup(s.deco)
      fadeOut.cancel()
      d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: "ease-out", fill: "forwards" })
      d.querySelectorAll<SVGCircleElement>(".cf-sp").forEach((c) =>
        c.animate([{ opacity: 0, transform: "scale(0)" }, { opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.4)" }],
          { duration: 1200, delay: Number(c.dataset.d), iterations: Infinity, easing: "ease-out" }))
    }, reduced ? 0 : 460)

    // olhos e pernas acompanham com a mesma curva
    const e = eyes.current!
    e.style.transform = `translateY(${(s.eyeY ?? 46) - 46}px)`
    e.style.opacity = s.eyes === "none" ? "0" : "1"
    open.current!.style.opacity = s.eyes === "open" || s.eyes === "tight" ? "1" : "0"
    happy.current!.style.opacity = s.eyes === "happy" ? "1" : "0"
    open.current!.querySelectorAll("ellipse").forEach((el) => el.setAttribute("ry", s.eyes === "tight" ? "3.5" : "6.5"))
    legs.current!.style.opacity = s.legs ? "1" : "0"

    // moeda caindo na fenda
    const cn = coin.current!
    cn.getAnimations().forEach((a) => a.cancel())
    if (target === "guardou" && !reduced) {
      cn.style.opacity = "1"
      cn.animate([{ transform: "translateY(-30px)" }, { transform: "translateY(26px)", offset: 0.7 }, { transform: "translateY(26px) scaleY(.2)", opacity: 0 }],
        { duration: 900, delay: 250, easing: "cubic-bezier(.5,0,1,.6)", fill: "forwards" }).onfinish = () => { cn.style.opacity = "0" }
    } else cn.style.opacity = "0"
    if (target === "feliz" && !reduced)
      svg.current!.animate([{ transform: "translateY(0)" }, { transform: "translateY(-12%)" }, { transform: "translateY(0)" }, { transform: "translateY(-5%)" }, { transform: "translateY(0)" }], { duration: 900, delay: 300, easing: "ease-out" })

    const from = paths().map((p) => p.getAttribute("d")!)
    const to = s.body
    if (reduced || from.join() === to.join()) { setPaths(to); g.removeAttribute("transform"); after(); cur.current = target; return () => clearTimeout(decoTimer) }

    const rot0 = (() => { const tr = g.getAttribute("transform"); return tr?.startsWith("rotate") ? parseFloat(tr.slice(7)) % 360 : 0 })()
    loadFlubber().then((fl) => {
      if (run.current !== id) return
      let interp: Interp[] | null = null
      const o = { maxSegmentLength: 3 }
      try {
        if (from.length === to.length) interp = from.map((f, i) => fl.interpolate(f, to[i], o))
        else if (from.length === 1) interp = fl.separate(from[0], to, { ...o, single: false })
        else if (to.length === 1) interp = fl.combine(from, to[0], { ...o, single: false })
      } catch { interp = null }
      if (!interp) { setPaths(to); after(); return }
      if (paths().length !== interp.length) setPaths(interp.map((f) => f(0)))
      const ps = paths(), t0 = performance.now(), D = 680
      const io = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
      const step = (now: number) => {
        if (run.current !== id) return
        const k = Math.min(1, (now - t0) / D), ev = io(k)
        ps.forEach((p, i) => p.setAttribute("d", interp![i](ev)))
        blur.current?.setAttribute("stdDeviation", String(1.6 + Math.sin(k * Math.PI) * 4.2))
        const sq = Math.sin(k * Math.PI) * 0.06
        g.setAttribute("transform", `rotate(${rot0 * (1 - ev)} 50 48) translate(50 75) scale(${1 + sq} ${1 - sq}) translate(-50 -75)`)
        if (k < 1) requestAnimationFrame(step)
        else { g.removeAttribute("transform"); blur.current?.setAttribute("stdDeviation", "1.6"); after() }
      }
      requestAnimationFrame(step)
    })
    cur.current = target
    return () => clearTimeout(decoTimer)
  }, [state, reduced])

  return (
    <svg ref={svg} viewBox="-10 -10 120 120" role="img" aria-label={label} className={className} style={{ overflow: "visible", display: "block" }}>
      <g ref={legs} className={swing && !reduced ? "cf-swing" : undefined} style={{ transition: "opacity .35s ease" }}>
        <path className="cf-l" d="M33 72H41V80A3 3 0 0 1 38 83H36A3 3 0 0 1 33 80Z" fill={COFRINHO_LEGS} />
        <path className="cf-r" d="M59 72H67V80A3 3 0 0 1 64 83H62A3 3 0 0 1 59 80Z" fill={COFRINHO_LEGS} />
      </g>
      {lights && <g dangerouslySetInnerHTML={{ __html: lightsBack(50, 46, 32) }} />}
      {/* filtro líquido: as partes se fundem como gosma durante a transformação, sem linhas de corte */}
      <defs>
        <filter id={gooId} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feGaussianBlur ref={blur} in="SourceGraphic" stdDeviation="1.6" result="b" />
          <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
        </filter>
      </defs>
      <g filter={`url(#${gooId})`}><g ref={body}><path d={MOEDA} fill={COFRINHO_COLOR} /></g></g>
      <g ref={deco} className="text-ink" dangerouslySetInnerHTML={{ __html: decoMarkup("ring") }} />
      <g ref={eyes} style={{ transition: "transform .68s cubic-bezier(.65,0,.35,1), opacity .3s ease" }}>
        <g ref={open} style={{ transition: "opacity .3s ease" }}>
          <ellipse cx="40" cy="46" rx="6" ry="6.5" fill="#fff" />
          <ellipse cx="60" cy="46" rx="6" ry="6.5" fill="#fff" />
          <circle cx="41.5" cy="44" r="2.8" fill="#1F282E" />
          <circle cx="61.5" cy="44" r="2.8" fill="#1F282E" />
        </g>
        <g ref={happy} style={{ opacity: 0, transition: "opacity .3s ease" }}>
          <path d="M34 48q6-8 12 0M54 48q6-8 12 0" stroke="#fff" strokeWidth="3.6" fill="none" strokeLinecap="round" />
        </g>
      </g>
      {lights && <g dangerouslySetInnerHTML={{ __html: lightsFront(50, 46, 32) }} />}
      <g ref={coin} style={{ opacity: 0 }}>
        <circle cx="50" cy="0" r="7" fill="#FFC23D" stroke="#E2A21A" strokeWidth="2" />
      </g>
    </svg>
  )
}
