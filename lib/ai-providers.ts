/**
 * Multi-provider AI helper — supports Anthropic, OpenAI, and Groq.
 */

import { prisma } from "@/lib/db";

type Provider = "anthropic" | "openai" | "groq" | "nvidia";

interface AIRequestParams {
  provider: Provider;
  model: string;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  purpose?: string; // "post" | "chat_enhance" | "auto_reply"
}

/* ── Provider model options ── */

export const PROVIDER_MODELS: Record<Provider, { label: string; models: { id: string; name: string; desc: string }[] }> = {
  anthropic: {
    label: "Anthropic (Claude)",
    models: [
      { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", desc: "Latest, best quality" },
      { id: "claude-sonnet-4-5-20250514", name: "Claude Sonnet 4.5", desc: "Previous gen, fast" },
      { id: "claude-haiku-4-5-20250514", name: "Claude Haiku 4.5", desc: "Fastest, cheapest" },
      { id: "claude-opus-4-0-20250514", name: "Claude Opus 4", desc: "Most capable, expensive" },
    ],
  },
  openai: {
    label: "OpenAI (GPT)",
    models: [
      { id: "gpt-4o", name: "GPT-4o", desc: "Best overall" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", desc: "Fast, affordable" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", desc: "128k context" },
      { id: "gpt-4.1", name: "GPT-4.1", desc: "Latest flagship" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", desc: "Latest mini" },
      { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", desc: "Fastest, cheapest" },
      { id: "o4-mini", name: "o4 Mini", desc: "Reasoning model" },
      { id: "o3", name: "o3", desc: "Advanced reasoning" },
      { id: "o3-mini", name: "o3 Mini", desc: "Compact reasoning" },
    ],
  },
  groq: {
    label: "Groq (Ultra Fast)",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", desc: "Best quality on Groq" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", desc: "Ultra fast" },
      { id: "llama-3.2-90b-vision-preview", name: "Llama 3.2 90B Vision", desc: "Multimodal" },
      { id: "llama-3.2-11b-vision-preview", name: "Llama 3.2 11B Vision", desc: "Small multimodal" },
      { id: "llama-3.2-3b-preview", name: "Llama 3.2 3B", desc: "Tiny, instant" },
      { id: "llama-3.2-1b-preview", name: "Llama 3.2 1B", desc: "Smallest" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", desc: "MoE, 32k context" },
      { id: "gemma2-9b-it", name: "Gemma 2 9B", desc: "Google, compact" },
      { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 70B", desc: "Reasoning" },
      { id: "qwen-qwq-32b", name: "Qwen QWQ 32B", desc: "Alibaba reasoning" },
      { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B", desc: "Latest Llama 4" },
      { id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "Llama 4 Maverick 17B", desc: "Latest Llama 4 MoE" },
    ],
  },
  nvidia: {
    label: "NVIDIA NIM (free 40 RPM)",
    models: [
      { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B", desc: "OpenAI's open 120B — high quality" },
      { id: "deepseek-ai/deepseek-v4-pro", name: "DeepSeek V4 Pro", desc: "Strong reasoning + factual" },
      { id: "moonshotai/kimi-k2.6", name: "Kimi K2.6", desc: "Long-context, thinking mode" },
      { id: "mistralai/mistral-medium-3.5-128b", name: "Mistral Medium 3.5", desc: "Excellent prose" },
      { id: "z-ai/glm-5.1", name: "GLM 5.1", desc: "Thinking-mode reasoning" },
    ],
  },
};

/* ── Pricing per 1M tokens (USD) ── */

const PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  "claude-opus-4-0-20250514": { input: 15, output: 75 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-sonnet-4-5-20250514": { input: 3, output: 15 },
  "claude-haiku-4-5-20250514": { input: 0.8, output: 4 },
  // OpenAI
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-4.1": { input: 2, output: 8 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1-nano": { input: 0.1, output: 0.4 },
  "o4-mini": { input: 1.1, output: 4.4 },
  "o3": { input: 2, output: 8 },
  "o3-mini": { input: 1.1, output: 4.4 },
  // Groq — free tier / very cheap
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
  // NVIDIA NIM — free dev tier (40 RPM)
  "openai/gpt-oss-120b": { input: 0, output: 0 },
  "deepseek-ai/deepseek-v4-pro": { input: 0, output: 0 },
  "moonshotai/kimi-k2.6": { input: 0, output: 0 },
  "mistralai/mistral-medium-3.5-128b": { input: 0, output: 0 },
  "z-ai/glm-5.1": { input: 0, output: 0 },
};

function calcCost(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model] || { input: 0, output: 0 };
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}

/* ── API call with usage tracking ── */

export async function callAI({
  provider,
  model,
  systemPrompt,
  userMessage,
  maxTokens = 1024,
  purpose = "other",
}: AIRequestParams): Promise<string> {
  const start = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  let result = "";
  let success = true;
  let errorMsg: string | undefined;

  try {
    switch (provider) {
      case "anthropic": {
        const r = await rawAnthropic(model, systemPrompt, userMessage, maxTokens);
        result = r.text;
        inputTokens = r.inputTokens;
        outputTokens = r.outputTokens;
        break;
      }
      case "openai": {
        const r = await rawOpenAI(model, systemPrompt, userMessage, maxTokens);
        result = r.text;
        inputTokens = r.inputTokens;
        outputTokens = r.outputTokens;
        break;
      }
      case "groq": {
        const r = await rawGroq(model, systemPrompt, userMessage, maxTokens);
        result = r.text;
        inputTokens = r.inputTokens;
        outputTokens = r.outputTokens;
        break;
      }
      case "nvidia": {
        const r = await rawNvidia(model, systemPrompt, userMessage, maxTokens);
        result = r.text;
        inputTokens = r.inputTokens;
        outputTokens = r.outputTokens;
        break;
      }
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (err) {
    success = false;
    errorMsg = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    const durationMs = Date.now() - start;
    const totalTokens = inputTokens + outputTokens;
    const costUsd = calcCost(model, inputTokens, outputTokens);

    // Log usage (fire-and-forget)
    prisma.aIUsage
      .create({
        data: {
          provider,
          model,
          purpose,
          inputTokens,
          outputTokens,
          totalTokens,
          costUsd,
          durationMs,
          success,
          error: errorMsg,
        },
      })
      .catch((e: unknown) => console.error("[Usage log error]", e));
  }

  return result;
}

/* ── Raw provider calls (return tokens) ── */

interface RawResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

async function rawAnthropic(model: string, sys: string, msg: string, max: number): Promise<RawResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: max, system: sys, messages: [{ role: "user", content: msg }] }),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const block = data.content?.[0];
  return {
    text: block?.type === "text" ? block.text : "",
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
  };
}

async function rawOpenAI(model: string, sys: string, msg: string, max: number): Promise<RawResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, max_tokens: max, messages: [{ role: "system", content: sys }, { role: "user", content: msg }] }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content || "",
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  };
}

