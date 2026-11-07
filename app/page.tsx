import { loadSnapshot } from "@/lib/space"
import { Onboarding } from "@/components/onboarding"
import { FluxoApp } from "@/components/fluxo-app"

export const dynamic = "force-dynamic"

export default async function Page() {
  const snap = await loadSnapshot()
  if (!snap) return <Onboarding />
  return <FluxoApp snap={snap} />
}
