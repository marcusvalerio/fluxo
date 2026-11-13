// Modo Natal: liga sozinho de 1º de dezembro a 6 de janeiro (dá pra forçar nos Ajustes).
// O Fluximetro aparece enrolado no pisca-pisca; quando o mês aperta, neva no app.

export type NatalPref = "auto" | "on" | "off"
const KEY = "fluxo-natal"
export const natalPref = (): NatalPref => { try { return (localStorage.getItem(KEY) as NatalPref) || "auto" } catch { return "auto" } }
export const setNatalPref = (v: NatalPref) => { try { localStorage.setItem(KEY, v) } catch {} window.dispatchEvent(new Event("fluxo:natal")) }
export function isNatal(today: string, pref: NatalPref = natalPref()) {
  if (pref !== "auto") return pref === "on"
  const m = Number(today.slice(5, 7)), d = Number(today.slice(8, 10))
  return m === 12 || (m === 1 && d <= 6)
}

export const BULBS = ["#FF3B30", "#FFD60A", "#34C759", "#0A84FF", "#FF9F0A", "#FF375F"]

/** Uma lampadinha: soquete, vidro colorido e um brilho suave que pisca. */
export function bulb(x: number, y: number, c: string, sz: number, k: number, ang = 0) {
  const d = `${(k % 4) * 0.3}s`
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(0)})"><circle r="${sz * 3}" fill="${c}" opacity=".28" class="xm-bulb xm-glow" style="animation-delay:${d}"/><rect x="${-sz * 0.45}" y="${-sz * 0.2}" width="${sz * 0.9}" height="${sz * 0.7}" rx="${sz * 0.2}" fill="#2B3A2B"/><ellipse cy="${sz * 1.3}" rx="${sz * 0.8}" ry="${sz * 1.15}" fill="${c}" class="xm-bulb" style="animation-delay:${d}"/></g>`
}

// voltas do fio em torno da moeda: a metade de trás passa por trás dela, a da frente por cima
const WRAPS = [{ dy: -0.7, tilt: -7, ry: 0.18 }, { dy: 0.48, tilt: 8, ry: 0.2 }, { dy: 0.74, tilt: -10, ry: 0.15 }]
function arc(cx: number, cy: number, R: number, w: (typeof WRAPS)[number], front: boolean) {
  const rx = R * 1.06, ry = R * w.ry, a = (w.tilt * Math.PI) / 180, pts: [number, number][] = []
  for (let i = 0; i <= 40; i++) {
    const th = (front ? 0 : Math.PI) + (i / 40) * Math.PI, x = rx * Math.cos(th), y = ry * Math.sin(th)
    pts.push([cx + x * Math.cos(a) - y * Math.sin(a), cy + R * w.dy + x * Math.sin(a) + y * Math.cos(a)])
  }
  return pts
}
const poly = (pts: [number, number][]) => "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L")

export function lightsBack(cx: number, cy: number, R: number) {
  return WRAPS.map((w) => `<path d="${poly(arc(cx, cy, R, w, false))}" stroke="#2B3A2B" stroke-width="${R * 0.028}" fill="none" opacity=".7"/>`).join("")
}
export function lightsFront(cx: number, cy: number, R: number, seed = 0) {
  let h = "", k = seed
  for (const w of WRAPS) {
    const pts = arc(cx, cy, R, w, true)
    h += `<path d="${poly(pts)}" stroke="#2B3A2B" stroke-width="${R * 0.03}" fill="none" stroke-linecap="round"/>`
    for (const j of [6, 14, 22, 30, 37]) { const [x, y] = pts[j]; h += bulb(x, y, BULBS[k % BULBS.length], R * 0.05, k, Math.sin(k) * 25); k++ }
  }
  return h
}