async function rawGroq(model: string, sys: string, msg: string, max: number): Promise<RawResult> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, max_tokens: max, messages: [{ role: "system", content: sys }, { role: "user", content: msg }] }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content || "",
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  };
}

/**
 * NVIDIA NIM — OpenAI-compatible API at integrate.api.nvidia.com.
 * Free dev tier: 40 RPM. Models include OpenAI's GPT-OSS, DeepSeek V4 Pro,
 * Kimi K2.6, Mistral Medium 3.5, GLM 5.1, etc.
 *
 * All NVIDIA models share training-data-only knowledge — they have no live
 * web access. Use for evergreen content (how-to guides, technology
 * explainers, deep-dive analysis) NOT today's breaking news.
 */
async function rawNvidia(model: string, sys: string, msg: string, max: number): Promise<RawResult> {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) throw new Error("NVIDIA_API_KEY not set");

  // Some NVIDIA models (GLM, Kimi, DeepSeek V4) accept a chat_template_kwargs
  // flag to enable/disable thinking mode. We disable thinking by default so
  // responses are clean JSON or HTML without <thinking>...</thinking> blocks.
  const body: Record<string, unknown> = {
    model,
    max_tokens: max,
    temperature: 0.7,
    top_p: 1.0,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: msg },
    ],
  };
  // Disable thinking-mode prefix on models that support it
  if (
    model.startsWith("deepseek-ai/") ||
    model.startsWith("moonshotai/") ||
    model.startsWith("z-ai/")
  ) {
    body.chat_template_kwargs = { thinking: false };
  }

  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`NVIDIA ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content || "",
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  };
}
