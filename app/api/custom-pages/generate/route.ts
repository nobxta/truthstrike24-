import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const maxDuration = 10;

/**
 * POST /api/custom-pages/generate
 *
 * Creates a GenerationJob with jobType="custom_page" and returns its ID instantly.
 * The VPS worker picks it up and produces a full CustomPage JSON
 * (title, headline, sections, etc.). Frontend polls until status=done.
 */

interface CreateJobBody {
  brief: string;
  attachments?: string;
  themeKey: string;
  generateImage?: boolean;
  imageModel?: string;
  provider?: "anthropic" | "openai" | "groq";
  model?: string;
  useWebSearch?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CreateJobBody;

    if (!body.brief || body.brief.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a brief (at least 10 characters)" },
        { status: 400 }
      );
    }
    if (!body.themeKey) {
      return NextResponse.json(
        { error: "themeKey is required" },
        { status: 400 }
      );
    }

    // Combine brief + attachments into the context field that the worker reads
    const combined = body.attachments?.trim()
      ? `${body.brief.trim()}\n\n--- Additional context / notes ---\n${body.attachments.trim()}`
      : body.brief.trim();

    const job = await prisma.generationJob.create({
      data: {
        status: "pending",
        jobType: "custom_page",
        themeKey: body.themeKey,
        context: combined,
        wordLimit: 1200, // longer outputs for full pages
        provider: body.provider ?? "anthropic",
        model: body.model ?? "claude-sonnet-4-6",
        useWebSearch: body.useWebSearch ?? false,
        generateImage: body.generateImage ?? true,
        imageModel: body.imageModel ?? "wavespeed-ai/flux-schnell",
      },
      select: { id: true, status: true, createdAt: true },
    });

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
      message:
        "Job queued. Poll GET /api/custom-pages/generate/{id} until status=done",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create job";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
