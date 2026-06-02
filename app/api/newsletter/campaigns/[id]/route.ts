import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/newsletter/campaigns/:id
 * Returns campaign + analytics: unique opens, total opens, unique clicks,
 * total clicks, top clicked URLs, recent events.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      subject: true,
      preHeader: true,
      fromRole: true,
      sentToCount: true,
      failedCount: true,
      testMode: true,
      createdAt: true,
    },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [openEvents, clickEvents, topUrls, recentEvents] = await Promise.all([
    prisma.newsletterEvent.findMany({
      where: { campaignId: params.id, type: "open" },
      select: { email: true },
    }),
    prisma.newsletterEvent.findMany({
      where: { campaignId: params.id, type: "click" },
      select: { email: true, url: true },
    }),
    prisma.newsletterEvent.groupBy({
      by: ["url"],
      where: { campaignId: params.id, type: "click", url: { not: null } },
      _count: { url: true },
      orderBy: { _count: { url: "desc" } },
      take: 10,
    }),
    prisma.newsletterEvent.findMany({
      where: { campaignId: params.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { type: true, email: true, url: true, createdAt: true },
    }),
  ]);

  const uniqueOpens = new Set(openEvents.map((e) => e.email).filter(Boolean)).size;
  const uniqueClicks = new Set(clickEvents.map((e) => e.email).filter(Boolean))
    .size;
  const openRate =
    campaign.sentToCount > 0 ? (uniqueOpens / campaign.sentToCount) * 100 : 0;
  const clickRate =
    campaign.sentToCount > 0 ? (uniqueClicks / campaign.sentToCount) * 100 : 0;
  const ctor = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0;

  return NextResponse.json({
    campaign,
    stats: {
      sent: campaign.sentToCount,
      failed: campaign.failedCount,
      totalOpens: openEvents.length,
      uniqueOpens,
      totalClicks: clickEvents.length,
      uniqueClicks,
      openRate: Math.round(openRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
      clickToOpenRate: Math.round(ctor * 10) / 10,
    },
    topUrls: topUrls.map((u) => ({ url: u.url, clicks: u._count.url })),
    recentEvents,
  });
}
