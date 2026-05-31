import TopBar from "@/components/admin/TopBar";
import PostForm from "@/components/admin/PostForm";
import { prisma } from "@/lib/db";

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <TopBar title="New Post" />
      <PostForm categories={categories} tags={tags} />
    </>
  );
}
