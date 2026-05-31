import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ArticleCard from "@/components/public/ArticleCard";
import { Newspaper, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  });

  if (!category) return { title: "Category Not Found" };

  return {
    title: `${category.name} News — TruthStrike24`,
    description: `Latest ${category.name} news and articles on TruthStrike24.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
  });

  if (!category) notFound();

  const posts = await prisma.post.findMany({
    where: { status: "published", categoryId: category.id },
    include: {
      category: { select: { name: true, slug: true, color: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy dark:hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Back to Home
      </Link>

      <div className="flex items-center gap-4 mb-10">
        <span
          className="w-14 h-14 rounded-2xl text-white text-2xl flex items-center justify-center shadow-lg"
          style={{
            backgroundColor: category.color,
            boxShadow: `0 8px 24px ${category.color}30`,
          }}
        >
          {category.emoji}
        </span>
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy dark:text-white">
            {category.name}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {posts.length} article{posts.length !== 1 ? "s" : ""} published
          </p>
        </div>
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
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
        <div className="text-center py-24 bg-white dark:bg-white/[0.015] rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <Newspaper size={22} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            No articles in this category yet
          </p>
          <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">
            Check back soon for new content
          </p>
        </div>
      )}
    </div>
  );
}
