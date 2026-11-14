import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fluxo",
    short_name: "Fluxo",
    description: "Quanto ainda cabe no seu mês, todo dia.",
    start_url: "/",
    display: "standalone",
    background_color: "#E4E3DC",
    theme_color: "#FF4E20",
    icons: [
      { src: "/icon-v4-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-v4-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-v4-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
