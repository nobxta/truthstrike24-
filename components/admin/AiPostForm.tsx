"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  X,
  Globe,
  ImageIcon,
  Upload,
  Ban,
  ArrowLeft,
  RefreshCw,
  Send,
  Save,
  CalendarClock,
  Star,
  Wand2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import TiptapEditor from "./TiptapEditor";
import ImageUpload from "./ImageUpload";
import { PROVIDER_MODELS } from "@/lib/ai-providers";
import { IMAGE_MODELS } from "@/lib/image-gen";
import { slugify } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  emoji: string;
}
interface Tag {
  id: string;
  name: string;
  slug: string;
}
interface Props {
  categories: Category[];
  tags: Tag[];
}

type Provider = "anthropic" | "openai" | "groq";
type ImageStrategy = "ai" | "upload" | "none";
type Stage = "brief" | "draft";

/* ── Rough cost estimate for the brief panel ── */
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
const IMAGE_COST: Record<string, number> = {
  "wavespeed-ai/flux-dev": 0.025,
  "wavespeed-ai/flux-schnell": 0.003,
  "wavespeed-ai/flux-dev-ultra-fast": 0.018,
  "wavespeed-ai/flux-kontext-pro": 0.04,
  "wavespeed-ai/flux-kontext-max": 0.08,
  "wavespeed-ai/hidream-i1-full": 0.06,
  "wavespeed-ai/sdxl-lightning": 0.005,
};

