"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export default function SearchBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
      setQuery("");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-[#111111] dark:hover:text-white transition-all duration-200"
        aria-label="Search"
      >
        <Search size={15} strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-1.5 animate-fade-in"
    >
      <div className="relative">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          className="w-44 md:w-56 pl-8 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-[#111111] dark:text-white text-sm placeholder:text-gray-400 ring-1 ring-gray-200 dark:ring-white/[0.12] focus:ring-accent/50 focus:outline-none transition-all duration-200"
        />
      </div>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setQuery("");
        }}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#111111] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200"
      >
        <X size={14} />
      </button>
    </form>
  );
}
