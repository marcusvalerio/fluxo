"use client"

import { animate, AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion"
import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"

export function Ticker({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => format(v))
  useEffect(() => {
    const c = animate(mv, value, { type: "spring", stiffness: 70, damping: 20 })
    return () => c.stop()
  }, [value, mv])
  return <motion.span className={className}>{text}</motion.span>
}

/** Valor em BRL com centavos menores, estilo instrumento. */
export function Money({ value, className, size = "lg" }: { value: number; className?: string; size?: "lg" | "md" | "sm" }) {
  const neg = value < 0
  const abs = Math.abs(value)
  const sizes = { lg: ["text-[64px] leading-[0.9]", "text-[26px]", "text-[22px]"], md: ["text-[34px] leading-none", "text-[16px]", "text-[14px]"], sm: ["text-[20px] leading-none", "text-[12px]", "text-[11px]"] }[size]
  return (
    <span className={`num inline-flex items-start ${className ?? ""}`}>
      <span className={`${sizes[2]} mr-1.5 mt-[0.2em] text-fg-3`}>{neg ? "−R$" : "R$"}</span>
      <Ticker value={Math.floor(abs)} format={(n) => Math.round(n).toLocaleString("pt-BR")} className={sizes[0]} />
      <Ticker value={Math.round((abs % 1) * 100)} format={(n) => "," + String(Math.round(n)).padStart(2, "0")} className={`${sizes[1]} mt-[0.12em] text-fg-3`} />
    </span>
  )
}

export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog" aria-modal aria-label={title}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] rounded-t-[32px] border border-line-2 bg-ink-2/95 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 shadow-2xl backdrop-blur-2xl sm:bottom-6 sm:rounded-[32px]"
            initial={{ y: "105%" }} animate={{ y: 0 }} exit={{ y: "105%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => (i.offset.y > 110 || i.velocity.y > 600) && onClose()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
            {title && (
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-serif text-[28px] italic leading-none">{title}</h2>
                <button onClick={onClose} className="grid size-9 place-items-center rounded-full bg-white/5 text-fg-2" aria-label="Fechar"><X size={16} /></button>
              </div>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  )
}

export const inputCls = "w-full rounded-2xl border border-line bg-white/[0.03] px-4 py-3.5 outline-none transition focus:border-acid/50 focus:bg-white/[0.05]"

export function Primary({ children, disabled, onClick, type = "button" }: { children: ReactNode; disabled?: boolean; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <motion.button
      type={type} disabled={disabled} onClick={onClick} whileTap={{ scale: 0.97 }}
      className="relative w-full overflow-hidden rounded-2xl bg-acid py-4 font-medium text-ink transition disabled:opacity-30"
    >
      {children}
    </motion.button>
  )
}
