import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Live agent status — polled by the admin dashboard every 10s.
 * Returns: settings snapshot, last post, next post countdown,
 * recent posts list with token usage.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.agentSettings.findUnique({
      where: { id: "singleton" },
    });
    if (!settings) {
      return NextResponse.json({ error: "No settings" }, { status: 404 });
    }

    // Last agent post
    const lastPost = await prisma.post.findFirst({
      where: { isAgentPost: true },
      orderBy: { publishedAt: "desc" },
      include: { category: true },
    });

    // Recent 10 agent posts
    const recentPosts = await prisma.post.findMany({
      where: { isAgentPost: true },
      orderBy: { publishedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        featuredImage: true,
        publishedAt: true,
        imageStatus: true,
        category: { select: { name: true, color: true } },
      },
    });

    // Compute next post time
    const intervalMin = Math.max(1, settings.postIntervalMinutes || 60);
    let nextPostAt: Date | null = null;
    let secondsUntilNextPost: number | null = null;

    if (settings.enabled && lastPost?.publishedAt) {
      nextPostAt = new Date(lastPost.publishedAt.getTime() + intervalMin * 60 * 1000);
      secondsUntilNextPost = Math.max(
        0,
        Math.floor((nextPostAt.getTime() - Date.now()) / 1000)
      );
    } else if (settings.enabled && !lastPost) {
      // No posts yet — next is "ASAP"
      nextPostAt = new Date();
      secondsUntilNextPost = 0;
    }

    // Last AI Usage entry for the post (matches by createdAt within 30s of publishedAt)
    let lastPostUsage: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      costUsd: number;
      durationMs: number;
      model: string;
      provider: string;
    } | null = null;

    if (lastPost) {
      const usage = await prisma.aIUsage.findFirst({
        where: {
          purpose: "post",
          createdAt: {
            gte: new Date(lastPost.publishedAt!.getTime() - 60000),
            lte: new Date(lastPost.publishedAt!.getTime() + 60000),
          },
        },
        orderBy: { createdAt: "desc" },
      });
      if (usage) {
        lastPostUsage = {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.totalTokens,
          costUsd: usage.costUsd,
          durationMs: usage.durationMs,
          model: usage.model,
          provider: usage.provider,
        };
      }
    }

    // Total agent post count today + lifetime
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [postsToday, postsTotal] = await Promise.all([
      prisma.post.count({ where: { isAgentPost: true, publishedAt: { gte: startOfDay } } }),
      prisma.post.count({ where: { isAgentPost: true } }),
    ]);

    // Recent agent logs (errors/successes)
    const recentLogs = await prisma.agentLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    return NextResponse.json({
      enabled: settings.enabled,
      intervalMinutes: intervalMin,
      provider: settings.postProvider,
      model: settings.model,
      imageModel: settings.imageModel,
      wordLimit: settings.wordLimit,
      useWebSearch: settings.useWebSearch,
      lastPost: lastPost
        ? {
            id: lastPost.id,
            title: lastPost.title,
            slug: lastPost.slug,
            url: `/news/${lastPost.slug}`,
            featuredImage: lastPost.featuredImage,
            publishedAt: lastPost.publishedAt,
            imageStatus: lastPost.imageStatus,
            category: lastPost.category?.name,
            categoryColor: lastPost.category?.color,
            usage: lastPostUsage,
          }
        : null,
      nextPostAt: nextPostAt?.toISOString() ?? null,
      secondsUntilNextPost,
      stats: {
        postsToday,
        postsTotal,
      },
      recentPosts: recentPosts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        url: `/news/${p.slug}`,
        featuredImage: p.featuredImage,
        publishedAt: p.publishedAt,
        imageStatus: p.imageStatus,
        category: p.category?.name,
        categoryColor: p.category?.color,
      })),
      recentLogs: recentLogs.map((l) => ({
        id: l.id,
        timestamp: l.timestamp,
        status: l.status,
        title: l.title,
        error: l.error,
        model: l.model,
      })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
