import Link from "next/link";
import { prisma } from "@/lib/db";
import { Clock, Newspaper, ChevronRight, Mail } from "lucide-react";
import AnalyticsTracker from "@/components/public/AnalyticsTracker";
import TrendingWidget from "@/components/public/TrendingWidget";
import NewsletterSignup from "@/components/public/NewsletterSignup";
import { formatRelativeDate } from "@/lib/utils";

export const revalidate = 60;

interface HomePost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  featuredImage: string;
  publishedAt: Date | null;
  createdAt: Date;
  category: { id: string; name: string; slug: string; color: string };
}

export default async function HomePage() {
  // Pull a generous pool once — we'll partition it across sections without
  // repeating any article. Limit 100 so we always have enough headroom.
  const pool: HomePost[] = await prisma.post.findMany({
    where: { status: "published" },
    orderBy: [{ isPinned: "desc" }, { isBreaking: "desc" }, { publishedAt: "desc" }],
    take: 100,
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      featuredImage: true,
      publishedAt: true,
      createdAt: true,
      category: { select: { id: true, name: true, slug: true, color: true } },
    },
  });

  // Categories with at least one post — dedup by slug just in case.
  const allCategories = await prisma.category.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: "asc" },
  });
  const seenSlugs = new Set<string>();
  const categories = allCategories.filter((c) => {
    if (seenSlugs.has(c.slug) || c._count.posts === 0) return false;
    seenSlugs.add(c.slug);
    return true;
  });

  // ── Section partitioning — every article is used at most once ──
  const used = new Set<string>();
  const take = (count: number, predicate?: (p: HomePost) => boolean): HomePost[] => {
    const out: HomePost[] = [];
    for (const p of pool) {
      if (used.has(p.id)) continue;
      if (predicate && !predicate(p)) continue;
      out.push(p);
      used.add(p.id);
      if (out.length === count) break;
    }
    return out;
  };

  // 1 hero + 4 secondary text headlines (sit beside hero on desktop)
  const [hero] = take(1);
  const headlines = take(4);

  // "Top Stories" — next 6 articles as cards
  const topStories = take(6);

  // For each category that has remaining posts, a topic row of 4.
  // Show max 4 category sections so the page doesn't sprawl.
  const topicSections: { category: typeof categories[number]; posts: HomePost[] }[] = [];
  for (const cat of categories) {
    if (topicSections.length === 4) break;
    const row = take(4, (p) => p.category.slug === cat.slug);
    if (row.length >= 2) topicSections.push({ category: cat, posts: row });
  }

  return (
    <>
      <AnalyticsTracker pathname="/" />

      {/* ── HERO ROW ── */}
      <section className="bg-white dark:bg-[#0a0a0f]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Hero post */}
            {hero && (
              <Link
                href={`/${hero.slug}`}
                className="group lg:col-span-8 block"
              >
                <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden mb-4">
                  {hero.featuredImage ? (
                    <img
                      src={hero.featuredImage}
                      alt={hero.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.025]"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                      <Newspaper size={56} className="text-gray-300 dark:text-gray-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <span
                    className="absolute top-4 left-4 inline-block px-2.5 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest"
                    style={{ backgroundColor: hero.category.color }}
                  >
                    {hero.category.name}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-serif font-bold leading-[1.15] text-[#111111] dark:text-white group-hover:text-accent transition-colors duration-300">
                  {hero.title}
                </h1>
                {hero.summary && (
                  <p className="text-[15px] text-gray-600 dark:text-gray-400 mt-3 leading-relaxed line-clamp-2">
                    {hero.summary}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-3 text-[12px] text-gray-400">
                  <Clock size={11} />
                  {formatRelativeDate(
                    hero.publishedAt?.toISOString() || hero.createdAt.toISOString()
                  )}
                </div>
              </Link>
            )}

            {/* Headlines column — text-only, no images, more headlines per square inch */}
            {headlines.length > 0 && (
              <div className="lg:col-span-4 lg:border-l lg:border-gray-200 dark:lg:border-white/[0.06] lg:pl-8">
                <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-4">
                  More headlines
                </p>
                <ul className="space-y-5">
                  {headlines.map((post) => (
                    <li
                      key={post.id}
                      className="pb-5 border-b border-gray-100 dark:border-white/[0.06] last:border-0 last:pb-0"
                    >
                      <Link href={`/${post.slug}`} className="group block">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: post.category.color }}
                        >
                          {post.category.name}
                        </span>
                        <h3 className="text-[15px] font-serif font-semibold leading-snug text-[#111111] dark:text-white mt-1 group-hover:text-accent transition-colors duration-300">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-400">
                          <Clock size={10} />
                          {formatRelativeDate(
                            post.publishedAt?.toISOString() || post.createdAt.toISOString()
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── TOP STORIES (next 6, full-width row of cards) ── */}
      {topStories.length > 0 && (
        <section className="bg-[#fafafa] dark:bg-[#0c0c14] border-t border-gray-100 dark:border-white/[0.04]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
            <SectionHeader title="Top Stories" subtitle="What our newsroom is following right now" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {topStories.map((post) => (
                <StoryCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PER-CATEGORY TOPIC SECTIONS ── */}
      {topicSections.map(({ category, posts }) => (
        <section
          key={category.id}
          className="bg-white dark:bg-[#0a0a0f] border-t border-gray-100 dark:border-white/[0.04]"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
            <div className="flex items-end justify-between mb-6">
              <div className="flex items-center gap-3">
                <span
                  className="w-1 h-7 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#111111] dark:text-white leading-none">
                    {category.name}
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider">
                    Latest in {category.name.toLowerCase()}
                  </p>
                </div>
              </div>
              <Link
                href={`/category/${category.slug}`}
                className="hidden sm:flex items-center gap-1 text-[12px] font-semibold text-gray-500 dark:text-gray-400 hover:text-accent transition-colors group"
              >
                More
                <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {posts.map((post) => (
                <StoryCard key={post.id} post={post} compact />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ── NEWSLETTER + TRENDING ── */}
      <section className="bg-[#fafafa] dark:bg-[#0c0c14] border-t border-gray-100 dark:border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-red-600 to-rose-800 rounded-2xl p-7 sm:p-9 text-white relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <Mail size={20} className="mb-3 relative" />
                <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-2 relative leading-tight">
                  Get the newsroom in your inbox
                </h2>
                <p className="text-white/85 text-[14px] mb-5 relative max-w-md">
                  Daily headlines, investigations, and breaking alerts — written by our team, delivered before you finish your coffee.
                </p>
                <div className="relative max-w-md">
                  <NewsletterSignup variant="inline" source="homepage_cta" />
                </div>
              </div>
            </div>
            <div>
              <TrendingWidget limit={6} />
            </div>
          </div>
        </div>
      </section>

      {/* ── EXPLORE CATEGORIES (cleaned, no duplicates) ── */}
      {categories.length > 0 && (
        <section className="bg-white dark:bg-[#0a0a0f] border-t border-gray-100 dark:border-white/[0.04]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-[#111111] dark:text-white uppercase tracking-[0.1em]">
                All Sections
              </h2>
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
                  <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300 group-hover:text-accent transition-colors">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-gray-400">{cat._count.posts}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/* ─── shared section header ─── */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#111111] dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12px] text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/* ─── shared article card ─── */
function StoryCard({ post, compact = false }: { post: HomePost; compact?: boolean }) {
  return (
    <Link href={`/${post.slug}`} className="group block card-lift">
      <div
        className={`relative w-full rounded-xl overflow-hidden mb-3 ${
          compact ? "aspect-[16/10]" : "aspect-[16/10]"
        }`}
      >
        {post.featuredImage ? (
          <img
            src={post.featuredImage}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
            <Newspaper size={28} className="text-gray-300 dark:text-gray-700" />
          </div>
        )}
      </div>
      <span
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: post.category.color }}
      >
        {post.category.name}
      </span>
      <h3
        className={`font-serif font-semibold leading-snug text-[#111111] dark:text-white mt-1 group-hover:text-accent transition-colors duration-300 line-clamp-3 ${
          compact ? "text-[14px]" : "text-[16px]"
        }`}
      >
        {post.title}
      </h3>
      {!compact && post.summary && (
        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
          {post.summary}
        </p>
      )}
      <div className="flex items-center gap-1 mt-2 text-[11px] text-gray-400">
        <Clock size={10} />
        {formatRelativeDate(
          post.publishedAt?.toISOString() || post.createdAt.toISOString()
        )}
      </div>
    </Link>
  );
}
