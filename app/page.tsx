import { loadSnapshot } from "@/lib/space"
import { Landing } from "@/components/landing"
import { Onboarding } from "@/components/onboarding"
import { FluxoApp } from "@/components/fluxo-app"

export const dynamic = "force-dynamic"

export default async function Page({ searchParams }: { searchParams: Promise<{ onboarding?: string }> }) {
  const snap = await loadSnapshot()
  if (!snap) return <Landing />
  // /?onboarding=1 reabre o onboarding só pra ver, sem mexer nos dados
  if ((await searchParams).onboarding) return <Onboarding name={snap.user.name} needsPassword={false} preview />
  if (!snap.space.onboarded) return <Onboarding name={snap.user.name} needsPassword={snap.user.mustChangePassword} />
  return <FluxoApp snap={snap} />
}
