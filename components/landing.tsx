"use client"

import { animate, motion, useInView, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { ArrowRight, CalendarDays, CreditCard, Eye, Repeat, ShieldCheck, Sparkles } from "lucide-react"

const ease = [0.2, 0.9, 0.2, 1] as const

/* ------------------------------------------------------------------ */

export function Landing() {
  return (
    <div className="bg-[#0C1114] text-[#ECEBE5]" style={{ colorScheme: "dark" }}>
      <Nav />
      <Hero />
      <div className="relative z-10 rounded-t-[40px] bg-[#E4E3DC] text-[#1F282E]" style={{ colorScheme: "light" }}>
        <Manifesto />
        <Features />
        <Health />
        <Install />
        <FinalCta />
        <footer className="mx-auto flex max-w-[1100px] items-center justify-between px-6 pb-10 pt-4 text-[13px] text-[#55606A]">
          <span className="ttl text-[16px] text-[#1F282E]">fluxo<span className="text-otan">.</span></span>
          <span>Feito no Brasil · {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  )
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[max(14px,env(safe-area-inset-top))]">
      <motion.nav initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.8, ease }}
        className="flex w-full max-w-[1100px] items-center justify-between rounded-full border border-white/10 bg-white/[0.06] py-2 pl-5 pr-2 backdrop-blur-xl [box-shadow:inset_0_1px_1px_rgb(255_255_255/0.15)]">
        <a href="/" className="ttl text-[20px] text-[#ECEBE5]">fluxo<span className="text-otan">.</span></a>
        <a href="/entrar" className="flex h-10 items-center gap-1.5 rounded-full bg-[#ECEBE5] px-5 text-[14px] font-semibold text-[#1F282E]">Entrar <ArrowRight size={15} /></a>
      </motion.nav>
    </header>
  )
}

/* --------------------------------- HERO --------------------------------- */

