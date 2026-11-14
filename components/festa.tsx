"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

/** Chuva de moedas: dispara com window.dispatchEvent(new Event("fluxo:festa")). */
export const festa = () => window.dispatchEvent(new Event("fluxo:festa"))

export function ChuvaMoedas() {
  const [k, setK] = useState(0)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined
    const on = () => { setK(Date.now()); try { navigator.vibrate?.([8, 40, 8, 40, 14]) } catch {} clearTimeout(t); t = setTimeout(() => setK(0), 2800) }
    window.addEventListener("fluxo:festa", on)
    return () => { window.removeEventListener("fluxo:festa", on); clearTimeout(t) }
  }, [])
  if (!k) return null
  return createPortal(
    <div key={k} aria-hidden>
      {Array.from({ length: 22 }, (_, i) => (
        <span key={i} className="moeda" style={{ left: `${(i * 47) % 100}vw`, animationDelay: `${(i * 137) % 900}ms` }} />
      ))}
    </div>, document.body)
}
