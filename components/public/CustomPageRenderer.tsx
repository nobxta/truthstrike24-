"use client";

import { type DesignTheme } from "@/lib/designs";
import {
  ArrowRight,
  ExternalLink,
  Quote,
  Shield,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Send,
  Flag,
} from "lucide-react";
import ScrollAnimate from "./ScrollAnimate";
import { TypewriterText, CountUp, StaggerGrid } from "./ScrollAnimate";

export interface ContentSection {
  title: string;
  body: string;
  image?: string;
  layout?:
    | "text"
    | "image-left"
    | "image-right"
    | "full-image"
    | "highlight"
    | "evidence"
    | "stats"
    | "quote"
    | "timeline"
    | "verdict"
    | "grid"
    | "banner";
}

interface PageData {
  id: string;
  title: string;
  slug: string;
  headline: string;
  subheadline: string;
  content: string;
  heroImage: string;
  image2: string;
  logoUrl: string;
  ctaText: string;
  ctaUrl: string;
  sections: string;
  customCss: string;
}

interface Props {
  page: PageData;
  design: DesignTheme;
}

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

/** Split "LABEL|Heading text" into { label, heading }. If no pipe, label is empty. */
function parseSectionTitle(raw: string): { label: string; heading: string } {
  if (!raw) return { label: "", heading: "" };
  const idx = raw.indexOf("|");
  if (idx === -1) return { label: "", heading: raw };
  return {
    label: raw.slice(0, idx).trim(),
    heading: raw.slice(idx + 1).trim(),
  };
}

/** Render the section label + heading pair used by ALL section types. */
function SectionHeading({
  title,
  design,
  className = "",
  headingClassName = "",
}: {
  title: string;
  design: DesignTheme;
  className?: string;
  headingClassName?: string;
}) {
  const s = design.styles;
  const { label, heading } = parseSectionTitle(title);
  if (!label && !heading) return null;

  return (
    <div className={className}>
      {label && (
        <span
          className="block text-xs font-bold uppercase tracking-[0.2em] mb-3"
          style={{ color: s.accentColor }}
        >
          {label}
        </span>
      )}
      {heading && (
        <h3
          className={`text-2xl sm:text-3xl font-bold ${s.headingColor} ${s.fontHeading} ${headingClassName}`}
        >
          {heading}
        </h3>
      )}
    </div>
  );
}

/** Parse a numeric string like "$500,000+" into { prefix, number, suffix, decimals }. */
function parseStatNumber(raw: string): {
  prefix: string;
  number: number;
  suffix: string;
  decimals: number;
  separator: string;
} {
  const trimmed = raw.trim();
  // Match optional prefix (non-digit, non-dot chars), then a number (with optional commas/dots), then suffix
  const match = trimmed.match(
    /^([^0-9]*?)([\d,]+(?:\.\d+)?)\s*(.*)$/
  );
  if (!match) {
    return { prefix: "", number: 0, suffix: trimmed, decimals: 0, separator: "," };
  }
  const prefix = match[1] || "";
  const numStr = match[2].replace(/,/g, "");
  const suffix = match[3] || "";
  const dotIdx = numStr.indexOf(".");
  const decimals = dotIdx >= 0 ? numStr.length - dotIdx - 1 : 0;
  return {
    prefix,
    number: parseFloat(numStr) || 0,
    suffix,
    decimals,
    separator: ",",
  };
}

/* ─────────────────────────────────────────────────────────────
   Main Renderer
   ───────────────────────────────────────────────────────────── */