function Hero() {
  const ref = useRef<HTMLElement>(null)
  const [vp, setVp] = useState({ w: 1440, h: 900 })
  const { scrollY } = useScroll()
  const p = useTransform(scrollY, (y) => Math.max(0, Math.min(1, y / (vp.h * 2.2))))
  useEffect(() => {
    const r = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    r(); window.addEventListener("resize", r)
    return () => window.removeEventListener("resize", r)
  }, [])

  // geometria do iPhone final (centralizado) e do card dentro dele
  const mobile = vp.w < 768
  const ph = Math.min(vp.h * (mobile ? 0.7 : 0.8), 760)
  const pw = ph * 0.47
  const phoneTop = mobile ? vp.h - ph - 24 : (vp.h - ph) / 2 + 20
  const phoneLeft = (vp.w - pw) / 2
  const cw = pw * 0.9, ch = cw * 0.66
  const cTop = phoneTop + ph * 0.17, cLeft = phoneLeft + (pw - cw) / 2

  const z = useTransform(p, [0.18, 0.62], [0, 1], { clamp: true })
  const zs = useSpring(z, { stiffness: 90, damping: 22 })
  const top = useTransform(zs, (t) => t * cTop)
  const left = useTransform(zs, (t) => t * cLeft)
  const width = useTransform(zs, (t) => vp.w + (cw - vp.w) * t)
  const height = useTransform(zs, (t) => vp.h + (ch - vp.h) * t)
  const radius = useTransform(zs, (t) => t * (pw * 0.07))
  const padTop = useTransform(zs, (t) => `calc(5cqw + ${(1 - t) * (mobile ? 78 : 70)}px)`)
  const phoneOpacity = useTransform(p, [0.45, 0.66], [0, 1])
  const phoneScale = useTransform(p, [0.45, 0.7], [1.08, 1])
  const introOpacity = useTransform(p, [0, 0.16], [1, 0])
  const introY = useTransform(p, [0, 0.16], [0, -60])
  const outroOpacity = useTransform(p, [0.66, 0.8], [0, 1])
  const outroY = useTransform(p, [0.66, 0.8], [40, 0])
  const bgDark = useTransform(p, [0.3, 0.6], [0, 1])

  const [n, setN] = useState("0")
  useEffect(() => {
    const c = animate(0, 3272, { delay: 0.5, duration: 2.2, ease: [0.16, 1, 0.3, 1], onUpdate: (x) => setN(Math.round(x).toLocaleString("pt-BR")) })
    return () => c.stop()
  }, [])
  const days = [58, 42, 74, 36, 96, 50, 66, 100]

  return (
    <section ref={ref} className="relative h-[320vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-[#0C1114]">
        {/* fundo escuro com brilho que aparece quando a câmera se afasta */}
        <motion.div aria-hidden style={{ opacity: bgDark }} className="pointer-events-none absolute inset-0"
          >
          <div className="absolute left-1/2 top-1/2 size-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgb(255 78 32 / 0.32), transparent 60%)" }} />
        </motion.div>

        {/* o iPhone em volta do card */}
        <motion.div aria-hidden style={{ opacity: phoneOpacity, scale: phoneScale, top: phoneTop, left: phoneLeft, width: pw, height: ph, borderRadius: pw * 0.16 }}
          className="absolute overflow-hidden border-[6px] border-[#2A333A] bg-[#E4E3DC] text-[#1F282E] shadow-[0_60px_120px_-40px_rgb(0_0_0/0.9),0_0_0_2px_rgb(255_255_255/0.06)]">
          <div className="absolute left-1/2 top-[1.6%] h-[3.4%] w-[30%] -translate-x-1/2 rounded-full bg-black" />
          <div style={{ padding: `${ph * 0.075}px ${pw * 0.06}px 0`, fontSize: pw * 0.04 }} className="text-[#1F282E]">
            <p className="text-[#55606A]" style={{ fontSize: "0.85em" }}>Sábado, 7 de novembro</p>
            <p className="ttl" style={{ fontSize: "1.9em", lineHeight: 1.1 }}>Oi, Marcus</p>
          </div>
          <div className="absolute inset-x-[5%] flex flex-col gap-[3%]" style={{ top: ph * 0.17 + ch + ph * 0.025, bottom: ph * 0.13 }}>
            <div className="flex flex-1 items-center gap-[6%] rounded-[14%/22%] bg-white px-[6%]">
              <div className="aspect-square h-[62%] rounded-full border-[5px] border-[#1F282E] [border-right-color:#E4E3DC]" />
              <div><p className="text-[#55606A]" style={{ fontSize: pw * 0.032 }}>Saúde financeira</p><p className="ttl" style={{ fontSize: pw * 0.06 }}>Ótima</p></div>
            </div>
            <div className="flex flex-1 gap-[4%]">
              <div className="flex-1 rounded-[18%/26%] bg-white p-[5%]"><p className="text-[#55606A]" style={{ fontSize: pw * 0.03 }}>Entrou</p><p className="ttl" style={{ fontSize: pw * 0.05 }}>R$ 8.400</p></div>
              <div className="flex-1 rounded-[18%/26%] bg-white p-[5%]"><p className="text-[#55606A]" style={{ fontSize: pw * 0.03 }}>Saiu</p><p className="ttl" style={{ fontSize: pw * 0.05 }}>R$ 2.508</p></div>
            </div>
          </div>
          <div className="absolute inset-x-[5%] bottom-[3.5%] flex h-[7.5%] items-center justify-between rounded-full bg-white/70 px-[3%] shadow-[inset_0_1px_1px_#fff]">
            <span className="h-[70%] w-[28%] rounded-full bg-white" /><span className="aspect-square h-[78%] rounded-full bg-otan" />
          </div>
        </motion.div>

        {/* O CARD: começa ocupando a tela inteira e vira o card do app */}
        <motion.div style={{ top, left, width, height, borderRadius: radius, containerType: "size" }}
          className="absolute z-10 overflow-hidden text-white shadow-[0_40px_100px_-30px_rgb(255_78_32/0.7)]">
          <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 100% 0%, rgb(255 190 150 / 0.55), transparent 55%), linear-gradient(160deg, #FF5A2C, #E2401C 55%, #B83312)" }} />
          <motion.div className="absolute inset-0 flex flex-col" style={{ padding: "5cqw 6cqw 4cqw", paddingTop: padTop }}>
            <div className="flex items-center justify-between" style={{ fontSize: "3.6cqw" }}>
              <span className="font-medium text-white/85">Livre até dia 30</span>
              <span className="ttl text-white/75">23 dias</span>
            </div>
            <p className="ttl font-bold tracking-[-0.045em]" style={{ fontSize: "17cqw", lineHeight: 0.95, marginTop: "2cqw", fontFeatureSettings: '"tnum" 1' }}>
              <span className="text-white/70" style={{ fontSize: "0.42em", marginRight: "0.1em" }}>R$</span>{n}<span className="text-white/70" style={{ fontSize: "0.42em" }}>,40</span>
            </p>
            <p className="text-white/85" style={{ fontSize: "3.8cqw", marginTop: "1.5cqw" }}>Dá uns <b className="ttl">R$ 142</b> por dia sem apertar.</p>
            <div className="mt-auto flex items-end" style={{ height: "30cqh", gap: "0.8cqw" }}>
              {Array.from({ length: 30 }, (_, i) => {
                const past = i < 7, today = i === 7
                return (
                  <motion.span key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.4 + i * 0.035, type: "spring", stiffness: 260, damping: 14 }}
                    className="flex-1 origin-bottom" style={{ height: `${today ? 100 : past ? days[i] : 40}%`, borderRadius: "0.8cqw", background: today ? "#1F282E" : past ? "rgb(255 255 255 / 0.94)" : "rgb(255 255 255 / 0.28)", boxShadow: today ? "0 0 0 0.4cqw #fff" : undefined }} />
                )
              })}
            </div>
            <div className="ttl flex justify-between text-white/70" style={{ fontSize: "2.6cqw", marginTop: "1.2cqw" }}><span>dia 1</span><span className="text-white">hoje</span><span>dia 30</span></div>
          </motion.div>

        </motion.div>

        {/* textos da abertura (fora do card para não encolher junto) */}
        <motion.div style={{ opacity: introOpacity, y: introY }} className="pointer-events-none absolute inset-x-0 top-[46%] z-20 px-6 text-center md:inset-x-auto md:right-[5%] md:top-[29%] md:w-[30%] md:px-0 md:text-right">
          <motion.p initial={{ opacity: 0, y: 30, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 1.2, duration: 1, ease }}
            className="ttl mx-auto max-w-[900px] text-[clamp(30px,4.6vw,64px)] leading-[0.95] tracking-[-0.04em] text-white [text-shadow:0_8px_40px_rgb(110_29_8/0.5)]">
            é o que ainda cabe no seu mês.
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 1 }}
            className="mt-6 flex items-center justify-center gap-2 text-[14px] font-medium text-white/80 md:justify-end">
            <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>↓</motion.span> role
          </motion.p>
        </motion.div>

        {/* fecho: texto ao lado do iPhone */}
        <motion.div style={{ opacity: outroOpacity, y: outroY }}
          className="absolute z-20 text-[#ECEBE5] max-md:inset-x-0 max-md:top-[max(84px,calc(env(safe-area-inset-top)+76px))] max-md:px-6 max-md:text-center md:left-[6%] md:top-1/2 md:w-[30%] md:-translate-y-1/2">
          <p className="ttl text-[clamp(30px,4.4vw,60px)] leading-[0.98] tracking-[-0.04em]">Seu mês inteiro, <span className="text-otan">num palito por dia.</span></p>
          <p className="mt-4 text-[16px] text-[#ECEBE5]/65 max-md:hidden">Sem planilha. Você abre e sabe na hora quanto pode gastar, o que vem pela frente e para onde o dinheiro foi.</p>
          <a href="/entrar" className="pointer-events-auto mt-7 inline-flex h-14 items-center gap-2 rounded-full bg-otan px-7 text-[16px] font-semibold text-white shadow-[0_14px_40px_-10px_rgb(255_78_32/0.8)] max-md:hidden">
            Começar agora <ArrowRight size={18} />
          </a>
        </motion.div>
        <motion.div style={{ opacity: outroOpacity }} className="absolute right-[6%] top-1/2 z-20 hidden w-[24%] -translate-y-1/2 space-y-3 md:block">
          {[["Netflix cobra amanhã", "R$ 44,90"], ["Delivery em 96% do limite", "atenção"], ["Saúde financeira", "86 · Ótima"]].map(([a, b], i) => (
            <motion.div key={a} animate={{ y: [0, -6, 0] }} transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
              className="flex items-center justify-between gap-3 rounded-full border border-white/15 bg-white/[0.07] px-4 py-3 text-[14px] text-[#ECEBE5] backdrop-blur-xl [box-shadow:inset_0_1px_1px_rgb(255_255_255/0.2)]">
              <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-otan shadow-[0_0_10px_#FF4E20]" />{a}</span><span className="ttl text-[#ECEBE5]/80">{b}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}


/* ------------------------------- SEÇÕES ------------------------------- */

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 40, filter: "blur(10px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.9, delay, ease }}>
      {children}
    </motion.div>
  )
}

function Manifesto() {
  return (
    <section id="como" className="mx-auto max-w-[1100px] px-6 pb-10 pt-28 md:pt-36">
      <Reveal>
        <p className="ttl max-w-[900px] text-[clamp(32px,5.4vw,64px)] leading-[1.02] tracking-[-0.035em]">
          Não é mais um app de finanças. <span className="text-[#8A939A]">É o seu mês inteiro em uma régua: o que já foi, o que vem, e quanto ainda <span className="text-otan">cabe</span>.</span>
        </p>
      </Reveal>
    </section>
  )
}

function Features() {
  return (
    <section className="mx-auto grid max-w-[1100px] gap-4 px-6 pb-24 md:grid-cols-3">
      <Reveal className="md:col-span-2">
        <div className="relative h-full overflow-hidden rounded-[28px] bg-[#1F282E] p-7 text-[#ECEBE5]">
          <p className="text-[13px] text-[#A9B1B7]">Fluxo do mês</p>
          <p className="ttl mt-1 text-[30px] leading-tight">Cada dia vira um palito.</p>
          <p className="mt-2 max-w-[420px] text-[15px] text-[#A9B1B7]">A altura é quanto você gastou. Passou do teto do dia, aparece o ponto laranja. Você entende o mês em um olhar.</p>
          <Bars />
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="flex h-full flex-col justify-between rounded-[28px] bg-white p-7">
          <div>
            <span className="grid size-11 place-items-center rounded-full bg-[#FF4E20]/12 text-[#B83312]"><Repeat size={20} /></span>
            <p className="ttl mt-4 text-[24px] leading-tight">Assinaturas no ano.</p>
            <p className="mt-2 text-[15px] text-[#414E58]">Aqueles R$ 21,90 por mês, somados, assustam.</p>
          </div>
          <Counter to={2467} className="ttl mt-6 text-[48px] leading-none text-[#B83312]" prefix="R$ " suffix="/ano" />
        </div>
      </Reveal>
      <Reveal delay={0.05}>
        <div className="h-full rounded-[28px] bg-white p-7">
          <span className="grid size-11 place-items-center rounded-full bg-[#E4E3DC] text-[#414E58]"><CreditCard size={20} /></span>
          <p className="ttl mt-4 text-[24px] leading-tight">Cartão e parcelas no lugar certo.</p>
          <p className="mt-2 text-[15px] text-[#414E58]">Comprou em 10x? Cada parcela cai na fatura do mês dela. Sem susto no dia do vencimento.</p>
          <div className="mt-5 space-y-2">
            {[["Fatura fechada · vence 10", "R$ 349,90"], ["Fatura aberta · vence dez", "R$ 469,90"], ["Celular novo · 1/10", "R$ 120,00"]].map(([a, b], i) => (
              <motion.div key={a} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1, ease }}
                className="flex justify-between rounded-[14px] bg-[#E4E3DC]/70 px-3.5 py-2.5 text-[13px]"><span>{a}</span><span className="ttl">{b}</span></motion.div>
            ))}
          </div>
        </div>
      </Reveal>
      <Reveal delay={0.1} className="md:col-span-2">
        <div className="grid h-full gap-6 rounded-[28px] bg-white p-7 md:grid-cols-[1fr_1.1fr]">
          <div>
            <span className="grid size-11 place-items-center rounded-full bg-[#E4E3DC] text-[#414E58]"><CalendarDays size={20} /></span>
            <p className="ttl mt-4 text-[24px] leading-tight">O que vem pela frente.</p>
            <p className="mt-2 text-[15px] text-[#414E58]">Contas, assinaturas e faturas num calendário. Você sabe quanto ainda cabe depois de tudo pago.</p>
          </div>
          <MiniCalendar />
        </div>
      </Reveal>
    </section>
  )
}

