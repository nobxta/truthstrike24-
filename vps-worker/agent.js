#!/usr/bin/env node
/**
 * TruthStrike24 — VPS Worker
 * Runs on a VPS (Oracle Cloud Free / Hetzner / DigitalOcean / Pterodactyl).
 * Reads agent settings + writes posts to the SAME Neon DB as Vercel.
 *
 * No timeouts — uses big models with web_search + long articles.
 *
 * Usage:
 *   node agent.js                            # run once
 *   node agent.js --watch                    # run every 60 min in a loop
 *   node agent.js --watch --every=30         # custom interval
 */

// Load .env into process.env (works on any Node 16+)
try {
  require("dotenv").config();
} catch {
  /* dotenv not installed — assume env vars come from Pterodactyl panel */
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* ─── Config from env vars ─── */

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const WAVESPEED_KEY = process.env.WAVESPEED_API_KEY;
const WATERMARK_URL = process.env.NEXT_PUBLIC_WATERMARK_URL || "";

if (!ANTHROPIC_KEY && !OPENAI_KEY && !GROQ_KEY) {
  console.error("❌ At least one AI provider API key required");
  process.exit(1);
}
if (!WAVESPEED_KEY) {
  console.error("❌ WAVESPEED_API_KEY required");
  process.exit(1);
}

/* ─── Slugify ─── */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

/* ─── AI calls (full quality, no timeout) ─── */

async function callClaude(model, systemPrompt, userMessage, useWebSearch) {
  const body = {
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  };
  if (useWebSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }];
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n"),
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

async function callOpenAI(model, systemPrompt, userMessage) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.choices[0].message.content,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
  };
}

async function callGroq(model, systemPrompt, userMessage) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.choices[0].message.content,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
  };
}

/* ─── IndexNow ping (instant Bing/Yandex indexing) ─── */

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "a2b1d92cfba9ba4089e8a73f17ebf5ef";
const SITE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.truthstrike24.com").host;
  } catch {
    return "www.truthstrike24.com";
  }
})();

async function pingIndexNow(url) {
  try {
    const fullUrl = url.startsWith("http") ? url : `https://${SITE_HOST}${url.startsWith("/") ? url : `/${url}`}`;
    const res = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: SITE_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
        urlList: [fullUrl],
      }),
    });
    if (res.ok || res.status === 202) {
      console.log(`   📨 IndexNow ✓ ${fullUrl}`);
    } else {
      console.warn(`   📨 IndexNow ${res.status}`);
    }
  } catch (err) {
    console.error(`   📨 IndexNow error: ${err.message}`);
  }
}

/* ─── WaveSpeed image gen ─── */

async function generateImage(model, prompt) {
  const url = `https://api.wavespeed.ai/api/v3/${model}`;
  const body = {
    prompt: `${prompt}. High quality, professional news photography, sharp details. No watermarks or text in image.`,
    size: "1344*768",
    aspect_ratio: "16:9",
    num_inference_steps: model.includes("schnell") ? 4 : 28,
    guidance_scale: 3.5,
    seed: Math.floor(Math.random() * 2147483647),
  };

  const submit = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${WAVESPEED_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!submit.ok) throw new Error(`WaveSpeed submit ${submit.status}: ${await submit.text()}`);

  const sj = await submit.json();
  const sd = sj.data || sj;
  if (sd.outputs?.length) return sd.outputs[0];

  // Poll
  const id = sd.id || sj.id;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const r = await fetch(`https://api.wavespeed.ai/api/v3/predictions/${id}/result`, {
      headers: { Authorization: `Bearer ${WAVESPEED_KEY}` },
    });
    if (!r.ok) continue;
    const j = await r.json();
    const d = j.data || j;
    if (d.status === "completed" || d.status === "succeeded") {
      if (d.outputs?.length) return d.outputs[0];
      throw new Error("WaveSpeed: no outputs");
    }
    if (d.status === "failed") throw new Error(`WaveSpeed failed: ${d.error || "unknown"}`);
  }
  throw new Error("WaveSpeed timeout after 2min");
}

/* ─── Parse AI JSON output (tolerant of raw control chars in strings) ─── */

function sanitizeJsonString(input) {
  let result = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (escaped) { result += c; escaped = false; continue; }
    if (c === "\\") { result += c; escaped = true; continue; }
    if (c === '"') { result += c; inString = !inString; continue; }
    if (inString) {
      const code = c.charCodeAt(0);
      if (c === "\n") { result += "\\n"; continue; }
      if (c === "\r") { result += "\\r"; continue; }
      if (c === "\t") { result += "\\t"; continue; }
      if (code < 0x20) { result += "\\u" + code.toString(16).padStart(4, "0"); continue; }
    }
    result += c;
  }
  return result;
}

