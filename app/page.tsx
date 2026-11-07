import { loadSnapshot } from "@/lib/space"
import { Landing } from "@/components/landing"
import { Onboarding } from "@/components/onboarding"
import { FluxoApp } from "@/components/fluxo-app"

export const dynamic = "force-dynamic"

export default async function Page() {
  const snap = await loadSnapshot()
  if (!snap) return <Landing />
  if (!snap.space.onboarded) return <Onboarding name={snap.user.name} needsPassword={snap.user.mustChangePassword} />
  return <FluxoApp snap={snap} />
}
