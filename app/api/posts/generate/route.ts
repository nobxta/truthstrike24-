import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { callAI } from "@/lib/ai-providers";
import { generateImage } from "@/lib/image-gen";

export const maxDuration = 60;

/**
 * POST /api/posts/generate
 *
 * AI-generates an article from a free-form brief and (optionally) a hero image.
 * Returns the parsed draft JSON — does NOT save to DB. The client then submits
 * via POST /api/posts to actually create the post.
 */

interface GenerateBody {
  context: string;
  wordLimit?: number;
  provider?: "anthropic" | "openai" | "groq";
  model?: string;
  useWebSearch?: boolean;
  generateImage?: boolean;
  imageModel?: string;
}

interface ContentBlock {
  type: string;
  text?: string;
  [key: string]: unknown;
}

interface AnthropicResponse {
  content: ContentBlock[];
  usage?: { input_tokens?: number; output_tokens?: number };
}

interface ArticleJson {
  title: string;
  slug?: string;
  summary: string;
  content: string;
  seoTitle?: string;
  metaDescription?: string;
  imagePrompt: string;
  source?: string;
}

/* ── Pricing ── */
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-0-20250514": { input: 15, output: 75 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-sonnet-4-5-20250514": { input: 3, output: 15 },
  "claude-haiku-4-5-20250514": { input: 0.8, output: 4 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-4.1": { input: 2, output: 8 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1-nano": { input: 0.1, output: 0.4 },
  "o4-mini": { input: 1.1, output: 4.4 },
  o3: { input: 2, output: 8 },
  "o3-mini": { input: 1.1, output: 4.4 },
  "llama-3.3-70b-versatile": { input: 0.59, output: 0.79 },
  "llama-3.1-8b-instant": { input: 0.05, output: 0.08 },
  "llama-3.2-90b-vision-preview": { input: 0.9, output: 0.9 },
  "llama-3.2-11b-vision-preview": { input: 0.18, output: 0.18 },
  "llama-3.2-3b-preview": { input: 0.06, output: 0.06 },
  "llama-3.2-1b-preview": { input: 0.04, output: 0.04 },
  "mixtral-8x7b-32768": { input: 0.24, output: 0.24 },
  "gemma2-9b-it": { input: 0.2, output: 0.2 },
  "deepseek-r1-distill-llama-70b": { input: 0.75, output: 0.99 },
  "qwen-qwq-32b": { input: 0.29, output: 0.39 },
  "meta-llama/llama-4-scout-17b-16e-instruct": { input: 0.11, output: 0.34 },
  "meta-llama/llama-4-maverick-17b-128e-instruct": { input: 0.5, output: 0.77 },
};

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
      if (c === "\n") {
        result += "\\n";
        continue;
      }
      if (c === "\r") {
        result += "\\r";
        continue;
      }
      if (c === "\t") {
        result += "\\t";
        continue;
      }
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
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(cleaned) as ArticleJson;
  } catch {
    return JSON.parse(sanitizeJsonString(cleaned)) as ArticleJson;
  }
}

async function callClaudeWithSearch(
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number
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
      max_tokens: maxTokens,
      system: systemPrompt,
      tools: [
        { type: "web_search_20250305", name: "web_search", max_uses: 1 },
      ],
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const errTxt = await res.text();
    throw new Error(`Anthropic ${res.status}: ${errTxt.slice(0, 500)}`);
  }

  const data: AnthropicResponse = await res.json();
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

