import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPushToAll } from "@/lib/push";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  postId?: string;
}

export async function POST(req: NextRequest) {
  // Auth: admin session OR x-cron-secret header
  const session = await getServerSession(authOptions);
  const cronSecret = req.headers.get("x-cron-secret");
  const isCron =
    !!(cronSecret && cronSecret === process.env.CRON_SECRET);
  if (!session?.user && !isCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Body;
    if (!body.postId) {
      return NextResponse.json({ error: "postId required" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: body.postId },
      select: {
        title: true,
        slug: true,
        summary: true,
        featuredImage: true,
        status: true,
        category: { select: { name: true } },
      },
    });

    if (!post || post.status !== "published") {
      return NextResponse.json(
        { error: "Post not published" },
        { status: 404 }
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.truthstrike24.com";

    const result = await sendPushToAll({
      title: post.title,
      body: post.summary || `Breaking from ${post.category?.name || "TruthStrike24"}`,
      url: `/${post.slug}`,
      image: post.featuredImage || undefined,
      tag: `post-${post.slug}`,
    });

    return NextResponse.json({ ...result, siteUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
