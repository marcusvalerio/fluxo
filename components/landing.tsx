"use client"

import { animate, motion, useInView, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { ArrowRight, CalendarDays, CreditCard, Eye, Repeat, ShieldCheck, Sparkles } from "lucide-react"

const ease = [0.2, 0.9, 0.2, 1] as const
const H1 = ["Quanto", "ainda", "cabe", "no", "seu", "mês."]

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
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const straighten = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -160])
  const textY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  // inclinação 3D do card seguindo o mouse / o celular
  const rx = useSpring(0, { stiffness: 120, damping: 14 })
  const ry = useSpring(0, { stiffness: 120, damping: 14 })
  useEffect(() => {
    const move = (e: PointerEvent) => {
      ry.set(((e.clientX / window.innerWidth) - 0.5) * 22)
      rx.set(-((e.clientY / window.innerHeight) - 0.5) * 16)
    }
    const tilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      ry.set(Math.max(-14, Math.min(14, e.gamma * 0.6)))
      rx.set(Math.max(-10, Math.min(10, (e.beta - 45) * -0.4)))
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("deviceorientation", tilt)
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("deviceorientation", tilt) }
  }, [rx, ry])

  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col items-center overflow-hidden px-5 pb-0 pt-[max(110px,calc(env(safe-area-inset-top)+96px))]">
      {/* brilho laranja */}
      <motion.div aria-hidden className="pointer-events-none absolute left-1/2 top-[38%] size-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgb(255 78 32 / 0.35), rgb(255 78 32 / 0.08) 40%, transparent 65%)" }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")" }} />

      <motion.div style={{ y: textY, opacity: fade }} className="relative z-10 text-center">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease }}
          className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[13px] text-[#ECEBE5]/80 backdrop-blur">
          <span className="size-1.5 rounded-full bg-otan shadow-[0_0_10px_#FF4E20]" /> Finanças pessoais, do jeito certo
        </motion.p>
        <h1 className="ttl mx-auto max-w-[920px] text-[clamp(46px,10.5vw,124px)] leading-[0.92] tracking-[-0.045em]">
          {H1.map((w, i) => (
            <motion.span key={i} className="mr-[0.22em] inline-block last:mr-0"
              initial={{ opacity: 0, y: 40, filter: "blur(14px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.35 + i * 0.09, duration: 0.9, ease }}>
              {w === "cabe" ? <span className="bg-gradient-to-b from-[#FF8A5C] to-[#FF4E20] bg-clip-text text-transparent">{w}</span> : w}
            </motion.span>
          ))}
        </h1>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.8, ease }}
          className="mx-auto mt-6 max-w-[520px] text-[17px] leading-relaxed text-[#ECEBE5]/70 md:text-[19px]">
          Sem planilha, sem culpa. O Fluxo mostra todo dia quanto você pode gastar, o que vem pela frente e para onde o dinheiro foi.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.8, ease }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="/entrar" className="group flex h-14 items-center gap-2 rounded-full bg-otan px-7 text-[16px] font-semibold text-white shadow-[0_14px_40px_-10px_rgb(255_78_32/0.8),inset_0_1px_1px_rgb(255_255_255/0.4)] transition hover:shadow-[0_18px_50px_-8px_rgb(255_78_32/0.95)]">
            Começar agora <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
          </a>
          <a href="#como" className="flex h-14 items-center rounded-full border border-white/15 bg-white/[0.06] px-6 text-[15px] font-medium backdrop-blur">Ver como funciona</a>
        </motion.div>
      </motion.div>

      {/* card 3D + avisos orbitando */}
      <motion.div style={{ y: cardY }} className="relative z-10 mt-14 w-full max-w-[420px] [perspective:1200px]">
        <motion.div initial={{ opacity: 0, y: 80, rotateX: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }} transition={{ delay: 1.3, duration: 1.3, ease }}>
          <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}>
            <HeroCard />
            <Chip className="-left-3 -top-10 md:-left-64 md:top-4" delay={2.0} float={0}>
              <Repeat size={14} className="text-otan" /> <b>Netflix</b> cobra amanhã · <span className="ttl">R$ 44,90</span>
            </Chip>
            <Chip className="-right-3 top-[44%] md:-right-60" delay={2.2} float={1}>
              <span className="size-2 rounded-full bg-otan" /> <b>Delivery</b> em 96% do limite
            </Chip>
            <Chip className="-bottom-7 left-3 md:-bottom-2 md:-left-56" delay={2.4} float={2}>
              <Sparkles size={14} className="text-otan" /> Saúde financeira <b className="ttl">86 · Ótima</b>
            </Chip>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* campo de palitos: balança e endireita ao rolar */}
      <Sticks straighten={straighten} />
    </section>
  )
}

