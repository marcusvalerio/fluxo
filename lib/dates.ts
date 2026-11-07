export const TZ = "America/Sao_Paulo"

/** YYYY-MM-DD no fuso de São Paulo */
export function todayISO(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
}

export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00Z")
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function daysInMonth(iso: string) {
  const [y, m] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

export function diffDays(a: string, b: string) {
  return Math.round((new Date(b + "T12:00:00Z").getTime() - new Date(a + "T12:00:00Z").getTime()) / 86400000)
}

const fmtDay = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })
const fmtWeek = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" })
const fmtMonth = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" })

export const labelDay = (iso: string) => fmtDay.format(new Date(iso + "T12:00:00Z")).replace(".", "")
export const labelWeekday = (iso: string) => fmtWeek.format(new Date(iso + "T12:00:00Z")).replace(".", "")
export const labelMonth = (iso: string) => fmtMonth.format(new Date(iso + "T12:00:00Z"))

export function relativeDay(iso: string, today: string) {
  const d = diffDays(today, iso)
  if (d === 0) return "Hoje"
  if (d === -1) return "Ontem"
  if (d === 1) return "Amanhã"
  const s = d < 0 && d > -7 ? labelWeekday(iso) : labelDay(iso)
  return s[0].toUpperCase() + s.slice(1)
}