// Lazy-loaded JSON repair library (handles unescaped quotes inside HTML strings,
// trailing commas, unquoted keys, and other common AI output issues)
let _jsonrepair;
function loadJsonRepair() {
  if (_jsonrepair !== undefined) return _jsonrepair;
  try {
    _jsonrepair = require("jsonrepair").jsonrepair;
  } catch {
    _jsonrepair = null;
  }
  return _jsonrepair;
}

function extractJson(raw) {
  let s = raw.trim();
  if (s.startsWith("```")) s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1) s = s.slice(first, last + 1);

  // Attempt 1: parse as-is (works for clean output)
  try {
    return JSON.parse(s);
  } catch {
    /* fall through */
  }

  // Attempt 2: sanitize control characters inside string literals
  try {
    return JSON.parse(sanitizeJsonString(s));
  } catch {
    /* fall through */
  }

  // Attempt 3: full JSON repair (handles unescaped quotes in HTML, etc.)
  const repair = loadJsonRepair();
  if (repair) {
    try {
      return JSON.parse(repair(s));
    } catch {
      // Try with sanitize too
      return JSON.parse(repair(sanitizeJsonString(s)));
    }
  }

  // Last resort — throw with truncated context
  throw new Error("All JSON parse attempts failed");
}

/* ─── Main agent run ─── */

