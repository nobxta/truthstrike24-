import Link from "next/link";
import { prisma } from "@/lib/db";
import { Zap } from "lucide-react";
import BreakingScroll from "./BreakingScroll";

/**
 * Slim red ticker bar shown above the Header on every public page.
 * Pulls posts marked isBreaking=true from the last 72 hours.
 * Renders nothing if no breaking posts exist (no empty bar).
 */
export default async function BreakingBar() {
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const posts = await prisma.post.findMany({
    where: {
      status: "published",
      isBreaking: true,
      publishedAt: { gte: cutoff },
    },
    orderBy: { publishedAt: "desc" },
    take: 8,
    select: { title: true, slug: true },
  });

  if (posts.length === 0) return null;

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-red-700 to-red-600 text-white text-sm relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center gap-3 px-3 sm:px-4 h-9">
        <Link
          href="/category/breaking"
          className="flex items-center gap-1.5 shrink-0 font-extrabold text-[11px] uppercase tracking-wider bg-black/25 px-2 py-1 rounded"
        >
          <Zap size={12} className="animate-pulse" />
          Breaking
        </Link>
        <BreakingScroll
          items={posts.map((p) => ({ title: p.title, slug: p.slug }))}
        />
      </div>
    </div>
  );
}
