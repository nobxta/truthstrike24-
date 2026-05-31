import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { callAI } from "@/lib/ai-providers";
import { slugify } from "@/lib/utils";

/**
 * Generate and publish a news article using the configured AI agent.
 * - Admin-triggered via "Generate Now" button OR cron-triggered with CRON_SECRET
 * - Uses the post provider/model from AgentSettings
 * - Picks a random topic from topicFocus
 * - Saves the post as published
 * - Logs to AgentLog
 */
export async function POST(req: NextRequest) {
  try {
    // Auth: either admin session OR cron secret
    const session = await getServerSession(authOptions);
    const cronSecret = req.headers.get("x-cron-secret");
    const isCron = cronSecret && cronSecret === process.env.CRON_SECRET;

    if (!session?.user && !isCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Pick a random topic
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

    // System prompt for news article generation
    const systemPrompt = `You are a professional news journalist for TruthStrike24. Write engaging, factual, well-structured news articles. Output STRICT JSON only — no markdown code fences, no preamble. Format:
{
  "title": "Article title (under 100 chars, headline-style)",
  "slug": "url-friendly-slug",
  "summary": "1-2 sentence summary (under 200 chars)",
  "content": "Full HTML article body with <p>, <h2>, <ul>, <strong> tags. 400-700 words. Multiple paragraphs.",
  "seoTitle": "SEO title (under 60 chars)",
  "metaDescription": "Meta description (under 160 chars)"
}`;

    const userPrompt = `Write a fresh, newsworthy article about: ${topic}.
Make it current, engaging, and factual. Add specific details, quotes, or statistics where appropriate.
Today's date: ${new Date().toISOString().split("T")[0]}.`;

    const aiResponse = await callAI({
      provider,
      model,
      systemPrompt,
      userMessage: userPrompt,
      maxTokens: 2048,
      purpose: "post",
    });

    // Parse JSON response (handle accidental code fences)
    let cleaned = aiResponse.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    let parsed: {
      title: string;
      slug?: string;
      summary: string;
      content: string;
      seoTitle?: string;
      metaDescription?: string;
    };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      await prisma.agentLog.create({
        data: {
          model,
          status: "error",
          error: `Failed to parse AI JSON response: ${cleaned.slice(0, 200)}`,
        },
      });
      return NextResponse.json(
        { error: "AI returned invalid JSON", raw: cleaned.slice(0, 300) },
        { status: 500 }
      );
    }

    if (!parsed.title || !parsed.content) {
      return NextResponse.json(
        { error: "AI response missing title or content" },
        { status: 500 }
      );
    }

    // Find or create author (use first admin)
    const author = await prisma.user.findFirst();
    if (!author) {
      return NextResponse.json(
        { error: "No author user exists. Create an admin user first." },
        { status: 400 }
      );
    }

    // Find or create a default category
    let category = await prisma.category.findFirst({
      where: { slug: "news" },
    });
    if (!category) {
      category = await prisma.category.findFirst();
    }
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: "News",
          slug: "news",
          color: "#3b82f6",
          emoji: "📰",
        },
      });
    }

    // Build unique slug
    let baseSlug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.title);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.post.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${++counter}`;
    }

    const post = await prisma.post.create({
      data: {
        title: parsed.title,
        slug: uniqueSlug,
        summary: parsed.summary || parsed.title,
        content: parsed.content,
        featuredImage: "",
        seoTitle: parsed.seoTitle || parsed.title,
        metaDescription: parsed.metaDescription || parsed.summary || "",
        status: "published",
        publishedAt: new Date(),
        authorId: author.id,
        categoryId: category.id,
        isAgentPost: true,
        isBreaking: false,
      },
    });

    await prisma.agentLog.create({
      data: {
        model,
        status: "success",
        title: post.title,
      },
    });

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        url: `/news/${post.slug}`,
      },
      topic,
      provider,
      model,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Agent post failed";
    try {
      await prisma.agentLog.create({
        data: {
          model: "unknown",
          status: "error",
          error: message,
        },
      });
    } catch {
      /* */
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* ── GET: fetch recent agent run logs ── */
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
    const message = error instanceof Error ? error.message : "Failed to fetch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