async function runAgent() {
  const startTime = Date.now();
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[${new Date().toISOString()}] Starting agent run...`);

  try {
    const settings = await prisma.agentSettings.findUnique({ where: { id: "singleton" } });
    if (!settings) throw new Error("AgentSettings not found in DB");
    if (!settings.enabled) {
      console.log("⏸  Agent disabled in settings. Skipping.");
      return;
    }

    const provider = settings.postProvider || "anthropic";
    const model = settings.model;
    const imageModel = settings.imageModel || "wavespeed-ai/flux-dev";
    const useWebSearch = !!settings.useWebSearch;
    const wordLimit = settings.wordLimit || 800;
    const writingStyle = settings.writingStyle || "Professional journalism with specific names, dates, statistics, and quotes from real people.";

    const topics = settings.topicFocus.split(/[,\n]/).map((t) => t.trim()).filter(Boolean);
    if (!topics.length) throw new Error("No topics in settings");
    const topic = topics[Math.floor(Math.random() * topics.length)];

    console.log(`📝 Topic: "${topic}"`);
    console.log(`🤖 Model: ${provider}/${model}`);
    console.log(`🔎 Web search: ${useWebSearch ? "ON" : "off"}`);
    console.log(`📏 Word limit: ${wordLimit}`);

    /* Build prompt (same as Vercel route) */
    const today = new Date().toISOString().split("T")[0];
    const minWords = Math.max(200, wordLimit - 100);
    const maxWords = wordLimit + 100;

    const systemPrompt = `You are a SENIOR NEWS JOURNALIST + EXPERT SEO WRITER for TruthStrike24, an independent investigative news outlet.

PRIMARY GOAL: Produce a news article that ranks on Google AND reads like real journalism.

TASK: ${useWebSearch && provider === "anthropic" ? "Use web_search to find a real recent (last 7 days) news story" : "Write a fresh, factual news article from your knowledge"}.

═══════════════════════════════════════════════════════════════════
ARTICLE CONTENT RULES
═══════════════════════════════════════════════════════════════════
LENGTH: ${minWords}-${maxWords} words (target ${wordLimit}).
- Include REAL named people, organizations, specific dates, exact statistics, dollar amounts
- Include DIRECT QUOTES from named sources (in quotation marks)
- NO filler: never write "experts say" without naming them
- NO repetition. Every paragraph adds NEW information.
- ${writingStyle}

CONTENT STRUCTURE (critical for SEO):
- Opening paragraph: HOOK + answer the 5 Ws (who, what, when, where, why) in the first 100 words
- Primary keyword MUST appear in the first 100 words AND in the first sentence
- Use 2-4 H2 subheadings (<h2> tags) to break up content — each H2 should contain a related keyword variation
- Bullet lists (<ul><li>) where appropriate to win featured snippets
- Strong, journalistic prose. Short sentences. Active voice.
- Close with a forward-looking statement or implication

═══════════════════════════════════════════════════════════════════
SEO FIELD RULES — FOLLOW EXACTLY
═══════════════════════════════════════════════════════════════════

1. TITLE (the headline shown on the site):
   - 55-65 characters MAX
   - Contains the PRIMARY KEYWORD at the start
   - Specific names, numbers, or "How/Why/What" hooks
   - Compelling, factual, NOT clickbait
   - Title case
   - Examples of good: "Federal Judge Blocks $1.8B Trump Anti-Weaponization Fund"
                       "Apple Q3 Revenue Hits $90.8B Despite iPhone Slump"
   - Examples of bad: "Big news happens" / "You won't believe what happened"

2. SEO TITLE (the <title> tag for Google):
   - 50-60 characters MAX (Google truncates around 60)
   - Identical to title IF title ≤ 60 chars, otherwise shorter rewrite
   - End with " | TruthStrike24" ONLY if total is still ≤ 60 chars
   - Front-load the primary keyword

3. META DESCRIPTION (Google search result snippet):
   - 150-160 characters EXACTLY (Google truncates 160)
   - Contains primary keyword in first 120 chars
   - Compelling — answers "why click?"
   - Includes a benefit, statistic, or hook
   - Ends with a soft CTA: "Read more.", "Full report.", "What it means."
   - Active voice. Present tense. No quotation marks.

4. SUMMARY (article subhead/preview):
   - 140-200 characters
   - Two complete sentences with SPECIFIC FACTS
   - First sentence: what happened (5 Ws condensed)
   - Second sentence: significance/scope/next step
   - NOT identical to meta description — written for human reading on the site

5. SLUG (URL):
   - Lowercase, hyphen-separated, 4-7 words MAX
   - Includes 2-3 primary keywords
   - NO articles (a, an, the), NO conjunctions if avoidable
   - NO dates unless newsworthy
   - Examples: "federal-judge-blocks-trump-fund" "apple-q3-revenue-iphone-slump"
   - BAD: "the-big-news-from-yesterday-about-something"

6. KEYWORDS (extracted for tagging):
   - 4-8 lowercase comma-separated keywords/phrases this article targets
   - Mix of head (broad) + long-tail (specific) keywords
   - Examples: "tesla earnings, q3 2026 revenue, elon musk, electric vehicles, ev market"

═══════════════════════════════════════════════════════════════════
OUTPUT — STRICT JSON ONLY (no markdown fences, no preamble):
═══════════════════════════════════════════════════════════════════
{
  "title": "55-65 char headline with primary keyword at start",
  "slug": "url-friendly-slug-with-keywords",
  "summary": "Two sentences with specific facts (140-200 chars)",
  "content": "<p>Opening with primary keyword in first 100 words.</p><h2>Subhead with keyword variation</h2><p>...</p><h2>Another subhead</h2><p>...</p><ul><li>Bullet point if relevant</li></ul><p>Closing forward-looking statement.</p>",
  "seoTitle": "50-60 char SEO title, front-loaded keyword",
  "metaDescription": "150-160 char meta description with keyword in first 120 chars + benefit/hook + soft CTA",
  "keywords": "comma, separated, primary, and long-tail, keywords",
  "imagePrompt": "Detailed photojournalism scene: subjects, setting, lighting, mood. NO text, logos, watermarks IN the image. Real-photo aesthetic.",
  "topic": "${topic}",
  "source": "${useWebSearch ? "Full URL of the source article" : "Written from knowledge"}"
}

═══════════════════════════════════════════════════════════════════
Today: ${today}
═══════════════════════════════════════════════════════════════════
Write a publication-grade, SEO-optimized news article. Be specific. Be factual. Be Google-worthy.`;

    const userPrompt = `Write a ${wordLimit}-word news article about: ${topic}\nReturn JSON only.`;

    /* Call AI */
    console.log(`🧠 Calling ${provider}...`);
    const aiStart = Date.now();
    let aiResult;
    if (provider === "anthropic") {
      aiResult = await callClaude(model, systemPrompt, userPrompt, useWebSearch);
    } else if (provider === "openai") {
      aiResult = await callOpenAI(model, systemPrompt, userPrompt);
    } else {
      aiResult = await callGroq(model, systemPrompt, userPrompt);
    }
    console.log(`   ✓ AI done in ${((Date.now() - aiStart) / 1000).toFixed(1)}s · ${aiResult.inputTokens}→${aiResult.outputTokens} tokens`);

    /* Parse */
    let parsed;
    try {
      parsed = extractJson(aiResult.text);
    } catch (e) {
      throw new Error(`JSON parse failed: ${e.message}\nRaw: ${aiResult.text.slice(0, 300)}`);
    }
    if (!parsed.title || !parsed.content || !parsed.imagePrompt) {
      throw new Error("AI response missing required fields");
    }

    /* Generate image */
    console.log(`🎨 Generating image (${imageModel})...`);
    const imgStart = Date.now();
    const featuredImage = await generateImage(imageModel, parsed.imagePrompt);
    console.log(`   ✓ Image done in ${((Date.now() - imgStart) / 1000).toFixed(1)}s`);

    /* Find author + category */
    const author = await prisma.user.findFirst();
    if (!author) throw new Error("No user in DB");
    let category = await prisma.category.findFirst({ where: { slug: "news" } });
    if (!category) category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: { name: "News", slug: "news", color: "#3b82f6", emoji: "📰" },
      });
    }

    /* Unique slug */
    let baseSlug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.title);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.post.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${++counter}`;
    }

    /* Save */
    const post = await prisma.post.create({
      data: {
        title: parsed.title,
        slug: uniqueSlug,
        summary: parsed.summary || parsed.title,
        content: parsed.content,
        featuredImage,
        seoTitle: parsed.seoTitle || parsed.title,
        metaDescription: parsed.metaDescription || parsed.summary || "",
        keywords: parsed.keywords || "",
        status: "published",
        publishedAt: new Date(),
        authorId: author.id,
        categoryId: category.id,
        isAgentPost: true,
        imagePrompt: parsed.imagePrompt,
        imageStatus: "done",
      },
    });

    await prisma.agentLog.create({
      data: { model, status: "success", title: post.title },
    });

    // Instant Bing/Yandex indexing
    await pingIndexNow(`/${post.slug}`);

    /* Log usage */
    if (aiResult.inputTokens > 0) {
      await prisma.aIUsage.create({
        data: {
          provider,
          model,
          purpose: "post",
          inputTokens: aiResult.inputTokens,
          outputTokens: aiResult.outputTokens,
          totalTokens: aiResult.inputTokens + aiResult.outputTokens,
          costUsd: 0, // rough — not tracked precisely here
          durationMs: Date.now() - startTime,
          success: true,
        },
      });
    }

    const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ SUCCESS in ${totalSec}s`);
    console.log(`   Title: ${post.title}`);
    console.log(`   URL:   /news/${post.slug}`);
    console.log(`   Image: ${featuredImage}`);
    if (parsed.source) console.log(`   Source: ${parsed.source}`);
  } catch (error) {
    console.error(`\n❌ FAILED: ${error.message}`);
    try {
      await prisma.agentLog.create({
        data: { model: "unknown", status: "error", error: error.message },
      });
    } catch {}
  }
}

/* ─── Entry point ─── */

// Run-once mode: pass --once or set RUN_ONCE=1
const runOnce =
  process.argv.includes("--once") || process.env.RUN_ONCE === "1";

/**
 * Fetches the next-run interval from the DB.
 * Returns minutes. Default 60 if not set.
 */
async function getIntervalMinutes() {
  try {
    const s = await prisma.agentSettings.findUnique({
      where: { id: "singleton" },
    });
    return Math.max(1, s?.postIntervalMinutes || 60);
  } catch {
    return 60;
  }
}

/**
 * Checks if agent is enabled in DB.
 * Worker pauses if disabled — no posts created.
 */
async function isEnabled() {
  try {
    const s = await prisma.agentSettings.findUnique({
      where: { id: "singleton" },
    });
    return !!s?.enabled;
  } catch {
    return false;
  }
}

/**
 * Get the timestamp of the last agent-generated post.
 * Used to calculate when the next post is due.
 */
async function getLastAgentPostTime() {
  try {
    const last = await prisma.post.findFirst({
      where: { isAgentPost: true },
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true },
    });
    return last?.publishedAt?.getTime() ?? 0;
  } catch {
    return 0;
  }
}

let lastEnabledLogState = null; // dedupe enabled/disabled state logs

/* ─── Generation Job Processor ─── */

/**
 * Process ONE pending manual-generation job (from frontend New Post AI flow).
 * Returns true if a job was processed, false if none were pending.
 */
async function processOneGenerationJob() {
  // Atomically grab the next pending job and mark it running
  // Use a transaction-ish update to avoid double-processing in case multiple
  // workers run (we only have 1, but safe pattern anyway)
  const job = await prisma.generationJob.findFirst({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
  });

  if (!job) return false;

  // Lock by marking running
  const locked = await prisma.generationJob.updateMany({
    where: { id: job.id, status: "pending" },
    data: { status: "running", startedAt: new Date() },
  });
  if (locked.count === 0) return true; // someone else grabbed it

  const jobStart = Date.now();
  console.log(`\n[${new Date().toISOString()}] 📥 Picked up job ${job.id} [${job.jobType || "article"}]`);
  console.log(`   Context: "${job.context.slice(0, 80)}..."`);
  console.log(`   Model: ${job.provider}/${job.model}, words: ${job.wordLimit}, image: ${job.generateImage}`);

  // Branch to custom-page processor if this is a custom-page job
  if (job.jobType === "custom_page") {
    return processCustomPageJob(job, jobStart);
  }

  try {
    const minWords = Math.max(200, job.wordLimit - 100);
    const maxWords = job.wordLimit + 100;
    const today = new Date().toISOString().split("T")[0];

    const systemPrompt = `You are a SENIOR NEWS JOURNALIST + EXPERT SEO WRITER for TruthStrike24, an independent investigative news outlet.

