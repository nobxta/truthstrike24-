import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all-time totals by purpose
    const byPurpose = await prisma.aIUsage.groupBy({
      by: ["purpose"],
      _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costUsd: true },
      _count: true,
    });

    // Get all-time totals by provider
    const byProvider = await prisma.aIUsage.groupBy({
      by: ["provider"],
      _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costUsd: true },
      _count: true,
    });

    // Get all-time totals by model
    const byModel = await prisma.aIUsage.groupBy({
      by: ["model"],
      _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costUsd: true },
      _count: true,
      orderBy: { _sum: { totalTokens: "desc" } },
    });

    // Get last 30 days daily usage
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const recentLogs = await prisma.aIUsage.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, totalTokens: true, costUsd: true, purpose: true },
      orderBy: { createdAt: "asc" },
    });

    // Aggregate daily
    const dailyMap = new Map<string, { tokens: number; cost: number; calls: number }>();
    for (const log of recentLogs) {
      const day = log.createdAt.toISOString().split("T")[0];
      const existing = dailyMap.get(day) || { tokens: 0, cost: 0, calls: 0 };
      existing.tokens += log.totalTokens;
      existing.cost += log.costUsd;
      existing.calls += 1;
      dailyMap.set(day, existing);
    }
    const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({ date, ...data }));

    // Grand totals
    const totals = await prisma.aIUsage.aggregate({
      _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costUsd: true },
      _count: true,
    });

    // Recent calls (last 20)
    const recentCalls = await prisma.aIUsage.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        provider: true,
        model: true,
        purpose: true,
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        costUsd: true,
        durationMs: true,
        success: true,
        error: true,
        createdAt: true,
      },
    });

    // Failed count
    const failedCount = await prisma.aIUsage.count({ where: { success: false } });

    return NextResponse.json({
      totals: {
        calls: totals._count || 0,
        inputTokens: totals._sum.inputTokens || 0,
        outputTokens: totals._sum.outputTokens || 0,
        totalTokens: totals._sum.totalTokens || 0,
        costUsd: totals._sum.costUsd || 0,
        failedCalls: failedCount,
      },
      byPurpose: byPurpose.map((b) => ({
        purpose: b.purpose,
        calls: b._count,
        tokens: b._sum.totalTokens || 0,
        cost: b._sum.costUsd || 0,
      })),
      byProvider: byProvider.map((b) => ({
        provider: b.provider,
        calls: b._count,
        tokens: b._sum.totalTokens || 0,
        cost: b._sum.costUsd || 0,
      })),
      byModel: byModel.map((b) => ({
        model: b.model,
        calls: b._count,
        tokens: b._sum.totalTokens || 0,
        cost: b._sum.costUsd || 0,
      })),
      daily,
      recentCalls,
    });
  } catch (error) {
    console.error("[AI Usage Error]", error);
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
