/**
 * WaveSpeed.ai image generation helper.
 * Supports text-to-image and image-to-image (with reference) flux models.
 *
 * Docs: https://wavespeed.ai/docs
 * API:  https://api.wavespeed.ai/api/v3/{model}
 */

import { prisma } from "@/lib/db";
import { uploadToCloudinary } from "./cloudinary";

export interface ImageModel {
  id: string;
  name: string;
  desc: string;
  supportsReference: boolean;
}

export const IMAGE_MODELS: ImageModel[] = [
  {
    id: "wavespeed-ai/flux-dev",
    name: "FLUX.1 [dev]",
    desc: "High-quality 12B text-to-image",
    supportsReference: false,
  },
  {
    id: "wavespeed-ai/flux-schnell",
    name: "FLUX.1 [schnell]",
    desc: "Ultra-fast (4 steps), good quality",
    supportsReference: false,
  },
  {
    id: "wavespeed-ai/flux-dev-ultra-fast",
    name: "FLUX Dev Ultra Fast",
    desc: "Optimized FLUX dev, faster",
    supportsReference: false,
  },
  {
    id: "wavespeed-ai/flux-kontext-pro",
    name: "FLUX Kontext Pro",
    desc: "Image editing & reference (recommended)",
    supportsReference: true,
  },
  {
    id: "wavespeed-ai/flux-kontext-max",
    name: "FLUX Kontext Max",
    desc: "Highest quality with reference",
    supportsReference: true,
  },
  {
    id: "wavespeed-ai/hidream-i1-full",
    name: "HiDream-I1 Full",
    desc: "Premium quality, slower",
    supportsReference: false,
  },
  {
    id: "wavespeed-ai/sdxl-lightning",
    name: "SDXL Lightning",
    desc: "Fast Stable Diffusion XL",
    supportsReference: false,
  },
];

export interface GenerateImageParams {
  model: string;
  prompt: string;
  /** Optional reference image URL (only used by supportsReference models) */
  referenceImage?: string;
  /** Watermark URL to compose into the final image */
  watermarkUrl?: string;
  /** Aspect ratio (default 16:9 for news) */
  aspectRatio?: "1:1" | "16:9" | "4:3" | "3:2" | "9:16";
  /** Article topic — used for usage logging */
  purpose?: string;
}

export interface ImageResult {
  url: string;
  model: string;
  durationMs: number;
}

const WAVESPEED_BASE = "https://api.wavespeed.ai/api/v3";
const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 60; // ~90 seconds max

/* ── Helpers ── */

function arToSize(ar: string): { width: number; height: number } {
  switch (ar) {
    case "1:1":
      return { width: 1024, height: 1024 };
    case "16:9":
      return { width: 1344, height: 768 };
    case "4:3":
      return { width: 1152, height: 896 };
    case "3:2":
      return { width: 1216, height: 832 };
    case "9:16":
      return { width: 768, height: 1344 };
    default:
      return { width: 1344, height: 768 };
  }
}

async function pollResult(predictionId: string, apiKey: string): Promise<string> {
  const pollUrl = `${WAVESPEED_BASE}/predictions/${predictionId}/result`;

  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`WaveSpeed poll failed: ${res.status} ${await res.text()}`);
    }

    const json = await res.json();
    const data = json.data || json;
    const status = data.status;
    const outputs: string[] | undefined = data.outputs;
    const error = data.error;

    if (status === "completed" || status === "succeeded") {
      if (outputs && outputs.length > 0) return outputs[0];
      throw new Error("WaveSpeed completed with no outputs");
    }
    if (status === "failed") {
      throw new Error(`WaveSpeed failed: ${error || "unknown"}`);
    }
    // status === "created" or "processing" — keep polling
  }
  throw new Error("WaveSpeed timed out after ~90s");
}

/* ── Main: generate image via WaveSpeed ── */

