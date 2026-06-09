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
const SITE_TAGLINE = "Breaking News, World Coverage & Live Updates 24/7";
const SITE_DESC =
  "TruthStrike24 delivers breaking news, world headlines, politics, business, technology, sports, entertainment and investigative reports — updated 24/7 with verified sources. Independent journalism covering global events, markets, finance, crypto, security, and the stories shaping today.";

// Default OG image — fallback for pages that don't set their own.
const DEFAULT_OG_IMAGE =
  process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE ||
  "https://res.cloudinary.com/dumhqc5k6/image/upload/v1780221602/ChatGPT_Image_May_31_2026_03_29_40_PM_sgjcd2.png";

// Comprehensive keyword cluster — general news outlet surface + verticals + long-tail
const SITE_KEYWORDS = [
  // Brand
  "truthstrike24", "truth strike 24", "truthstrike news", "truthstrike",
  // News head — broad, high-volume
  "breaking news", "latest news", "news today", "today news", "trending news",
  "live news", "news updates", "headlines today", "top stories", "news 24/7",
  "world news", "global news", "international news", "current events",
  // Geographic
  "us news", "uk news", "india news", "europe news", "asia news",
  "middle east news", "africa news", "china news",
  // Verticals
  "politics news", "business news", "finance news", "economy news",
  "tech news", "technology news", "science news", "health news",
  "sports news", "entertainment news", "celebrity news", "lifestyle news",
  "education news", "climate news", "weather news", "travel news",
  // Markets / finance
  "stock market news", "stock market today", "wall street news",
  "nasdaq today", "s&p 500 today", "dow jones today",
  "earnings reports", "ipo news", "market analysis",
  // Crypto vertical
  "cryptocurrency news", "bitcoin news", "btc news", "ethereum news", "eth news",
  "xrp news", "solana news", "altcoin news", "defi news", "nft news",
  "crypto market today", "crypto prices today", "web3 news", "blockchain news",
  // Investigative
  "investigative journalism", "investigative reports", "exposes",
  "scam alerts", "fraud investigation", "consumer alerts",
  "is it a scam", "scam exposure", "fact-checked news", "verified news",
  // Politics / world
  "election news", "white house news", "congress news", "supreme court news",
  "geopolitics", "foreign policy", "national security news",
  // Tech / AI
  "ai news", "artificial intelligence news", "chatgpt news", "openai news",
  "anthropic news", "google news", "apple news", "microsoft news",
  "tesla news", "spacex news", "startup news",
  // Long-tail evergreen
  "what happened today", "news right now", "current news today",
  "live news updates", "real time news", "independent news source",
  "trusted news site", "unbiased news",
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
  // Favicon + apple-touch-icon auto-detected from app/icon.png + app/apple-icon.png
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
    // Google News + News SEO signals
    "news_keywords":
      "breaking news, world news, politics, business, technology, crypto, sports, entertainment, investigations",
    "article:publisher": SITE_URL,
    "coverage": "Worldwide",
    "distribution": "Global",
    "rating": "General",
    "language": "EN",
    "revisit-after": "1 hours",
    "geo.region": "US",
    "geo.placename": "Global",
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
    "https://t.me/temp519",
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

        {/* PWA install support — apple-touch-icon auto-generated from app/apple-icon.png */}
        <link rel="manifest" href="/manifest.webmanifest" />

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
