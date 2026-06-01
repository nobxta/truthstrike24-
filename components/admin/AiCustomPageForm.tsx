"use client";

import { useEffect, useMemo, useState } from "react";

const JOB_STORAGE_KEY = "truthstrike-pending-custompage-job";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  Send,
  Save,
  Trash2,
  RefreshCw,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Globe,
  ImageIcon,
  Search,
  Megaphone,
  Star,
  FileText,
  Wand2,
  Layout as LayoutIcon,
  AlertTriangle,
} from "lucide-react";
import {
  DESIGNS,
  getDesign,
  type DesignTheme,
  type DesignCategory,
} from "@/lib/designs";
import { PROVIDER_MODELS } from "@/lib/ai-providers";
import { IMAGE_MODELS } from "@/lib/image-gen";
import { slugify } from "@/lib/utils";
import CustomPageRenderer, {
  type ContentSection,
} from "@/components/public/CustomPageRenderer";

type Stage = "theme" | "brief" | "loading" | "draft";
type Provider = "anthropic" | "openai" | "groq";
type GenStatus = "queued" | "running" | "image" | "done" | null;

const SECTION_LAYOUTS: { key: ContentSection["layout"]; label: string }[] = [
  { key: "text", label: "Text" },
  { key: "image-left", label: "Image Left" },
  { key: "image-right", label: "Image Right" },
  { key: "full-image", label: "Full Image" },
  { key: "highlight", label: "Highlight" },
  { key: "evidence", label: "Evidence" },
  { key: "stats", label: "Stats" },
  { key: "quote", label: "Quote" },
  { key: "timeline", label: "Timeline" },
  { key: "verdict", label: "Verdict" },
  { key: "grid", label: "Grid" },
  { key: "banner", label: "Banner" },
];

const CATEGORY_META: Record<
  DesignCategory,
  { label: string; icon: typeof Search }
> = {
  investigation: { label: "Investigation", icon: Search },
  promotional: { label: "Promotional", icon: Megaphone },
  review: { label: "Review", icon: Star },
  editorial: { label: "Editorial", icon: FileText },
};

const CATEGORY_ORDER: DesignCategory[] = [
  "investigation",
  "promotional",
  "review",
  "editorial",
];

interface GeneratedPage {
  title?: string;
  slug?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaUrl?: string;
  logoUrl?: string;
  metaTitle?: string;
  metaDesc?: string;
  content?: string;
  heroImage?: string;
  sections?: ContentSection[];
}