PRIMARY GOAL: Produce a news article that ranks on Google AND reads like real journalism.

TASK: ${job.useWebSearch && job.provider === "anthropic" ? "Use web_search to find a real recent story related to the brief" : "Write a comprehensive, factual article based on the brief"}.

═══════════════════════════════════════════════════════════════════
ARTICLE CONTENT RULES
═══════════════════════════════════════════════════════════════════
LENGTH: ${minWords}-${maxWords} words (target ${job.wordLimit}).
- Include REAL named people, organizations, specific dates, exact statistics, dollar amounts
- Include DIRECT QUOTES from named sources (in quotation marks)
- NO filler: never write "experts say" without naming them
- NO repetition. Every paragraph adds NEW information.

CONTENT STRUCTURE (critical for SEO):
- Opening paragraph: HOOK + answer the 5 Ws (who, what, when, where, why) in the first 100 words
- Primary keyword MUST appear in the first 100 words AND in the first sentence
- Use 2-4 H2 subheadings (<h2> tags) to break up content — each H2 should contain a related keyword variation
- Bullet lists (<ul><li>) where appropriate to win featured snippets
- Strong, journalistic prose. Short sentences. Active voice.
- Close with a forward-looking statement or implication

═══════════════════════════════════════════════════════════════════
SEO FIELD RULES — FOLLOW EXACTLY
═══════════════════════════════════════════════════════════════════

