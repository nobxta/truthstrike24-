"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { TrendingUp, ChevronRight } from "lucide-react";

interface TickerPost {
  title: string;
  slug: string;
  category: { name: string; color: string };
}

export default function TrendingTicker({ posts }: { posts: TickerPost[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || posts.length === 0) return;

    let frame: number;
    let pos = 0;

    function tick() {
      pos += 0.5;
      if (el && pos >= el.scrollWidth / 2) pos = 0;
      if (el) el.scrollLeft = pos;
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);

    const pause = () => cancelAnimationFrame(frame);
    const resume = () => {
      frame = requestAnimationFrame(tick);
    };

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
    };
  }, [posts.length]);

  if (posts.length === 0) return null;

  const doubled = [...posts, ...posts];

  return (
    <div className="bg-surface dark:bg-[#111111] border-b border-gray-100 dark:border-white/[0.04]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center h-9">
        <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-gray-200 dark:border-white/10">
          <TrendingUp size={13} className="text-accent" />
          <span className="text-[11px] font-bold text-accent uppercase tracking-widest">
            Trending
          </span>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-hidden whitespace-nowrap ml-4"
        >
          <div className="inline-flex items-center gap-6">
            {doubled.map((post, i) => (
              <Link
                key={`${post.slug}-${i}`}
                href={`/${post.slug}`}
                className="inline-flex items-center gap-2 text-[13px] text-gray-500 dark:text-gray-400 hover:text-accent transition-colors duration-200 group"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: post.category.color }}
                />
                <span className="group-hover:text-accent transition-colors font-medium">
                  {post.title}
                </span>
                <ChevronRight
                  size={10}
                  className="text-gray-300 dark:text-gray-600"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
