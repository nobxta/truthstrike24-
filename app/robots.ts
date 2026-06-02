import { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://truthstrike24.vercel.app";

/**
 * Auto-generated robots.txt at /robots.txt
 * Tells search engines what to crawl and where the sitemap is.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
          "/dispute/*",
          "/unsubscribe/*",
          "/login",
          "/_next/*",
          "/*.json$",
        ],
      },
      // Be extra generous with major crawlers
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api/*", "/dispute/*", "/unsubscribe/*", "/login"],
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api/*"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api/*", "/dispute/*", "/unsubscribe/*", "/login"],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/news-sitemap.xml`,
    ],
    host: SITE_URL,
  };
}
