import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Users, Globe, Zap, Mail, Search, FileCheck, Bot } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — TruthStrike24",
  description:
    "TruthStrike24 is an independent investigative news outlet covering crypto scams, fraud, corporate cover-ups, and breaking news with verified sources.",
  openGraph: {
    title: "About TruthStrike24",
    description:
      "Independent investigative journalism — exposing crypto scams, fraud, and corporate cover-ups.",
    type: "website",
  },
};

const values = [
  {
    icon: Shield,
    title: "Truth & Accuracy",
    desc: "Every claim is verified against primary sources. We publish the receipts and link to the original evidence.",
  },
  {
    icon: Search,
    title: "Independent Investigations",
    desc: "We follow the money — crypto scams, Ponzi schemes, fake exchanges, fraudulent token launches.",
  },
  {
    icon: Zap,
    title: "Speed & Timeliness",
    desc: "Breaking stories around the clock. We cover events as they unfold, not after the fact.",
  },
  {
    icon: Users,
    title: "Reader First",
    desc: "Our editorial decisions are driven by what matters to readers — not advertisers or special interests.",
  },
  {
    icon: Globe,
    title: "Global Perspective",
    desc: "Cross-border investigations, multilingual coverage, sources from every continent.",
  },
  {
    icon: Bot,
    title: "AI-Augmented, Human-Edited",
    desc: "We use AI to accelerate research — every story is verified, edited, and published under human responsibility.",
  },
];

const masthead = [
  { role: "Editor in Chief", name: "Editorial Board" },
  { role: "Investigations Lead", name: "Investigations Desk" },
  { role: "Crypto & Fraud Desk", name: "Crypto Desk" },
  { role: "News Desk", name: "Newsroom" },
  { role: "Corrections & Standards", name: "Standards Office" },
  { role: "Reader Tips", name: "news@truthstrike24.com" },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-3">
          About TruthStrike24
        </p>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-navy mb-4 leading-tight dark:text-white">
          Independent journalism that follows the money.
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
          TruthStrike24 is an independent investigative news outlet covering crypto
          scams, fraud, corporate cover-ups, and the stories larger newsrooms
          won&apos;t touch. Founded in 2026, we publish for readers — not advertisers.
        </p>
      </div>

      {/* Mission */}
      <section className="mb-12">
        <h2 className="text-2xl font-serif font-bold text-navy mb-4 dark:text-white">Our Mission</h2>
        <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
          <p>
            In an era of information overload, paid promotion, and pump-and-dump
            disguised as journalism, TruthStrike24 exists to publish what&apos;s
            verifiable, document what&apos;s suspicious, and expose what&apos;s being
            hidden. We report on crypto scams, Ponzi schemes, fake exchanges,
            phishing operations, fraudulent corporate filings, and the people
            behind them.
          </p>
          <p>
            We don&apos;t take sponsorships from the projects we cover. We don&apos;t
            accept &ldquo;hush money&rdquo; to take down stories. When we&apos;re wrong, we
            correct the record loudly and visibly — the same way we publish.
          </p>
        </div>
      </section>

      {/* What We Cover */}
      <section className="mb-12">
        <h2 className="text-2xl font-serif font-bold text-navy mb-4 dark:text-white">What We Cover</h2>
        <ul className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
          <li>
            <strong className="text-navy dark:text-white">Crypto investigations</strong> — rug pulls, exit scams,
            fake exchanges, fraudulent ICOs, wallet drainers, social-engineering
            schemes, and the recovery scams that prey on victims.
          </li>
          <li>
            <strong className="text-navy dark:text-white">Fraud &amp; corporate accountability</strong> — Ponzi
            schemes, shell-company structures, false advertising, and unregistered
            securities offerings.
          </li>
          <li>
            <strong className="text-navy dark:text-white">Breaking news</strong> — politics, business, tech,
            sports, and entertainment, with primary-source verification.
          </li>
          <li>
            <strong className="text-navy dark:text-white">Reader-submitted tips</strong> — anonymous reports
            from victims, whistleblowers, and insiders. Every tip is reviewed.
          </li>
        </ul>
      </section>

      {/* Editorial Standards */}
      <section className="mb-12">
        <h2 className="text-2xl font-serif font-bold text-navy mb-4 dark:text-white">Editorial Standards</h2>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
          <div className="flex gap-3">
            <FileCheck size={18} className="text-accent shrink-0 mt-1" />
            <p>
              <strong className="text-navy dark:text-white">We verify every source.</strong> Wallets are
              checked on-chain, documents are cross-referenced, and quotes are
              attributed to named individuals wherever possible.
            </p>
          </div>
          <div className="flex gap-3">
            <FileCheck size={18} className="text-accent shrink-0 mt-1" />
            <p>
              <strong className="text-navy dark:text-white">We link to primary evidence.</strong> If a claim
              rests on a contract, transaction, court filing, or screenshot, you
              can click through to see it yourself.
            </p>
          </div>
          <div className="flex gap-3">
            <FileCheck size={18} className="text-accent shrink-0 mt-1" />
            <p>
              <strong className="text-navy dark:text-white">We separate reporting from opinion.</strong> Opinion
              pieces are labeled. News reporting sticks to verifiable facts.
            </p>
          </div>
          <div className="flex gap-3">
            <FileCheck size={18} className="text-accent shrink-0 mt-1" />
            <p>
              <strong className="text-navy dark:text-white">We correct errors transparently.</strong> Mistakes
              are noted at the top of the story with a date and the original
              wording preserved.
            </p>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="mb-12">
        <h2 className="text-2xl font-serif font-bold text-navy mb-4 dark:text-white">Our Approach</h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
          TruthStrike24 practices AI-augmented journalism. We use AI tooling to
          monitor on-chain activity at scale, parse large document dumps, and draft
          background research — but every published story is reviewed, edited, and
          signed off by human editors. AI accelerates the work; it does not replace
          the judgment behind it.
        </p>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          This is how we cover breaking news within minutes while keeping
          investigations rigorous over weeks.
        </p>
      </section>

      {/* Values grid */}
      <section className="mb-12">
        <h2 className="text-2xl font-serif font-bold text-navy mb-5 dark:text-white">What We Stand For</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {values.map((v) => (
            <div
              key={v.title}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm"
            >
              <v.icon size={24} className="text-accent mb-2" />
              <h3 className="font-semibold text-navy dark:text-white mb-1.5">{v.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Masthead */}
      <section className="mb-12">
        <h2 className="text-2xl font-serif font-bold text-navy mb-5 dark:text-white">Masthead</h2>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
          {masthead.map((m) => (
            <div key={m.role} className="px-5 py-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-navy dark:text-white">{m.role}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{m.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-navy rounded-xl p-8 text-white">
        <h2 className="text-xl font-serif font-bold mb-3">Get in touch</h2>
        <p className="text-gray-300 leading-relaxed mb-5">
          Have a tip? See something that doesn&apos;t add up? Want to correct the
          record? Reach the newsroom directly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="mailto:contact@truthstrike24.com"
            className="inline-flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Mail size={14} /> contact@truthstrike24.com
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors"
          >
            Contact page
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">Founded 2026 &middot; Independent &middot; Reader-supported</p>
      </section>
    </div>
  );
}
