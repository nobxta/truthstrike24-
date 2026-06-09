import type { Metadata } from "next";
import { Mail, MessageSquare, Newspaper, LifeBuoy, Send as SendIcon } from "lucide-react";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — TruthStrike24",
  description:
    "Reach the TruthStrike24 newsroom — news tips, press inquiries, support, and corrections. Multiple channels including Telegram.",
  openGraph: {
    title: "Contact TruthStrike24",
    description: "Get in touch with the newsroom.",
    type: "website",
  },
};

const channels = [
  {
    icon: Mail,
    label: "General",
    value: "contact@truthstrike24.com",
    href: "mailto:contact@truthstrike24.com",
    desc: "Anything that doesn't fit below.",
  },
  {
    icon: Newspaper,
    label: "News Tips",
    value: "news@truthstrike24.com",
    href: "mailto:news@truthstrike24.com",
    desc: "Story leads, anonymous tips, whistleblowers.",
  },
  {
    icon: SendIcon,
    label: "Press / Media",
    value: "contact@truthstrike24.com",
    href: "mailto:contact@truthstrike24.com",
    desc: "Interview requests, press passes, syndication.",
  },
  {
    icon: LifeBuoy,
    label: "Support",
    value: "support@truthstrike24.com",
    href: "mailto:support@truthstrike24.com",
    desc: "Technical issues, dispute chat help, corrections.",
  },
  {
    icon: MessageSquare,
    label: "Telegram DM",
    value: "@temp519",
    href: "https://t.me/temp519",
    desc: "Direct message for fast tips.",
  },
];

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-3">
          Contact
        </p>
        <h1 className="text-4xl font-serif font-bold text-navy dark:text-white mb-3">
          Reach the newsroom.
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
          Have a tip, a correction, or a question? Pick the channel that fits
          and we&apos;ll get back to you. For sensitive tips we recommend Telegram or
          email.
        </p>
      </div>

      {/* Channels grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {channels.map((c) => (
          <a
            key={c.label}
            href={c.href}
            target={c.href.startsWith("http") ? "_blank" : undefined}
            rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:border-accent transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 text-accent flex items-center justify-center shrink-0">
                <c.icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  {c.label}
                </p>
                <p className="text-sm font-semibold text-navy dark:text-white truncate group-hover:text-accent transition-colors">
                  {c.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  {c.desc}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Form */}
      <ContactForm />
    </div>
  );
}
