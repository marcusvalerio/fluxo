// Service worker do Fluxo: só recebe os recados do Fluximetro.
self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()))
self.addEventListener("push", (e) => {
  let d = { title: "Fluximetro", body: "Tenho um recado pra você.", url: "/" }
  try { d = { ...d, ...e.data.json() } } catch {}
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: "/icon-v7-192.png", badge: "/icon-v7-192.png", data: { url: d.url || "/" } }))
})
self.addEventListener("notificationclick", (e) => {
  e.notification.close()
  const url = (e.notification.data && e.notification.data.url) || "/"
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) if ("focus" in c) { c.navigate(url); return c.focus() }
    return self.clients.openWindow(url)
  }))
})
// o aparelho trocou a inscrição (acontece no iPhone): pede uma nova e avisa o servidor
self.addEventListener("pushsubscriptionchange", (e) => {
  const opts = (e.oldSubscription && e.oldSubscription.options) || null
  if (!opts || !opts.applicationServerKey) return
  e.waitUntil(self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: opts.applicationServerKey })
    .then((sub) => fetch("/api/push", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(sub) }))
    .catch(() => {}))
})