1. TITLE (the headline shown on the site):
   - 55-65 characters MAX
   - Contains the PRIMARY KEYWORD at the start
   - Specific names, numbers, or "How/Why/What" hooks
   - Compelling, factual, NOT clickbait
   - Title case

2. SEO TITLE (the <title> tag for Google):
   - 50-60 characters MAX (Google truncates around 60)
   - Identical to title IF title ≤ 60 chars, otherwise shorter rewrite
   - End with " | TruthStrike24" ONLY if total is still ≤ 60 chars
   - Front-load the primary keyword

3. META DESCRIPTION (Google search result snippet):
   - 150-160 characters EXACTLY (Google truncates 160)
   - Contains primary keyword in first 120 chars
   - Compelling — answers "why click?"
   - Includes a benefit, statistic, or hook
   - Ends with a soft CTA: "Read more.", "Full report.", "What it means."
   - Active voice. Present tense.

4. SUMMARY (article subhead/preview):
   - 140-200 characters
   - Two complete sentences with SPECIFIC FACTS
   - First sentence: what happened (5 Ws condensed)
   - Second sentence: significance/scope/next step
   - NOT identical to meta description

5. SLUG (URL):
   - Lowercase, hyphen-separated, 4-7 words MAX
   - Includes 2-3 primary keywords
   - NO articles (a, an, the)

6. KEYWORDS (extracted for tagging):
   - 4-8 lowercase comma-separated keywords/phrases this article targets
   - Mix of head (broad) + long-tail (specific)

═══════════════════════════════════════════════════════════════════
OUTPUT — STRICT JSON ONLY (no markdown fences, no preamble):
═══════════════════════════════════════════════════════════════════
{
  "title": "55-65 char headline with primary keyword at start",
  "slug": "url-friendly-slug-with-keywords",
  "summary": "Two sentences with specific facts (140-200 chars)",
  "content": "<p>Opening with primary keyword in first 100 words.</p><h2>Subhead with keyword variation</h2><p>...</p><h2>Another subhead</h2><p>...</p><ul><li>Bullet point if relevant</li></ul><p>Closing forward-looking statement.</p>",
  "seoTitle": "50-60 char SEO title, front-loaded keyword",
  "metaDescription": "150-160 char meta description with keyword in first 120 chars + benefit/hook + soft CTA",
  "keywords": "comma, separated, primary, and long-tail, keywords",
  "imagePrompt": "Detailed photojournalism scene: subjects, setting, lighting, mood. NO text, logos, watermarks IN the image. Real-photo aesthetic.",
  "source": "${job.useWebSearch ? "URL of source article" : "Written from knowledge"}"
}

