import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { pingIndexNow } from "@/lib/indexnow";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    const where = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: { select: { name: true, email: true } },
          category: { select: { name: true, slug: true, color: true, emoji: true } },
          tags: { include: { tag: { select: { name: true, slug: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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
      keywords,
      status,
      publishedAt,
      categoryId,
      tagIds,
      isBreaking,
    } = body as {
      title: string;
      slug?: string;
      summary: string;
      content: string;
      featuredImage: string;
      seoTitle: string;
      metaDescription: string;
      keywords?: string;
      status: string;
      publishedAt?: string;
      categoryId: string;
      tagIds?: string[];
      isBreaking?: boolean;
    };

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: "Title, content, and category are required" },
        { status: 400 }
      );
    }

    let slug = customSlug?.trim() ? slugify(customSlug) : slugify(title);

    let counter = 1;
    let uniqueSlug = slug;
    while (await prisma.post.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${++counter}`;
    }
    slug = uniqueSlug;

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        summary: summary || "",
        content,
        featuredImage: featuredImage || "",
        seoTitle: seoTitle || title,
        metaDescription: metaDescription || summary || "",
        keywords: keywords || "",
        status: status || "draft",
        publishedAt:
          status === "published"
            ? new Date()
            : publishedAt
              ? new Date(publishedAt)
              : null,
        authorId: session.user.id,
        categoryId,
        isBreaking: isBreaking || false,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: {
        author: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    // Fire-and-forget IndexNow ping (instant Bing/Yandex indexing)
    if (post.status === "published") {
      pingIndexNow(`/${post.slug}`).catch(() => {});
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
