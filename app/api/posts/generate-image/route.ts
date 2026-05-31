import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateImage } from "@/lib/image-gen";

export const maxDuration = 60;

/**
 * POST /api/posts/generate-image
 * Body: { prompt: string; model?: string }
 * Returns: { url: string; durationMs: number }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { prompt?: string; model?: string };
    const prompt = (body.prompt || "").trim();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    const model = body.model || "wavespeed-ai/flux-schnell";

    const settings = await prisma.agentSettings.findUnique({
      where: { id: "singleton" },
    });
    const watermarkUrl =
      settings?.watermarkUrl || process.env.NEXT_PUBLIC_WATERMARK_URL || "";

    const result = await generateImage({
      model,
      prompt,
      watermarkUrl: watermarkUrl || undefined,
      aspectRatio: "16:9",
      purpose: "manual_post",
    });

    return NextResponse.json({ url: result.url, durationMs: result.durationMs });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