Today: ${today}`;

    const userPrompt = `Article brief: ${job.context}\n\nWrite the full article. Return JSON only.`;

    console.log(`🧠 Calling ${job.provider}...`);
    const aiStart = Date.now();
    let aiResult;
    if (job.provider === "anthropic") {
      aiResult = await callClaude(job.model, systemPrompt, userPrompt, job.useWebSearch);
    } else if (job.provider === "openai") {
      aiResult = await callOpenAI(job.model, systemPrompt, userPrompt);
    } else {
      aiResult = await callGroq(job.model, systemPrompt, userPrompt);
    }
    console.log(`   ✓ AI done in ${((Date.now() - aiStart) / 1000).toFixed(1)}s · ${aiResult.inputTokens}→${aiResult.outputTokens} tokens`);

    let parsed;
    try {
      parsed = extractJson(aiResult.text);
    } catch (e) {
      throw new Error(`JSON parse failed: ${e.message}`);
    }
    if (!parsed.title || !parsed.content) {
      throw new Error("AI response missing title or content");
    }

    let imageUrl = "";
    if (job.generateImage && parsed.imagePrompt) {
      console.log(`🎨 Generating image (${job.imageModel})...`);
      const imgStart = Date.now();
      try {
        imageUrl = await generateImage(job.imageModel, parsed.imagePrompt);
        console.log(`   ✓ Image done in ${((Date.now() - imgStart) / 1000).toFixed(1)}s`);
      } catch (imgErr) {
        console.error(`   ⚠ Image gen failed: ${imgErr.message}`);
        // Continue without image — job still completes
      }
    }

    const totalMs = Date.now() - jobStart;

    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "done",
        resultJson: JSON.stringify(parsed),
        imageUrl: imageUrl || null,
        inputTokens: aiResult.inputTokens,
        outputTokens: aiResult.outputTokens,
        durationMs: totalMs,
        completedAt: new Date(),
      },
    });

    // Track in AIUsage
    if (aiResult.inputTokens > 0) {
      await prisma.aIUsage.create({
        data: {
          provider: job.provider,
          model: job.model,
          purpose: "manual_post",
          inputTokens: aiResult.inputTokens,
          outputTokens: aiResult.outputTokens,
          totalTokens: aiResult.inputTokens + aiResult.outputTokens,
          costUsd: 0,
          durationMs: totalMs,
          success: true,
        },
      });
    }

    console.log(`✅ Job ${job.id} complete in ${(totalMs / 1000).toFixed(1)}s · "${parsed.title}"`);
  } catch (error) {
    console.error(`❌ Job ${job.id} failed: ${error.message}`);
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        errorMsg: error.message.slice(0, 1000),
        completedAt: new Date(),
        durationMs: Date.now() - jobStart,
      },
    });
  }

  return true;
}

/* ─── Custom-page job processor ─── */

// Minimal map of theme key -> category for prompt context.
// Keep in sync with lib/designs.ts. If a key is missing, defaults to "investigation".
const THEME_CATEGORY = {
  "scam-alert": "investigation",
  "fraud-radar": "investigation",
  "cyber-forensic": "investigation",
  "dark-intel": "investigation",
  "exposure-white": "investigation",
  "luxe-gold": "promotional",
  "fresh-gradient": "promotional",
  "neon-promo": "promotional",
  "clean-minimal": "promotional",
  "bold-impact": "promotional",
  "tech-review": "review",
  "verdict-green": "review",
  "deep-analysis": "review",
  "trust-score": "review",
  "compare-split": "review",
  "press-navy": "editorial",
  "case-study": "editorial",
  "annual-report": "editorial",
  "creative-studio": "editorial",
  "data-driven": "editorial",
};

function layoutGuidanceFor(category) {
  switch (category) {
    case "investigation":
      return "evidence, stats, verdict, timeline, quote, banner, highlight, text";
    case "promotional":
      return "banner, highlight, full-image, stats, text, grid";
    case "review":
      return "text, image-left, image-right, stats, verdict, quote";
    case "editorial":
      return "text, quote, timeline, grid, image-left, image-right";
    default:
      return "text, highlight, quote, stats";
  }
}

async function processCustomPageJob(job, jobStart) {
  try {
    const category = THEME_CATEGORY[job.themeKey] || "investigation";
    const layoutHints = layoutGuidanceFor(category);

    const systemPrompt = `You are a senior content designer creating a polished single-page landing/report site for TruthStrike24.

GOAL: Produce STRICT JSON for a single page. The page uses a "${job.themeKey || "scam-alert"}" theme (category: ${category}).

LAYOUT TYPES AVAILABLE (use the right ones for this category — favor: ${layoutHints}):
- "text": standard paragraph block
- "image-left" / "image-right": side-by-side image + text (image optional, can be left as "")
- "full-image": large showcase image with caption
- "highlight": glassy callout card with accent border, good for key claims
- "evidence": evidence list — use <hr> separators between items, each item with <strong>Title</strong> then description
- "stats": numbers row — use <p><strong>$2.5M</strong> Amount Lost</p><p><strong>1,200+</strong> Victims</p> format (pairs of number + label)
- "quote": large pull-quote (body is the quote text; title is attribution like "Jane Doe — CEO")
- "timeline": dated event row (title is date/event, body describes what happened)
- "verdict": final ruling card — title like "VERDICT: SCAM" or "VERDICT: LEGIT" triggers red/green styling
- "grid": multi-step or 2-column — use <hr> to separate items, optionally <strong>Step Title</strong> per item
- "banner": bold full-width CTA banner in accent color

