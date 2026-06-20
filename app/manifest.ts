import type { MetadataRoute } from "next";

// Native web app manifest — Next.js auto-links it at /manifest.webmanifest.
// Manifest + HTTPS is enough for "Add to Home Screen"; no service worker in MVP (spec §9).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Team Tracker",
    short_name: "Tracker",
    description:
      "Sổ tay riêng của manager: ghi quan sát & theo dõi nhận định về nhân viên theo thời gian.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3f8f6b",
    lang: "vi",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
