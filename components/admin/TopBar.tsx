"use client";

import { useSession } from "next-auth/react";

export default function TopBar({ title }: { title: string }) {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {session?.user?.name ?? "Admin"}
          </p>
          <p className="text-xs text-gray-500">{session?.user?.email}</p>
        </div>
        <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white text-sm font-bold">
          {(session?.user?.name ?? "A").charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
