"use client";

import { useEffect, useState } from "react";

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const el = document.getElementById("article-body");
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight;
      const visible = window.innerHeight;
      const scrolled = -rect.top;

      const pct = Math.min(
        100,
        Math.max(0, (scrolled / (total - visible)) * 100)
      );
      setProgress(pct);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-accent via-red-500 to-orange-500 transition-[width] duration-150 ease-out shadow-[0_0_8px_rgba(230,57,70,0.5)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
