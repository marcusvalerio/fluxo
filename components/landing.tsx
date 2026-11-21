"use client"

import { useEffect, useRef } from "react"
import { joinWaitlist } from "@/app/actions"
import { MARKUP } from "./landing-markup"
import { initLanding } from "./landing-init"
import "@/app/landing.css"

/** Página de quem ainda não entrou: apresenta o Fluxo e guarda o e-mail na lista de espera. */
export function Landing() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    return initLanding(ref.current, joinWaitlist)
  }, [])
  return <div ref={ref} className="lp" dangerouslySetInnerHTML={{ __html: MARKUP }} />
}
