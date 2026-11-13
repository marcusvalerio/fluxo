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

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  // vai direto pro body: dentro da tela animada o z-index ficava preso e a barra de abas passava por cima
  const [host, setHost] = useState<HTMLElement | null>(null)
  // arrastar pra fechar só pela barrinha do topo; no resto da folha o dedo rola o conteúdo
  const drag = useDragControls()
  useEffect(() => setHost(document.body), [])
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [open, onClose])
  if (!host) return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog" aria-modal aria-label={title}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[94dvh] max-w-[480px] overflow-y-auto overscroll-contain rounded-t-[36px] bg-cotton px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_60px_-20px_rgb(31_40_46/0.4)]"
            initial={{ y: "105%" }} animate={{ y: 0 }} exit={{ y: "105%" }} transition={spring}
            drag="y" dragControls={drag} dragListener={false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => (i.offset.y > 110 || i.velocity.y > 600) && onClose()}
          >
            <div onPointerDown={(e) => drag.start(e)} className="-mx-4 -mt-3 mb-1 flex cursor-grab touch-none justify-center pb-2 pt-3" aria-hidden>
              <span className="h-1.5 w-10 rounded-full bg-sand-2" />
            </div>
            {title && <h2 className="ttl mb-4 px-2 text-[24px]">{title}</h2>}
            {children}
          </motion.div>
        </>
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
