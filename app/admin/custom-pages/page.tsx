"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Palette,
  ExternalLink,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { DESIGNS } from "@/lib/designs";

interface CustomPageRow {
  id: string;
  title: string;
  slug: string;
  design: string;
  published: boolean;
  createdAt: string;
}

export default function CustomPagesAdmin() {
  const [pages, setPages] = useState<CustomPageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/custom-pages")
      .then((r) => r.json())
      .then((data) => setPages(data))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this page permanently?")) return;
    await fetch(`/api/custom-pages/${id}`, { method: "DELETE" });
    setPages((prev) => prev.filter((p) => p.id !== id));
  }

  async function togglePublish(page: CustomPageRow) {
    const res = await fetch(`/api/custom-pages/${page.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !page.published }),
    });
    if (res.ok) {
      setPages((prev) =>
        prev.map((p) =>
          p.id === page.id ? { ...p, published: !p.published } : p
        )
      );
    }
  }

  function getDesignName(key: string) {
    return DESIGNS.find((d) => d.key === key)?.name || key;
  }

  function getDesignPreview(key: string) {
    return DESIGNS.find((d) => d.key === key)?.preview;
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Palette size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custom Pages</h1>
            <p className="text-sm text-gray-500">
              Standalone landing pages with custom designs
            </p>
          </div>
        </div>
        <Link
          href="/admin/custom-pages/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus size={16} />
          New Page
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <Palette size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No custom pages yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create your first standalone landing page
          </p>
          <Link
            href="/admin/custom-pages/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Plus size={14} />
            Create Page
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {pages.map((page) => {
            const preview = getDesignPreview(page.design);
            return (
              <div
                key={page.id}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5 hover:shadow-sm transition-shadow"
              >
                <div
                  className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center"
                  style={{
                    backgroundColor: preview?.bg || "#111",
                    border: `1px solid ${preview?.accent || "#fff"}20`,
                  }}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: preview?.accent || "#fff" }}
                  >
                    {getDesignName(page.design).slice(0, 3)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {page.title}
                    </h3>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        page.published
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {page.published ? "Live" : "Draft"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{getDesignName(page.design)} theme</span>
                    <span>/p/{page.slug}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => togglePublish(page)}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    title={page.published ? "Unpublish" : "Publish"}
                  >
                    {page.published ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                  {page.published && (
                    <a
                      href={`/p/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title="View live page"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <Link
                    href={`/admin/custom-pages/${page.id}/edit`}
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    onClick={() => handleDelete(page.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
