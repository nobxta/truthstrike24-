import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const maxDuration = 10;

/**
 * POST /api/posts/generate
 *
 * Creates a GenerationJob in the DB and returns its ID INSTANTLY.
 * The VPS worker picks up pending jobs and does the slow AI work.
 * Frontend polls GET /api/posts/generate/[id] until status === "done".
 *
 * This split allows generation to take 30-60s (Vercel Hobby has 10s timeout).
 */

interface CreateJobBody {
  context: string;
  wordLimit?: number;
  provider?: "anthropic" | "openai" | "groq";
  model?: string;
  useWebSearch?: boolean;
  generateImage?: boolean;
  imageModel?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CreateJobBody;

    if (!body.context || body.context.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a brief (at least 10 characters)" },
        { status: 400 }
      );
    }

    const job = await prisma.generationJob.create({
      data: {
        status: "pending",
        context: body.context.trim(),
        wordLimit: body.wordLimit ?? 600,
        provider: body.provider ?? "groq",
        model: body.model ?? "llama-3.3-70b-versatile",
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
      message: "Job queued. Poll GET /api/posts/generate/{id} until status=done",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create job";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
