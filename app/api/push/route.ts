import { requireSpaceId } from "@/lib/space"
import { saveSub } from "@/lib/push"

export const dynamic = "force-dynamic"

/** O service worker chama aqui quando o aparelho troca a inscrição de notificações sozinho. */
export async function POST(req: Request) {
  try {
    const id = await requireSpaceId()
    const sub = await req.json()
    if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return new Response("inscrição inválida", { status: 400 })
    await saveSub(id, sub)
    return Response.json({ ok: true })
  } catch {
    return new Response("sem acesso", { status: 401 })
  }
}