export async function POST(req: NextRequest) {
  const runStart = Date.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as GenerateBody;
    const context = (body.context || "").trim();
    if (!context) {
      return NextResponse.json(
        { error: "Brief context is required" },
        { status: 400 }
      );
    }

    const provider = body.provider || "groq";
    const model =
      body.model ||
      (provider === "anthropic"
        ? "claude-sonnet-4-6"
        : provider === "openai"
          ? "gpt-4o-mini"
          : "llama-3.3-70b-versatile");
    const wordLimit = Math.min(1500, Math.max(200, body.wordLimit ?? 600));
    const useWebSearch = !!body.useWebSearch && provider === "anthropic";
    const wantImage = !!body.generateImage;
    const imageModel = body.imageModel || "wavespeed-ai/flux-schnell";

    const today = new Date().toISOString().split("T")[0];
    const minWords = Math.max(200, wordLimit - 100);
    const maxWords = wordLimit + 100;

    const systemPrompt = `You are a top-tier news journalist writing for TruthStrike24, a professional news outlet.

YOUR TASK: ${
      useWebSearch
        ? "Use web_search to find the most relevant CURRENT facts about the user's brief, then write a comprehensive news article."
        : "Write a well-researched, detailed news article from the user's brief using your knowledge."
    }

ARTICLE QUALITY RULES (CRITICAL — your output is published live):

1. LENGTH: ${minWords}-${maxWords} words (target: ${wordLimit}).
2. SPECIFICITY:
   - Include REAL named people
   - Include EXACT statistics with sources
   - Include SPECIFIC dates, locations, dollar amounts, percentages
   - Include DIRECT QUOTES from named sources (in quotation marks)
3. NO FLUFF: never write "experts say" without naming them, never write "many people" without numbers, no empty filler, no repetition.
4. STRUCTURE: Lead paragraph (the 5 Ws), 2-3 body paragraphs each with NEW info, optional <h2> for longer pieces, closing on implications or what's next.
5. TONE: Professional journalism with specific names, dates, statistics, and quotes from real people.

OUTPUT — STRICT JSON ONLY (no markdown fences, no preamble, no trailing text):
{
  "title": "Specific headline (under 90 chars)",
  "slug": "url-friendly-slug",
  "summary": "Two complete sentences with specific facts (140-180 chars)",
  "content": "<p>HTML body with <p>, <h2>, <strong>, <ul>, <li>. ${minWords}-${maxWords} WORDS. Every paragraph adds NEW info.</p>",
  "seoTitle": "SEO-optimized title (under 60 chars)",
  "metaDescription": "Meta with the key fact (under 155 chars)",
  "imagePrompt": "PHOTOJOURNALISM description of the SCENE: specific subjects, setting, lighting, mood. NEVER include text/logos/watermarks IN the image.",
  "source": "${useWebSearch ? "URL of the source article if found, otherwise empty string" : ""}"
}

Today's date: ${today}
Word target: ${wordLimit} (${minWords}-${maxWords} acceptable range)

REMEMBER: No filler. No vague language. Specific people, specific numbers, specific places. RETURN JSON ONLY.`;

    const userPrompt = `User's brief:\n"""${context}"""\n\nWrite a comprehensive ${wordLimit}-word news article based on this brief. ${
      useWebSearch
        ? "Use web_search to find the latest real facts, names, statistics, and quotes related to this story. Cite the source URL in the 'source' field."
        : "Use your knowledge. Include real-sounding names, exact statistics, locations, dates, and quotes attributed to named people or specific organizations."
    }\n\nRETURN JSON ONLY. The content field must be ${minWords}-${maxWords} words.`;

    const maxTokens = Math.min(8192, Math.max(2048, Math.round(maxWords * 1.3 * 1.4)));

    /* ── Run article + image in parallel when applicable ── */
    const articlePromise = (async () => {
      if (provider === "anthropic" && useWebSearch) {
        return await callClaudeWithSearch(model, systemPrompt, userPrompt, maxTokens);
      }
      const text = await callAI({
        provider,
        model,
        systemPrompt,
        userMessage: userPrompt,
        maxTokens,
        purpose: "manual_post",
      });
      return { text, inputTokens: 0, outputTokens: 0 };
    })();

    const articleResult = await articlePromise;

    let parsed: ArticleJson;
    try {
      parsed = extractJson(articleResult.text);
    } catch (err) {
      return NextResponse.json(
        {
          error: "AI returned invalid JSON",
          parseError: (err as Error).message,
          raw: articleResult.text.slice(0, 500),
        },
        { status: 500 }
      );
    }

    if (!parsed.title || !parsed.content) {
      return NextResponse.json(
        { error: "AI response missing title or content", parsed },
        { status: 500 }
      );
    }

    /* ── Optionally generate image (after article, since we use article's imagePrompt) ── */
    let imageUrl = "";
    let imageError: string | null = null;
    if (wantImage && parsed.imagePrompt) {
      try {
        const settings = await prisma.agentSettings.findUnique({
          where: { id: "singleton" },
        });
        const watermarkUrl =
          settings?.watermarkUrl ||
          process.env.NEXT_PUBLIC_WATERMARK_URL ||
          "";
        const img = await generateImage({
          model: imageModel,
          prompt: parsed.imagePrompt,
          watermarkUrl: watermarkUrl || undefined,
          aspectRatio: "16:9",
          purpose: "manual_post",
        });
        imageUrl = img.url;
      } catch (err) {
        imageError = err instanceof Error ? err.message : String(err);
      }
    }

    /* ── Log usage for Anthropic web-search path (callAI logs itself) ── */
    if (articleResult.inputTokens > 0 || articleResult.outputTokens > 0) {
      const p = PRICING[model] || { input: 3, output: 15 };
      const costUsd =
        (articleResult.inputTokens * p.input +
          articleResult.outputTokens * p.output) /
        1_000_000;
      try {
        await prisma.aIUsage.create({
          data: {
            provider,
            model,
            purpose: "manual_post",
            inputTokens: articleResult.inputTokens,
            outputTokens: articleResult.outputTokens,
            totalTokens: articleResult.inputTokens + articleResult.outputTokens,
            costUsd,
            durationMs: Date.now() - runStart,
            success: true,
          },
        });
      } catch {
        /* ignore */
      }
    }

    const slug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.title);

    return NextResponse.json({
      title: parsed.title,
      slug,
      summary: parsed.summary || "",
      content: parsed.content,
      seoTitle: parsed.seoTitle || parsed.title,
      metaDescription: parsed.metaDescription || parsed.summary || "",
      imageUrl,
      imagePrompt: parsed.imagePrompt || "",
      imageError,
      source: parsed.source || "",
      provider,
      model,
      durationMs: Date.now() - runStart,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
