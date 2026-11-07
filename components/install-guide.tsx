"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { ChevronLeft, Copy, Menu, RotateCw, Share, SquarePlus, X } from "lucide-react"
import { Sheet, spring } from "./ui"

const KEY = "fluxo-install-dismissed"
const STEPS = [
  { title: "Toque no menu", text: "No Safari, toque no ☰ ao lado do endereço." },
  { title: "Compartilhar", text: "Escolha Compartilhar." },
  { title: "Tela de Início", text: "Toque em Adicionar à Tela de Início." },
  { title: "Pronto", text: "Toque em Adicionar. O Fluxo vira um app." },
]

function isIOS() {
  if (typeof navigator === "undefined") return false
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
}
function isStandalone() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true
}

/** Abre sozinho no iPhone quando o Fluxo está no Safari (e não como app), no máximo uma vez por semana. */
export function useInstallPrompt() {
  const [open, setOpen] = useState(false)
  const [can, setCan] = useState(false)
  useEffect(() => {
    if (isStandalone()) return
    setCan(true)
    if (!isIOS()) return
    let last = 0
    try { last = Number(localStorage.getItem(KEY) || 0) } catch {}
    if (Date.now() - last > 7 * 864e5) {
      const t = setTimeout(() => setOpen(true), 1800)
      return () => clearTimeout(t)
    }
  }, [])
  useEffect(() => {
    const h = () => setOpen(true)
    window.addEventListener("fluxo:install", h)
    return () => window.removeEventListener("fluxo:install", h)
  }, [])
  const close = () => {
    setOpen(false)
    try { localStorage.setItem(KEY, String(Date.now())) } catch {}
  }
  return { open, show: () => setOpen(true), close, can }
}

