import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Aggregated dashboard stats for the Agent Settings hero.
 * Returns posts today/yesterday/week, weekly AI spend, and recent errors.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(now.getTime() - 7 * 86400000);
    const startOf24h = new Date(now.getTime() - 86400000);

    const [postsToday, postsYesterday, postsThisWeek, spendAgg, errors24h, recentErrors] =
      await Promise.all([
        prisma.post.count({
          where: { isAgentPost: true, publishedAt: { gte: startOfToday } },
        }),
        prisma.post.count({
          where: {
            isAgentPost: true,
            publishedAt: { gte: startOfYesterday, lt: startOfToday },
          },
        }),
        prisma.post.count({
          where: { isAgentPost: true, publishedAt: { gte: startOfWeek } },
        }),
        prisma.aIUsage.aggregate({
          where: { createdAt: { gte: startOfWeek } },
          _sum: { costUsd: true },
        }),
        prisma.agentLog.count({
          where: { status: "error", timestamp: { gte: startOf24h } },
        }),
        prisma.agentLog.findMany({
          where: { status: "error", timestamp: { gte: startOf24h } },
          orderBy: { timestamp: "desc" },
          take: 10,
          select: { id: true, timestamp: true, title: true, error: true, model: true },
        }),
      ]);

    return NextResponse.json({
      postsToday,
      postsYesterday,
      postsThisWeek,
      spendThisWeek: spendAgg._sum.costUsd ?? 0,
      errorsLast24h: errors24h,
      recentErrors,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