function Bars() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const data = [40, 62, 35, 90, 48, 120, 55, 38, 70, 44, 52, 30, 85, 60]
  return (
    <div ref={ref} className="mt-8 flex h-40 items-end gap-2">
      {data.map((v, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          {v > 80 && <motion.span initial={{ scale: 0 }} animate={inView ? { scale: 1 } : {}} transition={{ delay: 0.6 + i * 0.05 }} className="size-2 rounded-full bg-otan shadow-[0_0_10px_#FF4E20]" />}
          <motion.span initial={{ scaleY: 0 }} animate={inView ? { scaleY: 1 } : {}} transition={{ delay: i * 0.05, type: "spring", stiffness: 160, damping: 14 }}
            className="w-full origin-bottom rounded-full" style={{ height: `${(v / 120) * 100}%`, background: i === 13 ? "#FF4E20" : v > 80 ? "#B83312" : "#ECEBE5" }} />
        </div>
      ))}
    </div>
  )
}

function Counter({ to, className, prefix = "", suffix = "" }: { to: number; className: string; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const inView = useInView(ref, { once: true })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(0, to, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: (x) => setN(Math.round(x)) })
    return () => c.stop()
  }, [inView, to])
  return <p ref={ref} className={className}>{prefix}{n.toLocaleString("pt-BR")}<span className="text-[18px] text-[#8A939A]">{suffix}</span></p>
}

