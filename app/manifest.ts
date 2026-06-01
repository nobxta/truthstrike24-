import { MetadataRoute } from "next";

const DEFAULT_ICON =
  process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE ||
  "https://res.cloudinary.com/dumhqc5k6/image/upload/v1780221602/ChatGPT_Image_May_31_2026_03_29_40_PM_sgjcd2.png";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TruthStrike24 — Breaking News & Investigations",
    short_name: "TruthStrike24",
    description:
      "Independent investigative journalism — crypto scam alerts, fraud exposure, and real news 24/7.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#dc2626",
    orientation: "portrait",
    icons: [
      { src: DEFAULT_ICON, sizes: "192x192", type: "image/png" },
      { src: DEFAULT_ICON, sizes: "512x512", type: "image/png" },
      { src: DEFAULT_ICON, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: DEFAULT_ICON, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: DEFAULT_ICON, sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: DEFAULT_ICON, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    categories: ["news", "journalism", "magazines"],
    lang: "en-US",
  };
}
