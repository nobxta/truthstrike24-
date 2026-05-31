"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TiptapEditor from "./TiptapEditor";
import DevicePreview from "./DevicePreview";
import ImageUpload from "./ImageUpload";
import {
  Save,
  Send,
  CalendarClock,
  Trash2,
  Sparkles,
  Eye,
  PenSquare,
  Star,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
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

interface PostFormProps {
  categories: Category[];
  tags: Tag[];
  post?: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    featuredImage: string;
    seoTitle: string;
    metaDescription: string;
    status: string;
    publishedAt: string | null;
    categoryId: string;
    isBreaking: boolean;
    tags: { tag: Tag }[];
  };
}

export default function PostForm({ categories, tags, post }: PostFormProps) {
  const router = useRouter();
  const isEditing = !!post;

  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [slugEdited, setSlugEdited] = useState(false);
  const [summary, setSummary] = useState(post?.summary || "");
  const [content, setContent] = useState(post?.content || "");
  const [featuredImage, setFeaturedImage] = useState(post?.featuredImage || "");
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle || "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription || "");
  const [categoryId, setCategoryId] = useState(post?.categoryId || "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    post?.tags.map((t) => t.tag.id) || []
  );
  const [isBreaking, setIsBreaking] = useState(post?.isBreaking || false);
  const [scheduledDate, setScheduledDate] = useState(
    post?.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : ""
  );
  const [keyPoints, setKeyPoints] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showSeo, setShowSeo] = useState(false);

  useEffect(() => {
    if (!slugEdited && title) {
      setSlug(slugify(title));
    }
  }, [title, slugEdited]);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  async function generateWithAI() {
    if (!title.trim()) {
      setError("Enter a title first, then click AI Generate");
      return;
    }
    setAiGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category: selectedCategory?.name || "General",
          tone: "professional, informative",
          length: "medium",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "AI generation failed");
        setAiGenerating(false);
        return;
      }

      const data = await res.json();
      setContent(data.content || "");
      setSummary(data.summary || "");
      setSeoTitle(data.seoTitle || title);
      setMetaDescription(data.summary || "");
      if (data.keyPoints) setKeyPoints(data.keyPoints);
    } catch {
      setError("Failed to connect to AI service");
    }
    setAiGenerating(false);
  }

  async function handleSave(status: "draft" | "published" | "scheduled") {
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!content.trim()) {
      setError("Content is required");
      return;
    }
    if (!categoryId) {
      setError("Select a category");
      return;
    }
    if (status === "scheduled" && !scheduledDate) {
      setError("Select a scheduled date");
      return;
    }

    setSaving(true);

    const payload = {
      title,
      slug,
      summary,
      content,
      featuredImage,
      seoTitle: seoTitle || title,
      metaDescription: metaDescription || summary,
      status,
      publishedAt: status === "scheduled" ? scheduledDate : undefined,
      categoryId,
      tagIds: selectedTagIds,
      isBreaking,
    };

    const url = isEditing ? `/api/posts/${post.id}` : "/api/posts";
    const method = isEditing ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        setSaving(false);
        return;
      }

      router.push("/admin/posts");
      router.refresh();
    } catch {
      setError("Failed to save post");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!post || !confirm("Permanently delete this article?")) return;

    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/posts");
        router.refresh();
      }
    } catch {
      setError("Failed to delete");
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }

  return (
    <div className="p-6">
      {error && (
        <div className="bg-red-50 text-accent text-sm px-4 py-2 rounded border border-red-200 mb-4 flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !showPreview
              ? "bg-navy text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <PenSquare size={16} />
          Editor
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showPreview
              ? "bg-navy text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Eye size={16} />
          Preview
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={generateWithAI}
          disabled={aiGenerating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {aiGenerating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {aiGenerating ? "Generating..." : "AI Generate"}
        </button>
      </div>

      {showPreview ? (
        <DevicePreview
          title={title}
          content={content}
          featuredImage={featuredImage}
          category={selectedCategory?.name || ""}
          categoryColor={selectedCategory?.color || "#64748b"}
          author="Admin"
          date={new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          keyPoints={keyPoints}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter article title..."
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
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
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
                placeholder="Brief summary for article cards..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <TiptapEditor content={content} onChange={setContent} />
            </div>

            {keyPoints.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-blue-800">
                    Key Points (AI Generated)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setKeyPoints([])}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <X size={14} />
                  </button>
                </div>
                <ul className="space-y-1">
                  {keyPoints.map((point, i) => (
                    <li key={i} className="text-sm text-blue-900 flex gap-2">
                      <span className="text-blue-500">•</span>
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => {
                          const updated = [...keyPoints];
                          updated[i] = e.target.value;
                          setKeyPoints(updated);
                        }}
                        className="flex-1 bg-transparent border-none outline-none text-sm"
                      />
                    </li>
                  ))}
                </ul>
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
                      placeholder="SEO title (max 60 chars)"
                      maxLength={60}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
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
                      placeholder="Meta description (max 160 chars)"
                      maxLength={160}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {metaDescription.length}/160
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
              <h3 className="font-semibold text-sm text-navy">Publish</h3>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSave("draft")}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <Save size={14} />
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSave("published")}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Send size={14} />
                  Publish
                </button>
                <button
                  type="button"
                  onClick={() => handleSave("scheduled")}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <CalendarClock size={14} />
                  Schedule
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Schedule Date
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-accent hover:bg-red-50 transition-colors w-full justify-center border border-red-200"
                >
                  <Trash2 size={14} />
                  Delete Article
                </button>
              )}
            </div>

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
              <p className="text-xs text-gray-400 mt-1 ml-7">
                Show on homepage hero section
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-sm text-navy mb-3">Category</h3>
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

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-sm text-navy mb-3">
                Featured Image
              </h3>
              <ImageUpload value={featuredImage} onChange={setFeaturedImage} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
