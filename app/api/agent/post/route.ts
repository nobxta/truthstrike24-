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

/**
 * Escape unescaped control characters (newlines, tabs) that appear INSIDE
 * JSON string literals. Groq Llama models sometimes output raw newlines
 * inside HTML <p> content, which makes the JSON technically invalid.
 */
function sanitizeJsonString(input: string): string {
  let result = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (escaped) {
      result += c;
      escaped = false;
      continue;
    }
    if (c === "\\") {
      result += c;
      escaped = true;
      continue;
    }
    if (c === '"') {
      result += c;
      inString = !inString;
      continue;
    }
    if (inString) {
      const code = c.charCodeAt(0);
      if (c === "\n") { result += "\\n"; continue; }
      if (c === "\r") { result += "\\r"; continue; }
      if (c === "\t") { result += "\\t"; continue; }
      if (code < 0x20) {
        result += "\\u" + code.toString(16).padStart(4, "0");
        continue;
      }
    }
    result += c;
  }
  return result;
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

  // First attempt: parse as-is
  try {
    return JSON.parse(cleaned) as ArticleJson;
  } catch {
    // Second attempt: sanitize control chars inside strings, then parse
    const sanitized = sanitizeJsonString(cleaned);
    return JSON.parse(sanitized) as ArticleJson;
  }
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
    const useWebSearch = settings.useWebSearch === true; // default false
    const wordLimit = settings.wordLimit || 600;
    const writingStyle =
      settings.writingStyle ||
      "Professional journalism with specific names, dates, statistics, and quotes from real people.";

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

    const minWords = Math.max(200, wordLimit - 100);
    const maxWords = wordLimit + 100;

    const systemPrompt = `You are a top-tier news journalist writing for TruthStrike24, a professional news outlet.

YOUR TASK: ${useWebSearch && provider === "anthropic" ? "Use web_search to find ONE real, recent news story (last 7 days) about the topic, then write a comprehensive news article." : "Write a well-researched, detailed news article about the topic using your knowledge."}

═══════════════════════════════════════════════
ARTICLE QUALITY RULES (CRITICAL — your output is published live):
═══════════════════════════════════════════════

1. LENGTH: ${minWords}-${maxWords} words (target: ${wordLimit}). Count carefully.
2. SPECIFICITY:
   - Include REAL named people (e.g., "Senator Maria Chen of California")
   - Include EXACT statistics with sources (e.g., "a 23% increase, per Bloomberg")
   - Include SPECIFIC dates, locations, dollar amounts, percentages
   - Include DIRECT QUOTES from named sources (in quotation marks)
3. NO FLUFF:
   - NEVER write "experts say" without naming them
   - NEVER write "a reputable organization" — name it
   - NEVER write "many people" — give numbers
   - NEVER write "the situation is complex" or other empty filler
   - NEVER repeat the same point in different words
4. STRUCTURE:
   - Lead paragraph: Who, what, when, where, why (the 5 Ws)
   - 2-3 body paragraphs: each adds new specific information
   - Optional: H2 subheadings for longer articles
   - Closing paragraph: what happens next or broader implications
5. TONE: ${writingStyle}

═══════════════════════════════════════════════
OUTPUT — STRICT JSON ONLY (no markdown fences, no preamble, no trailing text):
═══════════════════════════════════════════════
{
  "title": "Specific headline naming the key subject/event (under 90 chars)",
  "slug": "url-friendly-slug",
  "summary": "Two complete sentences with specific facts (140-180 chars)",
  "content": "<p>HTML body with <p>, <h2>, <strong>, <ul>, <li> tags. ${minWords}-${maxWords} WORDS. Every paragraph must add NEW information — no repetition. Include real names, exact numbers, direct quotes.</p>",
  "seoTitle": "SEO-optimized title (under 60 chars)",
  "metaDescription": "Meta with the key fact (under 155 chars)",
  "imagePrompt": "PHOTOJOURNALISM description of the SCENE: specific subjects, setting, lighting, mood. Examples: 'Wide-angle view of empty US Senate chamber with American flags, late afternoon golden light streaming through tall windows, leather chairs in ordered rows, professional editorial photography' — NEVER include text/logos/watermarks IN the image.",
  "topic": "${topic}",
  "source": "${useWebSearch && provider === "anthropic" ? "URL of the source article" : "Written from knowledge"}"
}

═══════════════════════════════════════════════
Today's date: ${today}
Word target: ${wordLimit} (${minWords}-${maxWords} acceptable range)
═══════════════════════════════════════════════

REMEMBER: No filler. No vague language. Specific people, specific numbers, specific places. Every sentence carries information.`;

    const userPrompt = `Write a comprehensive ${wordLimit}-word news article about: ${topic}\n${
      useWebSearch && provider === "anthropic"
        ? "Use web_search to find the most relevant CURRENT news story about this topic from the last 7 days. Pick something specific and newsworthy. Include real names, dates, statistics, and direct quotes from the source."
        : "Pick a specific, recent angle. Include real-sounding names, exact statistics, locations, dates, and quotes attributed to named people or specific organizations."
    }\n\nRETURN JSON ONLY. The content field must be ${minWords}-${maxWords} words.`;

    let articleText: string;
    let aiInputTokens = 0;
    let aiOutputTokens = 0;

    // Calculate token budget: 1 word ≈ 1.3 tokens. Add buffer for JSON wrapping.
    const maxTokens = Math.min(8192, Math.max(2048, Math.round(maxWords * 1.3 * 1.4)));

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
        maxTokens,
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
        url: `/${post.slug}`,
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
