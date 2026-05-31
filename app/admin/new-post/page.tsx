import TopBar from "@/components/admin/TopBar";
import NewPostShell from "@/components/admin/NewPostShell";
import { prisma } from "@/lib/db";

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <TopBar title="New Post" />
      <NewPostShell categories={categories} tags={tags} />
    </>
  );
}
