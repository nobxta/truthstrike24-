import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const maxDuration = 10;

/**
 * GET /api/custom-pages/generate/[id]
 *
 * Polled by frontend every ~2 seconds while waiting for the VPS worker.
 *
 * Returns:
 *  - { status: "pending" } → not yet picked up
 *  - { status: "running" }
 *  - { status: "done", page, imageUrl, themeKey } → ready to render in draft preview
 *  - { status: "failed", error }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const job = await prisma.generationJob.findUnique({ where: { id } });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const base = {
      jobId: job.id,
      status: job.status,
      jobType: job.jobType,
      themeKey: job.themeKey,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };

    if (job.status === "done" && job.resultJson) {
      let page: Record<string, unknown> = {};
      try {
        page = JSON.parse(job.resultJson);
      } catch {
        /* */
      }
      return NextResponse.json({
        ...base,
        page,
        imageUrl: job.imageUrl,
        usage: {
          provider: job.provider,
          model: job.model,
          imageModel: job.imageModel,
          inputTokens: job.inputTokens,
          outputTokens: job.outputTokens,
          totalTokens: job.inputTokens + job.outputTokens,
          costUsd: job.costUsd,
          durationMs: job.durationMs,
        },
      });
    }

    if (job.status === "failed") {
      return NextResponse.json({
        ...base,
        error: job.errorMsg || "Generation failed",
      });
    }

    return NextResponse.json(base);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