export function InstallGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!open) return
    setStep(0)
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 2200)
    return () => clearInterval(t)
  }, [open])

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-1 pb-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] text-mute">Fica muito melhor assim</p>
            <h2 className="ttl text-[24px] leading-tight">Guarde o Fluxo como app</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="grid size-9 place-items-center rounded-full bg-card text-mute"><X size={16} /></button>
        </div>

        {/* animação: um iPhone em miniatura mostrando cada passo */}
        <div className="mt-5 flex justify-center">
          <div className="relative h-[300px] w-[170px] overflow-hidden rounded-[30px] border-[5px] border-ink bg-[#101519] shadow-[0_20px_40px_-20px_rgb(31_40_46/0.6)]" aria-hidden>
            <div className="absolute left-1/2 top-1.5 h-3.5 w-14 -translate-x-1/2 rounded-full bg-black" />
            <AnimatePresence mode="wait">
              {step < 3 ? (
                <motion.div key="safari" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* página do Fluxo */}
                  <div className="mx-2.5 mt-8 h-16 rounded-[10px]" style={{ background: "linear-gradient(160deg,#FF5A2C,#B83312)" }} />
                  <div className="mx-2.5 mt-2 h-10 rounded-[10px] bg-[#1F282E]" />
                  <div className="mx-2.5 mt-2 h-10 rounded-[10px] bg-[#1F282E]" />
                  {/* barra do Safari */}
                  <div className="absolute inset-x-2 bottom-3 flex items-center gap-1.5">
                    <span className="grid h-7 w-9 place-items-center rounded-full bg-[#2A333A] text-[#E4E3DC]"><ChevronLeft size={12} /></span>
                    <span className="relative flex h-7 flex-1 items-center gap-1 rounded-full bg-[#2A333A] px-2 text-[8px] text-[#E4E3DC]">
                      <motion.span animate={step === 0 ? { scale: [1, 1.35, 1] } : { scale: 1 }} transition={{ duration: 0.8, repeat: step === 0 ? Infinity : 0 }}
                        className={`grid size-4 place-items-center rounded-full ${step === 0 ? "bg-otan text-white" : ""}`}><Menu size={9} /></motion.span>
                      fluxo-app…
                      <RotateCw size={8} className="ml-auto" />
                    </span>
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[#2A333A] text-[#E4E3DC]"><Copy size={10} /></span>
                  </div>
                  {step === 0 && <Finger x={58} y={262} />}

                  {/* menu e folha de compartilhar */}
                  <AnimatePresence>
                    {step >= 1 && (
                      <motion.div key="sheet" className="absolute inset-x-1.5 bottom-1.5 rounded-[18px] bg-[#E4E3DC] p-2 text-[#1F282E]"
                        initial={{ y: "110%" }} animate={{ y: 0 }} exit={{ y: "110%" }} transition={spring}>
                        {step === 1 ? (
                          <div className="space-y-1">
                            {["Copiar", "Compartilhar", "Favoritos", "Leitor"].map((r) => (
                              <motion.div key={r} animate={r === "Compartilhar" ? { backgroundColor: ["#FFFFFF", "#FFD9C9", "#FFFFFF"] } : {}} transition={{ duration: 1, repeat: Infinity }}
                                className="flex items-center gap-1.5 rounded-[8px] bg-white px-2 py-1.5 text-[8.5px] font-medium">
                                {r === "Compartilhar" ? <Share size={9} className="text-otan" /> : <span className="size-[9px] rounded-full bg-[#DAD8CF]" />}{r}
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {["Copiar", "Adicionar à Tela de Início", "Adicionar aos Favoritos"].map((r) => (
                              <motion.div key={r} animate={r.startsWith("Adicionar à") ? { backgroundColor: ["#FFFFFF", "#FFD9C9", "#FFFFFF"] } : {}} transition={{ duration: 1, repeat: Infinity }}
                                className="flex items-center gap-1.5 rounded-[8px] bg-white px-2 py-1.5 text-[8.5px] font-medium">
                                {r.startsWith("Adicionar à") ? <SquarePlus size={9} className="text-otan" /> : <span className="size-[9px] rounded-full bg-[#DAD8CF]" />}{r}
                              </motion.div>
                            ))}
                          </div>
                        )}
                        <Finger x={step === 1 ? 70 : 92} y={step === 1 ? 44 : 44} rel />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div key="home" className="absolute inset-0 grid grid-cols-4 content-start gap-x-2 gap-y-3 px-3 pt-10"
                  initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  style={{ background: "radial-gradient(120% 80% at 50% 0%, #3A4A55, #101519)" }}>
                  {Array.from({ length: 11 }, (_, i) => (
                    <span key={i} className="aspect-square rounded-[8px]" style={{ background: ["#5BA9F5", "#7AC7A0", "#F5F5F5", "#8A5BE8", "#F5C04B", "#E4E3DC"][i % 6], opacity: 0.85 }} />
                  ))}
                  <motion.span initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.1 }}
                    className="relative aspect-square overflow-hidden rounded-[8px] shadow-[0_0_0_2px_#fff]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon-192.png" alt="" className="size-full" />
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* passos */}
        <div className="mt-5 flex justify-center gap-1.5">
          {STEPS.map((_, i) => <motion.span key={i} animate={{ width: i === step ? 20 : 6, backgroundColor: i === step ? "#FF4E20" : "var(--c-sand-2)" }} className="h-1.5 rounded-full" />)}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="mt-3 text-center">
            <p className="ttl text-[17px]">{step + 1}. {STEPS[step].title}</p>
            <p className="mt-0.5 text-[14px] text-smoke">{STEPS[step].text}</p>
          </motion.div>
        </AnimatePresence>

        <ol className="mt-5 space-y-2.5 rounded-[20px] bg-card p-4 text-[14px] leading-snug">
          <li className="flex gap-3"><span className="num w-4 shrink-0 text-otan">1</span><span>Toque no <Menu size={14} className="inline align-[-2px]" /> ao lado do endereço (ou em <Share size={14} className="inline align-[-2px]" /> Compartilhar).</span></li>
          <li className="flex gap-3"><span className="num w-4 shrink-0 text-otan">2</span><span>Escolha <b>Compartilhar</b>.</span></li>
          <li className="flex gap-3"><span className="num w-4 shrink-0 text-otan">3</span><span>Toque em <b>Adicionar à Tela de Início</b>.</span></li>
          <li className="flex gap-3"><span className="num w-4 shrink-0 text-otan">4</span><span>Toque em <b>Adicionar</b> e abra pelo ícone novo.</span></li>
        </ol>
        <button onClick={onClose} className="mt-3 h-12 w-full text-[14px] font-semibold text-mute">Agora não</button>
      </div>
    </Sheet>
  )
}

function Finger({ x, y, rel }: { x: number; y: number; rel?: boolean }) {
  return (
    <motion.span className={`${rel ? "absolute" : "absolute"} pointer-events-none size-5 rounded-full border-2 border-white/90 bg-white/40`}
      style={{ left: x, top: y }} initial={{ opacity: 0, scale: 1.6 }} animate={{ opacity: [0, 1, 1, 0], scale: [1.6, 1, 0.85, 1] }}
      transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.3 }} />
  )
}

