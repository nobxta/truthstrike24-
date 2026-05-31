import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { name: true, email: true } },
        category: true,
        tags: { include: { tag: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      slug: customSlug,
      summary,
      content,
      featuredImage,
      seoTitle,
      metaDescription,
      status,
      publishedAt,
      categoryId,
      tagIds,
      isBreaking,
    } = body as {
      title?: string;
      slug?: string;
      summary?: string;
      content?: string;
      featuredImage?: string;
      seoTitle?: string;
      metaDescription?: string;
      status?: string;
      publishedAt?: string;
      categoryId?: string;
      tagIds?: string[];
      isBreaking?: boolean;
    };

    const data: Record<string, unknown> = {};

    if (title !== undefined) data.title = title;
    if (summary !== undefined) data.summary = summary;
    if (content !== undefined) data.content = content;
    if (featuredImage !== undefined) data.featuredImage = featuredImage;
    if (seoTitle !== undefined) data.seoTitle = seoTitle;
    if (metaDescription !== undefined) data.metaDescription = metaDescription;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (isBreaking !== undefined) data.isBreaking = isBreaking;

    if (customSlug !== undefined && title) {
      let slug = customSlug.trim() ? slugify(customSlug) : slugify(title);
      const existing = await prisma.post.findUnique({ where: { slug } });
      if (existing && existing.id !== params.id) {
        let counter = 1;
        while (
          await prisma.post.findUnique({ where: { slug: `${slug}-${++counter}` } })
        ) {}
        slug = `${slug}-${counter}`;
      }
      data.slug = slug;
    }

    if (status !== undefined) {
      data.status = status;
      if (status === "published" && !publishedAt) {
        data.publishedAt = new Date();
      }
    }
    if (publishedAt !== undefined) {
      data.publishedAt = new Date(publishedAt);
    }

    if (tagIds !== undefined) {
      await prisma.postTag.deleteMany({ where: { postId: params.id } });
      if (tagIds.length > 0) {
        await prisma.postTag.createMany({
          data: tagIds.map((tagId) => ({ postId: params.id, tagId })),
        });
      }
    }

    const post = await prisma.post.update({
      where: { id: params.id },
      data,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.postTag.deleteMany({ where: { postId: params.id } });
    await prisma.post.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
