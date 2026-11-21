import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fluxo",
    short_name: "Fluxo",
    description: "Quanto ainda cabe no seu mês, todo dia.",
    start_url: "/",
    display: "standalone",
    background_color: "#F3F5F9",
    theme_color: "#1B2440",
    icons: [
      { src: "/icon-v7-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-v7-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-v7-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
