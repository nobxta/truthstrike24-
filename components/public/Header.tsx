import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import NavLinks from "./NavLinks";
import LanguageSelector from "./LanguageSelector";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";

const LOGO_URL =
  process.env.NEXT_PUBLIC_LOGO_URL ||
  "https://res.cloudinary.com/dumhqc5k6/image/upload/f_auto,q_auto/v1780221602/ChatGPT_Image_May_31_2026_03_29_40_PM_sgjcd2.png";

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
        <div className="flex items-center justify-between h-16 sm:h-16">
          {/* Brand logo (PNG) */}
          <Link
            href="/"
            className="flex items-center shrink-0 group"
            aria-label="TruthStrike24 — Home"
          >
            <Image
              src={LOGO_URL}
              alt="TruthStrike24"
              width={480}
              height={120}
              priority
              unoptimized
              className="h-20 sm:h-24 w-auto object-contain -my-4 sm:-my-6 transition-opacity duration-200 group-hover:opacity-90"
            />
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
