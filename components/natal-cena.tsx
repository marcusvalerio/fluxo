"use client"

import { useEffect, useRef } from "react"
import { mountNatal, NATAL_MARKUP } from "./natal-cenas"

/** Cena de Natal: a árvore (dias ímpares) ou o coral (dias pares), a não ser que `which` diga qual. */
export function NatalCena({ which, className = "" }: { which?: "arvore" | "coral"; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const w = which ?? (new Date().getDate() % 2 ? "arvore" : "coral")
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = NATAL_MARKUP[w]
    return mountNatal(el, w)
  }, [w])
  return <div ref={ref} aria-hidden className={`nt relative overflow-hidden bg-[linear-gradient(180deg,#0E1630,#1B2440_45%,#24345A_70%,#2B3756)] ${className}`} />
}
