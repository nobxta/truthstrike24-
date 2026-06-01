import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/newsletter
 * Admin-only — returns all newsletter subscribers + stats
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim().toLowerCase() || "";
    const status = url.searchParams.get("status") || "all";

    const where: {
      status?: string;
      OR?: { email?: { contains: string; mode: "insensitive" }; name?: { contains: string; mode: "insensitive" } }[];
    } = {};
    if (status !== "all") where.status = status;
    if (q) {
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ];
    }

    const [subscribers, totalActive, totalUnsubscribed, recentCount] =
      await Promise.all([
        prisma.newsletterSubscriber.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 500,
          select: {
            id: true,
            email: true,
            name: true,
            source: true,
            status: true,
            createdAt: true,
            ipAddress: true,
          },
        }),
        prisma.newsletterSubscriber.count({ where: { status: "active" } }),
        prisma.newsletterSubscriber.count({ where: { status: "unsubscribed" } }),
        prisma.newsletterSubscriber.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
          },
        }),
      ]);

    return NextResponse.json({
      subscribers,
      stats: {
        active: totalActive,
        unsubscribed: totalUnsubscribed,
        thisWeek: recentCount,
        total: totalActive + totalUnsubscribed,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/newsletter?id=xxx
 * Admin removes a subscriber permanently
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await prisma.newsletterSubscriber.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
