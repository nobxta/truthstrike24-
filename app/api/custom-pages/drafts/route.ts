import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/custom-pages/drafts
 *
 * Returns recent recoverable items:
 *   - Generated jobs (status=done, jobType=custom_page) from last 7 days
 *     that haven't been published as a CustomPage yet
 *   - Saved CustomPages with published=false
 *
 * Used by the "Recent Drafts" panel in the AI Custom Page form so
 * users can pick up where they left off.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 1. Recently completed jobs (could still be recovered)
    const recentJobs = await prisma.generationJob.findMany({
      where: {
        jobType: "custom_page",
        status: "done",
        completedAt: { gte: sevenDaysAgo },
      },
      orderBy: { completedAt: "desc" },
      take: 20,
      select: {
        id: true,
        themeKey: true,
        context: true,
        resultJson: true,
        imageUrl: true,
        completedAt: true,
        provider: true,
        model: true,
        inputTokens: true,
        outputTokens: true,
        costUsd: true,
      },
    });

    // 2. Saved CustomPage drafts (status=draft equivalent)
    const drafts = await prisma.customPage.findMany({
      where: { published: false },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        slug: true,
        headline: true,
        design: true,
        heroImage: true,
        updatedAt: true,
      },
    });

    // Helper: parse title from job result for display
    const parsedJobs = recentJobs.map((job) => {
      let title = "Untitled draft";
      let preview = "";
      try {
        const r = JSON.parse(job.resultJson || "{}") as {
          title?: string;
          headline?: string;
          subheadline?: string;
        };
        title = r.title || r.headline || "Untitled draft";
        preview = r.headline || r.subheadline || "";
      } catch {
        /* */
      }
      return {
        type: "job" as const,
        jobId: job.id,
        title,
        preview,
        themeKey: job.themeKey,
        heroImage: job.imageUrl,
        completedAt: job.completedAt,
        context: job.context.slice(0, 200),
        provider: job.provider,
        model: job.model,
        tokens: job.inputTokens + job.outputTokens,
        cost: job.costUsd,
      };
    });

    const parsedDrafts = drafts.map((d) => ({
      type: "page" as const,
      pageId: d.id,
      slug: d.slug,
      title: d.title,
      preview: d.headline,
      themeKey: d.design,
      heroImage: d.heroImage || null,
      updatedAt: d.updatedAt,
    }));

    return NextResponse.json({
      jobs: parsedJobs,
      drafts: parsedDrafts,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