SECTION TITLE CONVENTION: Use "LABEL|Heading" to render a small uppercase label above the heading.
  Example: "BACKGROUND|What Is BlockLender.io?" → small "BACKGROUND" pill + "What Is BlockLender.io?" h3.
  If no pipe, the whole string is the heading.

OUTPUT — STRICT JSON ONLY (no markdown fences, no preamble):
{
  "title": "Internal/admin title — short",
  "slug": "url-friendly-slug",
  "headline": "Big hero headline (typed out on load — keep it punchy, < 90 chars)",
  "subheadline": "Pill badge text above headline (e.g. INVESTIGATION REPORT, EXCLUSIVE REVIEW)",
  "ctaText": "Optional CTA button label (or empty string)",
  "ctaUrl": "Optional CTA url (or empty string)",
  "logoUrl": "",
  "metaTitle": "SEO title under 60 chars",
  "metaDesc": "Meta description under 155 chars",
  "heroImagePrompt": "Photojournalism scene for hero — vivid, specific. NO TEXT/LOGOS/WATERMARKS in image.",
  "content": "<p>Optional short intro paragraph shown between hero and sections — can be empty string.</p>",
  "sections": [
    {
      "title": "LABEL|Section heading",
      "body": "<p>HTML body for this section</p>",
      "image": "",
      "layout": "one of: text | image-left | image-right | full-image | highlight | evidence | stats | quote | timeline | verdict | grid | banner"
    }
  ]
}

