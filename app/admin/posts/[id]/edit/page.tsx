import TopBar from "@/components/admin/TopBar";
import PostForm from "@/components/admin/PostForm";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const [post, categories, tags] = await Promise.all([
    prisma.post.findUnique({
      where: { id: params.id },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!post) notFound();

  const serializedPost = {
    ...post,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    tags: post.tags.map((pt) => ({
      tag: { id: pt.tag.id, name: pt.tag.name, slug: pt.tag.slug },
    })),
  };

  return (
    <>
      <TopBar title="Edit Post" />
      <PostForm categories={categories} tags={tags} post={serializedPost} />
    </>
  );
}
