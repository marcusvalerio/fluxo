"use client"

import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { useMemo, useState } from "react"
import type { Snapshot } from "@/lib/types"
import { addDays, labelMonth, relativeDay } from "@/lib/dates"
import { brl, int, TONES, type Analysis } from "@/lib/finance"
import { rise, spring } from "../ui"
import { TxList } from "../tx-list"
import { CatIcon } from "../cat-icon"

type View = "mes" | "meses"
const WD = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" })
const MS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

export function FluxoScreen({ snap, a }: { snap: Snapshot; a: Analysis }) {
  const [view, setView] = useState<View>("mes")
  const biggest = a.days.filter((d) => !d.future).reduce((m, d) => (d.total > m.total ? d : m), a.days[0])
  const [sel, setSel] = useState<number>(biggest?.day ?? a.dayOfMonth)

  // 6 meses empilhados pelas maiores categorias do período
  const six = useMemo(() => {
    const yms: string[] = []
    let cur = a.ym + "-01"
    for (let i = 0; i < 6; i++) { yms.unshift(cur.slice(0, 7)); cur = addDays(cur, -1).slice(0, 7) + "-01" }
    const exp = snap.txs.filter((t) => t.kind === "expense" && yms.includes(t.date.slice(0, 7)))
    const tot = new Map<string, number>()
    for (const t of exp) tot.set(t.category, (tot.get(t.category) ?? 0) + t.amount)
    const top = [...tot.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([n], i) => ({ name: n, color: TONES[i] }))
    const legend = [...top, ...(tot.size > 3 ? [{ name: "Outros", color: TONES[3] }] : [])]
    const months = yms.map((ym) => {
      const list = exp.filter((t) => t.date.startsWith(ym))
      const seg = new Map<string, number>()
      for (const t of list) { const k = top.some((c) => c.name === t.category) ? t.category : "Outros"; seg.set(k, (seg.get(k) ?? 0) + t.amount) }
      return { ym, total: list.reduce((s2, t) => s2 + t.amount, 0), segments: legend.filter((c) => seg.has(c.name)).map((c) => ({ name: c.name, value: seg.get(c.name)!, color: c.color })) }
    })
    return { months, legend }
  }, [snap.txs, a.ym])
  const months = six.months
  const legend = view === "mes" ? a.categories : six.legend

  const peakDay = Math.max(a.dailyCap * 1.25, ...a.days.map((d) => d.total), 1)
  const peakMonth = Math.max(...months.map((m) => m.total), 1)
  const day = a.days[sel - 1]
  const avgMonth = months.filter((m) => m.total > 0).reduce((s, m, _, arr) => s + m.total / arr.length, 0)

  const monthTx = snap.txs.filter((t) => t.date.startsWith(a.ym))
  const catRows = useMemo(() => {
    const prevYm = addDays(a.ym + "-01", -1).slice(0, 7)
    const m = new Map<string, { value: number; count: number; prev: number }>()
    for (const t of snap.txs) {
      if (t.kind !== "expense") continue
      const e = m.get(t.category) ?? { value: 0, count: 0, prev: 0 }
      if (t.date.startsWith(a.ym)) { e.value += t.amount; e.count++ } else if (t.date.startsWith(prevYm)) e.prev += t.amount
      m.set(t.category, e)
    }
    return [...m.entries()].filter(([, e]) => e.value > 0).sort((x, y) => y[1].value - x[1].value).map(([name, e]) => {
      const exp = e.prev * (a.dayOfMonth / a.dim)
      return { name, ...e, delta: a.dayOfMonth >= 5 && exp > 30 ? (e.value - exp) / exp : null }
    })
  }, [snap.txs, a])

  const groups = useMemo(() => {
    const m = new Map<string, typeof monthTx>()
    for (const t of monthTx) m.set(t.date, [...(m.get(t.date) ?? []), t])
    return [...m.entries()]
  }, [monthTx])

  return (
    <div className="px-4 pt-[max(52px,env(safe-area-inset-top))]">
      <motion.header {...rise} transition={spring} className="flex items-end justify-between px-1 pb-6">
        <div>
          <p className="text-[13px] text-mute">Seu fluxo</p>
          <h1 className="ttl text-[30px] leading-tight first-letter:uppercase">{view === "mes" ? labelMonth(snap.today) : "6 meses"}</h1>
        </div>
        <div className="lg flex gap-0.5 rounded-[22px] p-1">
          <LayoutGroup>
            {(["mes", "meses"] as View[]).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`relative rounded-[18px] px-3.5 py-2 text-[13px] ${view === v ? "font-semibold" : "text-smoke"}`}>
                {view === v && <motion.span layoutId="seg" className="lg-pill absolute inset-0 rounded-[18px]" transition={spring} />}
                <span className="relative">{v === "mes" ? "Mês" : "6 meses"}</span>
              </button>
            ))}
          </LayoutGroup>
        </div>
      </motion.header>

      <div className="flex flex-col gap-6">
        <motion.section {...rise} transition={{ ...spring, delay: 0.05 }} className="rounded-[23px] bg-card px-[18px] pb-4 pt-5">
          <div className="flex items-baseline gap-2.5">
            <p className="num text-[36px] leading-none">{brl(view === "mes" ? a.expense : months.reduce((s, m) => s + m.total, 0), false)}</p>
            {view === "mes" && a.vsPrev !== null && (
              <span className="num rounded-[10px] bg-cotton px-2 py-1 text-[13px]">{a.vsPrev > 0 ? "+" : "−"}{Math.abs(Math.round(a.vsPrev * 100))}% vs mês passado</span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] text-mute">
            {view === "mes" ? `gastos em ${a.dayOfMonth} dias · média R$ ${int(a.expense / Math.max(1, a.dayOfMonth))}/dia` : `média de R$ ${int(avgMonth)} por mês`}
          </p>

          {view === "mes" && (
            <div className="mt-4 h-[58px]">
              {day && !day.future && (
                <motion.div key={day.day} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring}
                  className="flex items-center justify-between rounded-2xl bg-cotton/70 px-3.5 py-2.5">
                  <div>
                    <p className="text-[12px] text-mute first-letter:uppercase">{WD.format(new Date(day.iso + "T12:00:00Z"))}</p>
                    <p className="num text-[18px] leading-tight">{brl(day.total, false)}{day.over && <span className="ml-2 text-[12px] text-gravy">+R$ {int(day.total - a.dailyCap)} do teto</span>}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    {day.segments.slice(0, 3).map((sg) => (
                      <span key={sg.name} className="flex items-center gap-1.5 text-[11px] text-smoke">{sg.name}<span className="num">{int(sg.value)}</span><span className="size-1.5 rounded-sm" style={{ background: sg.color }} /></span>
                    ))}
                    {!day.segments.length && <span className="text-[11px] text-mute">Nenhum gasto</span>}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          <AnimatePresence mode="wait">
            {view === "mes" ? (
              <motion.div key="mes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative mt-3 h-[170px]">
                {a.dailyCap > 0 && (
                  <>
                    <div className="absolute inset-x-0 border-t-[1.5px] border-dashed border-sand-2" style={{ bottom: `${(a.dailyCap / peakDay) * 100}%` }} />
                    <span className="lg absolute right-0 z-10 rounded-xl px-2 py-1 text-[11px] font-semibold text-smoke" style={{ bottom: `calc(${(a.dailyCap / peakDay) * 100}% + 4px)` }}>teto R$ {int(a.dailyCap)}</span>
                  </>
                )}
                <div className="absolute inset-0 flex items-end gap-[3px]">
                  {a.days.map((d, i) => (
                    <button key={d.iso} onClick={() => !d.future && setSel(d.day)} aria-label={`Dia ${d.day}: ${brl(d.total)}`}
                      className="relative flex h-full flex-1 flex-col items-center justify-end">
                      {d.over && <span className="mb-1 size-1.5 rounded-full bg-otan" />}
                      <motion.span initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.15 + i * 0.02, type: "spring", stiffness: 160, damping: 18 }}
                        className={`flex w-full origin-bottom flex-col-reverse overflow-hidden rounded-full ${d.future ? "ghost" : ""} ${d.today ? "ring-2 ring-otan ring-offset-1" : ""} ${sel === d.day ? "opacity-100" : "opacity-90"}`}
                        style={{ height: d.future ? "34%" : `${Math.max(4, (d.total / peakDay) * 100)}%`, background: !d.future && !d.total ? "var(--c-cotton)" : undefined }}>
                        {!d.future && d.segments.map((s) => <span key={s.name} style={{ flexGrow: s.value, background: s.color }} />)}
                      </motion.span>
                      {sel === d.day && <motion.span layoutId="sel" className="absolute -bottom-2.5 size-1 rounded-full bg-ink" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="meses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 flex h-[190px] items-end gap-3">
                {months.map((m, i) => {
                  const cur = m.ym === a.ym
                  return (
                    <div key={m.ym} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                      <span className="num text-[11px] text-mute">{m.total ? (m.total / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "k" : ""}</span>
                      <motion.span initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.1 + i * 0.06, type: "spring", stiffness: 120, damping: 16 }}
                        className={`flex w-full max-w-[34px] origin-bottom flex-col-reverse overflow-hidden rounded-[12px] ${cur ? "ring-2 ring-otan ring-offset-2" : ""}`}
                        style={{ height: `${Math.max(3, (m.total / peakMonth) * 80)}%`, background: m.total ? undefined : "var(--c-cotton)" }}>
                        {m.segments.map((s) => <span key={s.name} style={{ flexGrow: s.value, background: s.color }} />)}
                      </motion.span>
                      <span className={`num text-[11px] ${cur ? "text-gravy" : "text-mute"}`}>{MS[Number(m.ym.slice(5)) - 1]}</span>
                    </div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1.5">
            {legend.map((c) => (
              <span key={c.name} className="flex items-center gap-1.5 text-[12px] text-smoke"><span className="size-2 rounded-sm" style={{ background: c.color }} />{c.name}</span>
            ))}
            {view === "mes" && <span className="flex items-center gap-1.5 text-[12px] text-smoke"><span className="size-1.5 rounded-full bg-otan" />passou do teto</span>}
          </div>
        </motion.section>

        {view === "mes" && (
          <motion.div {...rise} transition={{ ...spring, delay: 0.08 }} className="grid grid-cols-3 gap-3">
            {[
              ["Dia mais caro", biggest && biggest.total ? `R$ ${int(biggest.total)}` : "—", biggest && biggest.total ? `dia ${biggest.day}` : ""],
              ["Por dia", `R$ ${int(a.expense / Math.max(1, a.dayOfMonth))}`, a.dailyCap > 0 ? `teto R$ ${int(a.dailyCap)}` : "média"],
              ["Lançamentos", String(monthTx.length), `${monthTx.filter((t) => t.kind === "income").length} entradas`],
            ].map(([t, v, sub]) => (
              <div key={t} className="rounded-[23px] bg-card p-4">
                <p className="text-[11px] text-mute">{t}</p>
                <p className="num mt-1 text-[19px] leading-none">{v}</p>
                <p className="mt-1 text-[11px] text-faint">{sub}</p>
              </div>
            ))}
          </motion.div>
        )}

        {view === "mes" && a.categories.length > 0 && (
          <motion.div {...rise} transition={{ ...spring, delay: 0.1 }}>
            <div className="mb-3 flex items-center justify-between px-1"><p className="ttl text-[17px]">Por categoria</p><span className="text-[12px] text-mute">vs mês passado</span></div>
            <section className="rounded-[23px] bg-card px-5 py-1">
            {catRows.map((c) => (
              <div key={c.name} className="flex items-center gap-3 border-t border-cotton py-3 first-of-type:border-0">
                <CatIcon category={c.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px]">{c.name}</p>
                  <p className="text-[12px] text-mute">{c.count} {c.count === 1 ? "lançamento" : "lançamentos"} · {Math.round((c.value / a.expense) * 100)}%</p>
                </div>
                {c.delta !== null && Math.abs(c.delta) >= 0.1 && c.delta < 3 && (
                  <span className={`num rounded-full px-2 py-0.5 text-[12px] ${c.delta > 0 ? "bg-otan/12 text-gravy" : "bg-cotton text-smoke"}`}>{c.delta > 0 ? "↑" : "↓"}{Math.min(999, Math.round(Math.abs(c.delta) * 100))}%</span>
                )}
                <span className="num w-[86px] text-right text-[15px]">{brl(c.value, false)}</span>
              </div>
            ))}
            </section>
          </motion.div>
        )}

        <motion.div {...rise} transition={{ ...spring, delay: 0.12 }}>
        <div className="mb-3 flex items-center justify-between px-1"><p className="ttl text-[17px]">Lançamentos</p><span className="text-[12px] text-mute">{monthTx.length} no mês</span></div>
        <section className="rounded-[23px] bg-card px-5 py-2">
          {groups.length === 0 && <p className="py-4 text-[14px] text-mute">Nenhum lançamento este mês.</p>}
          {groups.map(([iso, list]) => (
            <div key={iso} className="pt-3">
              <div className="flex justify-between text-[12px] text-mute">
                <span>{relativeDay(iso, snap.today)}</span>
                <span className="num">{(() => { const out = list.filter((t) => t.kind === "expense").reduce((x, t) => x + t.amount, 0); const inc = list.filter((t) => t.kind === "income").reduce((x, t) => x + t.amount, 0); return <>{out > 0 && `−${brl(out)}`}{out > 0 && inc > 0 && " · "}{inc > 0 && <span className="text-gravy">+{brl(inc)}</span>}</> })()}</span>
              </div>
              <TxList items={list} meta={(t) => t.category} />
            </div>
          ))}
          {groups.length > 0 && <p className="py-3 text-center text-[12px] text-faint">Arraste para a esquerda para apagar.</p>}
        </section>
        </motion.div>
      </div>
    </div>
  )
}