export default function AiCustomPageForm() {
  const router = useRouter();

  /* ── Stage ── */
  const [stage, setStage] = useState<Stage>("theme");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ── Theme selection ── */
  const [themeKey, setThemeKey] = useState<string>("scam-alert");

  /* ── Brief inputs ── */
  const [brief, setBrief] = useState("");
  const [attachments, setAttachments] = useState("");
  const [generateImage, setGenerateImage] = useState(true);
  const [imageModel, setImageModel] = useState("wavespeed-ai/flux-schnell");
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [useWebSearch, setUseWebSearch] = useState(false);

  /* ── Loading state ── */
  const [genStatus, setGenStatus] = useState<GenStatus>(null);

  /* ── Draft state ── */
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [content, setContent] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [customCss, setCustomCss] = useState("");
  const [showSeo, setShowSeo] = useState(false);

  const [saving, setSaving] = useState(false);
  const [regenImage, setRegenImage] = useState(false);

  const providerModels = PROVIDER_MODELS[provider].models;

  const designsByCategory = useMemo(() => {
    const grouped: Record<DesignCategory, DesignTheme[]> = {
      investigation: [],
      promotional: [],
      review: [],
      editorial: [],
    };
    for (const d of DESIGNS) grouped[d.category].push(d);
    return grouped;
  }, []);

  const selectedDesign = useMemo(() => getDesign(themeKey), [themeKey]);

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

  function resetAll() {
    setStage("theme");
    setBrief("");
    setAttachments("");
    setTitle("");
    setSlug("");
    setSlugEdited(false);
    setHeadline("");
    setSubheadline("");
    setContent("");
    setHeroImage("");
    setLogoUrl("");
    setCtaText("");
    setCtaUrl("");
    setSections([]);
    setMetaTitle("");
    setMetaDesc("");
    setCustomCss("");
    setError("");
    setSuccess("");
  }

  /* ── Generate ── */
  async function handleGenerate() {
    setError("");
    if (!brief.trim()) {
      setError("Please describe what this page is about");
      return;
    }
    setStage("loading");
    setGenStatus("queued");

    try {
      const createRes = await fetch("/api/custom-pages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief,
          attachments,
          themeKey,
          generateImage,
          imageModel,
          provider,
          model,
          useWebSearch,
        }),
      });
      const createData = (await createRes.json()) as {
        jobId?: string;
        error?: string;
      };
      if (!createRes.ok || !createData.jobId) {
        throw new Error(createData.error || "Failed to create job");
      }
      const jobId = createData.jobId;
      // Persist jobId so a page refresh can resume polling
      saveJobId(jobId);
      await pollUntilDone(jobId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setStage("brief");
      setGenStatus(null);
      clearJobId();
    }
  }

  /** Persist/recover jobId across page reloads */
  function saveJobId(id: string) {
    try {
      localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify({ id, themeKey, savedAt: Date.now() }));
    } catch { /* */ }
  }
  function clearJobId() {
    try { localStorage.removeItem(JOB_STORAGE_KEY); } catch { /* */ }
  }

  /** Polls a jobId until done/failed/timeout. Used both for fresh submissions and recovery. */
  async function pollUntilDone(jobId: string) {
    const deadline = Date.now() + 240 * 1000; // 4 min buffer
    let lastStatus = "pending";
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`/api/custom-pages/generate/${jobId}`);
      const pollData = (await pollRes.json()) as {
        status: string;
        page?: GeneratedPage;
        imageUrl?: string | null;
        themeKey?: string;
        error?: string;
      };
      if (!pollRes.ok) throw new Error(pollData.error || "Poll failed");

      if (pollData.status === "running" && lastStatus !== "running") {
        setGenStatus("running");
        lastStatus = "running";
      }
      if (pollData.status === "done") {
        setGenStatus("done");
        // If the saved themeKey differs (recovered job), switch the theme
        if (pollData.themeKey && pollData.themeKey !== themeKey) {
          setThemeKey(pollData.themeKey);
        }
        applyGenerated(pollData.page || {}, pollData.imageUrl || "");
        setStage("draft");
        setSuccess("Page generated");
        setTimeout(() => setSuccess(""), 3000);
        clearJobId();
        return;
      }
      if (pollData.status === "failed") {
        clearJobId();
        throw new Error(pollData.error || "Generation failed on VPS");
      }
    }
    throw new Error("Timed out after 4 minutes — check VPS worker logs");
  }

  /* ── On mount: auto-resume an in-progress job from localStorage ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = localStorage.getItem(JOB_STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw) as { id?: string; themeKey?: string; savedAt?: number };
        if (!saved.id) return;
        // Expire after 30 minutes
        if (saved.savedAt && Date.now() - saved.savedAt > 30 * 60 * 1000) {
          clearJobId();
          return;
        }
        // Probe the job status first
        const probe = await fetch(`/api/custom-pages/generate/${saved.id}`);
        if (!probe.ok) {
          clearJobId();
          return;
        }
        const probeData = (await probe.json()) as {
          status: string;
          page?: GeneratedPage;
          imageUrl?: string | null;
          themeKey?: string;
        };
        if (cancelled) return;

        if (probeData.status === "done") {
          if (probeData.themeKey) setThemeKey(probeData.themeKey);
          applyGenerated(probeData.page || {}, probeData.imageUrl || "");
          setStage("draft");
          setSuccess("Recovered your previously generated page");
          setTimeout(() => setSuccess(""), 4000);
          clearJobId();
          return;
        }
        if (probeData.status === "pending" || probeData.status === "running") {
          if (saved.themeKey) setThemeKey(saved.themeKey);
          setStage("loading");
          setGenStatus(probeData.status === "running" ? "running" : "queued");
          setSuccess("Resuming in-progress generation...");
          setTimeout(() => setSuccess(""), 3000);
          try {
            await pollUntilDone(saved.id);
          } catch (e) {
            if (!cancelled) {
              setError(e instanceof Error ? e.message : "Failed");
              setStage("brief");
              setGenStatus(null);
            }
          }
          return;
        }
        // Failed or unknown — discard
        clearJobId();
      } catch {
        clearJobId();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyGenerated(page: GeneratedPage, imageUrl: string) {
    const t = page.title || "";
    setTitle(t);
    const s = page.slug?.trim() ? slugify(page.slug) : slugify(t);
    setSlug(s);
    setSlugEdited(false);
    setHeadline(page.headline || "");
    setSubheadline(page.subheadline || "");
    setContent(page.content || "");
    setHeroImage(imageUrl || page.heroImage || "");
    setLogoUrl(page.logoUrl || "");
    setCtaText(page.ctaText || "");
    setCtaUrl(page.ctaUrl || "");
    setSections(Array.isArray(page.sections) ? page.sections : []);
    setMetaTitle(page.metaTitle || t);
    setMetaDesc(page.metaDesc || "");
  }

  /* ── Section helpers ── */
  function addSection() {
    setSections((prev) => [
      ...prev,
      { title: "", body: "<p></p>", image: "", layout: "text" },
    ]);
  }
  function updateSection<K extends keyof ContentSection>(
    idx: number,
    key: K,
    value: ContentSection[K]
  ) {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [key]: value } : s))
    );
  }
  function removeSection(idx: number) {
    setSections((prev) => prev.filter((_, i) => i !== idx));
  }
  function moveSection(idx: number, dir: -1 | 1) {
    setSections((prev) => {
      const arr = [...prev];
      const t = idx + dir;
      if (t < 0 || t >= arr.length) return arr;
      [arr[idx], arr[t]] = [arr[t], arr[idx]];
      return arr;
    });
  }

  /* ── Regenerate hero image ── */
  async function handleRegenerateHero() {
    setError("");
    setRegenImage(true);
    try {
      const prompt = `${brief}. Photojournalism scene, no text or logos.`;
      const res = await fetch("/api/posts/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: imageModel }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Image generation failed");
      }
      setHeroImage(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image regeneration failed");
    }
    setRegenImage(false);
  }

  /* ── Save ── */
  async function handleSave(publish: boolean) {
    setError("");
    if (!title.trim()) return setError("Title is required");
    setSaving(true);
    try {
      const payload = {
        title,
        slug,
        headline,
        subheadline,
        content,
        design: themeKey,
        heroImage,
        image2: "",
        logoUrl,
        ctaText,
        ctaUrl,
        sections: JSON.stringify(sections),
        published: publish,
        metaTitle: metaTitle || title,
        metaDesc,
        customCss,
      };
      const res = await fetch("/api/custom-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { slug?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to save");
      if (publish && data.slug) {
        router.push(`/p/${data.slug}`);
      } else {
        router.push("/admin/custom-pages");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
    setSaving(false);
  }

  /* ── Live preview page object ── */
  const previewPage = useMemo(
    () => ({
      id: "preview",
      title: title || "Untitled",
      slug: slug || "preview",
      headline,
      subheadline,
      content,
      heroImage,
      image2: "",
      logoUrl,
      ctaText,
      ctaUrl,
      sections: JSON.stringify(sections),
      customCss,
    }),
    [
      title,
      slug,
      headline,
      subheadline,
      content,
      heroImage,
      logoUrl,
      ctaText,
      ctaUrl,
      sections,
      customCss,
    ]
  );

  return (
    <div className="p-6">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded border border-red-200 mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded border border-green-200 mb-4 flex items-center gap-2">
          <Check size={14} />
          <span>{success}</span>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 text-xs font-medium">
        <StepDot active={stage === "theme"} done={stage !== "theme"} label="1. Theme" />
        <span className="text-gray-300">·</span>
        <StepDot
          active={stage === "brief"}
          done={stage === "loading" || stage === "draft"}
          label="2. Brief"
        />
        <span className="text-gray-300">·</span>
        <StepDot
          active={stage === "loading"}
          done={stage === "draft"}
          label="3. Generate"
        />
        <span className="text-gray-300">·</span>
        <StepDot active={stage === "draft"} done={false} label="4. Edit & Publish" />
      </div>

      {/* ── STAGE: THEME ── */}
      {stage === "theme" && (
        <div className="max-w-5xl mx-auto">
          {/* Recent Drafts panel */}
          <DraftsPanel
            onResumeJob={(jobId, themeKeyFromJob) => {
              if (themeKeyFromJob) setThemeKey(themeKeyFromJob);
              setStage("loading");
              setGenStatus("running");
              setSuccess("Loading saved draft...");
              setTimeout(() => setSuccess(""), 2500);
              (async () => {
                try {
                  const r = await fetch(`/api/custom-pages/generate/${jobId}`);
                  const d = await r.json();
                  if (!r.ok || d.status !== "done") {
                    throw new Error(d.error || "Draft no longer available");
                  }
                  if (d.themeKey) setThemeKey(d.themeKey);
                  applyGenerated(d.page || {}, d.imageUrl || "");
                  setStage("draft");
                  setGenStatus(null);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Failed");
                  setStage("theme");
                  setGenStatus(null);
                }
              })();
            }}
            onOpenDraft={(slug, pageId) => {
              router.push(`/admin/custom-pages/${pageId}/edit`);
              void slug;
            }}
          />

          <h2 className="text-lg font-bold text-navy mb-1">Pick a theme</h2>
          <p className="text-sm text-gray-500 mb-5">
            Choose the visual style for your page. The AI will tailor the
            content to match this category.
          </p>
          <div className="space-y-6">
            {CATEGORY_ORDER.map((cat) => {
              const themes = designsByCategory[cat];
              if (!themes.length) return null;
              const meta = CATEGORY_META[cat];
              const CatIcon = meta.icon;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <CatIcon size={14} className="text-gray-500" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {meta.label} · {themes.length} themes
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {themes.map((d) => (
                      <ThemeCard
                        key={d.key}
                        design={d}
                        selected={themeKey === d.key}
                        onClick={() => setThemeKey(d.key)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStage("brief")}
              disabled={!themeKey}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-navy text-white hover:bg-navy/90 disabled:opacity-50"
            >
              Continue
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE: BRIEF ── */}
      {stage === "brief" && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => setStage("theme")}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={14} />
              Back to themes
            </button>
          </div>

          <div
            className="rounded-lg p-3 flex items-center gap-3"
            style={{
              backgroundColor: selectedDesign.preview.bg,
              border: `1px solid ${selectedDesign.preview.accent}40`,
            }}
          >
            <div
              className="w-8 h-8 rounded-md"
              style={{ backgroundColor: selectedDesign.preview.accent }}
            />
            <div className="flex-1">
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: selectedDesign.preview.accent }}
              >
                {selectedDesign.category}
              </p>
              <p className="text-sm font-semibold" style={{ color: "#fff" }}>
                {selectedDesign.name}
              </p>
            </div>
            <button
              onClick={() => setStage("theme")}
              className="text-xs text-white/70 hover:text-white underline"
            >
              Change
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                What is this page about?
              </label>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={5}
                placeholder='e.g. "Investigate BlockLender.io scam — report the fake team, fund theft, and timeline of events."'
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Additional context / notes / known facts (optional)
              </label>
              <textarea
                value={attachments}
                onChange={(e) => setAttachments(e.target.value)}
                rows={4}
                placeholder="Paste URLs, quotes, dates, dollar amounts, names, screenshots context — anything to ground the AI."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => onProviderChange(e.target.value as Provider)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white"
                >
                  {(Object.keys(PROVIDER_MODELS) as Provider[]).map((k) => (
                    <option key={k} value={k}>
                      {PROVIDER_MODELS[k].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white"
                >
                  {providerModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  generateImage
                    ? "border-navy bg-navy/5"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={generateImage}
                  onChange={(e) => setGenerateImage(e.target.checked)}
                  className="accent-navy"
                />
                <ImageIcon size={14} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Generate hero image
                </span>
              </label>

              <label
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors ${
                  provider === "anthropic"
                    ? "border-gray-300 hover:bg-gray-50 cursor-pointer"
                    : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={provider !== "anthropic"}
                  checked={useWebSearch}
                  onChange={(e) => setUseWebSearch(e.target.checked)}
                  className="accent-navy"
                />
                <Globe size={14} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Use web search
                </span>
                <span className="text-[10px] text-gray-400 ml-auto">
                  Anthropic only
                </span>
              </label>
            </div>

            {generateImage && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Image model
                </label>
                <select
                  value={imageModel}
                  onChange={(e) => setImageModel(e.target.value)}
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
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={!brief.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Sparkles size={16} />
              Generate Page
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE: LOADING ── */}
      {stage === "loading" && (
        <div className="max-w-md mx-auto py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
            <Loader2 size={28} className="animate-spin text-orange-600" />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">
            {genStatus === "queued" && "Queued — VPS picking up..."}
            {genStatus === "running" && "Generating content..."}
            {genStatus === "image" && "Generating hero image..."}
            {genStatus === "done" && "Finalizing..."}
            {!genStatus && "Starting..."}
          </h3>
          <p className="text-sm text-gray-500">
            This typically takes 30–60 seconds for a full page with hero image.
          </p>
        </div>
      )}

      {/* ── STAGE: DRAFT ── */}
      {stage === "draft" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStage("brief")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <ArrowLeft size={14} />
              Back to brief
            </button>
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100"
            >
              <Trash2 size={14} />
              Discard & restart
            </button>
            <div className="flex-1" />
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Publish
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* LEFT — editable form */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <h3 className="text-sm font-bold text-navy">Page basics</h3>
                <Field label="Title (admin label)">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </Field>
                <Field label="Slug">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-400 mr-1">/p/</span>
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
                </Field>
                <Field label="Subheadline (pill above headline)">
                  <input
                    type="text"
                    value={subheadline}
                    onChange={(e) => setSubheadline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </Field>
                <Field label="Hero headline">
                  <textarea
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CTA text">
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </Field>
                  <Field label="CTA url">
                    <input
                      type="text"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </Field>
                </div>
                <Field label="Logo URL">
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </Field>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <h3 className="text-sm font-bold text-navy flex items-center gap-1.5">
                  <ImageIcon size={14} />
                  Hero image
                </h3>
                <input
                  type="text"
                  value={heroImage}
                  onChange={(e) => setHeroImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
                {heroImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroImage}
                    alt="Hero"
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                )}
                <button
                  onClick={handleRegenerateHero}
                  disabled={regenImage}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50"
                >
                  {regenImage ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Regenerate hero image
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <Field label="Intro content (HTML, optional)">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    placeholder="<p>Short intro between hero and sections...</p>"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-navy resize-y"
                  />
                </Field>
              </div>

              {/* Sections */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-navy flex items-center gap-1.5">
                    <LayoutIcon size={14} />
                    Sections ({sections.length})
                  </h3>
                  <button
                    onClick={addSection}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-navy text-white hover:bg-navy/90"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                </div>

                {sections.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">
                    No sections yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sections.map((sec, idx) => (
                      <SectionEditor
                        key={idx}
                        index={idx}
                        section={sec}
                        total={sections.length}
                        onChange={(k, v) => updateSection(idx, k, v)}
                        onRemove={() => removeSection(idx)}
                        onMove={(dir) => moveSection(idx, dir)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* SEO */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setShowSeo(!showSeo)}
                  className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-gray-700"
                >
                  SEO & custom CSS
                  {showSeo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showSeo && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                    <Field label="Meta title">
                      <input
                        type="text"
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        maxLength={60}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                      />
                    </Field>
                    <Field label="Meta description">
                      <textarea
                        value={metaDesc}
                        onChange={(e) => setMetaDesc(e.target.value)}
                        rows={2}
                        maxLength={160}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
                      />
                    </Field>
                    <Field label="Custom CSS">
                      <textarea
                        value={customCss}
                        onChange={(e) => setCustomCss(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-navy resize-y"
                      />
                    </Field>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — live preview */}
            <div className="xl:sticky xl:top-4 xl:self-start">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Live preview
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Scaled · scrollable
                  </span>
                </div>
                <div
                  className="relative overflow-auto"
                  style={{ height: "75vh", background: selectedDesign.preview.bg }}
                >
                  <div
                    style={{
                      transform: "scale(0.55)",
                      transformOrigin: "top left",
                      width: "calc(100% / 0.55)",
                    }}
                  >
                    <CustomPageRenderer
                      page={previewPage}
                      design={selectedDesign}
                    />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                <AlertTriangle size={11} />
                Preview is scaled to 55%. Live page will render at full size.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ─── */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function StepDot({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full ${
        active
          ? "bg-orange-100 text-orange-700"
          : done
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-500"
      }`}
    >
      {done ? <Check size={11} className="inline mr-1" /> : null}
      {label}
    </span>
  );
}

function ThemeCard({
  design,
  selected,
  onClick,
}: {
  design: DesignTheme;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden transition-all duration-200 text-left ${
        selected
          ? "ring-2 ring-orange-500 ring-offset-2 scale-[1.02]"
          : "ring-1 ring-gray-200 hover:ring-gray-300 hover:scale-[1.01]"
      }`}
    >
      <div
        className="h-24 flex flex-col items-center justify-center p-2"
        style={{ backgroundColor: design.preview.bg }}
      >
        <div
          className="w-12 h-1 rounded-full mb-1.5"
          style={{ backgroundColor: design.preview.accent }}
        />
        <div
          className="w-8 h-0.5 rounded-full opacity-40"
          style={{ backgroundColor: design.preview.text }}
        />
        <div
          className="w-10 h-0.5 rounded-full opacity-30 mt-0.5"
          style={{ backgroundColor: design.preview.text }}
        />
        <div
          className="w-6 h-3 rounded-sm mt-1.5"
          style={{ backgroundColor: design.preview.accent }}
        />
      </div>
      <div className="bg-white px-2 py-1.5 flex items-center gap-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: design.preview.accent }}
        />
        <p className="text-[11px] font-semibold text-gray-700 truncate">
          {design.name}
        </p>
      </div>
      {selected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
          <Check size={11} className="text-white" />
        </div>
      )}
    </button>
  );
}

function SectionEditor({
  index,
  section,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  index: number;
  section: ContentSection;
  total: number;
  onChange: <K extends keyof ContentSection>(
    key: K,
    value: ContentSection[K]
  ) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const showImage = !["text", "quote", "banner", "stats"].includes(
    section.layout || "text"
  );

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          #{index + 1}
        </span>
        <select
          value={section.layout || "text"}
          onChange={(e) =>
            onChange("layout", e.target.value as ContentSection["layout"])
          }
          className="px-2 py-1 border border-gray-300 rounded text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-navy"
        >
          {SECTION_LAYOUTS.map((l) => (
            <option key={l.key} value={l.key}>
              {l.label}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={() => onMove(-1)}
          disabled={index === 0}
          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
          title="Move up"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
          title="Move down"
        >
          <ChevronDown size={14} />
        </button>
        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-600"
          title="Remove"
        >
          <X size={14} />
        </button>
      </div>
      <div className="space-y-2">
        <input
          type="text"
          value={section.title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder='Title (use "LABEL|Heading" for a pill above the heading)'
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-navy"
        />
        <textarea
          value={section.body}
          onChange={(e) => onChange("body", e.target.value)}
          rows={4}
          placeholder="<p>HTML body...</p>"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-navy resize-y"
        />
        {showImage && (
          <input
            type="text"
            value={section.image || ""}
            onChange={(e) => onChange("image", e.target.value)}
            placeholder="Section image URL (optional)"
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-navy"
          />
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Recent Drafts panel — shows recoverable items
   ────────────────────────────────────────────────────────────── */

interface DraftJob {
  type: "job";
  jobId: string;
  title: string;
  preview: string;
  themeKey: string | null;
  heroImage: string | null;
  completedAt: string;
  context: string;
  provider: string;
  model: string;
  tokens: number;
  cost: number;
}
interface DraftPage {
  type: "page";
  pageId: string;
  slug: string;
  title: string;
  preview: string;
  themeKey: string;
  heroImage: string | null;
  updatedAt: string;
}

function DraftsPanel({
  onResumeJob,
  onOpenDraft,
}: {
  onResumeJob: (jobId: string, themeKey: string | null) => void;
  onOpenDraft: (slug: string, pageId: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<DraftJob[]>([]);
  const [drafts, setDrafts] = useState<DraftPage[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/custom-pages/drafts");
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = (await res.json()) as { jobs: DraftJob[]; drafts: DraftPage[] };
        if (cancelled) return;
        setJobs(data.jobs || []);
        setDrafts(data.drafts || []);
      } catch {
        /* */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = jobs.length + drafts.length;
  if (loading) {
    return (
      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-2 text-xs text-gray-400">
        <Loader2 size={12} className="animate-spin" />
        Loading recent drafts...
      </div>
    );
  }
  if (total === 0) return null;

  function timeAgo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  return (
    <div className="mb-6 bg-blue-50/50 border border-blue-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-blue-50 transition-colors"
      >
        <FileText size={14} className="text-blue-600" />
        <span className="text-sm font-semibold text-gray-800">
          Recent Drafts ({total})
        </span>
        <span className="text-xs text-gray-500">
          {jobs.length > 0 && `${jobs.length} generated`}
          {jobs.length > 0 && drafts.length > 0 && " · "}
          {drafts.length > 0 && `${drafts.length} saved`}
        </span>
        <span className="ml-auto">
          {collapsed ? (
            <ChevronDown size={14} className="text-gray-400" />
          ) : (
            <ChevronUp size={14} className="text-gray-400" />
          )}
        </span>
      </button>

      {!collapsed && (
        <div className="border-t border-blue-200 max-h-96 overflow-y-auto">
          {/* Generated jobs (not yet published) */}
          {jobs.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-blue-100/40 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Generated by AI — click to load
              </div>
              {jobs.map((j) => (
                <button
                  key={j.jobId}
                  onClick={() => onResumeJob(j.jobId, j.themeKey)}
                  className="w-full px-4 py-3 flex items-center gap-3 border-t border-blue-100/50 hover:bg-white text-left transition-colors"
                >
                  {j.heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={j.heroImage}
                      alt=""
                      className="w-14 h-9 rounded object-cover border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-9 rounded bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                      <ImageIcon size={14} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800 truncate">
                      {j.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                      <span>{j.themeKey}</span>
                      <span>·</span>
                      <span>{timeAgo(j.completedAt)}</span>
                      {j.cost > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-amber-600 font-semibold">
                            ${j.cost.toFixed(3)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Saved CustomPage drafts (published=false) */}
          {drafts.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-amber-50 border-t border-blue-100/50 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Saved drafts — click to edit
              </div>
              {drafts.map((d) => (
                <button
                  key={d.pageId}
                  onClick={() => onOpenDraft(d.slug, d.pageId)}
                  className="w-full px-4 py-3 flex items-center gap-3 border-t border-blue-100/50 hover:bg-white text-left transition-colors"
                >
                  {d.heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={d.heroImage}
                      alt=""
                      className="w-14 h-9 rounded object-cover border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-9 rounded bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                      <ImageIcon size={14} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800 truncate">
                      {d.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                      <span>{d.themeKey}</span>
                      <span>·</span>
                      <span>/p/{d.slug}</span>
                      <span>·</span>
                      <span>{timeAgo(d.updatedAt)}</span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
