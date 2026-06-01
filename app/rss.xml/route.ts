import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://truthstrike24.vercel.app";
const SITE_NAME = "TruthStrike24";

export const revalidate = 1800; // 30 min

function escape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 50,
      include: {
        category: { select: { name: true } },
        author: { select: { name: true } },
      },
    });

    const items = posts
      .map((p) => {
        const link = `${SITE_URL}/${p.slug}`;
        const pubDate = (p.publishedAt || p.createdAt).toUTCString();
        const description = escape(p.metaDescription || p.summary || stripHtml(p.content).slice(0, 250));
        const author = p.author?.name || SITE_NAME;
        return `
    <item>
      <title>${escape(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <author>news@truthstrike24.com (${escape(author)})</author>
      ${p.category?.name ? `<category>${escape(p.category.name)}</category>` : ""}
      ${p.featuredImage ? `<enclosure url="${p.featuredImage}" type="image/jpeg" />` : ""}
      <content:encoded><![CDATA[${p.content}]]></content:encoded>
    </item>`;
      })
      .join("");

    const lastBuild = posts[0]?.publishedAt?.toUTCString() || new Date().toUTCString();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME} — Breaking News, Crypto Scam Alerts &amp; Real Investigations</title>
    <link>${SITE_URL}</link>
    <description>Independent investigative journalism. Crypto scam alerts, fraud exposure, and real news 24/7.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${process.env.NEXT_PUBLIC_LOGO_URL || "https://res.cloudinary.com/dumhqc5k6/image/upload/v1780221602/ChatGPT_Image_May_31_2026_03_29_40_PM_sgjcd2.png"}</url>
      <title>${SITE_NAME}</title>
      <link>${SITE_URL}</link>
    </image>${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800, s-maxage=1800",
      },
    });
  } catch {
    return new NextResponse("RSS unavailable", { status: 500 });
  }
}
