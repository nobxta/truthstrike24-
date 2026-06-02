import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Flame,
  Newspaper,
  ChevronRight,
  Clock,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import ArticleCard from "@/components/public/ArticleCard";
import ReadingProgress from "@/components/public/ReadingProgress";
import ShareButtons from "@/components/public/ShareButtons";
import ScrollReveal from "@/components/public/ScrollReveal";
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
    authors: post.author?.name ? [{ name: post.author.name }] : undefined,
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
      authors: post.author?.name ? [post.author.name] : undefined,
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

  const [hotPosts, trendingPosts, categories, relatedPosts] = await Promise.all(
    [
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
        where: { status: "published", id: { not: post.id } },
        select: {
          title: true,
          slug: true,
          publishedAt: true,
          createdAt: true,
          category: { select: { name: true, color: true } },
        },
        orderBy: { publishedAt: "desc" },
        skip: 4,
        take: 5,
      }),
      prisma.category.findMany({
        include: { _count: { select: { posts: true } } },
        orderBy: { name: "asc" },
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
    ]
  );

  const dateStr =
    post.publishedAt?.toISOString() || post.createdAt.toISOString();

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
    author: post.author?.name
      ? {
          "@type": "Person",
          name: post.author.name,
        }
      : undefined,
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

      {/* ── Hero ── */}
      {post.featuredImage ? (
        <div className="relative w-full h-[50vh] md:h-[62vh] overflow-hidden article-hero-wrapper">
          <div className="absolute inset-0 article-hero-image">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-black/30 dark:from-[#0a0a0f] dark:via-[#0a0a0f]/30 dark:to-black/40" />

          <div className="absolute top-6 left-0 right-0 z-10">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/80 hover:text-white bg-black/25 hover:bg-black/40 backdrop-blur-sm transition-all duration-200 group"
              >
                <ArrowLeft
                  size={14}
                  className="group-hover:-translate-x-0.5 transition-transform duration-200"
                />
                Home
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-8 pb-2">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-accent transition-colors group"
            >
              <ArrowLeft
                size={13}
                className="group-hover:-translate-x-0.5 transition-transform duration-200"
              />
              Home
            </Link>
          </div>
        </div>
      )}

      {/* ── Main Layout ── */}
      <div
        className={`max-w-[1200px] mx-auto px-4 sm:px-6 ${
          post.featuredImage ? "-mt-28 relative z-10" : "pt-2"
        }`}
      >
        <div className="flex gap-10">
          {/* ═══ LEFT: Content ═══ */}
          <div className="flex-1 min-w-0">
            {/* Header card */}
            <div
              className={`article-header-animate ${
                post.featuredImage
                  ? "bg-white dark:bg-[#12121a] rounded-2xl shadow-2xl shadow-black/8 dark:shadow-black/40 ring-1 ring-black/[0.04] dark:ring-white/[0.08] p-7 sm:p-9"
                  : "pb-6"
              }`}
            >
              {/* Category + Breaking */}
              <div className="flex items-center gap-2.5 mb-4 article-stagger-1">
                <Link
                  href={`/category/${post.category.slug}`}
                  className="px-3 py-1 rounded-md text-[11px] font-bold text-white uppercase tracking-wider hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: post.category.color }}
                >
                  {post.category.name}
                </Link>

                {post.isBreaking && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-accent bg-red-50 dark:bg-red-900/20 uppercase tracking-wider">
                    <Flame size={11} />
                    Breaking
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-[2.5rem] sm:leading-[1.15] font-serif font-bold text-[#111111] dark:text-white article-stagger-2">
                {post.title}
              </h1>

              {/* Summary */}
              {post.summary && (
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-4 leading-relaxed article-stagger-3">
                  {post.summary}
                </p>
              )}

              {/* Date only */}
              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/[0.06] article-stagger-4">
                <ArticleDateTime dateStr={dateStr} />
              </div>
            </div>

            {/* ── Content + Share ── */}
            <div className="flex gap-6 mt-10 md:mt-12">
              {/* Share — just clean icons, no label */}
              <aside className="hidden lg:block w-10 shrink-0">
                <div className="sticky top-28">
                  <ShareButtons title={post.title} slug={post.slug} />
                </div>
              </aside>

              {/* Article body */}
              <div id="article-body" className="flex-1 min-w-0">
                <div
                  className="article-content article-body-animate drop-cap-first"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>
            </div>

            {/* ── Tags ── */}
            {post.tags.length > 0 && (
              <ScrollReveal>
                <div className="flex flex-wrap gap-2 mt-14 pt-8 border-t border-gray-200 dark:border-white/[0.06]">
                  {post.tags.map((pt) => (
                    <Link
                      key={pt.tag.id}
                      href={`/tag/${pt.tag.slug}`}
                      className="px-3.5 py-1.5 bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 rounded-lg text-[13px] hover:bg-accent hover:text-white dark:hover:bg-accent transition-all duration-200"
                    >
                      {pt.tag.name}
                    </Link>
                  ))}
                </div>
              </ScrollReveal>
            )}
          </div>

          {/* ═══ RIGHT: Sidebar ═══ */}
          <aside className="hidden lg:block w-[320px] shrink-0">
            <div
              className={`sticky top-24 space-y-8 ${
                post.featuredImage ? "pt-6" : ""
              }`}
            >
              {/* ─── HOT NEWS ─── */}
              {hotPosts.length > 0 && (
                <div className="sidebar-card-animate">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-extrabold text-[#111111] dark:text-white uppercase tracking-wider">
                      Hot News
                    </h3>
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  </div>

                  <div className="space-y-3">
                    {hotPosts.map((hp) => {
                      const hpDate =
                        hp.publishedAt?.toISOString() ||
                        hp.createdAt.toISOString();
                      return (
                        <Link
                          key={hp.slug}
                          href={`/${hp.slug}`}
                          className="flex gap-3 group"
                        >
                          {hp.featuredImage ? (
                            <div className="w-[68px] h-[50px] rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-white/[0.04]">
                              <img
                                src={hp.featuredImage}
                                alt={hp.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          ) : (
                            <div className="w-[68px] h-[50px] rounded-lg bg-gray-100 dark:bg-white/[0.04] shrink-0 flex items-center justify-center">
                              <Newspaper
                                size={14}
                                className="text-gray-300 dark:text-gray-600"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-[13px] font-semibold text-[#111111] dark:text-white line-clamp-2 leading-snug group-hover:text-accent transition-colors duration-200">
                              {hp.title}
                            </h4>
                            <span className="text-[11px] text-gray-400 mt-1 block">
                              {formatRelativeDate(hpDate)}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── TRENDING ─── */}
              {trendingPosts.length > 0 && (
                <div className="sidebar-card-animate-2">
                  <h3 className="text-xs font-extrabold text-[#111111] dark:text-white uppercase tracking-wider mb-4">
                    Trending
                  </h3>

                  <div className="space-y-0">
                    {trendingPosts.map((tp, idx) => {
                      const tpDate =
                        tp.publishedAt?.toISOString() ||
                        tp.createdAt.toISOString();
                      return (
                        <Link
                          key={tp.slug}
                          href={`/${tp.slug}`}
                          className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-white/[0.04] last:border-0 group"
                        >
                          <span className="text-[22px] font-black text-gray-200 dark:text-white/[0.08] leading-none mt-px w-6 shrink-0 tabular-nums group-hover:text-accent/20 transition-colors">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-[13px] font-semibold text-[#111111] dark:text-white line-clamp-2 leading-snug group-hover:text-accent transition-colors duration-200">
                              {tp.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="text-[10px] font-bold uppercase tracking-wider"
                                style={{ color: tp.category.color }}
                              >
                                {tp.category.name}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {formatRelativeDate(tpDate)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── CATEGORIES ─── */}
              <div className="sidebar-card-animate-3">
                <h3 className="text-xs font-extrabold text-[#111111] dark:text-white uppercase tracking-wider mb-4">
                  Explore
                </h3>

                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      className="px-3 py-1.5 rounded-md text-[12px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.04] hover:bg-accent hover:text-white dark:hover:bg-accent transition-all duration-200"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Related ── */}
      {relatedPosts.length > 0 && (
        <ScrollReveal>
          <section className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-20 pb-12">
            <div className="border-t border-gray-200 dark:border-white/[0.06] pt-12">
              <h2 className="text-xl font-serif font-bold text-[#111111] dark:text-white mb-8">
                More in {post.category.name}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
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
        </ScrollReveal>
      )}
    </>
  );
}
