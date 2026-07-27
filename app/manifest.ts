import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ListeKutusu",
    short_name: "ListeKutusu",
    description: "Müzik keşiflerini paylaş, kişisel listeni oluştur ve topluluğu takip et.",
    start_url: "/",
    display: "standalone",
    background_color: "#030b18",
    theme_color: "#030b18",
    lang: "tr",
    categories: ["music", "social"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
