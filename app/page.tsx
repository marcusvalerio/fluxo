import { loadSnapshot } from "@/lib/space"
import { Login } from "@/components/login"
import { Onboarding } from "@/components/onboarding"
import { FluxoApp } from "@/components/fluxo-app"

export const dynamic = "force-dynamic"

export default async function Page() {
  const snap = await loadSnapshot()
  if (!snap) return <Login />
  if (!snap.space.onboarded) return <Onboarding name={snap.user.name} needsPassword={snap.user.mustChangePassword} />
  return <FluxoApp snap={snap} />
}
