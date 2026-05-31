import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateImage } from "@/lib/image-gen";

export const maxDuration = 60;

/**
 * Picks ONE post with imageStatus="pending" and generates its image.
 * Designed to run as a separate cron (every 5-10 min) so each invocation
 * finishes inside Vercel Hobby's 10s function timeout.
 *
 * Auth: admin session OR `x-cron-secret` header.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const cronSecret = req.headers.get("x-cron-secret");
    const isCron = !!(cronSecret && cronSecret === process.env.CRON_SECRET);

    if (!session?.user && !isCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the oldest pending post (FIFO order)
    const post = await prisma.post.findFirst({
      where: { imageStatus: "pending" },
      orderBy: { createdAt: "asc" },
    });

    if (!post) {
      return NextResponse.json({ status: "idle", message: "No pending posts" });
    }

    if (!post.imagePrompt) {
      // Can't generate without prompt — mark failed
      await prisma.post.update({
        where: { id: post.id },
        data: { imageStatus: "failed" },
      });
      return NextResponse.json({
        status: "failed",
        postId: post.id,
        error: "No imagePrompt stored",
      });
    }

    const settings = await prisma.agentSettings.findUnique({
      where: { id: "singleton" },
    });
    const imageModel = settings?.imageModel || "wavespeed-ai/flux-schnell";
    const watermarkUrl =
      settings?.watermarkUrl ||
      process.env.NEXT_PUBLIC_WATERMARK_URL ||
      "";

    try {
      const result = await generateImage({
        model: imageModel,
        prompt: post.imagePrompt,
        watermarkUrl: watermarkUrl || undefined,
        aspectRatio: "16:9",
        purpose: "post",
      });

      await prisma.post.update({
        where: { id: post.id },
        data: {
          featuredImage: result.url,
          imageStatus: "done",
        },
      });

      return NextResponse.json({
        status: "done",
        postId: post.id,
        title: post.title,
        url: `/news/${post.slug}`,
        featuredImage: result.url,
        durationMs: result.durationMs,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await prisma.post.update({
        where: { id: post.id },
        data: { imageStatus: "failed" },
      });
      return NextResponse.json(
        {
          status: "failed",
          postId: post.id,
          title: post.title,
          error: msg,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** GET — count pending posts (status check) */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [pending, done, failed] = await Promise.all([
      prisma.post.count({ where: { imageStatus: "pending" } }),
      prisma.post.count({ where: { imageStatus: "done" } }),
      prisma.post.count({ where: { imageStatus: "failed" } }),
    ]);

    const recentPending = await prisma.post.findMany({
      where: { imageStatus: "pending" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, slug: true, createdAt: true },
    });

    return NextResponse.json({ pending, done, failed, recentPending });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