export async function generateImage({
  model,
  prompt,
  referenceImage,
  watermarkUrl,
  aspectRatio = "16:9",
  purpose = "article",
}: GenerateImageParams): Promise<ImageResult> {
  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) throw new Error("WAVESPEED_API_KEY not set");

  const start = Date.now();
  const { width, height } = arToSize(aspectRatio);

  // Build URL based on model
  const url = `${WAVESPEED_BASE}/${model}`;

  // Decide if model supports reference image
  const modelMeta = IMAGE_MODELS.find((m) => m.id === model);
  const useReference =
    modelMeta?.supportsReference && (referenceImage || watermarkUrl);

  // Build the prompt — include watermark instruction if available
  let fullPrompt = prompt;
  if (watermarkUrl) {
    fullPrompt = `${prompt}. Remove any existing watermarks or text overlays. High quality, professional news photography style, sharp details, well-lit.`;
  } else {
    fullPrompt = `${prompt}. High quality, professional news photography style, sharp details, well-lit. No watermarks or text overlays.`;
  }

  // WaveSpeed body — schema varies slightly per model
  type WaveSpeedBody = {
    prompt: string;
    size?: string;
    width?: number;
    height?: number;
    aspect_ratio?: string;
    num_inference_steps?: number;
    guidance_scale?: number;
    seed?: number;
    image?: string;
    images?: string[];
  };

  const body: WaveSpeedBody = {
    prompt: fullPrompt,
    size: `${width}*${height}`,
    aspect_ratio: aspectRatio,
    num_inference_steps: model.includes("schnell") ? 4 : 28,
    guidance_scale: 3.5,
    seed: Math.floor(Math.random() * 2_147_483_647),
  };

  if (useReference) {
    // Kontext models accept `image` parameter for reference
    if (referenceImage) {
      body.image = referenceImage;
    } else if (watermarkUrl) {
      // Use watermark as a faint reference
      body.image = watermarkUrl;
    }
  }

  // Submit prediction
  const submitRes = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!submitRes.ok) {
    const errTxt = await submitRes.text();
    // Log to usage table as failed
    await logImageUsage({
      model,
      purpose,
      success: false,
      error: `WaveSpeed submit ${submitRes.status}: ${errTxt.slice(0, 300)}`,
      durationMs: Date.now() - start,
    });
    throw new Error(`WaveSpeed submit failed: ${submitRes.status} ${errTxt.slice(0, 300)}`);
  }

  const submitJson = await submitRes.json();
  const submitData = submitJson.data || submitJson;

  // If synchronous response with outputs, return immediately
  if (submitData.outputs && submitData.outputs.length > 0) {
    const rawUrl = submitData.outputs[0];
    const imageUrl = await uploadToCloudinary(rawUrl);
    const durationMs = Date.now() - start;
    await logImageUsage({
      model,
      purpose,
      success: true,
      durationMs,
    });
    return { url: imageUrl, model, durationMs };
  }

  // Otherwise, poll for the result
  const predictionId = submitData.id || submitJson.id;
  if (!predictionId) {
    throw new Error(`WaveSpeed: no prediction id in response: ${JSON.stringify(submitJson).slice(0, 300)}`);
  }

  try {
    const rawUrl = await pollResult(predictionId, apiKey);
    const imageUrl = await uploadToCloudinary(rawUrl);
    const durationMs = Date.now() - start;
    await logImageUsage({
      model,
      purpose,
      success: true,
      durationMs,
    });
    return { url: imageUrl, model, durationMs };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await logImageUsage({
      model,
      purpose,
      success: false,
      error: errorMsg,
      durationMs: Date.now() - start,
    });
    throw err;
  }
}

/* ── Log image generation to AIUsage table ── */

async function logImageUsage(args: {
  model: string;
  purpose: string;
  success: boolean;
  error?: string;
  durationMs: number;
}): Promise<void> {
  try {
    // Estimate cost roughly (WaveSpeed flux-dev ~$0.025/image)
    const costMap: Record<string, number> = {
      "wavespeed-ai/flux-dev": 0.025,
      "wavespeed-ai/flux-schnell": 0.003,
      "wavespeed-ai/flux-dev-ultra-fast": 0.018,
      "wavespeed-ai/flux-kontext-pro": 0.04,
      "wavespeed-ai/flux-kontext-max": 0.08,
      "wavespeed-ai/hidream-i1-full": 0.06,
      "wavespeed-ai/sdxl-lightning": 0.005,
    };
    const cost = args.success ? costMap[args.model] ?? 0.025 : 0;

    await prisma.aIUsage.create({
      data: {
        provider: "wavespeed",
        model: args.model,
        purpose: args.purpose,
        inputTokens: 0,
        outputTokens: 1, // 1 image = "1 output"
        totalTokens: 1,
        costUsd: cost,
        durationMs: args.durationMs,
        success: args.success,
        error: args.error,
      },
    });
  } catch (e) {
    console.error("[Image usage log error]", e);
  }
}
