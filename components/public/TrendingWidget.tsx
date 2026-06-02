import Link from "next/link";
import { prisma } from "@/lib/db";
import { TrendingUp, Flame } from "lucide-react";

/**
 * Sidebar widget — top 5 most-viewed published articles in the last 7 days.
 * Counts PostView rows where isBot=false. Falls back to recent posts if no
 * view data yet (fresh install / pre-launch).
 */
export default async function TrendingWidget({ limit = 5 }: { limit?: number }) {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Group PostView by postId, count rows, take top N
  const grouped = await prisma.postView.groupBy({
    by: ["postId"],
    where: {
      postId: { not: null },
      isBot: false,
      createdAt: { gte: cutoff },
    },
    _count: { postId: true },
    orderBy: { _count: { postId: "desc" } },
    take: limit,
  });

  const postIds = grouped.map((g) => g.postId!).filter(Boolean);

  let posts: { id: string; title: string; slug: string; featuredImage: string }[] = [];
  if (postIds.length > 0) {
    const rows = await prisma.post.findMany({
      where: { id: { in: postIds }, status: "published" },
      select: { id: true, title: true, slug: true, featuredImage: true },
    });
    // Preserve view-count order
    posts = postIds
      .map((id) => rows.find((r) => r.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }

  // Fallback — no view data yet
  if (posts.length < limit) {
    const fallback = await prisma.post.findMany({
      where: {
        status: "published",
        id: { notIn: posts.map((p) => p.id) },
      },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: limit - posts.length,
      select: { id: true, title: true, slug: true, featuredImage: true },
    });
    posts = [...posts, ...fallback];
  }

  if (posts.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <Flame size={14} className="text-white" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          Trending Now
        </h3>
        <TrendingUp size={12} className="ml-auto text-gray-400" />
      </div>
      <ol className="divide-y divide-gray-100 dark:divide-gray-800">
        {posts.map((p, i) => (
          <li key={p.id}>
            <Link
              href={`/${p.slug}`}
              className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
            >
              <span
                className={`shrink-0 w-7 text-2xl font-black leading-none ${
                  i === 0
                    ? "text-red-600"
                    : i === 1
                    ? "text-orange-500"
                    : "text-gray-300 dark:text-gray-700"
                }`}
              >
                {i + 1}
              </span>
              <p className="text-[13px] font-semibold leading-snug text-gray-800 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 line-clamp-3">
                {p.title}
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
