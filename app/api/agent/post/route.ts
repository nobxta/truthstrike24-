import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export const maxDuration = 60; // Vercel function timeout

/**
 * AI Agent: generate and publish a news article with a real photo.
 *
 * Pipeline:
 * 1. Call Claude with web_search tool to find a real, recent, SMALL/short news story
 * 2. Claude returns article JSON + an image prompt
 * 3. Call WaveSpeed.ai with the image prompt + brand watermark reference
 * 4. Save the post with the generated image as featuredImage
 * 5. Log everything to AgentLog + AIUsage tables
 *
 * Auth: admin session OR header `x-cron-secret: ${CRON_SECRET}`
 */

/* ── Anthropic API call with web_search tool + usage tracking ── */

interface ContentBlock {
  type: string;
  text?: string;
  [key: string]: unknown;
}

interface AnthropicUsage {
  input_tokens?: number;
  output_tokens?: number;
}

interface AnthropicResponse {
  content: ContentBlock[];
  usage?: AnthropicUsage;
}

async function callClaudeWithSearch(
  model: string,
  systemPrompt: string,
  userMessage: string
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 1,
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const errTxt = await res.text();
    throw new Error(`Anthropic ${res.status}: ${errTxt.slice(0, 500)}`);
  }

  const data: AnthropicResponse = await res.json();

  // Concatenate all text blocks (skip tool_use/tool_result blocks)
  const text = data.content
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("\n")
    .trim();

  return {
    text,
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

/* ── Parse JSON from Claude (handles ```json fences and stray text) ── */

interface ArticleJson {
  title: string;
  slug?: string;
  summary: string;
  content: string;
  seoTitle?: string;
  metaDescription?: string;
  imagePrompt: string;
  source?: string;
  topic?: string;
}

function extractJson(raw: string): ArticleJson {
  let cleaned = raw.trim();

  // Strip markdown code fence
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  // Find first { and last } — Claude sometimes adds preamble
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned) as ArticleJson;
}

/* ── POST: run the agent ── */

