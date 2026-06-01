import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://truthstrike24.vercel.app";

/**
 * Auto-generated sitemap at /sitemap.xml
 *
 * Lists every public URL Google should crawl:
 *   - Static pages (home, about, contact, etc.)
 *   - Every published article
 *   - Every published custom page
 *   - Every category
 *   - Every tag
 *
 * Updated automatically on every request (revalidate=3600 = 1 hour).
 */

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.4 },
  ];

  try {
    const [posts, customPages, categories, tags] = await Promise.all([
      prisma.post.findMany({
        where: { status: "published" },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: "desc" },
        take: 5000,
      }),
      prisma.customPage.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.category.findMany({
        select: { slug: true, createdAt: true },
      }),
      prisma.tag.findMany({
        select: { slug: true, createdAt: true },
      }),
    ]);

    // Articles
    const articleEntries: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${SITE_URL}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    }));

    // Custom pages (high priority — these are landing pages)
    const customEntries: MetadataRoute.Sitemap = customPages.map((p) => ({
      url: `${SITE_URL}/p/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.95,
    }));

    // Category listings
    const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${SITE_URL}/category/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    }));

    // Tag listings
    const tagEntries: MetadataRoute.Sitemap = tags.map((t) => ({
      url: `${SITE_URL}/tag/${t.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    }));

    return [
      ...staticPages,
      ...customEntries,
      ...articleEntries,
      ...categoryEntries,
      ...tagEntries,
    ];
  } catch {
    return staticPages;
  }
}