RULES:
- Produce 6–10 sections with a MIX of layouts appropriate to the "${category}" category.
- Use the pipe-label convention on most section titles.
- Body must be HTML (use <p>, <strong>, <em>, <ul>/<li>, <a href>, <hr> as needed).
- Sections marked "evidence", "grid" should contain multiple items separated by <hr>.
- Section "stats" body should be pairs of <p><strong>NUMBER</strong> Label</p>.
- Section "quote" body is plain text of the quote (will be italicized); title is the attribution.
- Leave section "image" as empty string unless you want a specific image — we only generate the HERO image.
- Output JSON ONLY. No commentary.`;

    const userPrompt = `Build a complete page about this brief:\n\n${job.context}\n\nReturn JSON only.`;

    console.log(`🧠 Calling ${job.provider} (custom_page)...`);
    const aiStart = Date.now();
    let aiResult;
    if (job.provider === "anthropic") {
      aiResult = await callClaude(job.model, systemPrompt, userPrompt, job.useWebSearch);
    } else if (job.provider === "openai") {
      aiResult = await callOpenAI(job.model, systemPrompt, userPrompt);
    } else {
      aiResult = await callGroq(job.model, systemPrompt, userPrompt);
    }
    console.log(`   ✓ AI done in ${((Date.now() - aiStart) / 1000).toFixed(1)}s · ${aiResult.inputTokens}→${aiResult.outputTokens} tokens`);

    let parsed;
    try {
      parsed = extractJson(aiResult.text);
    } catch (e) {
      throw new Error(`JSON parse failed: ${e.message}`);
    }
    if (!parsed.title || !parsed.headline) {
      throw new Error("AI response missing title or headline");
    }
    if (!Array.isArray(parsed.sections)) parsed.sections = [];

    // Normalize sections
    parsed.sections = parsed.sections.map((s) => ({
      title: String(s.title || ""),
      body: String(s.body || ""),
      image: String(s.image || ""),
      layout: String(s.layout || "text"),
    }));

    let imageUrl = "";
    if (job.generateImage && parsed.heroImagePrompt) {
      console.log(`🎨 Generating hero image (${job.imageModel})...`);
      const imgStart = Date.now();
      try {
        imageUrl = await generateImage(job.imageModel, parsed.heroImagePrompt);
        console.log(`   ✓ Hero image done in ${((Date.now() - imgStart) / 1000).toFixed(1)}s`);
        parsed.heroImage = imageUrl;
      } catch (imgErr) {
        console.error(`   ⚠ Hero image gen failed: ${imgErr.message}`);
      }
    }

    const totalMs = Date.now() - jobStart;

    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "done",
        resultJson: JSON.stringify(parsed),
        imageUrl: imageUrl || null,
        inputTokens: aiResult.inputTokens,
        outputTokens: aiResult.outputTokens,
        durationMs: totalMs,
        completedAt: new Date(),
      },
    });

    if (aiResult.inputTokens > 0) {
      await prisma.aIUsage.create({
        data: {
          provider: job.provider,
          model: job.model,
          purpose: "custom_page",
          inputTokens: aiResult.inputTokens,
          outputTokens: aiResult.outputTokens,
          totalTokens: aiResult.inputTokens + aiResult.outputTokens,
          costUsd: 0,
          durationMs: totalMs,
          success: true,
        },
      });
    }

    console.log(`✅ Custom-page job ${job.id} complete in ${(totalMs / 1000).toFixed(1)}s · "${parsed.title}"`);
  } catch (error) {
    console.error(`❌ Custom-page job ${job.id} failed: ${error.message}`);
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        errorMsg: error.message.slice(0, 1000),
        completedAt: new Date(),
        durationMs: Date.now() - jobStart,
      },
    });
  }
}

async function loop() {
  console.log(`\n🟢 Worker started. Polling DB every 60s for cron + every 5s for manual jobs.`);
  console.log(`   Toggle the Active switch in frontend admin to pause/resume.\n`);

  // On startup: report status, but DO NOT generate immediately.
  // The main loop below will check the interval and only post when due.
  try {
    const settings = await prisma.agentSettings.findUnique({
      where: { id: "singleton" },
    });
    if (settings?.enabled) {
      const intervalMin = Math.max(1, settings.postIntervalMinutes || 60);
      const lastPostMs = await getLastAgentPostTime();
      if (lastPostMs === 0) {
        console.log(`   (No previous posts found — first article will be generated on next tick)\n`);
      } else {
        const elapsedMin = (Date.now() - lastPostMs) / 60000;
        const remaining = intervalMin - elapsedMin;
        if (remaining <= 0) {
          console.log(`   ⚡ Last post was ${elapsedMin.toFixed(1)}min ago (>${intervalMin}min interval). Will generate on next tick.\n`);
        } else {
          console.log(`   ⏰ Next post in ${remaining.toFixed(1)}min · interval=${intervalMin}min\n`);
        }
      }
    } else {
      console.log(`   ⏸  Agent currently paused. Toggle ON in admin to resume.\n`);
    }
  } catch (e) {
    console.error(`   ⚠ Could not read settings on startup: ${e.message}\n`);
  }

  // Independent job-processing loop (runs in parallel with cron loop)
  // Polls every 5s for pending generation jobs from the frontend.
  (async function jobLoop() {
    while (true) {
      try {
        // Drain all pending jobs (could be multiple)
        let any = true;
        while (any) {
          any = await processOneGenerationJob();
        }
      } catch (e) {
        console.error("[job loop error]", e.message);
      }
      await new Promise((r) => setTimeout(r, 5 * 1000));
    }
  })();

  while (true) {
    // Sleep 60 seconds between checks
    await new Promise((r) => setTimeout(r, 60 * 1000));

    try {
      const settings = await prisma.agentSettings.findUnique({
        where: { id: "singleton" },
      });
      if (!settings) {
        console.log(`[${new Date().toISOString()}] ⚠ Settings row not found, retrying in 60s`);
        continue;
      }

      // Log enable/pause state changes (don't spam — only on change)
      if (lastEnabledLogState !== settings.enabled) {
        if (settings.enabled) {
          console.log(`\n[${new Date().toISOString()}] ▶ Agent RESUMED via frontend toggle`);
        } else {
          console.log(`\n[${new Date().toISOString()}] ⏸ Agent PAUSED via frontend toggle`);
        }
        lastEnabledLogState = settings.enabled;
      }

      if (!settings.enabled) {
        // Paused — log heartbeat every 10 minutes so user knows worker is alive
        const now = new Date();
        if (now.getMinutes() % 10 === 0) {
          console.log(`[${now.toISOString()}] ⏸  Paused (heartbeat). Toggle ON in admin to resume.`);
        }
        continue;
      }

      const intervalMin = Math.max(1, settings.postIntervalMinutes || 60);
      const lastPostMs = await getLastAgentPostTime();
      const elapsedMin = lastPostMs === 0 ? Infinity : (Date.now() - lastPostMs) / 60000;
      const remainingMin = intervalMin - elapsedMin;

      if (remainingMin <= 0) {
        // Time to post!
        console.log(`\n[${new Date().toISOString()}] ⚡ Interval elapsed (${elapsedMin === Infinity ? "first run" : elapsedMin.toFixed(1) + "min since last"}). Generating...`);
        await runAgent();
      } else {
        // Not yet time — log countdown every 5 minutes (not every minute, too noisy)
        const now = new Date();
        if (now.getMinutes() % 5 === 0) {
          console.log(`[${now.toISOString()}] ⏰ Next post in ${remainingMin.toFixed(1)}min · interval=${intervalMin}min · model=${settings.postProvider}/${settings.model}`);
        }
      }
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Loop error:`, err.message);
    }
  }
}

// Graceful shutdown so Pterodactyl Stop button works cleanly
process.on("SIGTERM", async () => {
  console.log("\n👋 SIGTERM received, shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGINT", async () => {
  console.log("\n👋 SIGINT received, shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

async function main() {
  if (runOnce) {
    await runAgent();
    await prisma.$disconnect();
    process.exit(0);
  } else {
    await loop();
  }
}

main().catch(async (e) => {
  console.error("[fatal]", e);
  await prisma.$disconnect();
  process.exit(1);
});
