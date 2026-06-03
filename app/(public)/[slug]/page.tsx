import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Flame, ChevronRight } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import ArticleCard from "@/components/public/ArticleCard";
import ReadingProgress from "@/components/public/ReadingProgress";
import ShareButtons from "@/components/public/ShareButtons";
import ArticleDateTime from "@/components/public/ArticleDateTime";
import AnalyticsTracker from "@/components/public/AnalyticsTracker";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug, status: "published" },
    select: {
      seoTitle: true,
      metaDescription: true,
      title: true,
      summary: true,
      featuredImage: true,
      keywords: true,
      publishedAt: true,
      updatedAt: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  if (!post) return { title: "Article Not Found" };

  const fullTitle = post.seoTitle
    ? post.seoTitle.includes("TruthStrike24")
      ? post.seoTitle
      : `${post.seoTitle} | TruthStrike24`
    : `${post.title} | TruthStrike24`;

  const description = post.metaDescription || post.summary;
  const keywordsArr = post.keywords
    ? post.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;

  // Use the article's featured image if present, otherwise generate
  // a branded preview image via /api/og at request time.
  const siteUrlMeta =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.truthstrike24.com";
  const fallbackOg = `${siteUrlMeta}/api/og?title=${encodeURIComponent(
    post.title
  )}&category=${encodeURIComponent(post.category?.name || "News")}&date=${encodeURIComponent(
    post.publishedAt?.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) || ""
  )}`;
  const ogImage = post.featuredImage || fallbackOg;

  return {
    title: fullTitle,
    description,
    keywords: keywordsArr,
    authors: [{ name: "TruthStrike24 Newsroom", url: siteUrlMeta }],
    category: post.category?.name,
    openGraph: {
      title: post.seoTitle || post.title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      authors: ["TruthStrike24 Newsroom"],
      section: post.category?.name,
      tags: keywordsArr,
      siteName: "TruthStrike24",
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle || post.title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `/${params.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug, status: "published" },
    include: {
      author: { select: { name: true } },
      category: {
        select: { name: true, slug: true, color: true },
      },
      tags: { include: { tag: true } },
    },
  });

  if (!post) notFound();

  const [hotPosts, relatedPosts] = await Promise.all([
    prisma.post.findMany({
      where: { status: "published", id: { not: post.id } },
      select: {
        title: true,
        slug: true,
        featuredImage: true,
        publishedAt: true,
        createdAt: true,
        category: { select: { name: true, color: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
    prisma.post.findMany({
      where: {
        status: "published",
        categoryId: post.categoryId,
        id: { not: post.id },
      },
      include: {
        category: { select: { name: true, slug: true, color: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
  ]);

  const dateStr =
    post.publishedAt?.toISOString() || post.createdAt.toISOString();

  // Reading-time estimate (220 wpm, strip HTML)
  const wordCount = post.content
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  const readingMin = Math.max(1, Math.round(wordCount / 220));

  // JSON-LD structured data (Article schema) for Google rich results
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.truthstrike24.com";

  // Breadcrumb schema — shown in Google search results as a path
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      ...(post.category
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: post.category.name,
              item: `${siteUrl}/category/${post.category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: post.category ? 3 : 2,
        name: post.title,
        item: `${siteUrl}/${params.slug}`,
      },
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.metaDescription || post.summary,
    image: post.featuredImage ? [post.featuredImage] : undefined,
    datePublished: dateStr,
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: "TruthStrike24 Newsroom",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "TruthStrike24",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/${params.slug}`,
    },
    articleSection: post.category?.name,
    keywords: post.keywords || undefined,
  };

  return (
    <>
      {/* Schema.org JSON-LD for Google rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {/* BreadcrumbList — shown as Home › Category › Article in Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <AnalyticsTracker pathname={`/${params.slug}`} postId={post.id} />
      <ReadingProgress />

      {/* ── Breadcrumb / back nav ── */}
      <div className="border-b border-gray-100 dark:border-white/[0.06]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-11 flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-accent transition-colors flex items-center gap-1">
            <ArrowLeft size={12} /> Home
          </Link>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <Link
            href={`/category/${post.category.slug}`}
            className="hover:text-accent transition-colors font-semibold"
            style={{ color: post.category.color }}
          >
            {post.category.name}
          </Link>
        </div>
      </div>

      {/* ── HEADER (headline-first, like real news) ── */}
      <header className="bg-white dark:bg-[#0a0a0f]">
        <div className="max-w-[760px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8 article-header-animate">
          <div className="flex items-center gap-2.5 mb-5 article-stagger-1">
            <Link
              href={`/category/${post.category.slug}`}
              className="px-3 py-1 rounded text-[11px] font-extrabold text-white uppercase tracking-[0.15em] hover:opacity-90 transition-opacity"
              style={{ backgroundColor: post.category.color }}
            >
              {post.category.name}
            </Link>
            {post.isBreaking && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-extrabold text-white bg-red-600 uppercase tracking-[0.15em]">
                <Flame size={11} />
                Breaking
              </span>
            )}
          </div>

          {/* Headline */}
          <h1 className="text-[28px] sm:text-[40px] lg:text-[44px] leading-[1.1] tracking-tight font-serif font-bold text-[#111111] dark:text-white article-stagger-2">
            {post.title}
          </h1>

          {/* Dek / summary */}
          {post.summary && (
            <p className="text-[17px] sm:text-[19px] text-gray-600 dark:text-gray-400 mt-5 leading-[1.55] article-stagger-3">
              {post.summary}
            </p>
          )}

          {/* Meta strip: date · reading time · share */}
          <div className="flex items-center justify-between flex-wrap gap-3 mt-7 pt-5 border-t border-gray-200 dark:border-white/[0.08] article-stagger-4">
            <div className="flex items-center gap-4 text-[13px] text-gray-500 dark:text-gray-400">
              <ArticleDateTime dateStr={dateStr} />
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
              <span className="hidden sm:inline">{readingMin} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <ShareButtons title={post.title} slug={post.slug} />
            </div>
          </div>
        </div>
      </header>

      {/* ── FEATURED IMAGE (between header and body, real news pattern) ── */}
      {post.featuredImage && (
        <figure className="bg-white dark:bg-[#0a0a0f]">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
            <div className="article-hero-wrapper rounded-2xl overflow-hidden ring-1 ring-black/[0.04] dark:ring-white/[0.04]">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="article-hero-image w-full h-auto aspect-[16/9] object-cover"
              />
            </div>
            {post.summary && (
              <figcaption className="max-w-[760px] mx-auto text-[12px] text-gray-400 dark:text-gray-500 italic mt-2 px-1">
                Image illustrating story coverage.
              </figcaption>
            )}
          </div>
        </figure>
      )}

      {/* ── MAIN GRID: article body + slim sidebar ── */}
      <div className="bg-white dark:bg-[#0a0a0f]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-10 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Article body — centered, max-width for readability */}
            <article className="lg:col-span-8 lg:col-start-1 min-w-0">
              <div className="max-w-[680px] mx-auto">
                <div
                  className="article-content article-body-animate drop-cap-first"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-12 pt-7 border-t border-gray-200 dark:border-white/[0.06]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1">Topics:</span>
                    {post.tags.map((pt) => (
                      <Link
                        key={pt.tag.id}
                        href={`/tag/${pt.tag.slug}`}
                        className="px-2.5 py-1 bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 rounded text-[12px] font-medium hover:bg-accent hover:text-white transition-colors"
                      >
                        #{pt.tag.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Bottom share rail */}
                <div className="flex items-center justify-between gap-4 mt-10 pt-7 border-t border-gray-200 dark:border-white/[0.06]">
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                    Share this story
                  </p>
                  <ShareButtons title={post.title} slug={post.slug} />
                </div>
              </div>
            </article>

            {/* Slim sidebar — only ONE widget (more from category) */}
            <aside className="lg:col-span-4 lg:col-start-9 min-w-0">
              <div className="sticky top-20 space-y-6">
                {hotPosts.length > 0 && (
                  <div className="bg-[#fafafa] dark:bg-white/[0.02] rounded-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-5">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-white/[0.06]">
                      <h3 className="text-[11px] font-extrabold text-[#111111] dark:text-white uppercase tracking-wider">
                        More from the Newsroom
                      </h3>
                    </div>
                    <ul className="space-y-4">
                      {hotPosts.map((hp) => {
                        const hpDate =
                          hp.publishedAt?.toISOString() || hp.createdAt.toISOString();
                        return (
                          <li key={hp.slug}>
                            <Link href={`/${hp.slug}`} className="group block">
                              {hp.featuredImage && (
                                <div className="w-full aspect-[16/10] rounded-lg overflow-hidden bg-gray-100 dark:bg-white/[0.04] mb-2">
                                  <img
                                    src={hp.featuredImage}
                                    alt={hp.title}
                                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                                  />
                                </div>
                              )}
                              <span
                                className="text-[10px] font-bold uppercase tracking-wider"
                                style={{ color: hp.category.color }}
                              >
                                {hp.category.name}
                              </span>
                              <h4 className="text-[14px] font-serif font-semibold text-[#111111] dark:text-white leading-snug mt-1 group-hover:text-accent transition-colors line-clamp-3">
                                {hp.title}
                              </h4>
                              <span className="text-[11px] text-gray-400 mt-1.5 block">
                                {formatRelativeDate(hpDate)}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* ── RELATED — same-category, 4 cards ── */}
      {relatedPosts.length > 0 && (
        <section className="bg-[#fafafa] dark:bg-[#0c0c14] border-t border-gray-100 dark:border-white/[0.04]">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-end justify-between mb-7">
              <div className="flex items-center gap-3">
                <span
                  className="w-1 h-6 rounded-full"
                  style={{ backgroundColor: post.category.color }}
                />
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#111111] dark:text-white">
                  More in {post.category.name}
                </h2>
              </div>
              <Link
                href={`/category/${post.category.slug}`}
                className="hidden sm:flex items-center gap-1 text-[12px] font-semibold text-gray-500 dark:text-gray-400 hover:text-accent transition-colors group"
              >
                See all
                <ChevronRight
                  size={13}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedPosts.map((rp) => (
                <ArticleCard
                  key={rp.id}
                  title={rp.title}
                  slug={rp.slug}
                  summary={rp.summary}
                  featuredImage={rp.featuredImage}
                  category={rp.category}
                  publishedAt={rp.publishedAt?.toISOString() ?? null}
                  createdAt={rp.createdAt.toISOString()}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
