"use client"

import { animate, AnimatePresence, motion, useDragControls, useMotionValue, useTransform } from "framer-motion"
import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

export const spring = { type: "spring", stiffness: 380, damping: 32 } as const
export const rise = {
  initial: { opacity: 0, y: 18, scale: 0.98, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
}

export function Ticker({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => format(v))
  useEffect(() => {
    const c = animate(mv, value, { type: "spring", stiffness: 70, damping: 20 })
    return () => c.stop()
  }, [value, mv])
  return <motion.span className={className}>{text}</motion.span>
}

/** R$ grande com centavos menores. */
export function BigMoney({ value, size = 48 }: { value: number; size?: number }) {
  const neg = value < 0
  const abs = Math.abs(value)
  const small = Math.round(size * 0.46)
  return (
    <p className="num m-0 leading-none" style={{ fontSize: size }}>
      <span className="mr-1 text-faint" style={{ fontSize: small }}>{neg ? "−R$" : "R$"}</span>
      <Ticker value={Math.floor(abs)} format={(n) => Math.round(n).toLocaleString("pt-BR")} />
      <Ticker value={Math.round((abs % 1) * 100)} format={(n) => "," + String(Math.round(n)).padStart(2, "0")} className="text-faint" />
    </p>
  )
}

/**
 * Página que entra deslizando da direita, com botão de voltar (no lugar das abas que subiam).
 * O nome continua Sheet pra não mexer em quem já usa.
 */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  // vai direto pro body: dentro da tela animada o z-index ficava preso e a barra de abas passava por cima
  const [host, setHost] = useState<HTMLElement | null>(null)
  useEffect(() => setHost(document.body), [])
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", k)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev }
  }, [open, onClose])
  if (!host) return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog" aria-modal aria-label={title}
          className="fixed inset-0 z-50 mx-auto max-w-[480px] overflow-y-auto overscroll-contain bg-cotton px-4 pb-[max(28px,env(safe-area-inset-bottom))] shadow-[-20px_0_60px_-20px_rgb(31_40_46/0.35)]"
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
          drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0, right: 0.5 }} dragDirectionLock
          onDragEnd={(_, i) => (i.offset.x > 120 || i.velocity.x > 700) && onClose()}
        >
          <div className="sticky top-0 z-10 -mx-4 mb-4 flex items-center gap-3 bg-gradient-to-b from-cotton from-60% to-transparent px-4 pb-4 pt-[max(14px,env(safe-area-inset-top))]">
            <button onClick={onClose} aria-label="Voltar" className="lg grid size-11 shrink-0 place-items-center rounded-full text-ink">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            {title && <h2 className="ttl flex-1 truncate pr-11 text-center text-[17px]">{title}</h2>}
          </div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    host,
  )
}

export const field = "w-full rounded-[18px] border border-sand bg-card px-4 py-3.5 outline-none transition focus:border-otan"

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block px-1 text-[13px] text-mute">{children}</span>
}

export function Primary({ children, disabled, onClick, type = "button" }: { children: ReactNode; disabled?: boolean; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <motion.button type={type} disabled={disabled} onClick={onClick} whileTap={{ scale: 0.97 }}
      className="h-14 w-full rounded-[28px] bg-ink font-semibold text-cotton transition disabled:opacity-30">
      {children}
    </motion.button>
  )
}
