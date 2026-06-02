import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { callAI } from "@/lib/ai-providers";

export const maxDuration = 60;

/**
 * POST /api/newsletter/ai-generate
 *
 * Generates a COMPLETE newsletter from scratch using AI:
 * - Subject line (optimized for open rate)
 * - Pre-header text
 * - Rich HTML body with proper styling (headings, bold, callouts, lists,
 *   styled CTAs, colored highlights)
 *
 * Input: template type + brief/topic + tone + length
 * Output: { subject, preHeader, html }
 */

type TemplateType =
  | "weekly-digest"
  | "single-story"
  | "breaking-flash"
  | "scam-alert"
  | "magazine-issue"
  | "promotional";

interface Body {
  template?: TemplateType;
  brief?: string;
  tone?: string;
  length?: "short" | "medium" | "long";
  theme?: "classic" | "minimal" | "alert" | "magazine";
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

const TEMPLATE_PROMPTS: Record<TemplateType, string> = {
  "weekly-digest": `Create a WEEKLY DIGEST newsletter — a roundup of the week's biggest news, organized into 3-5 sections. Format:
- Strong opening hook (2-3 sentences about the week's biggest theme)
- 3-5 story sections, each with: <h2> headline, 2-paragraph summary, "Read more" CTA
- Closing thoughts section
- Subject: "This Week: [main story]" pattern
- Use varied formatting: callouts for shocking stats, bulleted "Quick Facts"`,

  "single-story": `Create a SINGLE-STORY DEEP DIVE newsletter focused entirely on ONE big news story. Format:
- Powerful opening: state the news in one bold sentence
- "The story" — 2-3 detailed paragraphs of what happened
- "Why it matters" — section with implications
- "Key numbers" — styled callout box with 3-4 specific statistics
- "Who's involved" — bulleted list of key players
- "What's next" — closing paragraph
- Big CTA button to read the full article
- Subject: punchy, specific, with the central figure/number`,

  "breaking-flash": `Create a BREAKING NEWS FLASH — urgent, short, immediate. Format:
- "BREAKING:" header in bold red
- One paragraph stating what just happened (the lede)
- "The key facts" — short bulleted list of 4-5 quick facts
- One styled callout with the most shocking number or quote
- "More to come" closing line
- Subject: starts with "BREAKING:" or "URGENT:" with the key fact
- KEEP IT SHORT — under 200 words`,

  "scam-alert": `Create a SCAM ALERT newsletter exposing a specific fraud (TruthStrike24's specialty). Format:
- "SCAM ALERT" header with warning emoji-style icon
- "The scam" — what's happening in 1-2 paragraphs
- "Red flags to watch for" — bulleted warning signs (use red bold)
- "Who's behind it" — known details about perpetrators
- "How to protect yourself" — bulleted action items (use green bold)
- "If you've been victimized" — bulleted next steps
- Styled warning callout box: "DO NOT send funds to..."
- Big red CTA: "Read full investigation"
- Subject: "⚠ Scam Alert: [Name]" pattern (without emoji char)`,

  "magazine-issue": `Create a MAGAZINE-STYLE EDITORIAL issue. Format:
- Editor's note from "The TruthStrike24 Editorial Team"
- "Cover story" — full feature treatment with subhead, lead paragraph, body
- "Inside this issue" — table of contents style with 3-4 article titles
- "Investigation spotlight" — short feature on an ongoing investigation
- "From our readers" — quoted reader correspondence (you can make these up plausibly)
- "Coming next" — teaser for next issue
- Sophisticated, longer-form, editorial voice
- Subject: "Issue [N]: [theme]" pattern`,

  promotional: `Create a PROMOTIONAL newsletter for a special announcement or campaign. Format:
- Big eye-catching opening with the offer/announcement
- "What this means" — 2-3 paragraphs of context
- Styled benefit list — 3-5 reasons this matters
- Time-limited or scarcity element (if relevant)
- Big, prominent styled CTA button
- Social proof or testimonial section (you can make these plausible)
- "Limited time" or "join now" energy
- Subject: benefit-led, specific`,
};

const STYLE_GUIDE = `
STYLING RULES — embed real CSS inline since email clients require it:

HEADINGS (h2):
<h2 style="color: #dc2626; font-size: 22px; font-weight: 800; margin: 24px 0 12px; letter-spacing: -0.3px;">Heading Here</h2>

SUBHEADINGS (h3):
<h3 style="color: #111827; font-size: 16px; font-weight: 700; margin: 18px 0 8px;">Subheading</h3>

PARAGRAPHS — keep them readable:
<p style="color: #1f2937; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">Paragraph text.</p>

BOLD KEY FACTS (use red for emphasis):
<strong style="color: #dc2626;">Key fact in red</strong>

CALLOUT BOX (for shocking stats / important quotes):
<div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
  <p style="color: #7f1d1d; font-size: 14px; line-height: 1.5; margin: 0; font-weight: 600;">The shocking fact or quote here.</p>
</div>

YELLOW WARNING CALLOUT:
<div style="background: #fefce8; border-left: 4px solid #ca8a04; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
  <p style="color: #713f12; font-size: 14px; line-height: 1.5; margin: 0; font-weight: 600;">Warning text.</p>
</div>

GREEN SUCCESS CALLOUT:
<div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
  <p style="color: #14532d; font-size: 14px; line-height: 1.5; margin: 0; font-weight: 600;">Positive note here.</p>
</div>

STAT NUMBER (huge display):
<div style="text-align: center; margin: 24px 0;">
  <p style="color: #dc2626; font-size: 48px; font-weight: 900; margin: 0; line-height: 1;">$4.2M</p>
  <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Stolen from victims</p>
</div>

BULLET LIST (styled):
<ul style="color: #1f2937; font-size: 15px; line-height: 1.7; padding-left: 20px; margin: 0 0 20px;">
  <li style="margin-bottom: 8px;"><strong>Bold lead:</strong> rest of the bullet text.</li>
  <li style="margin-bottom: 8px;">Another bullet point.</li>
</ul>

CTA BUTTON (the big action button):
<div style="text-align: center; margin: 28px 0;">
  <a href="https://www.truthstrike24.com/SLUG" style="display: inline-block; background: #dc2626; color: #ffffff; padding: 14px 36px; border-radius: 8px; font-weight: 700; font-size: 15px; text-decoration: none; letter-spacing: 0.3px;">Read the Full Investigation →</a>
</div>

INLINE LINK:
<a href="https://www.truthstrike24.com" style="color: #dc2626; font-weight: 600; text-decoration: underline;">link text</a>

BLOCKQUOTE (pull quote):
<blockquote style="border-left: 4px solid #e5e7eb; padding-left: 20px; margin: 24px 0; color: #4b5563; font-size: 18px; font-style: italic; line-height: 1.6;">"Quote here," — Attribution.</blockquote>

DIVIDER (between sections):
<div style="border-top: 1px solid #e5e7eb; margin: 28px 0;"></div>

SECTION LABEL (small uppercase eyebrow text):
<p style="color: #dc2626; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 6px;">SECTION LABEL</p>
`;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    const template = body.template || "single-story";
    const brief = body.brief?.trim() || "";
    const tone = body.tone?.trim() || "Professional investigative journalism";
    const length = body.length || "medium";

