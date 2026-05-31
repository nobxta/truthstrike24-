"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={toggle}
      className="relative w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 transition-all duration-200 group overflow-hidden"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun
        size={16}
        strokeWidth={2.5}
        className={`absolute transition-all duration-500 text-amber-500 ${
          dark
            ? "opacity-0 rotate-180 scale-0"
            : "opacity-100 rotate-0 scale-100"
        }`}
      />
      <Moon
        size={16}
        strokeWidth={2.5}
        className={`absolute transition-all duration-500 text-blue-400 ${
          dark
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 -rotate-180 scale-0"
        }`}
      />
    </button>
  );
}
