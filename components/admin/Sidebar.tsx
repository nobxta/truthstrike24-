"use client";

import { useState, useEffect } from "react";
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
  Mail,
  Menu,
  X,
  BarChart3,
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
  { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Agent Settings", href: "/admin/agent-settings", icon: Bot },
  { label: "Site Settings", href: "/admin/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/admin" className="block">
          <h1 className="text-xl font-bold text-white">
            Truth<span className="text-accent">Strike</span>24
          </h1>
          <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
        </Link>
        {/* Close button (mobile only) */}
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden p-1.5 text-gray-400 hover:text-white"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
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
              className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                isActive
                  ? "bg-white/10 text-white border-r-2 border-accent"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} className="shrink-0" />
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
    </>
  );

  return (
    <>
      {/* ── Mobile: floating hamburger button ── */}
      <button
        onClick={() => setOpen(true)}
        className={`lg:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-lg bg-navy-light text-white flex items-center justify-center shadow-lg transition-opacity ${
          open ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* ── Mobile: backdrop ── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in"
        />
      )}

      {/* ── Sidebar: desktop static, mobile drawer ── */}
      <aside
        className={`bg-navy-light flex flex-col fixed lg:sticky top-0 left-0 h-screen z-50 transition-transform duration-300 ease-out
          w-64 shrink-0
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
