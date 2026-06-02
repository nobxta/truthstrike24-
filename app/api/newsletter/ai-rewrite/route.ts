import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { callAI } from "@/lib/ai-providers";

export const maxDuration = 30;

/**
 * POST /api/newsletter/ai-rewrite
 *
 * Takes a draft newsletter (subject + preHeader + html body) plus a freeform
 * instruction from the admin, then returns a rewritten version via the
 * configured chat provider/model (same as dispute enhance).
 *
 * Returns { subject?, preHeader?, html } — only fields that changed.
 */

interface Body {
  instruction?: string;
  subject?: string;
  preHeader?: string;
  html?: string;
}

interface AiReply {
  subject?: string;
  preHeader?: string;
  html?: string;
}

function extractJson(raw: string): AiReply | null {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1) s = s.slice(first, last + 1);
  try {
    return JSON.parse(s) as AiReply;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    const instruction = body.instruction?.trim() || "Improve clarity and tone.";
    const subject = body.subject?.trim() ?? "";
    const preHeader = body.preHeader?.trim() ?? "";
    const html = body.html?.trim() ?? "";

    if (!html || html === "<p></p>") {
      return NextResponse.json(
        { error: "Body content is empty — write something first" },
        { status: 400 }
      );
    }

    // Use the chat AI settings (same provider/model used for enhance)
    const settings = await prisma.agentSettings.findUnique({
      where: { id: "singleton" },
    });
    const provider = (settings?.chatProvider || "groq") as
      | "anthropic"
      | "openai"
      | "groq";
    const model = settings?.chatModel || "llama-3.3-70b-versatile";

    const systemPrompt = `You are an expert newsletter editor for TruthStrike24, an independent investigative news outlet.

Your job: take the admin's draft newsletter and rewrite it according to their instruction. Preserve the core message and any specific facts. Maintain HTML structure if it has any. Return STRICT JSON only — no preamble, no fences.

Return ONLY the fields that should change. Always return "html" (the body). Return "subject" only if you're rewriting/generating the subject. Return "preHeader" only if changing it.

OUTPUT FORMAT — STRICT JSON ONLY:
{
  "html": "<p>Rewritten body HTML...</p>",
  "subject": "Optional new subject (only if you changed it)",
  "preHeader": "Optional new pre-header (only if you changed it)"
}

Rules:
- Output must be valid JSON — escape all quotes inside strings as \\"
- Output HTML body as a single string (newlines inside the HTML are fine)
- Keep all <a href> links if they exist
- Use semantic tags: <p>, <h2>, <h3>, <strong>, <em>, <ul>, <li>, <a>
- Don't include <html>, <body>, or doctype — just the inner body content
- Keep tone professional but engaging — match TruthStrike24's investigative voice`;

    const userPrompt = `CURRENT NEWSLETTER:
Subject: ${subject || "(none)"}
Pre-header: ${preHeader || "(none)"}

Body HTML:
${html}

═══════════════════════════════════
ADMIN'S INSTRUCTION:
${instruction}
═══════════════════════════════════

Rewrite per the instruction. Return JSON only.`;

    const raw = await callAI({
      provider,
      model,
      systemPrompt,
      userMessage: userPrompt,
      maxTokens: 2048,
      purpose: "newsletter_rewrite",
    });

    const parsed = extractJson(raw);
    if (!parsed || !parsed.html) {
      return NextResponse.json(
        {
          error: "AI returned invalid response — try again or use a different instruction",
          raw: raw.slice(0, 500),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      html: parsed.html,
      subject: parsed.subject,
      preHeader: parsed.preHeader,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "AI rewrite failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