export default function CustomPageRenderer({ page, design }: Props) {
  const s = design.styles;
  const isDark =
    design.preview.bg.startsWith("#0") ||
    design.preview.bg === "#000000" ||
    design.preview.bg.startsWith("#1");

  let sections: ContentSection[] = [];
  try {
    sections = JSON.parse(page.sections || "[]");
  } catch {
    sections = [];
  }

  return (
    <>
      {page.customCss && (
        <style dangerouslySetInnerHTML={{ __html: page.customCss }} />
      )}

      <div
        className={`custom-page min-h-screen ${s.pageBg} ${s.fontBody} overflow-hidden`}
        style={{
          backgroundColor: design.preview.bg,
          ["--cp-heading" as string]: isDark ? "#ffffff" : "#111111",
          ["--cp-accent" as string]: s.accentColor,
        }}
      >
        {/* Ambient glow */}
        {s.glow && isDark && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-15 blur-[80px]"
              style={{ backgroundColor: s.accentColor }}
            />
          </div>
        )}

        {/* ─── Nav ─── */}
        <nav className="relative z-20">
          <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
            {page.logoUrl ? (
              <img
                src={page.logoUrl}
                alt={page.title}
                className="h-8 object-contain"
                loading="lazy"
              />
            ) : (
              <span
                className={`text-lg font-bold ${s.headingColor} tracking-tight`}
              >
                {page.title}
              </span>
            )}
            {page.ctaText && page.ctaUrl && (
              <a
                href={page.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${s.buttonStyle} transition-all duration-300`}
              >
                {page.ctaText}
              </a>
            )}
          </div>
        </nav>

        {/* ─── Hero ─── */}
        <section className="relative z-10">
          {page.heroImage && (
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={page.heroImage}
                alt=""
                className="w-full h-full object-cover opacity-25 scale-105"
                loading="lazy"
                style={{
                  animation: "cpKenBurns 25s ease-in-out forwards",
                  willChange: "auto",
                }}
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t ${s.heroOverlay}`}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at center, transparent 0%, ${design.preview.bg} 75%)`,
                }}
              />
            </div>
          )}

          <div className="relative max-w-5xl mx-auto px-6 pt-20 sm:pt-32 pb-16 sm:pb-24 text-center">
            {/* Subheadline pill badge */}
            {page.subheadline && (
              <ScrollAnimate animation="fade-up" duration={600}>
                <div className="flex justify-center mb-6">
                  <span
                    className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full"
                    style={{
                      color: s.accentColor,
                      border: `1px solid ${s.accentColor}40`,
                      backgroundColor: `${s.accentColor}12`,
                    }}
                  >
                    {page.subheadline}
                  </span>
                </div>
              </ScrollAnimate>
            )}

            {/* Typewriter headline */}
            <ScrollAnimate animation="blur-in" duration={1000}>
              <h1
                className={`text-4xl sm:text-5xl md:text-7xl font-extrabold ${s.headingColor} ${s.fontHeading} leading-[1.05] tracking-tight`}
              >
                <TypewriterText
                  text={page.headline || page.title}
                  speed={35}
                  delay={page.subheadline ? 300 : 0}
                  cursor
                />
              </h1>
            </ScrollAnimate>

            {page.ctaText && (
              <ScrollAnimate animation="fade-up" delay={400}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 sm:mt-14">
                  <a
                    href={page.ctaUrl || "#content"}
                    target={page.ctaUrl ? "_blank" : undefined}
                    rel={page.ctaUrl ? "noopener noreferrer" : undefined}
                    className={`group flex items-center gap-2.5 px-8 py-4 rounded-xl text-sm font-bold ${s.buttonStyle} transition-all duration-300`}
                  >
                    {page.ctaText}
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </a>
                  <a
                    href="#content"
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium ${s.textColor} ${
                      isDark
                        ? "bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06]"
                        : "bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.06]"
                    } transition-all duration-300`}
                  >
                    Read More
                    <ExternalLink size={13} />
                  </a>
                </div>
              </ScrollAnimate>
            )}
          </div>
        </section>

        {/* ─── Hero Image Showcase ─── */}
        {page.heroImage && (
          <section className="relative z-10 max-w-5xl mx-auto px-6 -mt-4 mb-16">
            <ScrollAnimate animation="flip-up" duration={1000}>
              <div
                className={`rounded-2xl overflow-hidden ${s.cardBorder} ${s.glow || ""}`}
              >
                <img
                  src={page.heroImage}
                  alt={page.headline || page.title}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            </ScrollAnimate>
          </section>
        )}

        {/* ─── Main Content ─── */}
        {page.content && (
          <section id="content" className="relative z-10 py-16">
            <div className="max-w-4xl mx-auto px-6">
              <ScrollAnimate animation="fade-up">
                <div
                  className={`custom-page-content ${s.textColor}`}
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />
              </ScrollAnimate>
            </div>
          </section>
        )}

        {/* ─── Dynamic Sections ─── */}
        {sections.length > 0 && (
          <div className="relative z-10">
            {sections.map((section, idx) => (
              <SectionBlock
                key={idx}
                section={section}
                index={idx}
                design={design}
                isDark={isDark}
              />
            ))}
          </div>
        )}

        {/* ─── Second Image Showcase ─── */}
        {page.image2 && (
          <section className="relative z-10 py-16">
            <div className="max-w-5xl mx-auto px-6">
              <ScrollAnimate animation="zoom-in" duration={1000}>
                <div
                  className={`rounded-2xl overflow-hidden ${s.cardBorder} ${s.glow || ""}`}
                >
                  <img
                    src={page.image2}
                    alt="Showcase"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
              </ScrollAnimate>
            </div>
          </section>
        )}

        {/* ─── Report / Dispute Section ─── */}
        <section className="relative z-10 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <ScrollAnimate animation="fade-up">
              <div
                className={`${s.cardBg} ${s.cardBorder} rounded-2xl p-8 sm:p-12 ${s.glow || ""}`}
              >
                <div className="text-center mb-8">
                  <Flag
                    size={28}
                    style={{ color: s.accentColor }}
                    className="mx-auto mb-4"
                  />
                  <h3
                    className={`text-xl sm:text-2xl font-bold ${s.headingColor} ${s.fontHeading}`}
                  >
                    Think this information is wrong?
                  </h3>
                  <p className={`${s.textColor} mt-2 text-sm max-w-md mx-auto`}>
                    If you believe this report contains inaccurate information, you
                    can submit a dispute or contact us directly.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_USERNAME || "nobxta"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold ${
                      isDark
                        ? "bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white"
                        : "bg-black/[0.04] hover:bg-black/[0.08] border border-black/[0.08] text-gray-900"
                    } transition-all duration-300`}
                  >
                    <Send size={15} />
                    DM on Telegram
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("dispute-form");
                      if (el) {
                        el.style.display =
                          el.style.display === "none" ? "block" : "none";
                      }
                    }}
                    className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold ${s.buttonStyle} transition-all duration-300`}
                  >
                    <MessageSquare size={15} />
                    Submit a Report
                  </button>
                </div>

                {/* Inline Dispute Form */}
                <div
                  id="dispute-form"
                  style={{ display: "none" }}
                  className="mt-8"
                >
                  <DisputeForm
                    pageId={page.id}
                    pageSlug={page.slug}
                    pageTitle={page.title}
                    isDark={isDark}
                    accentColor={s.accentColor}
                    textColor={s.textColor}
                    headingColor={s.headingColor}
                    cardBg={s.cardBg}
                    cardBorder={s.cardBorder}
                  />
                </div>
              </div>
            </ScrollAnimate>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="relative z-10 py-10">
          <div
            className={`max-w-5xl mx-auto px-6 pt-8 border-t ${
              isDark ? "border-white/[0.06]" : "border-black/[0.06]"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {page.logoUrl ? (
                  <img
                    src={page.logoUrl}
                    alt={page.title}
                    className="h-6 object-contain opacity-60"
                    loading="lazy"
                  />
                ) : (
                  <span className={`text-sm font-semibold ${s.textColor}`}>
                    {page.title}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <a
                  href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_USERNAME || "nobxta"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs ${s.textColor} opacity-50 hover:opacity-80 transition-opacity`}
                >
                  Telegram
                </a>
                <span className={`text-xs ${s.textColor} opacity-30`}>|</span>
                <p className={`text-xs ${s.textColor} opacity-50`}>
                  All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes cpKenBurns {
            0% { transform: scale(1.05) translate(0, 0); }
            100% { transform: scale(1.12) translate(-1%, -1%); }
          }
          .custom-page-content h1,
          .custom-page-content h2,
          .custom-page-content h3 {
            color: var(--cp-heading, #fff);
          }
          .custom-page-content a {
            color: var(--cp-accent, #00f0ff);
          }
        `,
        }}
      />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section Block — routes each section to its layout renderer
   ───────────────────────────────────────────────────────────── */

function SectionBlock({
  section,
  index,
  design,
  isDark,
}: {
  section: ContentSection;
  index: number;
  design: DesignTheme;
  isDark: boolean;
}) {
  const layout = section.layout || "text";

  switch (layout) {
    case "text":
      return (
        <TextSection section={section} index={index} design={design} />
      );
    case "image-left":
      return (
        <ImageTextSection
          section={section}
          design={design}
          imgFirst={true}
        />
      );
    case "image-right":
      return (
        <ImageTextSection
          section={section}
          design={design}
          imgFirst={false}
        />
      );
    case "full-image":
      return <FullImageSection section={section} design={design} />;
    case "highlight":
      return (
        <HighlightSection section={section} design={design} isDark={isDark} />
      );
    case "evidence":
      return (
        <EvidenceSection section={section} index={index} design={design} isDark={isDark} />
      );
    case "stats":
      return <StatsSection section={section} design={design} isDark={isDark} />;
    case "quote":
      return <QuoteSection section={section} design={design} />;
    case "timeline":
      return (
        <TimelineSection section={section} design={design} isDark={isDark} />
      );
    case "verdict":
      return (
        <VerdictSection section={section} design={design} isDark={isDark} />
      );
    case "grid":
      return <GridSection section={section} design={design} isDark={isDark} />;
    case "banner":
      return (
        <BannerSection section={section} design={design} isDark={isDark} />
      );
    default:
      return (
        <TextSection section={section} index={index} design={design} />
      );
  }
}

/* ─── 1. Text ─── */

function TextSection({
  section,
  index,
  design,
}: {
  section: ContentSection;
  index: number;
  design: DesignTheme;
}) {
  const s = design.styles;
  const anim = index % 2 === 0 ? "fade-left" : "fade-right";

  return (
    <section className="py-14">
      <div className="max-w-4xl mx-auto px-6">
        <ScrollAnimate animation={anim}>
          {section.title && (
            <SectionHeading
              title={section.title}
              design={design}
              className="mb-4"
              headingClassName="pb-3"
            />
          )}
        </ScrollAnimate>
        <ScrollAnimate animation="fade-up" delay={150}>
          <div
            className={`${s.textColor} leading-relaxed text-[15px] [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1`}
            dangerouslySetInnerHTML={{ __html: section.body }}
          />
        </ScrollAnimate>
        {section.image && (
          <ScrollAnimate animation="fade-up" delay={300}>
            <img
              src={section.image}
              alt={section.title}
              className={`w-full rounded-xl mt-6 ${s.cardBorder}`}
              loading="lazy"
            />
          </ScrollAnimate>
        )}
      </div>
    </section>
  );
}

/* ─── 2 & 3. Image-Left / Image-Right ─── */

function ImageTextSection({
  section,
  design,
  imgFirst,
}: {
  section: ContentSection;
  design: DesignTheme;
  imgFirst: boolean;
}) {
  const s = design.styles;

  return (
    <section className="py-14">
      <div className="max-w-5xl mx-auto px-6">
        <div
          className={`flex flex-col ${imgFirst ? "lg:flex-row" : "lg:flex-row-reverse"} gap-8 lg:gap-12 items-center`}
        >
          <ScrollAnimate
            animation={imgFirst ? "fade-left" : "fade-right"}
            className="lg:w-1/2"
          >
            <div
              className={`rounded-2xl overflow-hidden ${s.cardBorder} ${s.glow || ""}`}
            >
              {section.image && (
                <img
                  src={section.image}
                  alt={section.title}
                  className="w-full h-auto"
                  loading="lazy"
                />
              )}
            </div>
          </ScrollAnimate>
          <ScrollAnimate
            animation={imgFirst ? "fade-right" : "fade-left"}
            delay={150}
            className="lg:w-1/2"
          >
            <div>
              {section.title && (
                <SectionHeading
                  title={section.title}
                  design={design}
                  className="mb-4"
                />
              )}
              <div
                className={`${s.textColor} leading-relaxed text-[15px] [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1`}
                dangerouslySetInnerHTML={{ __html: section.body }}
              />
            </div>
          </ScrollAnimate>
        </div>
      </div>
    </section>
  );
}

/* ─── 4. Full Image ─── */

function FullImageSection({
  section,
  design,
}: {
  section: ContentSection;
  design: DesignTheme;
}) {
  const s = design.styles;

  return (
    <section className="py-14">
      <div className="max-w-5xl mx-auto px-6">
        {section.image && (
          <ScrollAnimate animation="zoom-in" duration={900}>
            <div
              className={`rounded-2xl overflow-hidden ${s.cardBorder} ${s.glow || ""}`}
            >
              <img
                src={section.image}
                alt={section.title}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </ScrollAnimate>
        )}
        {(section.title || section.body) && (
          <ScrollAnimate animation="fade-up" delay={200}>
            <div className="mt-6 text-center max-w-2xl mx-auto">
              {section.title && (
                <SectionHeading
                  title={section.title}
                  design={design}
                  className="mb-2"
                />
              )}
              {section.body && (
                <div
                  className={`${s.textColor} text-sm leading-relaxed`}
                  dangerouslySetInnerHTML={{ __html: section.body }}
                />
              )}
            </div>
          </ScrollAnimate>
        )}
      </div>
    </section>
  );
}

/* ─── 5. Highlight ─── */

function HighlightSection({
  section,
  design,
  isDark,
}: {
  section: ContentSection;
  design: DesignTheme;
  isDark: boolean;
}) {
  const s = design.styles;

  return (
    <section className="py-14">
      <div className="max-w-4xl mx-auto px-6">
        <ScrollAnimate animation="fade-up">
          <div
            className={`${s.cardBg} ${s.cardBorder} rounded-2xl p-8 sm:p-10 ${s.glow || ""}`}
            style={{
              borderLeftWidth: 4,
              borderLeftColor: s.accentColor,
            }}
          >
            {section.title && (
              <div className="flex items-center gap-3 mb-4">
                <Shield
                  size={20}
                  style={{ color: s.accentColor }}
                  className="shrink-0"
                />
                <SectionHeading title={section.title} design={design} />
              </div>
            )}
            <div
              className={`${s.textColor} leading-relaxed text-[15px] [&_p]:mb-3`}
              dangerouslySetInnerHTML={{ __html: section.body }}
            />
            {section.image && (
              <img
                src={section.image}
                alt={section.title}
                className="w-full rounded-xl mt-6"
                loading="lazy"
              />
            )}
          </div>
        </ScrollAnimate>
      </div>
    </section>
  );
}

/* ─── 6. Evidence (Upgraded) ─── */

function EvidenceSection({
  section,
  index,
  design,
  isDark,
}: {
  section: ContentSection;
  index: number;
  design: DesignTheme;
  isDark: boolean;
}) {
  const s = design.styles;

  // Parse body into individual evidence rows.
  // Split on <hr>, --- or multiple <p>/<li> blocks to get individual evidence items.
  // Each item can have a title in <strong> and description text.
  const bodyItems = section.body
    .split(/<hr\s*\/?>|---/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  // If there's only one chunk (no dividers), try splitting by <p> pairs or <li> items
  const evidenceRows: { title: string; description: string; hasUrl: boolean }[] = [];

  if (bodyItems.length > 1) {
    // Multiple items separated by <hr>
    bodyItems.forEach((item) => {
      const strongMatch = item.match(/<strong>(.*?)<\/strong>/i);
      const title = strongMatch
        ? strongMatch[1].replace(/<[^>]*>/g, "").trim()
        : "";
      const description = item
        .replace(/<strong>.*?<\/strong>/gi, "")
        .replace(/<[^>]*>/g, "")
        .trim();
      const hasUrl = /<a\s/i.test(item) || /https?:\/\//i.test(item);
      evidenceRows.push({ title: title || description.slice(0, 60), description, hasUrl });
    });
  } else {
    // Single block: render as one evidence row
    const hasUrl = /<a\s/i.test(section.body) || /https?:\/\//i.test(section.body);
    const plainText = section.body.replace(/<[^>]*>/g, "").trim();
    evidenceRows.push({
      title: "",
      description: plainText,
      hasUrl,
    });
  }

  return (
    <section className="py-14">
      <div className="max-w-4xl mx-auto px-6">
        {section.title && (
          <ScrollAnimate animation="fade-up">
            <SectionHeading
              title={section.title}
              design={design}
              className="mb-8"
            />
          </ScrollAnimate>
        )}
        <ScrollAnimate animation="slide-up">
          <div
            className={`${s.cardBg} ${s.cardBorder} rounded-2xl overflow-hidden`}
          >
            {evidenceRows.map((row, i) => (
              <div
                key={i}
                className="flex items-start gap-4 px-6 sm:px-8 py-5"
                style={{
                  borderBottom:
                    i < evidenceRows.length - 1
                      ? `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`
                      : "none",
                }}
              >
                {/* Left: accent icon circle */}
                <div
                  className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
                  style={{
                    backgroundColor: `${s.accentColor}15`,
                    border: `1px solid ${s.accentColor}30`,
                  }}
                >
                  <Shield size={16} style={{ color: s.accentColor }} />
                </div>

                {/* Middle: title + description */}
                <div className="flex-1 min-w-0">
                  {row.title && (
                    <p className={`text-sm font-bold ${s.headingColor} leading-snug`}>
                      {row.title}
                    </p>
                  )}
                  <p className={`text-sm ${s.textColor} opacity-70 mt-0.5 leading-relaxed`}>
                    {row.description}
                  </p>
                </div>

                {/* Right: CRITICAL badge + link icon if URL present */}
                {row.hasUrl && (
                  <div className="shrink-0 flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25">
                      Critical
                    </span>
                    <ExternalLink size={14} className="text-red-400 opacity-60" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollAnimate>

        {/* Evidence image if present */}
        {section.image && (
          <ScrollAnimate animation="fade-up" delay={200}>
            <div
              className={`rounded-xl overflow-hidden ${s.cardBorder} mt-6`}
              style={{ boxShadow: "inset 0 2px 8px rgba(0,0,0,0.15)" }}
            >
              <img
                src={section.image}
                alt={section.title}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </ScrollAnimate>
        )}
      </div>
    </section>
  );
}

/* ─── 7. Stats (Upgraded) ─── */

function StatsSection({
  section,
  design,
  isDark,
}: {
  section: ContentSection;
  design: DesignTheme;
  isDark: boolean;
}) {
  const s = design.styles;

  // Parse stat items from body HTML.
  // Strategy 1: Look for <strong> tags — strong = number, remaining text = label.
  // Strategy 2: Pairs of <p> — first p = number, second p = label.
  // Strategy 3: Split on </p>, </div>, </li> as fallback.

  const statItems: { number: string; label: string }[] = [];

  // Try <strong> extraction first
  const strongRegex = /<(?:p|div|li)[^>]*>\s*<strong>(.*?)<\/strong>\s*(.*?)\s*<\/(?:p|div|li)>/gi;
  let strongMatch;
  while ((strongMatch = strongRegex.exec(section.body)) !== null) {
    const num = strongMatch[1].replace(/<[^>]*>/g, "").trim();
    const label = strongMatch[2].replace(/<[^>]*>/g, "").trim();
    if (num) statItems.push({ number: num, label });
  }

  // If no <strong> matches, try pairing <p> tags
  if (statItems.length === 0) {
    const pRegex = /<p[^>]*>(.*?)<\/p>/gi;
    const pItems: string[] = [];
    let pMatch;
    while ((pMatch = pRegex.exec(section.body)) !== null) {
      pItems.push(pMatch[1].replace(/<[^>]*>/g, "").trim());
    }

    if (pItems.length >= 2) {
      // Pair them: even index = number, odd index = label
      for (let i = 0; i < pItems.length; i += 2) {
        statItems.push({
          number: pItems[i],
          label: pItems[i + 1] || "",
        });
      }
    } else {
      // Final fallback: split on closing tags
      const fallbackItems = section.body
        .split(/<\/(?:p|div|li)>/i)
        .map((item) => item.replace(/<[^>]*>/g, "").trim())
        .filter(Boolean);
      fallbackItems.forEach((item) => {
        statItems.push({ number: item, label: "" });
      });
    }
  }

  return (
    <section className="py-14">
      <div className="max-w-4xl mx-auto px-6">
        {section.title && (
          <ScrollAnimate animation="fade-up">
            <SectionHeading
              title={section.title}
              design={design}
              className="mb-10 text-center"
            />
          </ScrollAnimate>
        )}

        {/* Stats row with vertical dividers */}
        <ScrollAnimate animation="fade-up" delay={150}>
          <div className="flex flex-wrap items-start justify-center">
            {statItems.map((item, i) => {
              const parsed = parseStatNumber(item.number);
              return (
                <div key={i} className="flex items-start">
                  {/* Stat item */}
                  <div className="text-center px-6 sm:px-10 py-4">
                    <p
                      className={`text-3xl sm:text-4xl md:text-5xl font-extrabold ${s.headingColor} ${s.fontHeading} leading-none`}
                    >
                      <CountUp
                        end={parsed.number}
                        prefix={parsed.prefix}
                        suffix={parsed.suffix}
                        decimals={parsed.decimals}
                        separator={parsed.separator}
                        duration={2000}
                        delay={i * 200}
                      />
                    </p>
                    {item.label && (
                      <p
                        className="text-[11px] font-bold uppercase tracking-[0.2em] mt-2 opacity-60"
                        style={{ color: isDark ? "#ffffff" : "#111111" }}
                      >
                        {item.label}
                      </p>
                    )}
                  </div>

                  {/* Vertical divider between items */}
                  {i < statItems.length - 1 && (
                    <div
                      className="self-stretch w-px my-4 shrink-0 hidden sm:block"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollAnimate>
      </div>
    </section>
  );
}

/* ─── 8. Quote ─── */

function QuoteSection({
  section,
  design,
}: {
  section: ContentSection;
  design: DesignTheme;
}) {
  const s = design.styles;

  return (
    <section className="py-14">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <ScrollAnimate animation="blur-in" duration={1000}>
          <div>
            {section.title && (
              <SectionHeading
                title={section.title}
                design={design}
                className="mb-6"
              />
            )}
            <Quote
              size={80}
              style={{ color: s.accentColor }}
              className="mx-auto mb-6 opacity-30"
            />
            <blockquote>
              <div
                className={`text-xl sm:text-2xl md:text-3xl italic leading-relaxed ${s.textColor} ${s.fontBody}`}
                dangerouslySetInnerHTML={{ __html: section.body }}
              />
            </blockquote>
            {section.title && (() => {
              const { heading } = parseSectionTitle(section.title);
              // Only show attribution if there is no pipe-label (attribution = whole title)
              return !section.title.includes("|") ? (
                <p
                  className={`mt-6 text-sm font-semibold ${s.headingColor} tracking-wide uppercase`}
                >
                  {heading}
                </p>
              ) : null;
            })()}
          </div>
        </ScrollAnimate>
      </div>
    </section>
  );
}

/* ─── 9. Timeline ─── */

function TimelineSection({
  section,
  design,
  isDark,
}: {
  section: ContentSection;
  design: DesignTheme;
  isDark: boolean;
}) {
  const s = design.styles;

  return (
    <section className="py-8">
      <div className="max-w-4xl mx-auto px-6">
        <ScrollAnimate animation="fade-left">
          <div className="flex gap-6">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: s.accentColor }}
              />
              <div
                className="w-0.5 flex-1 min-h-[40px]"
                style={{
                  backgroundColor: isDark
                    ? `${s.accentColor}30`
                    : `${s.accentColor}25`,
                }}
              />
            </div>

            {/* Content */}
            <div className="pb-8">
              {section.title && (
                <SectionHeading
                  title={section.title}
                  design={design}
                  className="mb-2"
                  headingClassName="text-lg sm:text-xl"
                />
              )}
              <div
                className={`${s.textColor} leading-relaxed text-[15px] [&_p]:mb-3`}
                dangerouslySetInnerHTML={{ __html: section.body }}
              />
              {section.image && (
                <img
                  src={section.image}
                  alt={section.title}
                  className={`w-full rounded-xl mt-4 ${s.cardBorder}`}
                  loading="lazy"
                />
              )}
            </div>
          </div>
        </ScrollAnimate>
      </div>
    </section>
  );
}

/* ─── 10. Verdict ─── */

function VerdictSection({
  section,
  design,
  isDark,
}: {
  section: ContentSection;
  design: DesignTheme;
  isDark: boolean;
}) {
  const s = design.styles;
  const { label, heading } = parseSectionTitle(section.title || "");
  const displayTitle = heading || section.title || "";
  const titleUpper = displayTitle.toUpperCase();
  const isNegative = /SCAM|FRAUD|FAKE|WARNING|DANGER/.test(titleUpper);
  const isPositive = /LEGIT|SAFE|TRUSTED|VERIFIED|APPROVED/.test(titleUpper);

  let borderColor = s.accentColor;
  let iconColor = s.accentColor;
  let IconComponent = Shield;

  if (isNegative) {
    borderColor = "#ef4444";
    iconColor = "#ef4444";
    IconComponent = AlertTriangle;
  } else if (isPositive) {
    borderColor = "#22c55e";
    iconColor = "#22c55e";
    IconComponent = CheckCircle;
  }

  return (
    <section className="py-14">
      <div className="max-w-4xl mx-auto px-6">
        <ScrollAnimate animation="zoom-in" duration={900}>
          <div
            className={`${s.cardBg} ${s.cardBorder} rounded-2xl p-8 sm:p-12 ${s.glow || ""}`}
            style={{
              borderTopWidth: 4,
              borderImage: `linear-gradient(90deg, ${borderColor}, ${borderColor}80) 1`,
            }}
          >
            <div className="flex items-start gap-4 mb-6">
              <IconComponent
                size={32}
                style={{ color: iconColor }}
                className="shrink-0 mt-1"
              />
              <div>
                {label && (
                  <span
                    className="block text-xs font-bold uppercase tracking-[0.2em] mb-2"
                    style={{ color: s.accentColor }}
                  >
                    {label}
                  </span>
                )}
                <h3
                  className={`text-2xl sm:text-3xl md:text-4xl font-extrabold ${s.headingColor} ${s.fontHeading}`}
                >
                  {displayTitle}
                </h3>
              </div>
            </div>
            <div
              className={`${s.textColor} leading-relaxed text-base [&_p]:mb-3`}
              dangerouslySetInnerHTML={{ __html: section.body }}
            />
            {section.image && (
              <img
                src={section.image}
                alt={section.title}
                className={`w-full rounded-xl mt-6 ${s.cardBorder}`}
                loading="lazy"
              />
            )}
          </div>
        </ScrollAnimate>
      </div>
    </section>
  );
}

/* ─── 11. Grid (Upgraded — Step Cards with StaggerGrid) ─── */

function GridSection({
  section,
  design,
  isDark,
}: {
  section: ContentSection;
  design: DesignTheme;
  isDark: boolean;
}) {
  const s = design.styles;

  // Split body at <hr> or --- into grid items
  const parts = section.body
    .split(/<hr\s*\/?>|---/)
    .map((p) => p.trim())
    .filter(Boolean);

  // If we have multiple items, render as step cards with StaggerGrid
  if (parts.length > 2) {
    const gridItems = parts.map((part, i) => {
      // Extract title from first <strong> or <h3>/<h4> if present
      const titleMatch = part.match(
        /<(?:strong|h[2-4])[^>]*>(.*?)<\/(?:strong|h[2-4])>/i
      );
      const itemTitle = titleMatch
        ? titleMatch[1].replace(/<[^>]*>/g, "").trim()
        : "";
      const itemBody = part
        .replace(/<(?:strong|h[2-4])[^>]*>.*?<\/(?:strong|h[2-4])>/i, "")
        .replace(/<[^>]*>/g, "")
        .trim();

      return (
        <div
          key={i}
          className={`${s.cardBg} ${s.cardBorder} rounded-xl p-6`}
        >
          {/* Step badge */}
          <span
            className="inline-block text-[11px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-md mb-4"
            style={{
              color: s.accentColor,
              backgroundColor: `${s.accentColor}12`,
              border: `1px solid ${s.accentColor}25`,
            }}
          >
            Step {String(i + 1).padStart(2, "0")}
          </span>
          {itemTitle && (
            <h4
              className={`text-base font-bold ${s.headingColor} mb-2 leading-snug`}
            >
              {itemTitle}
            </h4>
          )}
          {itemBody && (
            <p className={`text-sm ${s.textColor} opacity-70 leading-relaxed`}>
              {itemBody}
            </p>
          )}
        </div>
      );
    });

    return (
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-6">
          {section.title && (
            <ScrollAnimate animation="fade-up">
              <SectionHeading
                title={section.title}
                design={design}
                className="mb-8"
              />
            </ScrollAnimate>
          )}
          <StaggerGrid columns={4} staggerMs={100} animation="fade-up">
            {gridItems}
          </StaggerGrid>
        </div>
      </section>
    );
  }

  // Fallback: two-column layout for 1-2 items (original behavior)
  const leftHtml = parts[0] || "";
  const rightHtml = parts[1] || parts[0] || "";

  return (
    <section className="py-14">
      <div className="max-w-5xl mx-auto px-6">
        {section.title && (
          <ScrollAnimate animation="fade-up">
            <SectionHeading
              title={section.title}
              design={design}
              className="mb-8"
            />
          </ScrollAnimate>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ScrollAnimate animation="fade-left">
            <div
              className={`${s.textColor} leading-relaxed text-[15px] [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1`}
              dangerouslySetInnerHTML={{ __html: leftHtml }}
            />
          </ScrollAnimate>
          <ScrollAnimate animation="fade-right" delay={150}>
            <div
              className={`${s.textColor} leading-relaxed text-[15px] [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1`}
              dangerouslySetInnerHTML={{ __html: rightHtml }}
            />
          </ScrollAnimate>
        </div>
      </div>
    </section>
  );
}

/* ─── 12. Banner ─── */

function BannerSection({
  section,
  design,
  isDark,
}: {
  section: ContentSection;
  design: DesignTheme;
  isDark: boolean;
}) {
  const s = design.styles;

  // Determine if accent is light or dark for text contrast
  const accentHex = s.accentColor.replace("#", "");
  const r = parseInt(accentHex.substring(0, 2), 16) || 0;
  const g = parseInt(accentHex.substring(2, 4), 16) || 0;
  const b = parseInt(accentHex.substring(4, 6), 16) || 0;
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  const bannerTextColor = luminance > 150 ? "#111111" : "#ffffff";

  return (
    <section className="py-14">
      <div className="max-w-5xl mx-auto px-6">
        <ScrollAnimate animation="fade-up">
          <div
            className="rounded-2xl p-8 sm:p-12 text-center"
            style={{ backgroundColor: s.accentColor }}
          >
            {section.title && (
              <div className="mb-4">
                {(() => {
                  const { label, heading } = parseSectionTitle(section.title);
                  return (
                    <>
                      {label && (
                        <span
                          className="block text-xs font-bold uppercase tracking-[0.2em] mb-2"
                          style={{ color: bannerTextColor, opacity: 0.7 }}
                        >
                          {label}
                        </span>
                      )}
                      {heading && (
                        <h3
                          className="text-2xl sm:text-3xl md:text-4xl font-extrabold"
                          style={{ color: bannerTextColor }}
                        >
                          {heading}
                        </h3>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
            <div
              className="text-base sm:text-lg leading-relaxed [&_p]:mb-3 [&_a]:underline"
              style={{ color: bannerTextColor, opacity: 0.9 }}
              dangerouslySetInnerHTML={{ __html: section.body }}
            />
          </div>
        </ScrollAnimate>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   DisputeForm — inline form for submitting a report/dispute
   ───────────────────────────────────────────────────────────── */

import { useState, useCallback, type FormEvent } from "react";

function DisputeForm({
  pageId,
  pageSlug,
  pageTitle,
  isDark,
  accentColor,
  textColor,
  headingColor,
}: {
  pageId: string;
  pageSlug: string;
  pageTitle: string;
  isDark: boolean;
  accentColor: string;
  textColor: string;
  headingColor: string;
  cardBg: string;
  cardBorder: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState(`Report: ${pageTitle}`);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const inputCls = `w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200 ${
    isDark
      ? "bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/30 focus:border-white/20"
      : "bg-black/[0.03] border border-black/[0.08] text-gray-900 placeholder-gray-400 focus:border-black/20"
  }`;

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!email || !name || !description) {
        setError("Please fill in all required fields.");
        return;
      }
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/disputes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name,
            subject,
            description,
            customPageId: pageId,
            customPageSlug: pageSlug,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to submit report");
        }

        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [email, name, subject, description, pageId, pageSlug]
  );

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle
          size={40}
          className="mx-auto mb-4"
          style={{ color: "#22c55e" }}
        />
        <h4 className={`text-lg font-bold ${headingColor} mb-2`}>
          Report Submitted
        </h4>
        <p className={`${textColor} text-sm max-w-sm mx-auto`}>
          Check your email for a link to your dispute chat. You can use that link
          to track your case and communicate with our team.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className={`rounded-lg p-4 text-xs ${
          isDark
            ? "bg-white/[0.02] border border-white/[0.05] text-white/50"
            : "bg-black/[0.02] border border-black/[0.05] text-gray-500"
        }`}
      >
        <AlertTriangle
          size={14}
          className="inline mr-1.5"
          style={{ color: accentColor }}
        />
        We will send you a private chat link via email. No account or password
        needed.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={`block text-xs font-semibold ${headingColor} mb-1.5`}>
            Your Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className={`block text-xs font-semibold ${headingColor} mb-1.5`}>
            Your Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className={inputCls}
            required
          />
        </div>
      </div>

      <div>
        <label className={`block text-xs font-semibold ${headingColor} mb-1.5`}>
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label className={`block text-xs font-semibold ${headingColor} mb-1.5`}>
          Why do you want to report this? *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Explain why you believe this information is incorrect or should be removed..."
          rows={4}
          className={inputCls}
          style={{ resize: "vertical" }}
          required
        />
      </div>

      {error && <p className="text-sm text-red-400 font-medium">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 disabled:opacity-50"
        style={{ backgroundColor: accentColor }}
      >
        {loading ? (
          <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
        ) : (
          <>
            <Send size={15} />
            Submit Report
          </>
        )}
      </button>
    </form>
  );
}