function HeroCard() {
  const v = useMotionValue(0)
  const [n, setN] = useState("0")
  useEffect(() => {
    const c = animate(v, 3272, { delay: 1.6, duration: 2, ease: [0.16, 1, 0.3, 1], onUpdate: (x) => setN(Math.round(x).toLocaleString("pt-BR")) })
    return () => c.stop()
  }, [v])
  const days = [62, 48, 80, 40, 100, 55, 70]
  return (
    <div className="relative overflow-hidden rounded-[28px] p-6 text-white shadow-[0_40px_90px_-30px_rgb(255_78_32/0.75)]"
      style={{ background: "radial-gradient(120% 90% at 100% 0%, rgb(255 190 150 / 0.5), transparent 55%), linear-gradient(160deg, #FF5A2C, #E2401C 55%, #B83312)", transform: "translateZ(40px)" }}>
      <div className="pointer-events-none absolute inset-0 rounded-[28px] [box-shadow:inset_0_1px_1px_rgb(255_255_255/0.5)]" />
      <div className="flex items-center justify-between text-[14px]">
        <span className="font-medium text-white/85">Livre até dia 30</span>
        <span className="flex items-center gap-2"><span className="ttl text-white/75">23 dias</span><span className="grid size-8 place-items-center rounded-full bg-white/18"><Eye size={14} /></span></span>
      </div>
      <p className="ttl mt-3 text-[54px] font-bold leading-none tracking-[-0.04em]" style={{ fontFeatureSettings: '"tnum" 1' }}>
        <span className="mr-1 text-[24px] text-white/70">R$</span>{n}<span className="text-[24px] text-white/70">,40</span>
      </p>
      <p className="mt-2 text-[15px] text-white/85">Dá uns <b className="ttl">R$ 142</b> por dia sem apertar.</p>
      <div className="mt-5 flex h-12 items-end gap-[3px]">
        {Array.from({ length: 30 }, (_, i) => {
          const past = i < 7, today = i === 7
          const h = past ? days[i] : 40
          return (
            <motion.span key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 1.8 + i * 0.025, type: "spring", stiffness: 420, damping: 15 }}
              className="flex-1 origin-bottom rounded-[3px]"
              style={{ height: `${today ? 100 : h}%`, background: today ? "#1F282E" : past ? "rgb(255 255 255 / 0.92)" : "rgb(255 255 255 / 0.28)", boxShadow: today ? "0 0 0 1.5px #fff" : undefined }} />
          )
        })}
      </div>
      <div className="ttl mt-1.5 flex justify-between text-[11px] text-white/70"><span>dia 1</span><span className="text-white">hoje</span><span>dia 30</span></div>
    </div>
  )
}

function Chip({ children, className, delay, float }: { children: React.ReactNode; className: string; delay: number; float: number }) {
  return (
    <motion.div className={`absolute z-20 ${className}`} style={{ transform: "translateZ(90px)" }}
      initial={{ opacity: 0, scale: 0.7, filter: "blur(8px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ delay, type: "spring", stiffness: 260, damping: 18 }}>
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4 + float, repeat: Infinity, ease: "easeInOut", delay: float * 0.6 }}
        className="flex items-center gap-2 whitespace-nowrap rounded-full border border-white/25 bg-white/[0.14] px-4 py-2.5 text-[13px] text-white backdrop-blur-xl [box-shadow:inset_0_1px_1px_rgb(255_255_255/0.35),0_16px_40px_-12px_rgb(0_0_0/0.6)]">
        {children}
      </motion.div>
    </motion.div>
  )
}

function Sticks({ straighten }: { straighten: ReturnType<typeof useTransform<number, number>> }) {
  const N = 64
  return (
    <div aria-hidden className="pointer-events-none relative mt-auto flex h-[150px] w-[130%] max-w-none items-end justify-center gap-[1.1vw] pt-16 [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]">
      {Array.from({ length: N }, (_, i) => <Stick key={i} i={i} straighten={straighten} />)}
    </div>
  )
}

function Stick({ i, straighten }: { i: number; straighten: ReturnType<typeof useTransform<number, number>> }) {
  const base = ((i * 37) % 17) - 8
  const rotate = useTransform(straighten, (s) => base * s)
  const today = i === 32
  const h = today ? 120 : 70 + ((i * 53) % 30)
  return (
    <motion.span style={{ rotate, height: h }} className="w-[max(5px,0.7vw)] shrink-0 origin-bottom"
      initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }} transition={{ delay: 0.6 + Math.abs(i - 32) * 0.02, type: "spring", stiffness: 200, damping: 16 }}>
      <motion.span className={`block size-full origin-bottom rounded-[3px] ${today ? "bg-otan shadow-[0_0_24px_#FF4E20]" : "bg-[#ECEBE5]/85"}`}
        animate={today ? {} : { rotate: [0, (base >= 0 ? 3 : -3), 0] }} transition={{ duration: 3 + (i % 5) * 0.4, repeat: Infinity, ease: "easeInOut", delay: (i % 7) * 0.2 }} />
    </motion.span>
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
          <img src="/icon-512.png" alt="Ícone do Fluxo" className="size-full" />
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