export async function POST(req: NextRequest) {
  const runStart = Date.now();
  try {
    // Auth: admin session OR cron secret
    const session = await getServerSession(authOptions);
    const cronSecret = req.headers.get("x-cron-secret");
    const isCron = !!(cronSecret && cronSecret === process.env.CRON_SECRET);

    if (!session?.user && !isCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ── Get settings ── */
    const settings = await prisma.agentSettings.findUnique({
      where: { id: "singleton" },
    });
    if (!settings) {
      return NextResponse.json(
        { error: "Agent settings not configured" },
        { status: 400 }
      );
    }
    if (!settings.enabled) {
      return NextResponse.json(
        { error: "News agent is disabled. Enable it in Agent Settings." },
        { status: 400 }
      );
    }

    const provider = (settings.postProvider || "anthropic") as
      | "anthropic"
      | "openai"
      | "groq";
    const model = settings.model;
    const imageModel = settings.imageModel || "wavespeed-ai/flux-dev";
    const watermarkUrl =
      settings.watermarkUrl || process.env.NEXT_PUBLIC_WATERMARK_URL || "";
    const useWebSearch = settings.useWebSearch !== false; // default true

    /* ── Pick a random topic ── */
    const topics = settings.topicFocus
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (topics.length === 0) {
      return NextResponse.json(
        { error: "No topics configured in Agent Settings" },
        { status: 400 }
      );
    }
    const topic = topics[Math.floor(Math.random() * topics.length)];

    /* ── Step 1: Generate article + image prompt ── */
    const today = new Date().toISOString().split("T")[0];

    const systemPrompt = `You are a professional news journalist for TruthStrike24. Your task: ${useWebSearch && provider === "anthropic" ? "use web_search to find ONE real, recent (last 7 days), SHORT news story" : "write a fresh, plausible short news article"} about the assigned topic, then write a concise news article about it.

OUTPUT FORMAT — RETURN STRICT JSON ONLY (no markdown fences, no preamble):
{
  "title": "Punchy headline under 80 chars",
  "slug": "url-friendly-slug-here",
  "summary": "1-2 sentence summary under 180 chars",
  "content": "<p>Article body in HTML. Use <p>, <h2>, <ul>, <strong> tags. SHORT — 250-400 words total, 3-4 paragraphs max. Concise, factual, engaging.</p>",
  "seoTitle": "SEO title under 60 chars",
  "metaDescription": "Meta description under 155 chars",
  "imagePrompt": "Detailed visual description for a news photo about this story. Describe the SCENE, SUBJECTS, SETTING, LIGHTING, MOOD. Example: 'A modern courtroom interior with wooden bench, judge gavel on desk, soft afternoon light through tall windows, blurred figures in background, photojournalism style'. NO TEXT, NO LOGOS, NO WATERMARKS in image.",
  "topic": "${topic}",
  "source": "${useWebSearch && provider === "anthropic" ? "URL of the source article" : "AI-written"}"
}

RULES:
- Keep article SHORT (250-400 words). News should be digestible.
- imagePrompt must be VISUAL ONLY — describe a photo, not a concept
- Never put text/headlines INTO the image
- Today's date: ${today}`;

    const userPrompt = `Write a short news article about: ${topic}\n${
      useWebSearch && provider === "anthropic"
        ? "Search the web for the most recent SHORT news story about this topic from the last 7 days. Pick something current and specific."
        : "Make it current and specific."
    }\n\nReturn JSON only.`;

    let articleText: string;
    let aiInputTokens = 0;
    let aiOutputTokens = 0;

    if (provider === "anthropic" && useWebSearch) {
      const result = await callClaudeWithSearch(model, systemPrompt, userPrompt);
      articleText = result.text;
      aiInputTokens = result.inputTokens;
      aiOutputTokens = result.outputTokens;
    } else {
      // Fall back to standard callAI (no web_search for non-Anthropic)
      const { callAI } = await import("@/lib/ai-providers");
      articleText = await callAI({
        provider,
        model,
        systemPrompt,
        userMessage: userPrompt,
        maxTokens: 2048,
        purpose: "post",
      });
    }

    /* ── Step 2: Parse JSON ── */
    let parsed: ArticleJson;
    try {
      parsed = extractJson(articleText);
    } catch (err) {
      await prisma.agentLog.create({
        data: {
          model,
          status: "error",
          error: `Failed to parse JSON: ${(err as Error).message}. Raw: ${articleText.slice(0, 300)}`,
        },
      });
      return NextResponse.json(
        {
          error: "AI returned invalid JSON",
          raw: articleText.slice(0, 500),
          parseError: (err as Error).message,
        },
        { status: 500 }
      );
    }

    if (!parsed.title || !parsed.content || !parsed.imagePrompt) {
      return NextResponse.json(
        { error: "AI response missing title, content, or imagePrompt", parsed },
        { status: 500 }
      );
    }

    /* ── Image deferred to /api/agent/image endpoint ── */
    // We save the imagePrompt into seoTitle as a hidden marker (parsed later)
    // and use a placeholder in featuredImage. A separate cron picks pending posts up.
    const featuredImage = ""; // empty = pending
    const imageError: string | null = null;
    const imageDurationMs = 0;

    /* ── Step 4: Find author + category ── */
    const author = await prisma.user.findFirst();
    if (!author) {
      return NextResponse.json(
        { error: "No author user exists. Create an admin first." },
        { status: 400 }
      );
    }

    let category = await prisma.category.findFirst({ where: { slug: "news" } });
    if (!category) category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: { name: "News", slug: "news", color: "#3b82f6", emoji: "📰" },
      });
    }

    /* ── Step 5: Unique slug ── */
    const baseSlug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.title);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.post.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${++counter}`;
    }

    /* ── Step 6: Save post ── */
    const post = await prisma.post.create({
      data: {
        title: parsed.title,
        slug: uniqueSlug,
        summary: parsed.summary || parsed.title,
        content: parsed.content,
        featuredImage,
        seoTitle: parsed.seoTitle || parsed.title,
        metaDescription: parsed.metaDescription || parsed.summary || "",
        status: "published",
        publishedAt: new Date(),
        authorId: author.id,
        categoryId: category.id,
        isAgentPost: true,
        isBreaking: false,
        imagePrompt: parsed.imagePrompt,
        imageStatus: "pending",
      },
    });

    /* ── Step 7: Log usage + agent run ── */
    if (aiInputTokens > 0 || aiOutputTokens > 0) {
      const PRICING: Record<string, { input: number; output: number }> = {
        "claude-sonnet-4-6": { input: 3, output: 15 },
        "claude-opus-4-0-20250514": { input: 15, output: 75 },
        "claude-haiku-4-5-20250514": { input: 0.8, output: 4 },
      };
      const p = PRICING[model] || { input: 3, output: 15 };
      const costUsd = (aiInputTokens * p.input + aiOutputTokens * p.output) / 1_000_000;

      await prisma.aIUsage.create({
        data: {
          provider,
          model,
          purpose: "post",
          inputTokens: aiInputTokens,
          outputTokens: aiOutputTokens,
          totalTokens: aiInputTokens + aiOutputTokens,
          costUsd,
          durationMs: Date.now() - runStart - imageDurationMs,
          success: true,
        },
      });
    }

    await prisma.agentLog.create({
      data: {
        model,
        status: imageError ? "partial" : "success",
        title: post.title,
        error: imageError || null,
      },
    });

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        url: `/news/${post.slug}`,
        featuredImage,
      },
      topic,
      provider,
      model,
      imageModel,
      imagePrompt: parsed.imagePrompt,
      imageError,
      source: parsed.source,
      durationMs: Date.now() - runStart,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent failed";
    try {
      await prisma.agentLog.create({
        data: { model: "unknown", status: "error", error: message },
      });
    } catch {
      /* */
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* ── GET: fetch recent agent logs ── */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = await prisma.agentLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 20,
    });
    return NextResponse.json({ logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
