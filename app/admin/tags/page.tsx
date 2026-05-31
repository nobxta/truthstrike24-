"use client";

import TopBar from "@/components/admin/TopBar";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Tags as TagsIcon } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count: { posts: number };
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchTags() {
    const res = await fetch("/api/tags");
    const data = await res.json();
    setTags(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchTags();
  }, []);

  function resetForm() {
    setName("");
    setError("");
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setName(tag.name);
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);

    const url = editingId ? `/api/tags/${editingId}` : "/api/tags";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setSaving(false);
      return;
    }

    setSaving(false);
    resetForm();
    await fetchTags();
  }

  async function handleDelete(id: string, tagName: string) {
    if (!confirm(`Delete tag "${tagName}"?`)) return;

    const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to delete");
      return;
    }
    await fetchTags();
  }

  return (
    <>
      <TopBar title="Tags" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {tags.length} {tags.length === 1 ? "tag" : "tags"}
          </p>
          {!showForm && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors"
            >
              <Plus size={16} />
              Add Tag
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
                {editingId ? "Edit Tag" : "New Tag"}
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

            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Breaking News"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                autoFocus
              />
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
            Loading tags...
          </div>
        ) : tags.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <TagsIcon size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No tags yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3 group hover:border-gray-300 transition-colors"
              >
                <div>
                  <span className="font-medium text-sm text-gray-900">
                    {tag.name}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {tag._count.posts} posts
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(tag)}
                    className="p-1 text-gray-400 hover:text-navy hover:bg-gray-100 rounded transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id, tag.name)}
                    className="p-1 text-gray-400 hover:text-accent hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
