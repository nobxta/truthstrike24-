import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail, type SenderRole } from "@/lib/email";
import {
  renderNewsletterEmail,
  renderLatestArticlesBlock,
} from "@/lib/newsletter-template";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type FromRole = Extract<SenderRole, "news" | "promotion" | "alert">;
type Theme = "classic" | "minimal" | "alert" | "magazine";

interface SendBody {
  subject?: string;
  preHeader?: string;
  html?: string;
  fromRole?: FromRole;
  theme?: Theme;
  testMode?: boolean;
  includeLatestArticles?: boolean;
}

function isFromRole(v: unknown): v is FromRole {
  return v === "news" || v === "promotion" || v === "alert";
}

function isTheme(v: unknown): v is Theme {
  return v === "classic" || v === "minimal" || v === "alert" || v === "magazine";
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as
      | { id?: string; email?: string | null; name?: string | null }
      | undefined;
    if (!sessionUser?.email || !sessionUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as SendBody;
    const subject = body.subject?.trim() ?? "";
    const html = body.html?.trim() ?? "";
    const preHeader = body.preHeader?.trim() ?? "";
    const fromRole: FromRole = isFromRole(body.fromRole) ? body.fromRole : "news";
    const theme: Theme = isTheme(body.theme) ? body.theme : "classic";
    const testMode = Boolean(body.testMode);
    const includeLatestArticles = Boolean(body.includeLatestArticles);

    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }
    if (!html || html === "<p></p>") {
      return NextResponse.json({ error: "Body is required" }, { status: 400 });
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      `https://${req.headers.get("host") || "truthstrike24.com"}`;

    // Optional: latest 5 articles
    let latestArticlesHtml = "";
    if (includeLatestArticles) {
      const articles = await prisma.post.findMany({
        where: { status: "published" },
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: { title: true, slug: true, summary: true },
      });
      latestArticlesHtml = renderLatestArticlesBlock(articles, siteUrl);
    }

    // Determine recipients
    let recipients: { email: string; unsubToken: string }[];
    if (testMode) {
      // Find the admin's subscriber row if it exists (so we have an unsub token)
      const adminEmail = sessionUser.email;
      const existing = await prisma.newsletterSubscriber.findUnique({
        where: { email: adminEmail },
        select: { email: true, unsubToken: true },
      });
      recipients = [
        existing ?? { email: adminEmail, unsubToken: "test-mode-no-token" },
      ];
    } else {
      recipients = await prisma.newsletterSubscriber.findMany({
        where: { status: "active" },
        select: { email: true, unsubToken: true },
      });
    }

    let sentToCount = 0;
    let failedCount = 0;

    // Send sequentially in small batches to avoid overwhelming SMTP
    const BATCH = 5;
    for (let i = 0; i < recipients.length; i += BATCH) {
      const batch = recipients.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map((r) => {
          const unsubUrl = `${siteUrl}/unsubscribe/${r.unsubToken}`;
          const wrapped = renderNewsletterEmail({
            subject,
            preHeader,
            bodyHtml: html,
            unsubUrl,
            latestArticlesHtml,
            siteUrl,
            theme,
          });
          return sendEmail({
            to: r.email,
            subject,
            html: wrapped,
            from: fromRole,
            replyTo: "contact",
          });
        })
      );
      for (const ok of results) {
        if (ok) sentToCount++;
        else failedCount++;
      }
    }

    // Save campaign record
    const campaign = await prisma.newsletterCampaign.create({
      data: {
        subject,
        preHeader,
        html,
        fromRole,
        sentToCount,
        failedCount,
        testMode,
        createdById: sessionUser.id,
      },
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      sentToCount,
      failedCount,
      totalRecipients: recipients.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    console.error("[newsletter send]", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/newsletter/send — list recent campaigns
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const campaigns = await prisma.newsletterCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        subject: true,
        fromRole: true,
        sentToCount: true,
        failedCount: true,
        testMode: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ campaigns });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
