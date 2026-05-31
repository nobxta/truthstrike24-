"use client";

import TopBar from "@/components/admin/TopBar";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, FolderOpen } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  emoji: string;
  createdAt: string;
  _count: { posts: number };
}

const PRESET_COLORS = [
  "#dc2626", "#ea580c", "#d97706", "#16a34a", "#0d9488",
  "#2563eb", "#7c3aed", "#db2777", "#64748b", "#0f172a",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#dc2626");
  const [emoji, setEmoji] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchCategories() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  function resetForm() {
    setName("");
    setColor("#dc2626");
    setEmoji("");
    setError("");
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setName(cat.name);
    setColor(cat.color);
    setEmoji(cat.emoji);
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !emoji.trim()) {
      setError("Name and emoji are required");
      return;
    }

    setSaving(true);

    const url = editingId ? `/api/categories/${editingId}` : "/api/categories";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color, emoji: emoji.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setSaving(false);
      return;
    }

    setSaving(false);
    resetForm();
    await fetchCategories();
  }

  async function handleDelete(id: string, categoryName: string) {
    if (!confirm(`Delete category "${categoryName}"?`)) return;

    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to delete");
      return;
    }
    await fetchCategories();
  }

  return (
    <>
      <TopBar title="Categories" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {categories.length} {categories.length === 1 ? "category" : "categories"}
          </p>
          {!showForm && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors"
            >
              <Plus size={16} />
              Add Category
            </button>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg border border-gray-200 p-5 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy">
                {editingId ? "Edit Category" : "New Category"}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-accent text-sm px-4 py-2 rounded border border-red-200 mb-4">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Politics"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emoji
                </label>
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  placeholder="e.g. 🏛️"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        color === c
                          ? "border-navy scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-50"
              >
                <Check size={16} />
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <FolderOpen size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No categories yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                    Category
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                    Slug
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                    Posts
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm font-bold"
                          style={{ backgroundColor: cat.color }}
                        >
                          {cat.emoji}
                        </span>
                        <span className="font-medium text-sm text-gray-900">
                          {cat.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      /{cat.slug}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {cat._count.posts}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-1.5 text-gray-400 hover:text-navy hover:bg-gray-100 rounded transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-1.5 text-gray-400 hover:text-accent hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
