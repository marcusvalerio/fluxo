import type { MetadataRoute } from "next"
import { cookies } from "next/headers"
import { asIcone } from "@/lib/icone"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const ic = asIcone((await cookies()).get("fluxo-icone")?.value)
  return {
    name: "Fluxo",
    short_name: "Fluxo",
    description: "Quanto ainda cabe no seu mês, todo dia.",
    start_url: "/",
    display: "standalone",
    background_color: "#E4E3DC",
    theme_color: "#FF4E20",
    icons: [
      { src: `/icons/${ic}-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `/icons/${ic}-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `/icons/${ic}-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
