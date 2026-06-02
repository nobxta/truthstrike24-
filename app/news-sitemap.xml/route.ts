import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Google News sitemap at /news-sitemap.xml
 *
 * Per Google News spec: ONLY include articles published in the last 48 hours.
 * Each <url> includes <news:news> with publication name, language, publish
 * date, and title. This is what gets you onto the Google News tab.
 *
 * Spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */

export const revalidate = 600; // refresh every 10 minutes

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://truthstrike24.vercel.app";
const PUBLICATION_NAME = "TruthStrike24";
const LANGUAGE = "en";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const posts = await prisma.post.findMany({
    where: {
      status: "published",
      publishedAt: { gte: twoDaysAgo },
    },
    orderBy: { publishedAt: "desc" },
    take: 1000,
    select: {
      slug: true,
      title: true,
      publishedAt: true,
      keywords: true,
    },
  });

  const urls = posts
    .map((p) => {
      const pub = p.publishedAt ?? new Date();
      const kw = (p.keywords ?? "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
        .slice(0, 10)
        .join(", ");
      return `  <url>
    <loc>${SITE_URL}/${escapeXml(p.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(PUBLICATION_NAME)}</news:name>
        <news:language>${LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${pub.toISOString()}</news:publication_date>
      <news:title>${escapeXml(p.title)}</news:title>${kw ? `\n      <news:keywords>${escapeXml(kw)}</news:keywords>` : ""}
    </news:news>
  </url>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}
