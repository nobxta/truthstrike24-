import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const maxDuration = 10;

/**
 * GET /api/posts/generate/[id]
 *
 * Polled by frontend every ~2 seconds while waiting for the VPS worker
 * to finish processing a generation job.
 *
 * Returns:
 *  - { status: "pending" } → not yet picked up by VPS worker
 *  - { status: "running", startedAt } → VPS worker is actively generating
 *  - { status: "done", article, imageUrl, ... } → ready to show in draft preview
 *  - { status: "failed", error } → something went wrong
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
    const job = await prisma.generationJob.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Build response based on status
    const base = {
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };

    if (job.status === "done" && job.resultJson) {
      let article: Record<string, unknown> = {};
      try {
        article = JSON.parse(job.resultJson);
      } catch {
        /* */
      }
      return NextResponse.json({
        ...base,
        article,
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

    // pending or running
    return NextResponse.json(base);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE — cancel a pending job (only if not yet started)
 */
export async function DELETE(
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
    if (job.status === "running") {
      return NextResponse.json(
        { error: "Cannot cancel — already running on VPS" },
        { status: 409 }
      );
    }

    await prisma.generationJob.update({
      where: { id },
      data: { status: "failed", errorMsg: "Cancelled by user" },
    });
    return NextResponse.json({ status: "cancelled" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
