"use client"

/**
 * Ícones do Fluxo: só traço, na espessura dos palitos da logo, com pontas redondas.
 * Cada um tem um gesto pequeno (ver .fx-ic em globals.css). Parado por padrão;
 * mexe quando está ativo (aba aberta) ou com o dedo/mouse em cima.
 */
const PATHS = {
  home: "<g class=\"roof\"><path class=\"s\" d=\"M3.5 11 12 4l8.5 7\"/></g><path class=\"s\" d=\"M5.8 9.6V17.5a3.2 3.2 0 0 0 3.2 3.2h6a3.2 3.2 0 0 0 3.2-3.2V9.6\"/><path class=\"s door\" d=\"M12 20.7v-4.4\"/>",
  flux: "<path class=\"s bar\" d=\"M6 20v-8\"/><path class=\"s bar\" d=\"M12 20V5\"/><path class=\"s bar\" d=\"M18 20v-6\"/>",
  agenda: "<rect class=\"s\" x=\"3.5\" y=\"5\" width=\"17\" height=\"15.5\" rx=\"4.5\"/><path class=\"s\" d=\"M8 3v4M16 3v4\"/><g class=\"page\"><path class=\"s\" d=\"M3.5 10.2h17\"/></g><circle class=\"f dt\" cx=\"8.5\" cy=\"15\" r=\"1.15\"/><circle class=\"f dt\" cx=\"12\" cy=\"15\" r=\"1.15\" style=\"animation-delay:.15s\"/><circle class=\"f dt\" cx=\"15.5\" cy=\"15\" r=\"1.15\" style=\"animation-delay:.3s\"/>",
  wallet: "<g class=\"card\"><path class=\"s\" d=\"M7 7 16.4 4.6a2 2 0 0 1 2.4 1.5L19 7\"/></g><rect class=\"s\" x=\"3\" y=\"7\" width=\"18\" height=\"13.5\" rx=\"4\"/><path class=\"s\" d=\"M16 13.8h1.5\"/>",
  plus: "<circle class=\"s ring\" cx=\"12\" cy=\"12\" r=\"9\"/><g class=\"pl\"><path class=\"s\" d=\"M12 8v8M8 12h8\"/></g>",
  salary: "<g class=\"note\"><rect class=\"s\" x=\"2.5\" y=\"6.5\" width=\"19\" height=\"12\" rx=\"3.5\"/><circle class=\"s\" cx=\"12\" cy=\"12.5\" r=\"2.6\"/></g><path class=\"f tw\" d=\"M20 .8l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z\"/>",
  goal: "<path class=\"s\" d=\"M3 20.5 9.5 10l3.5 5.5 2-3 6 8z\"/><path class=\"s\" d=\"M9.5 10V3\"/><path class=\"s flag\" d=\"M9.5 3h5.5l-1.5 2 1.5 2H9.5\"/>",
  pig: "<circle class=\"s coin\" cx=\"12\" cy=\"3.6\" r=\"1.9\"/><g class=\"body\"><path class=\"s\" d=\"M4.5 13.5c0-3.3 3.4-5.5 7.5-5.5s7.5 2.2 7.5 5.5-3.4 5.5-7.5 5.5-7.5-2.2-7.5-5.5z\"/><path class=\"s\" d=\"M8 18.6v2.4M16 18.6v2.4M10.5 8.3h3\"/></g>",
  cart: "<g class=\"cartbody\"><path class=\"s\" d=\"M2.5 4h2.4l2.2 11h11.2l2-8H6.2\"/><circle class=\"s\" cx=\"9\" cy=\"19.5\" r=\"1.4\"/><circle class=\"s\" cx=\"17\" cy=\"19.5\" r=\"1.4\"/></g>",
  car: "<g class=\"carb\"><path class=\"s\" d=\"M4.5 16.5V12l2-4.6A2.5 2.5 0 0 1 8.8 6h6.4a2.5 2.5 0 0 1 2.3 1.4l2 4.6v4.5\"/><path class=\"s\" d=\"M3.5 16.5h17M6.5 16.5v2M17.5 16.5v2M4.5 12h15\"/></g><path class=\"s road\" d=\"M2 22h20\" style=\"stroke-dasharray:3 3;opacity:.4\"/>",
  bag: "<g class=\"bag\"><path class=\"s\" d=\"M5 8h14l-1 11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z\"/><path class=\"s\" d=\"M9 8V6.5a3 3 0 0 1 6 0V8\"/></g>",
  health: "<path class=\"s heart\" d=\"M12 20s-8-4.8-8-10.2A4.3 4.3 0 0 1 12 7.5a4.3 4.3 0 0 1 8 2.3C20 15.2 12 20 12 20z\"/><path class=\"s ecg\" d=\"M6.5 12.5h2.5l1.5-2.5 2.5 5 1.5-2.5h3\"/>",
  bolt: "<rect class=\"s\" x=\"3.5\" y=\"3.5\" width=\"17\" height=\"17\" rx=\"5.5\"/><path class=\"s bolt\" d=\"M13 7l-4 6h3.5l-1 4 4-6H12z\"/>",
  bell: "<g class=\"bell\"><path class=\"s\" d=\"M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z\"/><path class=\"s\" d=\"M12 3v2\"/></g><path class=\"s clap\" d=\"M10 21h4\"/>",
  eye: "<g class=\"lid\"><path class=\"s\" d=\"M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z\"/><g class=\"pupil\"><circle class=\"s\" cx=\"12\" cy=\"12\" r=\"2.8\"/></g></g>",
  fluxi: "<g class=\"bub\"><path class=\"s\" d=\"M4 11c0-3.9 3.6-6.5 8-6.5s8 2.6 8 6.5-3.6 6.5-8 6.5c-.9 0-1.8-.1-2.6-.4L5.5 19l.9-3.2C4.9 14.6 4 12.9 4 11z\"/><circle class=\"f ty\" cx=\"8.5\" cy=\"11\" r=\"1.1\"/><circle class=\"f ty\" cx=\"12\" cy=\"11\" r=\"1.1\"/><circle class=\"f ty\" cx=\"15.5\" cy=\"11\" r=\"1.1\"/></g>",
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 22, active = false, className = "" }: { name: IconName; size?: number; active?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden
      className={`fx-ic i-${name} ${active ? "on" : ""} ${className}`}
      dangerouslySetInnerHTML={{ __html: PATHS[name] }} />
  )
}