function estimateCost(
  model: string,
  wordLimit: number,
  withImage: boolean,
  imageModel: string
): number {
  const p = PRICING[model] || { input: 1, output: 3 };
  const inTok = 800; // prompt + brief
  const outTok = Math.round(wordLimit * 1.4);
  const text = (inTok * p.input + outTok * p.output) / 1_000_000;
  const img = withImage ? IMAGE_COST[imageModel] ?? 0.025 : 0;
  return text + img;
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ");
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function AiPostForm({ categories, tags }: Props) {
  const router = useRouter();

  /* ── Brief inputs ── */
  const [context, setContext] = useState("");
  const [wordLimit, setWordLimit] = useState(600);
  const [provider, setProvider] = useState<Provider>("groq");
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [imageStrategy, setImageStrategy] = useState<ImageStrategy>("ai");
  const [imageModel, setImageModel] = useState("wavespeed-ai/flux-schnell");
  const [uploadedImage, setUploadedImage] = useState("");

  /* ── Stage + generated draft ── */
  const [stage, setStage] = useState<Stage>("brief");
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<"queued" | "running" | "done" | null>(null);
  const [regeneratingImage, setRegeneratingImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ── Draft state ── */
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isBreaking, setIsBreaking] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ── Derived ── */
  const providerModels = PROVIDER_MODELS[provider].models;
  const cost = useMemo(
    () =>
      estimateCost(model, wordLimit, imageStrategy === "ai", imageModel),
    [model, wordLimit, imageStrategy, imageModel]
  );
  const wordCount = useMemo(() => countWords(content), [content]);

  function onProviderChange(p: Provider) {
    setProvider(p);
    const first = PROVIDER_MODELS[p].models[0];
    setModel(first.id);
    if (p !== "anthropic") setUseWebSearch(false);
  }

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugEdited) setSlug(slugify(v));
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  /* ── Job queue helpers ── */

  /** Submit a generation job and poll until done. Throws on failure. */
  async function runGenerationJob(opts: {
    generateImage: boolean;
    onStatus?: (s: "queued" | "running" | "done") => void;
  }): Promise<{
    title: string;
    slug?: string;
    summary?: string;
    content: string;
    seoTitle?: string;
    metaDescription?: string;
    imagePrompt?: string;
    source?: string;
    imageUrl?: string;
  }> {
    // 1. Create job (instant return)
    const createRes = await fetch("/api/posts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context,
        wordLimit,
        provider,
        model,
        useWebSearch,
        generateImage: opts.generateImage,
        imageModel,
      }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) {
      throw new Error(createData.error || "Failed to create job");
    }
    const jobId = createData.jobId;
    opts.onStatus?.("queued");

    // 2. Poll every 2 seconds until done/failed (max 120s)
    const deadline = Date.now() + 120 * 1000;
    let lastStatus = "pending";
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`/api/posts/generate/${jobId}`);
      const pollData = await pollRes.json();
      if (!pollRes.ok) {
        throw new Error(pollData.error || "Poll failed");
      }
      if (pollData.status === "running" && lastStatus !== "running") {
        opts.onStatus?.("running");
        lastStatus = "running";
      }
      if (pollData.status === "done") {
        opts.onStatus?.("done");
        const article = pollData.article || {};
        return {
          title: String(article.title || ""),
          slug: String(article.slug || ""),
          summary: String(article.summary || ""),
          content: String(article.content || ""),
          seoTitle: String(article.seoTitle || ""),
          metaDescription: String(article.metaDescription || ""),
          imagePrompt: String(article.imagePrompt || ""),
          source: String(article.source || ""),
          imageUrl: pollData.imageUrl || undefined,
        };
      }
      if (pollData.status === "failed") {
        throw new Error(pollData.error || "Generation failed on VPS");
      }
    }
    throw new Error("Timed out after 2 minutes — check VPS worker logs");
  }

  /* ── Generate article + (maybe) image ── */
  async function handleGenerate() {
    setError("");
    setSuccess("");
    if (!context.trim()) {
      setError("Describe what the news is about");
      return;
    }
    setGenerating(true);
    setGenStatus("queued");
    try {
      const data = await runGenerationJob({
        generateImage: imageStrategy === "ai",
        onStatus: (s) => setGenStatus(s),
      });
      setTitle(data.title);
      setSlug(slugify(data.slug || data.title));
      setSlugEdited(false);
      setSummary(data.summary || "");
      setContent(data.content);
      setSeoTitle(data.seoTitle || data.title);
      setMetaDescription(data.metaDescription || data.summary || "");
      setImagePrompt(data.imagePrompt || "");
      setSourceUrl(data.source || "");
      if (imageStrategy === "ai") setFeaturedImage(data.imageUrl || "");
      if (imageStrategy === "upload") setFeaturedImage(uploadedImage);
      if (imageStrategy === "none") setFeaturedImage("");
      setSuccess("Article generated");
      setTimeout(() => setSuccess(""), 3000);
      setStage("draft");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
    setGenerating(false);
    setGenStatus(null);
  }

  /* ── Regenerate just the article (keep settings/brief) ── */
  async function handleRegenerateArticle() {
    setError("");
    setGenerating(true);
    setGenStatus("queued");
    try {
      const data = await runGenerationJob({
        generateImage: false, // keep existing image
        onStatus: (s) => setGenStatus(s),
      });
      setTitle(data.title);
      setSlug(slugify(data.slug || data.title));
      setSlugEdited(false);
      setSummary(data.summary || "");
      setContent(data.content);
      setSeoTitle(data.seoTitle || data.title);
      setMetaDescription(data.metaDescription || data.summary || "");
      setImagePrompt(data.imagePrompt || imagePrompt);
      setSourceUrl(data.source || "");
      setSuccess("Article regenerated");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regeneration failed");
    }
    setGenerating(false);
    setGenStatus(null);
  }

  /* ── Regenerate just the image with the (possibly edited) prompt ── */
  async function handleRegenerateImage() {
    setError("");
    if (!imagePrompt.trim()) {
      setError("Image prompt is empty");
      return;
    }
    setRegeneratingImage(true);
    try {
      const res = await fetch("/api/posts/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt, model: imageModel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Image generation failed");
        setRegeneratingImage(false);
        return;
      }
      setFeaturedImage(data.url);
      setSuccess("Image regenerated");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Network error while generating image");
    }
    setRegeneratingImage(false);
  }

  /* ── Save (publish / draft / schedule) ── */
  async function handleSave(action: "publish" | "draft" | "schedule") {
    setError("");
    if (!title.trim()) return setError("Title is required");
    if (!content.trim()) return setError("Content is required");
    if (!categoryId) return setError("Select a category");
    if (action === "schedule" && !scheduledDate)
      return setError("Pick a date and time to schedule");

    setSaving(true);
    const payload = {
      title,
      slug,
      summary,
      content,
      featuredImage,
      seoTitle: seoTitle || title,
      metaDescription: metaDescription || summary,
      status: action === "publish" ? "published" : "draft",
      publishedAt:
        action === "schedule"
          ? new Date(scheduledDate).toISOString()
          : undefined,
      categoryId,
      tagIds: selectedTagIds,
      isBreaking,
    };

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        setSaving(false);
        return;
      }
      if (action === "publish" && data.slug) {
        router.push(`/news/${data.slug}`);
      } else {
        router.push("/admin/posts");
      }
      router.refresh();
    } catch {
      setError("Network error while saving");
      setSaving(false);
    }
  }

  /* ───────────────────────── Render ───────────────────────── */

  return (
    <div className="p-6">
      {/* Toasts */}
      {error && (
        <div className="bg-red-50 text-accent text-sm px-4 py-2 rounded border border-red-200 mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded border border-green-200 mb-4 flex items-center gap-2">
          <CheckCircle2 size={14} />
          <span>{success}</span>
        </div>
      )}

      {stage === "brief" ? (
        <BriefPanel
          context={context}
          setContext={setContext}
          wordLimit={wordLimit}
          setWordLimit={setWordLimit}
          provider={provider}
          onProviderChange={onProviderChange}
          model={model}
          setModel={setModel}
          providerModels={providerModels}
          useWebSearch={useWebSearch}
          setUseWebSearch={setUseWebSearch}
          imageStrategy={imageStrategy}
          setImageStrategy={setImageStrategy}
          imageModel={imageModel}
          setImageModel={setImageModel}
          uploadedImage={uploadedImage}
          setUploadedImage={setUploadedImage}
          generating={generating}
          genStatus={genStatus}
          cost={cost}
          onGenerate={handleGenerate}
        />
      ) : (
        <div className="space-y-4">
          {/* Top toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStage("brief")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <ArrowLeft size={14} />
              Back to brief
            </button>
            <button
              onClick={handleRegenerateArticle}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50"
            >
              {generating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Wand2 size={14} />
              )}
              Regenerate article
            </button>
            <div className="flex-1" />
            <span className="text-xs text-gray-500">
              {wordCount} words · {provider} · {model}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: editable article */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-lg font-serif focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-400 mr-1">
                    truthstrike24.com/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(slugify(e.target.value));
                      setSlugEdited(true);
                    }}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Summary
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <TiptapEditor content={content} onChange={setContent} />
              </div>

              {sourceUrl && (
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <ExternalLink size={12} />
                  Source:{" "}
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-navy hover:underline truncate max-w-md"
                  >
                    {sourceUrl}
                  </a>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={() => setShowSeo(!showSeo)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  {showSeo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  SEO Settings
                </button>
                {showSeo && (
                  <div className="mt-3 space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SEO Title
                      </label>
                      <input
                        type="text"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        maxLength={60}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {seoTitle.length}/60
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Description
                      </label>
                      <textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        rows={2}
                        maxLength={160}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {metaDescription.length}/160
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: image + publish */}
            <div className="space-y-4">
              {/* Image card */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <h3 className="font-semibold text-sm text-navy flex items-center gap-1.5">
                  <ImageIcon size={14} />
                  Featured Image
                </h3>

                {imageStrategy === "upload" ? (
                  <ImageUpload
                    value={featuredImage}
                    onChange={setFeaturedImage}
                  />
                ) : imageStrategy === "none" ? (
                  <div className="text-xs text-gray-500 p-4 bg-gray-50 rounded border border-dashed border-gray-300 text-center">
                    No featured image
                  </div>
                ) : regeneratingImage ? (
                  <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                    <Loader2
                      size={28}
                      className="animate-spin text-gray-400"
                    />
                  </div>
                ) : featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featuredImage}
                    alt="Featured"
                    className="w-full aspect-video object-cover rounded"
                  />
                ) : (
                  <div className="aspect-video bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                    No image yet
                  </div>
                )}

                {imageStrategy === "ai" && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Image prompt (edit before regenerating)
                      </label>
                      <textarea
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        rows={3}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-navy resize-none"
                      />
                    </div>
                    <button
                      onClick={handleRegenerateImage}
                      disabled={regeneratingImage || !imagePrompt.trim()}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50"
                    >
                      {regeneratingImage ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      Regenerate Image
                    </button>
                  </>
                )}
              </div>

              {/* Publish card */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <h3 className="font-semibold text-sm text-navy">Publish</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSave("publish")}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <Send size={14} />
                    Publish Now
                  </button>
                  <button
                    onClick={() => handleSave("draft")}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                  >
                    <Save size={14} />
                    Save as Draft
                  </button>
                  <button
                    onClick={() => setShowScheduler(!showScheduler)}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <CalendarClock size={14} />
                    Schedule
                  </button>
                </div>
                {showScheduler && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="block text-xs font-medium text-gray-500">
                      Publish at
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                    <button
                      onClick={() => handleSave("schedule")}
                      disabled={saving || !scheduledDate}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <CalendarClock size={14} />
                      Confirm Schedule
                    </button>
                  </div>
                )}
              </div>

              {/* Breaking */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setIsBreaking(!isBreaking)}
                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                      isBreaking
                        ? "bg-accent text-white"
                        : "border-2 border-gray-300"
                    }`}
                  >
                    {isBreaking && <Star size={12} fill="white" />}
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    Breaking / Hot News
                  </span>
                </label>
              </div>

              {/* Category */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-sm text-navy mb-3">
                  Category
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                        categoryId === cat.id
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={cat.id}
                        checked={categoryId === cat.id}
                        onChange={() => setCategoryId(cat.id)}
                        className="accent-navy"
                      />
                      <span
                        className="w-5 h-5 rounded text-white text-xs flex items-center justify-center"
                        style={{ backgroundColor: cat.color }}
                      >
                        {cat.emoji}
                      </span>
                      <span className="text-sm">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-sm text-navy mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedTagIds.includes(tag.id)
                          ? "bg-navy text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Brief panel subcomponent ───────────────────────── */

interface BriefPanelProps {
  context: string;
  setContext: (v: string) => void;
  wordLimit: number;
  setWordLimit: (n: number) => void;
  provider: Provider;
  onProviderChange: (p: Provider) => void;
  model: string;
  setModel: (m: string) => void;
  providerModels: { id: string; name: string; desc: string }[];
  useWebSearch: boolean;
  setUseWebSearch: (b: boolean) => void;
  imageStrategy: ImageStrategy;
  setImageStrategy: (s: ImageStrategy) => void;
  imageModel: string;
  setImageModel: (m: string) => void;
  uploadedImage: string;
  setUploadedImage: (s: string) => void;
  generating: boolean;
  genStatus: "queued" | "running" | "done" | null;
  cost: number;
  onGenerate: () => void;
}

function BriefPanel(p: BriefPanelProps) {
  const modelLabel =
    PROVIDER_MODELS[p.provider].models.find((m) => m.id === p.model)?.name ||
    p.model;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            What's the news about?
          </label>
          <textarea
            value={p.context}
            onChange={(e) => p.setContext(e.target.value)}
            rows={6}
            placeholder="e.g., New iPhone 17 release with detachable camera module, leaked on Reddit yesterday..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Try: "A magnitude 7.2 earthquake struck Tokyo..." or paste a tweet,
            headline, or a few sentences.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Word limit */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">
                Word Limit
              </label>
              <span className="text-xs font-mono text-gray-500">
                {p.wordLimit}
              </span>
            </div>
            <input
              type="range"
              min={200}
              max={1500}
              step={50}
              value={p.wordLimit}
              onChange={(e) => p.setWordLimit(parseInt(e.target.value))}
              className="w-full accent-navy"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>200</span>
              <span>1500</span>
            </div>
          </div>

          {/* Web search */}
          <div className="flex items-end">
            <div className="w-full">
              <label
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  p.provider === "anthropic"
                    ? "border-gray-300 hover:bg-gray-50 cursor-pointer"
                    : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                }`}
                title={
                  p.provider !== "anthropic"
                    ? "Web search is only available with Anthropic"
                    : ""
                }
              >
                <input
                  type="checkbox"
                  disabled={p.provider !== "anthropic"}
                  checked={p.useWebSearch}
                  onChange={(e) => p.setUseWebSearch(e.target.checked)}
                  className="accent-navy"
                />
                <Globe size={14} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Web Search
                </span>
                <span className="text-[10px] text-gray-400 ml-auto">
                  Anthropic only
                </span>
              </label>
            </div>
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Provider
            </label>
            <select
              value={p.provider}
              onChange={(e) => p.onProviderChange(e.target.value as Provider)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white"
            >
              {(Object.keys(PROVIDER_MODELS) as Provider[]).map((k) => (
                <option key={k} value={k}>
                  {PROVIDER_MODELS[k].label}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Model
            </label>
            <select
              value={p.model}
              onChange={(e) => p.setModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white"
            >
              {p.providerModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.desc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Image strategy */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-navy">Featured Image</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <ImageStrategyOption
            active={p.imageStrategy === "ai"}
            onClick={() => p.setImageStrategy("ai")}
            icon={<Sparkles size={16} />}
            label="AI Generate"
            desc="WaveSpeed"
          />
          <ImageStrategyOption
            active={p.imageStrategy === "upload"}
            onClick={() => p.setImageStrategy("upload")}
            icon={<Upload size={16} />}
            label="Upload"
            desc="Manual"
          />
          <ImageStrategyOption
            active={p.imageStrategy === "none"}
            onClick={() => p.setImageStrategy("none")}
            icon={<Ban size={16} />}
            label="No Image"
            desc="Skip"
          />
        </div>

        {p.imageStrategy === "ai" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Image Model
            </label>
            <select
              value={p.imageModel}
              onChange={(e) => p.setImageModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white"
            >
              {IMAGE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.desc}
                </option>
              ))}
            </select>
          </div>
        )}

        {p.imageStrategy === "upload" && (
          <ImageUpload value={p.uploadedImage} onChange={p.setUploadedImage} />
        )}
      </div>

      {/* Cost + Generate */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="text-xs text-gray-500 flex-1">
          Estimated:{" "}
          <span className="font-mono text-gray-700">
            ~${p.cost.toFixed(4)}
          </span>{" "}
          with {modelLabel}
          {p.imageStrategy === "ai" && " + image"}
        </div>
        <button
          onClick={p.onGenerate}
          disabled={p.generating || !p.context.trim()}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {p.generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {p.genStatus === "queued" && "Queued — VPS picking up..."}
              {p.genStatus === "running" && "Generating on VPS..."}
              {p.genStatus === "done" && "Finalizing..."}
              {!p.genStatus && "Queueing job..."}
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Draft
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ImageStrategyOption({
  active,
  onClick,
  icon,
  label,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 p-3 rounded-lg border-2 text-left transition-colors ${
        active
          ? "border-navy bg-navy/5"
          : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
    >
      <div
        className={`flex items-center gap-1.5 ${
          active ? "text-navy" : "text-gray-600"
        }`}
      >
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <span className="text-xs text-gray-500">{desc}</span>
    </button>
  );
}