function MiniCalendar() {
  const marks: Record<number, string> = { 5: "#1F282E", 10: "#FF4E20", 12: "#1F282E", 15: "#1F282E", 18: "#1F282E", 22: "#1F282E", 25: "#FF4E20", 28: "#1F282E", 1: "#B83312" }
  return (
    <div className="grid grid-cols-7 gap-1.5 self-center">
      {Array.from({ length: 30 }, (_, i) => {
        const d = i + 1
        return (
          <motion.div key={d} initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.015, type: "spring", stiffness: 300, damping: 18 }}
            className={`relative grid aspect-square place-items-center rounded-[10px] text-[13px] ${d === 7 ? "bg-[#1F282E] text-[#ECEBE5]" : "bg-[#E4E3DC]/60"}`}>
            <span className="ttl">{d}</span>
            {marks[d] && <span className="absolute bottom-1 size-[5px] rounded-full" style={{ background: marks[d] }} />}
          </motion.div>
        )
      })}
    </div>
  )
}

function Health() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })
  const R = 70, C = 2 * Math.PI * R
  return (
    <section className="px-4 pb-24">
      <div ref={ref} className="mx-auto grid max-w-[1100px] items-center gap-10 overflow-hidden rounded-[36px] bg-[#1F282E] p-8 text-[#ECEBE5] md:grid-cols-2 md:p-14">
        <div>
          <p className="text-[13px] text-[#A9B1B7]">Saúde financeira</p>
          <p className="ttl mt-2 text-[clamp(30px,4.6vw,52px)] leading-[1.02] tracking-[-0.03em]">Uma nota que mostra se você está indo bem.</p>
          <p className="mt-4 max-w-[440px] text-[16px] text-[#A9B1B7]">Quanto sobra, se o mês cabe no teto, contas em dia, limites e reserva. Tudo virando um número de 0 a 100 e uma dica do que melhorar.</p>
        </div>
        <div className="flex justify-center">
          <div className="relative size-[240px]">
            <svg viewBox="0 0 160 160" className="size-full -rotate-90" aria-hidden>
              <circle cx="80" cy="80" r={R} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="12" />
              <motion.circle cx="80" cy="80" r={R} fill="none" stroke="#FF4E20" strokeWidth="12" strokeLinecap="round" strokeDasharray={C}
                initial={{ strokeDashoffset: C }} animate={inView ? { strokeDashoffset: C * 0.14 } : {}} transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ filter: "drop-shadow(0 0 12px rgb(255 78 32 / 0.6))" }} />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                {inView ? <Counter to={86} className="ttl text-[64px] leading-none" /> : <p className="ttl text-[64px] leading-none">0</p>}
                <p className="mt-1 text-[14px] text-[#A9B1B7]">Ótima</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Install() {
  return (
    <section className="mx-auto grid max-w-[1100px] items-center gap-10 px-6 pb-24 md:grid-cols-[auto_1fr]">
      <Reveal>
        <motion.div whileHover={{ rotate: -4, scale: 1.04 }} className="mx-auto size-[150px] overflow-hidden rounded-[36px] shadow-[0_30px_60px_-24px_rgb(226_64_28/0.75)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-v3-512.png" alt="Ícone do Fluxo" className="size-full" />
        </motion.div>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="ttl text-[clamp(28px,4vw,44px)] leading-[1.05] tracking-[-0.03em]">Mora na sua tela inicial.</p>
        <p className="mt-3 max-w-[560px] text-[16px] text-[#414E58]">No iPhone, abra no Safari, toque em Compartilhar e em <b>Adicionar à Tela de Início</b>. Abre em tela cheia, como um app — sem loja, sem download.</p>
        <div className="mt-5 flex flex-wrap gap-2 text-[13px]">
          {[[ShieldCheck, "Senha criptografada"], [Eye, "Modo privacidade"], [Sparkles, "Modo escuro automático"]].map(([I, t]) => {
            const Icon = I as typeof Eye
            return <span key={t as string} className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2"><Icon size={14} className="text-otan" />{t as string}</span>
          })}
        </div>
      </Reveal>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="px-4 pb-10">
      <Reveal>
        <div className="relative mx-auto max-w-[1100px] overflow-hidden rounded-[36px] px-8 py-16 text-center text-white md:py-24"
          style={{ background: "radial-gradient(90% 120% at 100% 0%, rgb(255 190 150 / 0.5), transparent 55%), linear-gradient(160deg, #FF5A2C, #E2401C 55%, #B83312)" }}>
          <div aria-hidden className="absolute inset-x-0 bottom-0 flex h-24 items-end justify-center gap-2 opacity-30">
            {Array.from({ length: 40 }, (_, i) => (
              <motion.span key={i} className="w-1.5 origin-bottom rounded-full bg-white" style={{ height: 30 + ((i * 53) % 50) }}
                animate={{ rotate: [((i * 37) % 13) - 6, -(((i * 37) % 13) - 6), ((i * 37) % 13) - 6] }} transition={{ duration: 3 + (i % 4) * 0.5, repeat: Infinity, ease: "easeInOut" }} />
            ))}
          </div>
          <p className="ttl relative text-[clamp(38px,7vw,84px)] leading-[0.95] tracking-[-0.045em]">Seu dinheiro,<br />em movimento.</p>
          <p className="relative mx-auto mt-4 max-w-[440px] text-[17px] text-white/85">O acesso é por convite. Já tem o seu? Entre e comece agora.</p>
          <a href="/entrar" className="relative mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-[#1F282E] px-8 text-[16px] font-semibold text-[#ECEBE5] shadow-[0_14px_40px_-12px_rgb(31_40_46/0.8)]">
            Entrar no Fluxo <ArrowRight size={18} />
          </a>
        </div>
      </Reveal>
    </section>
  )
}
