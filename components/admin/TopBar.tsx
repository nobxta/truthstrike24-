"use client";

import { useSession } from "next-auth/react";

export default function TopBar({ title }: { title: string }) {
  const { data: session } = useSession();
  const initial = (session?.user?.name ?? "A").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
      {/* Title — leave space for hamburger button on mobile (left-3 + 40px width + gap) */}
      <h2 className="text-base sm:text-lg font-semibold text-navy truncate pl-12 lg:pl-0">
        {title}
      </h2>
      <div className="flex items-center gap-3 shrink-0">
        {/* Hide name/email on small screens, just show avatar */}
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
            {session?.user?.name ?? "Admin"}
          </p>
          <p className="text-xs text-gray-500 truncate max-w-[160px]">
            {session?.user?.email}
          </p>
        </div>
        <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
          {initial}
        </div>
      </div>
    </header>
  );
}
