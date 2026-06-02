import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://truthstrike24.vercel.app";
const SITE_NAME = "TruthStrike24";
const SITE_TAGLINE = "Breaking News, Crypto Scam Alerts & Real Investigations";
const SITE_DESC =
  "TruthStrike24 — independent investigative journalism exposing crypto scams, fraud, and corporate cover-ups. Real news, verified sources, breaking stories 24/7. Trusted scam reports on BlockLender, fake exchanges, Ponzi schemes, and high-yield investment frauds.";

// Default OG image — fallback for pages that don't set their own.
const DEFAULT_OG_IMAGE =
  process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE ||
  "https://res.cloudinary.com/dumhqc5k6/image/upload/v1780221602/ChatGPT_Image_May_31_2026_03_29_40_PM_sgjcd2.png";

// Big keyword cluster — head + long-tail combined, targeting our niche
const SITE_KEYWORDS = [
  // Brand
  "truthstrike24", "truth strike 24", "truthstrike news",
  // News head
  "breaking news", "latest news today", "news today", "trending news",
  "world news", "us news", "india news", "tech news", "politics news",
  "sports news", "entertainment news", "business news",
  // Investigative / scam — primary focus
  "crypto scam alerts", "crypto scam detector", "scam exposure",
  "is it a scam", "scam finder", "fraud investigation",
  "report a scam", "ponzi scheme list", "fake crypto exchange",
  "rug pull alerts", "high yield investment scam", "wallet drainer scam",
  "fake ICO", "yield platform scam", "blocklender scam",
  // News verticals
  "true news", "real news", "verified news", "independent journalism",
  "investigative journalism", "newsroom", "fact-checked news",
  // Crypto domain
  "cryptocurrency news", "bitcoin news", "ethereum news", "xrp news",
  "altcoin news", "defi scam", "nft scam", "crypto fraud", "crypto theft",
  "blockchain investigation", "web3 scam alerts",
  // Long-tail
  "how to identify a crypto scam",
  "how to recover from crypto scam",
  "is blocklender.io legit",
  "crypto yield platform scams 2026",
  "latest crypto scam alerts",
  "trending fraud news",
];

export const metadata: Metadata = {
  // CRITICAL for Open Graph: lets Next.js resolve relative image URLs
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  category: "news",
  classification: "News & Investigative Journalism",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: `${SITE_NAME} RSS Feed` }],
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESC,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESC,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: DEFAULT_OG_IMAGE,
    apple: DEFAULT_OG_IMAGE,
    shortcut: DEFAULT_OG_IMAGE,
  },
  verification: {
    google: "googlec44898a9d33589c0",
    // yandex: "your-yandex-verification-code",
    // other: { "msvalidate.01": "your-bing-verification-code" }
  },
  appleWebApp: {
    capable: true,
    title: "TruthStrike24",
    statusBarStyle: "black-translucent",
  },
  other: {
    "format-detection": "telephone=no",
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "TruthStrike24",
  },
};

/* ─── Site-wide JSON-LD ─── */

// 1. Organization / NewsMediaOrganization — Google's E-E-A-T signals
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  name: SITE_NAME,
  alternateName: "Truth Strike 24",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: DEFAULT_OG_IMAGE,
    width: 400,
    height: 100,
  },
  description: SITE_DESC,
  foundingDate: "2026",
  publishingPrinciples: `${SITE_URL}/about`,
  diversityPolicy: `${SITE_URL}/about`,
  ethicsPolicy: `${SITE_URL}/about`,
  masthead: `${SITE_URL}/about`,
  sameAs: [
    "https://t.me/nobxta",
    // Add real social URLs when you create accounts:
    // "https://twitter.com/truthstrike24",
    // "https://facebook.com/truthstrike24",
    // "https://www.linkedin.com/company/truthstrike24",
  ],
};

// 2. WebSite + SearchAction — gets you the search box in Google results
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: SITE_TAGLINE,
  url: SITE_URL,
  description: SITE_DESC,
  inLanguage: "en-US",
  publisher: {
    "@type": "NewsMediaOrganization",
    name: SITE_NAME,
    logo: {
      "@type": "ImageObject",
      url: DEFAULT_OG_IMAGE,
    },
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD: Organization + WebSite — applied to every page */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />

        {/* Performance hints */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://d2p7pg.cachecloud.net" />
        <link rel="dns-prefetch" href="https://d2p7pg.cachecloud.net" />
        <link rel="preconnect" href="https://translate.google.com" />
        <link rel="preconnect" href="https://translate.googleapis.com" />
        <link rel="dns-prefetch" href="https://translate.google.com" />

        {/* RSS feed discovery */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE_NAME} RSS Feed`}
          href="/rss.xml"
        />

        {/* PWA + iOS install support */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href={DEFAULT_OG_IMAGE} />
        <link rel="apple-touch-icon" sizes="180x180" href={DEFAULT_OG_IMAGE} />

        {/* Theme color for mobile browser chrome */}
        <meta name="theme-color" content="#dc2626" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />

        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <Providers>{children}</Providers>
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
