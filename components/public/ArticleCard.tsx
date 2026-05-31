import Link from "next/link";
import { Clock, Newspaper } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";

interface ArticleCardProps {
  title: string;
  slug: string;
  summary: string;
  featuredImage: string;
  category: { name: string; slug: string; color: string };
  publishedAt: string | Date | null;
  createdAt: string | Date;
  compact?: boolean;
  featured?: boolean;
}

export default function ArticleCard({
  title,
  slug,
  summary,
  featuredImage,
  category,
  publishedAt,
  createdAt,
  compact,
  featured,
}: ArticleCardProps) {
  const dateStr = publishedAt?.toString() || createdAt.toString();

  if (compact) {
    return (
      <Link
        href={`/${slug}`}
        className="flex gap-3.5 group py-2.5 rounded-xl transition-colors duration-300"
      >
        {featuredImage ? (
          <div className="w-[72px] h-[52px] rounded-lg overflow-hidden shrink-0">
            <img
              src={featuredImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-out"
            />
          </div>
        ) : (
          <div className="w-[72px] h-[52px] rounded-lg bg-gray-100 dark:bg-white/[0.04] shrink-0 flex items-center justify-center">
            <Newspaper size={14} className="text-gray-300 dark:text-gray-600" />
          </div>
        )}
        <div className="min-w-0 flex flex-col justify-center">
          <span
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: category.color }}
          >
            {category.name}
          </span>
          <h4 className="text-[13px] font-medium text-[#111111] dark:text-white line-clamp-2 group-hover:text-accent transition-colors duration-300 leading-snug mt-0.5">
            {title}
          </h4>
        </div>
      </Link>
    );
  }

  if (featured) {
    return (
      <Link
        href={`/${slug}`}
        className="group relative rounded-2xl overflow-hidden sm:col-span-2"
      >
        <div className="relative overflow-hidden">
          {featuredImage ? (
            <img
              src={featuredImage}
              alt={title}
              className="w-full h-56 sm:h-72 object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-56 sm:h-72 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
              <Newspaper size={36} className="text-gray-300 dark:text-gray-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <span
              className="inline-block px-2.5 py-0.5 rounded-md text-[9px] font-bold text-white uppercase tracking-widest"
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </span>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-white mt-2 leading-snug group-hover:text-accent/90 transition-colors duration-300">
              {title}
            </h3>
            {summary && (
              <p className="text-[12px] text-white/60 mt-1.5 line-clamp-2 max-w-md hidden sm:block">
                {summary}
              </p>
            )}
            <div className="flex items-center gap-1 mt-3 text-[10px] text-white/40">
              <Clock size={9} />
              {formatRelativeDate(dateStr)}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/${slug}`}
      className="group bg-white dark:bg-white/[0.02] rounded-xl overflow-hidden ring-1 ring-black/[0.05] dark:ring-white/[0.06] hover:ring-black/[0.1] dark:hover:ring-white/[0.1] hover:shadow-lg hover:shadow-black/[0.04] transition-all duration-300 ease-out"
    >
      <div className="relative overflow-hidden">
        {featuredImage ? (
          <img
            src={featuredImage}
            alt={title}
            className="w-full h-44 object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
            <Newspaper size={28} className="text-gray-300 dark:text-gray-700" />
          </div>
        )}
        <span
          className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[9px] font-bold text-white uppercase tracking-widest"
          style={{ backgroundColor: category.color }}
        >
          {category.name}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-serif font-bold text-[#111111] dark:text-white text-[15px] leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-300">
          {title}
        </h3>
        {summary && (
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
            {summary}
          </p>
        )}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.04] text-[10px] text-gray-400">
          <Clock size={9} />
          {formatRelativeDate(dateStr)}
        </div>
      </div>
    </Link>
  );
}
