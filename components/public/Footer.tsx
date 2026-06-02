import Link from "next/link";
import Image from "next/image";
import { Mail, Globe, ChevronRight } from "lucide-react";
import NewsletterSignup from "./NewsletterSignup";

const LOGO_URL =
  process.env.NEXT_PUBLIC_LOGO_URL ||
  "https://res.cloudinary.com/dumhqc5k6/image/upload/f_auto,q_auto/v1780221602/ChatGPT_Image_May_31_2026_03_29_40_PM_sgjcd2.png";

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
            <Link href="/" className="inline-flex items-center shrink-0" aria-label="TruthStrike24 — Home">
              <Image
                src={LOGO_URL}
                alt="TruthStrike24"
                width={480}
                height={120}
                unoptimized
                className="h-20 sm:h-24 w-auto object-contain"
              />
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
                { label: "Terms of Service", href: "/terms" },
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

          {/* Newsletter signup */}
          <div className="md:col-span-4">
            <NewsletterSignup
              source="footer"
              variant="footer"
              heading="Newsletter"
              description="Subscribe for breaking stories and investigations. No spam — ever."
            />
            <ul className="space-y-2.5 text-sm mt-6">
              <li className="flex items-center gap-3">
                <Mail size={13} className="text-gray-500 shrink-0" />
                <a href="mailto:contact@truthstrike24.com" className="text-gray-500 hover:text-white transition-colors">
                  contact@truthstrike24.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Globe size={13} className="text-gray-500 shrink-0" />
                <span className="text-gray-500">truthstrike24.com</span>
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
