import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RangeKey = "24h" | "7d" | "30d" | "90d";

function rangeToMs(r: RangeKey): number {
  switch (r) {
    case "24h":
      return 24 * 3600 * 1000;
    case "7d":
      return 7 * 86400 * 1000;
    case "30d":
      return 30 * 86400 * 1000;
    case "90d":
      return 90 * 86400 * 1000;
  }
}

interface DayBucket {
  date: string;
  views: number;
  unique: number;
}

interface CountryRow {
  country: string;
  views: number;
  percent: number;
}

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  featuredImage: string;
  views: number;
  avgPerDay: number;
  category: string;
}

interface ReferrerRow {
  domain: string;
  views: number;
  percent: number;
}

interface PushFunnel {
  visitors: number;
  consented: number;
  notificationsOptIn: number;
  active: number;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const rangeParam = (url.searchParams.get("range") || "7d") as RangeKey;
  const validRanges: RangeKey[] = ["24h", "7d", "30d", "90d"];
  const range: RangeKey = validRanges.includes(rangeParam) ? rangeParam : "7d";

  const sinceMs = Date.now() - rangeToMs(range);
  const since = new Date(sinceMs);
  const days =
    range === "24h" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 90;

  const baseWhere = { isBot: false, createdAt: { gte: since } };

  // Run independent queries in parallel
  const [
    totalViews,
    uniqueRows,
    activeSubs,
    countryGroups,
    rawViews,
    topPostsRaw,
    refererRows,
    consentCount,
    notifConsentCount,
    activeAllSubs,
    visitorsAll,
  ] = await Promise.all([
    prisma.postView.count({ where: baseWhere }),
    prisma.postView.findMany({
      where: { ...baseWhere, sessionId: { not: null } },
      select: { sessionId: true },
      distinct: ["sessionId"],
    }),
    prisma.pushSubscription.count({ where: { status: "active" } }),
    prisma.postView.groupBy({
      by: ["country"],
      where: { ...baseWhere, country: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
      take: 10,
    }),
    prisma.postView.findMany({
      where: baseWhere,
      select: { createdAt: true, sessionId: true, postId: true },
    }),
    prisma.postView.groupBy({
      by: ["postId"],
      where: { ...baseWhere, postId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { postId: "desc" } },
      take: 10,
    }),
    prisma.postView.findMany({
      where: { ...baseWhere, referer: { not: null } },
      select: { referer: true },
      take: 5000,
    }),
    prisma.cookieConsent.count(),
    prisma.cookieConsent.count({ where: { notifications: true } }),
    prisma.pushSubscription.count({ where: { status: "active" } }),
    prisma.postView.findMany({
      where: { isBot: false, sessionId: { not: null } },
      select: { sessionId: true },
      distinct: ["sessionId"],
    }),
  ]);

  const uniqueVisitors = uniqueRows.length;

  // Top country
  const topCountryCode = countryGroups[0]?.country || null;
  const topCountryCount = countryGroups[0]?._count._all || 0;

  // Build daily buckets
  const buckets = new Map<string, { views: number; sessions: Set<string> }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86400 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { views: 0, sessions: new Set() });
  }
  // Hourly heatmap: 7 days × 24 hours
  const hourly: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );
  for (const v of rawViews) {
    const key = v.createdAt.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (b) {
      b.views++;
      if (v.sessionId) b.sessions.add(v.sessionId);
    }
    // Hourly: day-of-week (0=Sun) × hour
    const dow = v.createdAt.getDay();
    const hour = v.createdAt.getHours();
    hourly[dow][hour]++;
  }
  const viewsOverTime: DayBucket[] = Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({
      date,
      views: v.views,
      unique: v.sessions.size,
    }));

  // Top countries
  const totalCountryViews = countryGroups.reduce(
    (s, g) => s + g._count._all,
    0
  );
  const topCountries: CountryRow[] = countryGroups.map((g) => ({
    country: g.country || "??",
    views: g._count._all,
    percent:
      totalCountryViews > 0 ? (g._count._all / totalCountryViews) * 100 : 0,
  }));

  // Top articles
  const topPostIds = topPostsRaw
    .map((p) => p.postId)
    .filter((id): id is string => !!id);
  const postsMeta = topPostIds.length
    ? await prisma.post.findMany({
        where: { id: { in: topPostIds } },
        select: {
          id: true,
          title: true,
          slug: true,
          featuredImage: true,
          category: { select: { name: true } },
        },
      })
    : [];
  const metaMap = new Map(postsMeta.map((p) => [p.id, p]));
  const topArticles: ArticleRow[] = topPostsRaw
    .map((row) => {
      const meta = row.postId ? metaMap.get(row.postId) : null;
      if (!meta) return null;
      const views = row._count._all;
      return {
        id: meta.id,
        title: meta.title,
        slug: meta.slug,
        featuredImage: meta.featuredImage,
        views,
        avgPerDay: views / Math.max(1, days),
        category: meta.category?.name || "",
      };
    })
    .filter((x): x is ArticleRow => x !== null);

  // Top referrers — aggregate by domain
  const domainCounts = new Map<string, number>();
  for (const r of refererRows) {
    if (!r.referer) continue;
    let domain = r.referer;
    try {
      domain = new URL(r.referer).hostname.replace(/^www\./, "");
    } catch {
      /* keep raw */
    }
    domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
  }
  const totalRefs = Array.from(domainCounts.values()).reduce(
    (s, n) => s + n,
    0
  );
  const topReferrers: ReferrerRow[] = Array.from(domainCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([domain, views]) => ({
      domain,
      views,
      percent: totalRefs > 0 ? (views / totalRefs) * 100 : 0,
    }));

  // Push funnel (all-time, not range-filtered, more meaningful)
  const pushFunnel: PushFunnel = {
    visitors: visitorsAll.length,
    consented: consentCount,
    notificationsOptIn: notifConsentCount,
    active: activeAllSubs,
  };

  return NextResponse.json({
    range,
    stats: {
      totalViews,
      uniqueVisitors,
      activeSubscribers: activeSubs,
      topCountry: topCountryCode
        ? { code: topCountryCode, views: topCountryCount }
        : null,
    },
    viewsOverTime,
    topCountries,
    topArticles,
    topReferrers,
    pushFunnel,
    hourlyDistribution: hourly,
  });
}
