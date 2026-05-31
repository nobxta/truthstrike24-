import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { title, category, tone, length } = body as {
      title: string;
      category: string;
      tone?: string;
      length?: string;
    };

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const wordCount = length === "short" ? "200-300" : length === "long" ? "500-700" : "300-500";
    const articleTone = tone || "professional, informative";

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Write a news article with the following details:

Title: ${title}
Category: ${category}
Tone: ${articleTone}
Word count: ${wordCount} words

Return a JSON object with these exact fields:
{
  "content": "The full article in HTML format using <p>, <h2>, <h3>, <blockquote>, <ul>, <li> tags. Write engaging paragraphs with subheadings. Do NOT include the title as an h1.",
  "summary": "A 1-2 sentence summary for the article card/meta description (max 160 characters)",
  "seoTitle": "An SEO-optimized title (max 60 characters)",
  "keyPoints": ["3-5 key takeaway bullet points from the article"],
  "suggestedTags": ["3-5 relevant tag names for this article"]
}

Return ONLY the JSON object, no other text.`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
