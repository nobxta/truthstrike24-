"use client";

import TopBar from "@/components/admin/TopBar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  isBreaking: boolean;
  createdAt: string;
  publishedAt: string | null;
  author: { name: string };
  category: { name: string; color: string; emoji: string };
}

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  scheduled: "bg-purple-100 text-purple-700",
};

export default function AllPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  async function fetchPosts(p: number) {
    setLoading(true);
    const res = await fetch(`/api/posts?page=${p}&limit=10`);
    const data = await res.json();
    setPosts(data.posts);
    setTotalPages(data.pages);
    setTotal(data.total);
    setPage(data.page);
    setLoading(false);
  }

  useEffect(() => {
    fetchPosts(1);
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) await fetchPosts(page);
  }

  return (
    <>
      <TopBar title="All Posts" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{total} posts</p>
          <Link
            href="/admin/new-post"
            className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors"
          >
            <Plus size={16} />
            New Post
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm mb-4">
              No articles yet. Write your first one!
            </p>
            <Link
              href="/admin/new-post"
              className="inline-flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light"
            >
              <Plus size={16} />
              New Post
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                      Article
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                      Category
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                      Date
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {posts.map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {post.isBreaking && (
                            <Star
                              size={14}
                              className="text-accent fill-accent shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-medium text-sm text-gray-900 line-clamp-1">
                              {post.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              {post.author.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white"
                          style={{
                            backgroundColor: post.category.color,
                          }}
                        >
                          {post.category.emoji} {post.category.name}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            STATUS_STYLES[post.status] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {formatRelativeDate(post.publishedAt || post.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              router.push(`/admin/posts/${post.id}/edit`)
                            }
                            className="p-1.5 text-gray-400 hover:text-navy hover:bg-gray-100 rounded transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(post.id, post.title)
                            }
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

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => fetchPosts(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => fetchPosts(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
