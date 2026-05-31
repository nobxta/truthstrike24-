import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import ArticleCard from "@/components/public/ArticleCard";
import { Search } from "lucide-react";

interface Props {
  searchParams: { q?: string };
}

export function generateMetadata({ searchParams }: Props): Metadata {
  return {
    title: searchParams.q
      ? `Search: ${searchParams.q} — TruthStrike24`
      : "Search — TruthStrike24",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q?.trim() || "";

  const posts = query
    ? await prisma.post.findMany({
        where: {
          status: "published",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { summary: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          category: { select: { name: true, slug: true, color: true } },
        },
        orderBy: { publishedAt: "desc" },
        take: 20,
      })
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-navy text-white flex items-center justify-center">
          <Search size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy">
            {query ? `Results for "${query}"` : "Search"}
          </h1>
          {query && (
            <p className="text-sm text-gray-400">
              {posts.length} result{posts.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>
      </div>

      {!query ? (
        <div className="text-center py-16">
          <Search size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">
            Use the search bar above to find articles.
          </p>
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => (
            <ArticleCard
              key={post.id}
              title={post.title}
              slug={post.slug}
              summary={post.summary}
              featuredImage={post.featuredImage}
              category={post.category}
              publishedAt={post.publishedAt?.toISOString() ?? null}
              createdAt={post.createdAt.toISOString()}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Search size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">
            No articles found for &quot;{query}&quot;. Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
}
