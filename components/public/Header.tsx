import Link from "next/link";
import { prisma } from "@/lib/db";
import NavLinks from "./NavLinks";
import LanguageSelector from "./LanguageSelector";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";

export default async function Header() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    take: 8,
  });

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0a0a0f]/95 backdrop-blur-2xl border-b border-gray-100/80 dark:border-white/[0.06]">
      {/* Crimson accent top line */}
      <div className="h-[2px] bg-gradient-to-r from-accent via-red-500 to-accent" />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Bold minimalist logo */}
          <Link
            href="/"
            className="flex items-center shrink-0 group"
          >
            <span className="text-[20px] font-black tracking-tight text-[#111111] dark:text-white uppercase">
              TRUTH
            </span>
            <span className="text-[20px] font-black tracking-tight text-accent uppercase">
              STRIKE
            </span>
            <span className="text-[20px] font-light tracking-tight text-gray-300 dark:text-white/30 ml-0.5">
              24
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-0.5 mx-6 flex-1 justify-center">
            <NavLinks categories={categories} />
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <SearchBar />
            <ThemeToggle />
            <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block" />
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-gray-100 dark:border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto px-4 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
          <NavLinks categories={categories} mobile />
        </div>
      </div>
    </header>
  );
}
