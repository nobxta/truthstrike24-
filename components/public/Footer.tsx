import Link from "next/link";
import { Mail, Globe, Newspaper, ChevronRight } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#111111] text-gray-400">
      {/* Crimson accent top line */}
      <div className="h-[2px] bg-gradient-to-r from-accent via-red-500 to-accent" />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center shrink-0">
              <span className="text-[22px] font-black tracking-tight text-white uppercase">
                TRUTH
              </span>
              <span className="text-[22px] font-black tracking-tight text-accent uppercase">
                STRIKE
              </span>
              <span className="text-[22px] font-light tracking-tight text-white/30 ml-0.5">
                24
              </span>
            </Link>
            <p className="text-sm leading-relaxed mt-4 max-w-sm text-gray-500">
              Your trusted source for breaking news and in-depth journalism.
              Delivering accurate, unbiased reporting around the clock.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-[0.12em] mb-5">
              Navigation
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: "Home", href: "/" },
                { label: "About Us", href: "/about" },
                { label: "Contact", href: "/contact" },
                { label: "Privacy Policy", href: "/privacy" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <ChevronRight
                      size={12}
                      className="text-gray-600 group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-200"
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-[0.12em] mb-5">
              Get in Touch
            </h4>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-center gap-3">
                <Mail size={14} className="text-gray-500 shrink-0" />
                <span>contact@truthstrike24.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Globe size={14} className="text-gray-500 shrink-0" />
                <span>truthstrike24.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Newspaper size={14} className="text-gray-500 shrink-0" />
                <span>Independent Journalism</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <span>&copy; {year} TruthStrike24. All rights reserved.</span>
          <span>Built with integrity and precision</span>
        </div>
      </div>
    </footer>
  );
}
