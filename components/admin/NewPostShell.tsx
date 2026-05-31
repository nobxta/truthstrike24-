"use client";

import { useState } from "react";
import { Edit3, Sparkles, Layout } from "lucide-react";
import PostForm from "./PostForm";
import AiPostForm from "./AiPostForm";
import AiCustomPageForm from "./AiCustomPageForm";

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

type Mode = "manual" | "ai" | "ai-page";

export default function NewPostShell({ categories, tags }: Props) {
  const [mode, setMode] = useState<Mode>("manual");

  return (
    <div>
      {/* Mode toggle pill */}
      <div className="px-6 pt-6">
        <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "manual"
                ? "bg-white text-navy shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Edit3 size={14} />
            Manual
          </button>
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "ai"
                ? "bg-white text-navy shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Sparkles size={14} />
            AI Article
          </button>
          <button
            type="button"
            onClick={() => setMode("ai-page")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "ai-page"
                ? "bg-white text-navy shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Layout size={14} />
            AI Custom Page
          </button>
        </div>
      </div>

      {mode === "manual" && <PostForm categories={categories} tags={tags} />}
      {mode === "ai" && <AiPostForm categories={categories} tags={tags} />}
      {mode === "ai-page" && <AiCustomPageForm />}
    </div>
  );
}
