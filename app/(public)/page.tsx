import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  ArrowRight,
  Clock,
  Newspaper,
  ChevronRight,
} from "lucide-react";
import ArticleCard from "@/components/public/ArticleCard";
import TrendingTicker from "@/components/public/TrendingTicker";
import ScrollReveal from "@/components/public/ScrollReveal";
import AnalyticsTracker from "@/components/public/AnalyticsTracker";
import { formatRelativeDate } from "@/lib/utils";

export const revalidate = 60;

export default async function HomePage() {
  const [breakingPosts, latestPosts, categories, popularPosts] =
    await Promise.all([
      prisma.post.findMany({
        where: { status: "published", isBreaking: true },
        include: {
          category: { select: { name: true, slug: true, color: true } },
        },
        orderBy: { publishedAt: "desc" },
        take: 6,
      }),
      prisma.post.findMany({
        where: { status: "published" },
        include: {
          category: { select: { name: true, slug: true, color: true } },
        },
        orderBy: { publishedAt: "desc" },
        take: 16,
      }),
      prisma.category.findMany({
        include: { _count: { select: { posts: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.post.findMany({
        where: { status: "published" },
        include: {
          category: { select: { name: true, slug: true, color: true } },
        },
        orderBy: { publishedAt: "desc" },
        skip: 4,
        take: 5,
      }),
    ]);

  const heroPost = breakingPosts[0] || latestPosts[0];
  const sideHeroPosts = (
    breakingPosts.length > 1
      ? breakingPosts.slice(1, 4)
      : latestPosts.filter((p) => p.id !== heroPost?.id).slice(0, 3)
  ).slice(0, 3);

  const heroIds = new Set([heroPost?.id, ...sideHeroPosts.map((s) => s.id)]);
  const gridPosts = latestPosts.filter((p) => !heroIds.has(p.id)).slice(0, 8);

  const trendingPosts = latestPosts.slice(0, 5);
  const editorPicks = latestPosts.slice(5, 8);

  const tickerPosts = latestPosts.slice(0, 8).map((p) => ({
    title: p.title,
    slug: p.slug,
    category: { name: p.category.name, color: p.category.color },
  }));

  return (
    <>
      <AnalyticsTracker pathname="/" />
      <TrendingTicker posts={tickerPosts} />

      {/* ── HERO ── */}
      <section className="bg-white dark:bg-[#0a0a0f]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-7 pb-8">
          {heroPost && (
            <div className="flex items-center gap-2.5 mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <span className="text-[11px] font-bold text-accent uppercase tracking-[0.15em]">
                Breaking News
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-accent/20 to-transparent" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
            {/* LEFT — Trending */}
            <div className="hidden lg:flex lg:col-span-3 flex-col">
              <h3 className="text-[11px] font-bold text-[#111111] dark:text-white uppercase tracking-[0.12em] pb-3 mb-0 border-b border-gray-200 dark:border-white/[0.08]">
                Trending Now
              </h3>
              <div className="flex-1 flex flex-col justify-between">
                {trendingPosts.map((post, idx) => (
                  <Link
                    key={post.id}
                    href={`/${post.slug}`}
                    className="group flex items-start gap-3 py-3 border-b border-gray-100 dark:border-white/[0.04] last:border-0"
                  >
                    <span className="text-[20px] font-black text-gray-200 dark:text-white/[0.06] leading-none shrink-0 w-6 tabular-nums mt-0.5">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider leading-none"
                        style={{ color: post.category.color }}
                      >
                        {post.category.name}
                      </span>
                      <h4 className="text-[13px] font-semibold text-[#111111] dark:text-white line-clamp-2 leading-snug group-hover:text-accent transition-colors duration-300 mt-0.5">
                        {post.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Clock size={9} />
                        {formatRelativeDate(
                          post.publishedAt?.toISOString() ||
                            post.createdAt.toISOString()
                        )}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* CENTER — Hero + Sub-hero */}
            <div className="lg:col-span-6 flex flex-col">
              {heroPost && (
                <Link
                  href={`/${heroPost.slug}`}
                  className="group relative block rounded-2xl overflow-hidden flex-1 min-h-[340px]"
                >
                  {heroPost.featuredImage ? (
                    <img
                      src={heroPost.featuredImage}
                      alt={heroPost.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                      <Newspaper size={48} className="text-gray-300 dark:text-gray-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span
                      className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-widest"
                      style={{ backgroundColor: heroPost.category.color }}
                    >
                      {heroPost.category.name}
                    </span>
                    <h2 className="text-2xl lg:text-3xl font-serif font-bold text-white mt-2.5 leading-[1.2] group-hover:text-accent/90 transition-colors duration-300">
                      {heroPost.title}
                    </h2>
                    {heroPost.summary && (
                      <p className="text-[13px] text-white/70 mt-2 line-clamp-2 max-w-md leading-relaxed hidden sm:block">
                        {heroPost.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-3 text-[11px] text-white/50">
                      <Clock size={10} />
                      {formatRelativeDate(
                        heroPost.publishedAt?.toISOString() ||
                          heroPost.createdAt.toISOString()
                      )}
                    </div>
                  </div>
                </Link>
              )}

              {sideHeroPosts.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {sideHeroPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/${post.slug}`}
                      className="group relative rounded-xl overflow-hidden aspect-[4/3]"
                    >
                      {post.featuredImage ? (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                          <Newspaper size={20} className="text-gray-300 dark:text-gray-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2.5">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-widest"
                          style={{ backgroundColor: post.category.color }}
                        >
                          {post.category.name}
                        </span>
                        <h4 className="text-[11px] font-semibold text-white mt-1 line-clamp-2 leading-snug group-hover:text-accent/90 transition-colors duration-300">
                          {post.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — Editor's Picks */}
            <div className="hidden lg:flex lg:col-span-3 flex-col">
              <h3 className="text-[11px] font-bold text-[#111111] dark:text-white uppercase tracking-[0.12em] pb-3 mb-0 border-b border-gray-200 dark:border-white/[0.08]">
                Editor&apos;s Picks
              </h3>

              {editorPicks.length > 0 ? (
                <div className="flex-1 flex flex-col">
                  {editorPicks.map((post) => (
                    <Link
                      key={post.id}
                      href={`/${post.slug}`}
                      className="group flex-1 flex flex-col py-3 border-b border-gray-100 dark:border-white/[0.04] last:border-0"
                    >
                      {post.featuredImage && (
                        <div className="w-full h-24 rounded-lg overflow-hidden mb-2">
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                          />
                        </div>
                      )}
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: post.category.color }}
                      >
                        {post.category.name}
                      </span>
                      <h4 className="text-[13px] font-semibold text-[#111111] dark:text-white line-clamp-2 leading-snug group-hover:text-accent transition-colors duration-300 mt-0.5">
                        {post.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 mt-auto pt-1 flex items-center gap-1">
                        <Clock size={9} />
                        {formatRelativeDate(
                          post.publishedAt?.toISOString() ||
                            post.createdAt.toISOString()
                        )}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center">
                  <div>
                    <Newspaper size={18} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-xs">Coming soon</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── LATEST ARTICLES + SIDEBAR ── */}
      <section className="bg-[#fafafa] dark:bg-[#0c0c14] border-t border-gray-100 dark:border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <ScrollReveal>
                <div className="flex items-end justify-between mb-7">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#111111] dark:text-white">
                      Latest Articles
                    </h2>
                    <p className="text-[12px] text-gray-400 mt-0.5">Fresh stories, updated every hour</p>
                  </div>
                </div>
              </ScrollReveal>

              {gridPosts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {gridPosts.map((post, i) => (
                    <ScrollReveal key={post.id} delay={i * 0.05}>
                      <ArticleCard
                        title={post.title}
                        slug={post.slug}
                        summary={post.summary}
                        featuredImage={post.featuredImage}
                        category={post.category}

                        publishedAt={post.publishedAt?.toISOString() ?? null}
                        createdAt={post.createdAt.toISOString()}
                        featured={i === 0}
                      />
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white dark:bg-white/[0.015] rounded-2xl">
                  <Newspaper size={22} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No published articles yet</p>
                </div>
              )}
            </div>

            <aside className="lg:col-span-4">
              <div className="sticky top-20 space-y-5">
                {popularPosts.length > 0 && (
                  <ScrollReveal delay={0.1}>
                    <div className="bg-white dark:bg-white/[0.02] rounded-2xl p-5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                      <h3 className="text-[11px] font-bold text-[#111111] dark:text-white uppercase tracking-[0.12em] mb-4 pb-2.5 border-b border-gray-100 dark:border-white/[0.06]">
                        Most Popular
                      </h3>
                      <div>
                        {popularPosts.map((post, idx) => (
                          <Link
                            key={post.id}
                            href={`/${post.slug}`}
                            className="group flex items-start gap-3 py-2.5 border-b border-gray-100/80 dark:border-white/[0.03] last:border-0 last:pb-0 first:pt-0"
                          >
                            <span className="text-lg font-black leading-none shrink-0 w-5 tabular-nums text-gray-200 dark:text-white/[0.06] group-hover:text-accent/25 transition-colors duration-300 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[13px] font-medium text-[#111111] dark:text-white line-clamp-2 group-hover:text-accent transition-colors duration-300 leading-snug">
                                {post.title}
                              </h4>
                              <span
                                className="text-[9px] font-bold uppercase tracking-wider mt-1 inline-block"
                                style={{ color: post.category.color }}
                              >
                                {post.category.name}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>
                )}

                <ScrollReveal delay={0.15}>
                  <div className="relative overflow-hidden rounded-2xl bg-[#111111] p-5">
                    <div className="absolute -top-8 -right-8 w-28 h-28 bg-accent/8 rounded-full" />
                    <h4 className="text-white font-serif font-bold text-base leading-snug relative">
                      Stay informed with TruthStrike24
                    </h4>
                    <p className="text-gray-500 text-[12px] mt-2 leading-relaxed relative">
                      Breaking stories and expert analysis delivered around the clock.
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 mt-3 text-[12px] font-semibold text-accent hover:text-red-400 transition-colors duration-300 relative"
                    >
                      Explore now
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </ScrollReveal>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── EXPLORE TOPICS ── */}
      {categories.length > 0 && (
        <section className="bg-white dark:bg-[#0a0a0f] border-t border-gray-100 dark:border-white/[0.04]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-[#111111] dark:text-white uppercase tracking-[0.1em]">
                Explore Topics
              </h2>
              <Link
                href="/"
                className="hidden sm:flex items-center gap-0.5 text-[11px] text-gray-400 hover:text-accent transition-colors duration-300 group"
              >
                View all
                <ChevronRight
                  size={12}
                  className="group-hover:translate-x-0.5 transition-transform duration-300"
                />
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group flex items-center gap-2 px-4 py-2 rounded-full bg-[#fafafa] dark:bg-white/[0.03] ring-1 ring-black/[0.04] dark:ring-white/[0.06] hover:ring-accent/30 hover:bg-accent/5 dark:hover:bg-accent/10 transition-all duration-300"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300 group-hover:text-accent transition-colors duration-300">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
