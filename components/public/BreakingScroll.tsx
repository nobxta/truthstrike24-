"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

interface Item {
  title: string;
  slug: string;
}

/**
 * Horizontally-scrolling ticker that auto-pans the breaking-news items
 * and pauses on hover. Duplicates the list once so the loop is seamless.
 */
export default function BreakingScroll({ items }: { items: Item[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let pos = 0;
    let frame = 0;
    function tick() {
      const node = ref.current;
      if (!node) return;
      if (!pausedRef.current) {
        pos += 0.5;
        const half = node.scrollWidth / 2;
        if (pos >= half) pos = 0;
        node.scrollLeft = pos;
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const doubled = [...items, ...items];

  return (
    <div
      ref={ref}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      className="flex gap-6 overflow-hidden whitespace-nowrap min-w-0 flex-1"
    >
      {doubled.map((p, i) => (
        <Link
          key={`${p.slug}-${i}`}
          href={`/${p.slug}`}
          className="shrink-0 text-[13px] font-medium hover:underline"
        >
          <span className="opacity-70 mr-1">•</span>
          {p.title}
        </Link>
      ))}
    </div>
  );
}
