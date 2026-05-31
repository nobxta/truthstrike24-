"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  PenSquare,
  FileText,
  FolderOpen,
  Tags,
  Users,
  Bot,
  Settings,
  Globe,
  LogOut,
  Palette,
  MessageSquare,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "New Post", href: "/admin/new-post", icon: PenSquare },
  { label: "All Posts", href: "/admin/posts", icon: FileText },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Tags", href: "/admin/tags", icon: Tags },
  { label: "Authors", href: "/admin/authors", icon: Users },
  { label: "Custom Pages", href: "/admin/custom-pages", icon: Palette },
  { label: "Disputes", href: "/admin/disputes", icon: MessageSquare },
  { label: "Agent Settings", href: "/admin/agent-settings", icon: Bot },
  { label: "Site Settings", href: "/admin/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-navy-light min-h-screen flex flex-col shrink-0">
      <div className="p-5 border-b border-white/10">
        <Link href="/admin" className="block">
          <h1 className="text-xl font-bold text-white">
            Truth<span className="text-accent">Strike</span>24
          </h1>
          <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
        </Link>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-white/10 text-white border-r-2 border-accent"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-3 px-2 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <Globe size={18} />
          View Site
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-2 py-2 text-sm text-gray-400 hover:text-accent transition-colors w-full text-left"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
