import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ArticleCard from "@/components/public/ArticleCard";
import { Tag } from "lucide-react";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = await prisma.tag.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  });

  if (!tag) return { title: "Tag Not Found" };

  return {
    title: `#${tag.name} — TruthStrike24`,
    description: `Articles tagged with ${tag.name} on TruthStrike24.`,
  };
}

export default async function TagPage({ params }: Props) {
  const tag = await prisma.tag.findUnique({
    where: { slug: params.slug },
  });

  if (!tag) notFound();

  const postTags = await prisma.postTag.findMany({
    where: { tagId: tag.id },
    include: {
      post: {
        include: {
          category: { select: { name: true, slug: true, color: true } },
        },
      },
    },
  });

  const posts = postTags
    .map((pt) => pt.post)
    .filter((p) => p.status === "published")
    .sort(
      (a, b) =>
        new Date(b.publishedAt || b.createdAt).getTime() -
        new Date(a.publishedAt || a.createdAt).getTime()
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-navy text-white flex items-center justify-center">
          <Tag size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy">
            #{tag.name}
          </h1>
          <p className="text-sm text-gray-400">
            {posts.length} article{posts.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {posts.length > 0 ? (
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
          <Tag size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">No articles with this tag yet.</p>
        </div>
      )}
    </div>
  );
}