    if (!brief || brief.length < 5) {
      return NextResponse.json(
        { error: "Brief is required — describe what the newsletter is about" },
        { status: 400 }
      );
    }

    // Use post-generation AI settings (better quality than chat AI)
    const settings = await prisma.agentSettings.findUnique({
      where: { id: "singleton" },
    });
    const provider = (settings?.postProvider || "groq") as
      | "anthropic"
      | "openai"
      | "groq";
    const model = settings?.model || "llama-3.3-70b-versatile";

    const wordTarget =
      length === "short" ? 250 : length === "long" ? 800 : 500;

    const templateBrief = TEMPLATE_PROMPTS[template] || TEMPLATE_PROMPTS["single-story"];

    const systemPrompt = `You are an expert newsletter writer and email designer for TruthStrike24, an independent investigative news outlet that exposes crypto scams, fraud, and corporate cover-ups.

${templateBrief}

═══════════════════════════════════
TONE: ${tone}
LENGTH TARGET: ~${wordTarget} words body content
═══════════════════════════════════

${STYLE_GUIDE}

═══════════════════════════════════
OUTPUT — STRICT JSON ONLY (no markdown fences, no preamble):
═══════════════════════════════════
{
  "subject": "Punchy subject line (40-65 chars, optimized for open rate)",
  "preHeader": "Pre-header text shown in inbox preview (60-100 chars, complements subject — adds context, not repetition)",
  "html": "FULL rich HTML body using the styling rules above. Multiple sections, bold key facts, at least one styled callout, at least one CTA button, varied formatting. ~${wordTarget} words."
}

CRITICAL JSON RULES:
- Escape all double quotes inside string values as \\"
- Newlines inside HTML strings: use literal newlines (the parser handles them)
- NO markdown code fences in output
- NO preamble or explanation text outside the JSON object
- HTML must be self-contained body content (no <html> or <body> wrappers)
- All href URLs must be absolute (use https://www.truthstrike24.com/ as base)

Write a publication-grade newsletter. Be specific, factual, engaging. Use the styled blocks generously to make it visually rich.`;

    const userPrompt = `BRIEF / TOPIC:
${brief}

Generate the complete ${template.replace("-", " ")} newsletter. Return JSON only.`;

    const raw = await callAI({
      provider,
      model,
      systemPrompt,
      userMessage: userPrompt,
      maxTokens: 4096,
      purpose: "newsletter_generate",
    });

    const parsed = extractJson(raw);
    if (!parsed || !parsed.html || !parsed.subject) {
      return NextResponse.json(
        {
          error: "AI returned invalid response — try again or simplify the brief",
          raw: raw.slice(0, 500),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subject: parsed.subject,
      preHeader: parsed.preHeader || "",
      html: parsed.html,
      template,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "AI generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
