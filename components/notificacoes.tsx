"use client"

import { useEffect, useState } from "react"
import { pushPublicKey, resyncPush, subscribePush, unsubscribePush } from "@/app/actions"

type Estado = "carregando" | "sem-suporte" | "instalar" | "negado" | "ligado" | "desligado"

const b64 = (s: string) => {
  const pad = "=".repeat((4 - (s.length % 4)) % 4)
  const raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

/** Liga e desliga os recados do Fluximetro (Web Push). No iPhone só funciona com o app na tela de início. */
export function useNotificacoes() {
  const [estado, setEstado] = useState<Estado>("carregando")
  useEffect(() => {
    (async () => {
      const ios = /iphone|ipad/i.test(navigator.userAgent)
      const instalado = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setEstado(ios && !instalado ? "instalar" : "sem-suporte")
      if (Notification.permission === "denied") return setEstado("negado")
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      setEstado(sub ? "ligado" : "desligado")
    })().catch(() => setEstado("sem-suporte"))
  }, [])

  const ligar = async () => {
    const key = await pushPublicKey()
    if (!key) { setEstado("sem-suporte"); return }
    const perm = await Notification.requestPermission()
    if (perm !== "granted") { setEstado(perm === "denied" ? "negado" : "desligado"); return }
    const reg = await navigator.serviceWorker.register("/sw.js")
    await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) })
    const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
    await subscribePush(j)
    setEstado("ligado")
  }
  const desligar = async () => {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    if (sub) { await unsubscribePush(sub.endpoint); await sub.unsubscribe() }
    setEstado("desligado")
  }
  return { estado, ligar, desligar }
}

/**
 * Toda vez que o app abre: se a pessoa já deixou notificações, confere a inscrição e manda de novo pro servidor.
 * O iPhone troca ou invalida a inscrição de tempos em tempos; sem isso o recado diário parava depois do primeiro.
 */
export function useManterNotificacoes() {
  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return
      if (Notification.permission !== "granted") return
      const key = await pushPublicKey()
      if (!key) return
      const reg = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) }))
      await resyncPush(sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } })
    })().catch(() => {})
  }, [])
}
