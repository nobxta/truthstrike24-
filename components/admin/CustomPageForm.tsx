"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Eye,
  Globe,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
  Check,
  Image,
  Link2,
  Type,
  Code,
  ArrowLeft,
  Plus,
  GripVertical,
  X,
  Layout,
  AlignLeft,
  ImageIcon,
  Columns,
  AlertTriangle,
  Shield,
  BarChart3,
  Quote,
  Clock,
  CheckCircle,
  LayoutGrid,
  Megaphone,
  Search,
  Star,
  FileText,
} from "lucide-react";
import { DESIGNS, type DesignTheme, type DesignCategory } from "@/lib/designs";
import Link from "next/link";
import type { ContentSection } from "@/components/public/CustomPageRenderer";

interface CustomPageData {
  id?: string;
  title: string;
  slug: string;
  headline: string;
  subheadline: string;
  content: string;
  design: string;
  heroImage: string;
  image2: string;
  logoUrl: string;
  ctaText: string;
  ctaUrl: string;
  sections: string;
  published: boolean;
  metaTitle: string;
  metaDesc: string;
  customCss: string;
}

interface Props {
  initialData?: CustomPageData;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SECTION_LAYOUTS = [
  { key: "text", label: "Text", icon: AlignLeft },
  { key: "image-left", label: "Image Left", icon: Columns },
  { key: "image-right", label: "Image Right", icon: Columns },
  { key: "full-image", label: "Full Image", icon: ImageIcon },
  { key: "highlight", label: "Highlight", icon: AlertTriangle },
  { key: "evidence", label: "Evidence", icon: Shield },
  { key: "stats", label: "Stats Grid", icon: BarChart3 },
  { key: "quote", label: "Quote", icon: Quote },
  { key: "timeline", label: "Timeline", icon: Clock },
  { key: "verdict", label: "Verdict", icon: CheckCircle },
  { key: "grid", label: "Two Columns", icon: LayoutGrid },
  { key: "banner", label: "Banner", icon: Megaphone },
] as const;

const CATEGORY_META: Record<
  DesignCategory,
  { label: string; icon: typeof Search }
> = {
  investigation: { label: "INVESTIGATION", icon: Search },
  promotional: { label: "PROMOTIONAL", icon: Megaphone },
  review: { label: "REVIEW", icon: Star },
  editorial: { label: "EDITORIAL", icon: FileText },
};

const CATEGORY_ORDER: DesignCategory[] = [
  "investigation",
  "promotional",
  "review",
  "editorial",
];

function getPlaceholders(layout: string) {
  switch (layout) {
    case "evidence":
      return {
        title: "Evidence Title",
        body: "<p>Description of this evidence...</p>",
      };
    case "stats":
      return {
        title: "Section Title",
        body: "<p>$2.5M</p><p>Amount Lost</p><p>1,200+</p><p>Victims</p>",
      };
    case "quote":
      return {
        title: "Attribution — Source Name",
        body: "The actual quote text goes here...",
      };
    case "timeline":
      return {
        title: "Date or Event Name",
        body: "<p>What happened at this point...</p>",
      };
    case "verdict":
      return {
        title: "VERDICT: SCAM (or your conclusion)",
        body: "<p>Our final assessment...</p>",
      };
    case "banner":
      return {
        title: "Section Title",
        body: "<p>Bold announcement or call-to-action text</p>",
      };
    case "grid":
      return {
        title: "Section Title",
        body: "<p>Left column content</p><hr><p>Right column content</p>",
      };
    default:
      return {
        title: "Section Title",
        body: "<p>Section content — use HTML for formatting</p>",
      };
  }
}

function showImageField(layout: string) {
  return !["text", "quote", "banner", "stats"].includes(layout);
}

export default function CustomPageForm({ initialData }: Props) {
  const router = useRouter();
  const isEdit = !!initialData?.id;

  const [form, setForm] = useState<CustomPageData>({
    title: "",
    slug: "",
    headline: "",
    subheadline: "",
    content: "",
    design: "scam-alert",
    heroImage: "",
    image2: "",
    logoUrl: "",
    ctaText: "",
    ctaUrl: "",
    sections: "[]",
    published: false,
    metaTitle: "",
    metaDesc: "",
    customCss: "",
    ...initialData,
  });

  const [sections, setSections] = useState<ContentSection[]>(() => {
    try {
      return JSON.parse(initialData?.sections || "[]");
    } catch {
      return [];
    }
  });

  const [saving, setSaving] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [showCustomCss, setShowCustomCss] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!isEdit);

