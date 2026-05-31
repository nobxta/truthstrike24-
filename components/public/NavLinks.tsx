"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  emoji: string;
}

export default function NavLinks({
  categories,
  mobile,
}: {
  categories: Category[];
  mobile?: boolean;
}) {
  const pathname = usePathname();

  if (mobile) {
    return (
      <>
        <Link
          href="/"
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all duration-200 ${
            pathname === "/"
              ? "bg-accent text-white shadow-sm shadow-accent/20"
              : "text-gray-500 dark:text-gray-400 hover:text-[#111111] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
          }`}
        >
          <Home size={11} />
          Home
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all duration-200 ${
              pathname === `/category/${cat.slug}`
                ? "bg-accent text-white shadow-sm shadow-accent/20"
                : "text-gray-500 dark:text-gray-400 hover:text-[#111111] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </>
    );
  }

  return (
    <>
      <Link
        href="/"
        className={`relative px-3.5 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 ${
          pathname === "/"
            ? "text-accent bg-accent/[0.06] dark:bg-accent/10"
            : "text-gray-500 dark:text-gray-400 hover:text-[#111111] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.06]"
        }`}
      >
        Home
        {pathname === "/" && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-accent rounded-full" />
        )}
      </Link>
      {categories.map((cat) => {
        const isActive = pathname === `/category/${cat.slug}`;
        return (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className={`relative px-3.5 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 ${
              isActive
                ? "text-accent bg-accent/[0.06] dark:bg-accent/10"
                : "text-gray-500 dark:text-gray-400 hover:text-[#111111] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.06]"
            }`}
          >
            {cat.name}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-accent rounded-full" />
            )}
          </Link>
        );
      })}
    </>
  );
}