  useEffect(() => {
    if (autoSlug && form.title) {
      setForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
    }
  }, [form.title, autoSlug]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, sections: JSON.stringify(sections) }));
  }, [sections]);

  const updateField = useCallback(
    <K extends keyof CustomPageData>(key: K, value: CustomPageData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  function addSection() {
    setSections((prev) => [
      ...prev,
      { title: "", body: "", image: "", layout: "text" },
    ]);
  }

  function updateSection(idx: number, field: keyof ContentSection, value: string) {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  }

  function removeSection(idx: number) {
    setSections((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveSection(idx: number, dir: -1 | 1) {
    setSections((prev) => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  }

  async function handleSave(publish?: boolean) {
    setSaving(true);
    try {
      const payload = {
        ...form,
        sections: JSON.stringify(sections),
        published: publish !== undefined ? publish : form.published,
      };

      const url = isEdit
        ? `/api/custom-pages/${initialData!.id}`
        : "/api/custom-pages";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      const saved = await res.json();
      if (!isEdit) {
        router.push(`/admin/custom-pages/${saved.id}/edit`);
      } else {
        setForm((prev) => ({
          ...prev,
          published: payload.published,
          slug: saved.slug,
        }));
      }
    } catch {
      alert("Failed to save page");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this page permanently?")) return;
    await fetch(`/api/custom-pages/${initialData!.id}`, { method: "DELETE" });
    router.push("/admin/custom-pages");
  }

  const selectedDesign =
    DESIGNS.find((d) => d.key === form.design) || DESIGNS[0];

  const designsByCategory = useMemo(() => {
    const grouped: Record<DesignCategory, DesignTheme[]> = {
      investigation: [],
      promotional: [],
      review: [],
      editorial: [],
    };
    for (const d of DESIGNS) {
      if (grouped[d.category]) {
        grouped[d.category].push(d);
      }
    }
    return grouped;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/custom-pages"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">
                {isEdit ? "Edit Page" : "New Custom Page"}
              </h1>
              {form.slug && (
                <p className="text-[11px] text-gray-400">/p/{form.slug}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEdit && form.published && (
              <a
                href={`/p/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Eye size={14} />
                View Live
              </a>
            )}
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Globe size={14} />
              Publish
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Left — Main fields */}
          <div className="flex-1 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Page Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="BlockLender.io Scam Report"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-lg font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Slug
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 shrink-0">/p/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    updateField("slug", e.target.value);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                />
              </div>
            </div>

            {/* Headline + Sub */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  <Type size={11} className="inline mr-1" />
                  Hero Headline
                </label>
                <input
                  type="text"
                  value={form.headline}
                  onChange={(e) => updateField("headline", e.target.value)}
                  placeholder="BlockLender.io is a Scam — Here's the Proof"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Subheadline
                </label>
                <input
                  type="text"
                  value={form.subheadline}
                  onChange={(e) => updateField("subheadline", e.target.value)}
                  placeholder="Investigation reveals fraudulent crypto lending platform"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                />
              </div>
            </div>

            {/* CTA */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  <Link2 size={11} className="inline mr-1" />
                  CTA Button Text
                </label>
                <input
                  type="text"
                  value={form.ctaText}
                  onChange={(e) => updateField("ctaText", e.target.value)}
                  placeholder="View Evidence"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  CTA Link URL
                </label>
                <input
                  type="text"
                  value={form.ctaUrl}
                  onChange={(e) => updateField("ctaUrl", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                />
              </div>
            </div>

            {/* Images */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  <Image size={11} className="inline mr-1" />
                  Hero / Screenshot 1
                </label>
                <input
                  type="text"
                  value={form.heroImage}
                  onChange={(e) => updateField("heroImage", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                />
                {form.heroImage && (
                  <img src={form.heroImage} alt="" className="w-full h-20 object-cover rounded-lg mt-2" />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  <Image size={11} className="inline mr-1" />
                  Showcase Image 2
                </label>
                <input
                  type="text"
                  value={form.image2}
                  onChange={(e) => updateField("image2", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                />
                {form.image2 && (
                  <img src={form.image2} alt="" className="w-full h-20 object-cover rounded-lg mt-2" />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Logo URL
                </label>
                <input
                  type="text"
                  value={form.logoUrl}
                  onChange={(e) => updateField("logoUrl", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                />
              </div>
            </div>

            {/* Intro Content (HTML) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Intro Content (HTML)
              </label>
              <textarea
                value={form.content}
                onChange={(e) => updateField("content", e.target.value)}
                rows={6}
                placeholder="<p>Our investigation into BlockLender.io has revealed...</p>"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 font-mono focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all resize-y"
              />
            </div>

            {/* ── Sections Builder ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Layout size={15} />
                    Content Sections
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Add sections with different layouts — text, images, evidence, highlights
                  </p>
                </div>
                <button
                  onClick={addSection}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent/90 transition-colors"
                >
                  <Plus size={13} />
                  Add Section
                </button>
              </div>

              {sections.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                  <Layout size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">No sections yet</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Add sections for your investigation data, screenshots, evidence
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, idx) => {
                    const placeholders = getPlaceholders(section.layout || "text");
                    return (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-xl p-4 bg-gray-50/50"
                      >
                        {/* Section header */}
                        <div className="flex items-center gap-2 mb-3">
                          <GripVertical
                            size={14}
                            className="text-gray-300 cursor-move"
                          />
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Section {idx + 1}
                          </span>

                          {/* Layout picker — wraps to two rows */}
                          <div className="flex flex-wrap gap-1 ml-2">
                            {SECTION_LAYOUTS.map((l) => {
                              const Icon = l.icon;
                              return (
                                <button
                                  key={l.key}
                                  onClick={() =>
                                    updateSection(idx, "layout", l.key)
                                  }
                                  className={`p-1 rounded text-[10px] transition-colors ${
                                    section.layout === l.key
                                      ? "bg-accent text-white"
                                      : "bg-white text-gray-400 hover:text-gray-600 border border-gray-200"
                                  }`}
                                  title={l.label}
                                >
                                  <Icon size={11} />
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex-1" />

                          <button
                            onClick={() => moveSection(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-30"
                            title="Move up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => moveSection(idx, 1)}
                            disabled={idx === sections.length - 1}
                            className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-30"
                            title="Move down"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            onClick={() => removeSection(idx)}
                            className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {/* Section fields */}
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) =>
                              updateSection(idx, "title", e.target.value)
                            }
                            placeholder={placeholders.title}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                          />
                          <textarea
                            value={section.body}
                            onChange={(e) =>
                              updateSection(idx, "body", e.target.value)
                            }
                            rows={4}
                            placeholder={placeholders.body}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 font-mono focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none resize-y"
                          />
                          {showImageField(section.layout || "text") && (
                            <div>
                              <input
                                type="text"
                                value={section.image || ""}
                                onChange={(e) =>
                                  updateSection(idx, "image", e.target.value)
                                }
                                placeholder="Image URL for this section"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                              />
                              {section.image && (
                                <img
                                  src={section.image}
                                  alt=""
                                  className="w-full h-24 object-cover rounded-lg mt-2"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setShowSeo(!showSeo)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-gray-700"
              >
                SEO Settings
                {showSeo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showSeo && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  <input
                    type="text"
                    value={form.metaTitle}
                    onChange={(e) => updateField("metaTitle", e.target.value)}
                    placeholder="Meta Title"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                  />
                  <textarea
                    value={form.metaDesc}
                    onChange={(e) => updateField("metaDesc", e.target.value)}
                    rows={3}
                    placeholder="Meta Description"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none resize-y"
                  />
                </div>
              )}
            </div>

            {/* Custom CSS */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setShowCustomCss(!showCustomCss)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-gray-700"
              >
                <span className="flex items-center gap-1.5">
                  <Code size={14} />
                  Custom CSS Override
                </span>
                {showCustomCss ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showCustomCss && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  <textarea
                    value={form.customCss}
                    onChange={(e) => updateField("customCss", e.target.value)}
                    rows={6}
                    placeholder=".custom-page h1 { font-size: 4rem; }"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none resize-y"
                  />
                </div>
              )}
            </div>

            {isEdit && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
                Delete Page
              </button>
            )}
          </div>

          {/* Right — Design picker */}
          <div className="w-[320px] shrink-0">
            <div className="sticky top-[72px] space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Select Design ({DESIGNS.length} themes)
                </label>
                <div className="max-h-[calc(100vh-160px)] overflow-y-auto pr-1 space-y-4">
                  {CATEGORY_ORDER.map((cat) => {
                    const themes = designsByCategory[cat];
                    if (!themes || themes.length === 0) return null;
                    const meta = CATEGORY_META[cat];
                    const CatIcon = meta.icon;
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <CatIcon size={12} className="text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {meta.label} ({themes.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {themes.map((d) => (
                            <DesignCard
                              key={d.key}
                              design={d}
                              selected={form.design === d.key}
                              onClick={() => updateField("design", d.key)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: selectedDesign.preview.bg,
                  border: `1px solid ${selectedDesign.preview.accent}20`,
                }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: selectedDesign.preview.accent }}
                >
                  Active: {selectedDesign.name}
                </p>
                <div className="flex gap-2 mt-2">
                  {[selectedDesign.preview.bg, selectedDesign.preview.accent, selectedDesign.preview.text].map((c, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-md border border-white/10"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesignCard({
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
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden transition-all duration-200 group ${
        selected
          ? "ring-2 ring-accent ring-offset-2 scale-[1.02]"
          : "ring-1 ring-gray-200 hover:ring-gray-300 hover:scale-[1.01]"
      }`}
    >
      <div
        className="h-20 flex flex-col items-center justify-center p-2"
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
          className="w-5 h-3 rounded-sm mt-1.5"
          style={{ backgroundColor: design.preview.accent }}
        />
      </div>
      <div className="bg-white px-2 py-1.5">
        <p className="text-[10px] font-semibold text-gray-700 truncate">
          {design.name}
        </p>
      </div>
      {selected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
          <Check size={10} className="text-white" />
        </div>
      )}
    </button>
  );
}
