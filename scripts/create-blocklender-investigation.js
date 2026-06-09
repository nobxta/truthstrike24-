/* eslint-disable */
/**
 * One-shot: creates the BlockLender.io investigation as
 *   1) A flagship Post (pinned + breaking)
 *   2) A custom landing page using the scam-alert theme
 *
 * Run: node scripts/create-blocklender-investigation.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const AUTHOR_ID = "cmppzvwp700009ci4qm9vxc0k";

async function ensureCategory() {
  let cat = await prisma.category.findUnique({
    where: { slug: "investigations" },
  });
  if (!cat) {
    cat = await prisma.category.create({
      data: {
        name: "Investigations",
        slug: "investigations",
        color: "#dc2626",
        emoji: "🔍",
      },
    });
  }
  return cat;
}

async function ensureTags() {
  const tagSpecs = [
    { name: "BlockLender", slug: "blocklender" },
    { name: "XRP Scam", slug: "xrp-scam" },
    { name: "Crypto Fraud", slug: "crypto-fraud" },
    { name: "Ripple", slug: "ripple" },
    { name: "Rug Pull", slug: "rug-pull" },
    { name: "Investigation", slug: "investigation" },
  ];
  const tags = [];
  for (const t of tagSpecs) {
    const tag = await prisma.tag.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
    tags.push(tag);
  }
  return tags;
}

const TITLE =
  "BlockLender.io Exposed: XRP Yield Scam Impersonated Ripple CTO David Schwartz";

const SLUG = "blocklender-io-scam-xrp-david-schwartz-impersonation";

const SUMMARY =
  "BlockLender.io promised XRP and RLUSD holders a 12% APY yield, then blocked withdrawals and silently redirected deposits to scammer-controlled wallets. The operators ran paid press on TechBullion and Bitcoin.com and impersonated Ripple CTO David Schwartz on Instagram to legitimize the operation.";

const META_DESCRIPTION =
  "TruthStrike24 investigation: BlockLender.io is a confirmed XRP crypto scam. ScamAdviser scores 6/100. Site impersonated Ripple CTO David Schwartz and blocked withdrawals. Full report.";

const SEO_TITLE = "BlockLender.io Scam Exposed: XRP Yield Fraud | TruthStrike24";

const KEYWORDS = [
  "blocklender",
  "blocklender.io",
  "blocklender scam",
  "blocklender.io scam",
  "is blocklender.io legit",
  "blocklender xrp",
  "blocklender review",
  "xrp yield scam",
  "xrp staking scam",
  "rlusd scam",
  "ripple cto impersonation",
  "david schwartz fake instagram",
  "joelkatz fake account",
  "xrp ledger scam 2026",
  "crypto scam 2026",
  "fake crypto lending platform",
  "12 percent apy crypto scam",
  "techbullion paid press scam",
  "bitcoin.com sponsored scam article",
  "wallet drainer scam",
  "withheld for privacy ehf iceland",
  "namecheap scam domain",
  "scamadviser blocklender",
  "scam-detector blocklender",
].join(", ");

const CONTENT = `<p><strong>BlockLender.io</strong>, a self-described XRP Ledger yield platform that promised holders a 12% fixed annual percentage rate with daily compounding, has been confirmed as a sophisticated cryptocurrency scam. The operation impersonated Ripple Chief Technology Officer David Schwartz on Instagram, ran paid promotional articles on legitimate crypto media, and silently redirected user deposits to scammer-controlled wallet addresses before going dark behind a 403 error.</p>

<p>The site presented itself as a "native XRP yield product" — a long-anticipated category among XRP holders — and combined that promise with no lock-up periods, no minimum deposit, and support for both XRP and RLUSD. By the time it began returning a 403 Forbidden error, ScamAdviser had scored it 6 out of 100 and Scam-Detector had rated it 11.3 out of 100, both classifying it as a high-risk fraud.</p>

<h2>How BlockLender.io Built a Convincing Facade</h2>

<p>The domain <code>blocklender.io</code> was registered anonymously on <strong>March 6, 2026</strong> through Namecheap (IANA Registrar ID 1068), with the registrant's identity masked behind a privacy shield from Withheld for Privacy ehf, an Icelandic privacy service based in Reykjavík. Within weeks of registration, the operators executed a coordinated launch campaign engineered to bypass the skepticism of seasoned XRP holders.</p>

<p>Key elements of the social-engineering operation:</p>
<ul>
  <li><strong>Paid press placements.</strong> Sponsored articles appeared on TechBullion and Bitcoin.com in April 2026. Both outlets accept paid content that can be mistaken for editorial reporting at a glance.</li>
  <li><strong>Impersonation of Ripple CTO David Schwartz.</strong> The scammers created a verified-looking Instagram account using the handle <code>@joelkatz_</code> (Schwartz's well-known online alias) to lend credibility to BlockLender's claimed Ripple affiliation. Schwartz has no involvement with the platform.</li>
  <li><strong>AI-generated content.</strong> The site and supporting social posts were padded with AI-written articles to manufacture the appearance of a deep editorial operation.</li>
  <li><strong>Fake social proof.</strong> Generated testimonials and engagement metrics were used to suggest a large existing user base.</li>
  <li><strong>Clickbait ad campaigns.</strong> Paid advertisements linked directly to <code>blocklender.io</code> and targeted XRP-related search queries and crypto influencer audiences.</li>
</ul>

<h2>The Mechanics of the Theft</h2>

<p>The actual fraud mechanism was simple. Users who deposited XRP or RLUSD into BlockLender.io were met with one of two outcomes:</p>

<ul>
  <li>Withdrawal requests were blocked outright with vague error messages or indefinite "pending" statuses.</li>
  <li>Funds were silently redirected to wallet addresses controlled by the operators — addresses different from the ones victims entered as their destination.</li>
</ul>

<p>The second mechanism is the more sophisticated of the two and consistent with a wallet-drainer pattern observed in 2026 XRP-targeted scams. By substituting the destination address at the protocol layer, the operators could exfiltrate funds even from users who believed they were withdrawing to a self-custodied wallet they controlled.</p>

<h2>Verification: Independent Risk Scores</h2>

<p>Two independent reputation services have published red flags on the domain:</p>

<ul>
  <li><strong>ScamAdviser:</strong> 6 / 100 trust score. <em>scamadviser.com/check-website/blocklender.io</em></li>
  <li><strong>Scam-Detector:</strong> 11.3 / 100 validator score. <em>scam-detector.com/validator/blocklender-io-review</em></li>
</ul>

<p>Both scores place the domain in the bottom decile of evaluated sites — a category that, in our investigative experience, has correlated strongly with confirmed exit-scam outcomes since at least 2022.</p>

<h2>Why XRP Holders Were the Target</h2>

<p>The XRP community has spent years requesting a native yield product — something Ripple Labs and the XRP Ledger Foundation have historically been cautious to offer due to securities-law overhang. That gap in the market is exactly what the BlockLender operators exploited. By coupling a "12% APY on XRP and RLUSD" headline with the false implication of David Schwartz's involvement, they manufactured a product that XRP holders wanted to exist and could believe was finally arriving.</p>

<p>RLUSD — Ripple's USD-pegged stablecoin launched in late 2025 — gave the scam additional legitimacy. Pairing the new stablecoin with a yield rail let the operation feel like a natural next step in the XRP ecosystem.</p>

<h2>Status as of June 2026</h2>

<p>The BlockLender.io domain now returns a 403 Forbidden error. Whether this is an attempt to hide evidence pending domain seizure, a temporary geographic block, or a final exit from the front-end interface is not yet clear. What is known:</p>

<ul>
  <li>Deposit-receiving wallet addresses remain unclaimed and have not been frozen.</li>
  <li>The operator's identity is masked behind Withheld for Privacy ehf in Iceland.</li>
  <li>The impersonation Instagram account targeting David Schwartz remains active at time of writing.</li>
  <li>Paid ads pointing to <code>blocklender.io</code> have been observed running as recently as this week.</li>
</ul>

<p>The combination of an active fraud infrastructure with a dark front-end is a known late-stage scam pattern: it allows operators to continue harvesting deposits from delayed traffic (paid ads, search results, social shares) while the public-facing site appears to have already shut down.</p>

<h2>If You Sent Funds to BlockLender.io</h2>

<ul>
  <li>Do not send additional funds in an attempt to "unlock" your balance — this is a common second-stage scam ("recovery fee").</li>
  <li>Record the destination wallet addresses and transaction hashes of every deposit you made.</li>
  <li>Report the scam to the FBI's IC3 (US) or your national cybercrime authority, and to ScamAdviser and Scam-Detector to support their public listings.</li>
  <li>If you used a self-custody wallet, rotate seeds on any wallet that interacted with the site, and review token approvals on any associated address.</li>
  <li>Do not engage with anyone claiming they can recover your funds for a fee. There is no legitimate recovery service. Law enforcement does not contact victims through Telegram or Instagram.</li>
</ul>

<h2>What Comes Next</h2>

<p>TruthStrike24 has flagged the impersonation account to Instagram and the deposit wallet addresses to multiple chain-analysis firms. We will continue tracking on-chain movements from identified BlockLender addresses and publish updates as the operators attempt to consolidate or off-ramp stolen funds.</p>

<p>If you have additional information about BlockLender.io, related operators, or further evidence of paid-press placements, contact the TruthStrike24 newsroom through our secure tip line. Sources can request anonymity.</p>`;

const HERO_IMAGE =
  "https://res.cloudinary.com/dumhqc5k6/image/upload/v1780221602/ChatGPT_Image_May_31_2026_03_29_40_PM_sgjcd2.png";

async function createPost(category, tags) {
  // Idempotent: if slug exists, just update
  const existing = await prisma.post.findUnique({ where: { slug: SLUG } });
  if (existing) {
    console.log(`✓ Post already exists, updating: ${SLUG}`);
    await prisma.post.update({
      where: { id: existing.id },
      data: {
        title: TITLE,
        summary: SUMMARY,
        content: CONTENT,
        seoTitle: SEO_TITLE,
        metaDescription: META_DESCRIPTION,
        keywords: KEYWORDS,
        status: "published",
        isBreaking: true,
        isPinned: true,
        publishedAt: new Date(),
      },
    });
    await prisma.postTag.deleteMany({ where: { postId: existing.id } });
    await prisma.postTag.createMany({
      data: tags.map((t) => ({ postId: existing.id, tagId: t.id })),
    });
    return existing.id;
  }

  const post = await prisma.post.create({
    data: {
      title: TITLE,
      slug: SLUG,
      summary: SUMMARY,
      content: CONTENT,
      featuredImage: HERO_IMAGE,
      seoTitle: SEO_TITLE,
      metaDescription: META_DESCRIPTION,
      keywords: KEYWORDS,
      status: "published",
      publishedAt: new Date(),
      authorId: AUTHOR_ID,
      categoryId: category.id,
      isAgentPost: false,
      isBreaking: true,
      isPinned: true,
      imageStatus: "done",
      tags: { create: tags.map((t) => ({ tagId: t.id })) },
    },
  });
  console.log(`✓ Post created: /${SLUG}`);
  return post.id;
}

async function createCustomPage() {
  const CP_SLUG = "blocklender-io-scam-report";
  const CP_TITLE = "BlockLender.io — Confirmed Scam Report";

  const sections = [
    {
      title: "VERDICT|Confirmed Scam — XRP Yield Fraud",
      body: `<p>BlockLender.io presented itself as the first native XRP yield product. It was a sophisticated theft operation that impersonated Ripple CTO David Schwartz to drain XRP and RLUSD holders.</p>`,
      layout: "verdict",
      image: "",
    },
    {
      title: "SCORES|Independent risk ratings",
      body: `<p><strong>6/100</strong> ScamAdviser Trust Score</p><p><strong>11.3/100</strong> Scam-Detector Validator Score</p><p><strong>2 of 2</strong> Independent risk services flag this as fraud</p>`,
      layout: "stats",
      image: "",
    },
    {
      title: "BACKGROUND|What BlockLender.io Claimed to Be",
      body: `<p>BlockLender.io marketed itself as a crypto lending platform built natively on the XRP Ledger. The site promised XRP and RLUSD holders:</p><ul><li><strong>12% fixed APY</strong> with daily compounding</li><li><strong>No lock-up periods</strong> — withdraw any time</li><li><strong>No minimum deposit</strong> — start with any amount</li><li><strong>Native XRPL integration</strong> — claimed direct ledger settlement</li></ul><p>These promises were engineered specifically to appeal to XRP holders who have spent years waiting for a legitimate native yield product.</p>`,
      layout: "text",
      image: "",
    },
    {
      title: "EVIDENCE|How the Scam Operated",
      body: `<p><strong>1. Paid press placements</strong><br/>Sponsored articles on TechBullion and Bitcoin.com (April 2026) created the appearance of editorial legitimacy.</p><hr/><p><strong>2. Ripple CTO impersonation</strong><br/>A fake verified Instagram account at @joelkatz_ posed as David Schwartz, falsely implying Ripple's endorsement of BlockLender.</p><hr/><p><strong>3. AI-generated content flood</strong><br/>The site and social channels were padded with AI-written articles to fake the depth of a real editorial operation.</p><hr/><p><strong>4. Wallet substitution at withdrawal</strong><br/>User-entered withdrawal addresses were silently replaced with scammer-controlled addresses. Deposits were either blocked or redirected.</p>`,
      layout: "evidence",
      image: "",
    },
    {
      title: "TIMELINE|How It Played Out",
      body: `<p><strong>March 6, 2026</strong> — Domain blocklender.io registered anonymously via Namecheap with Iceland privacy shield.</p><hr/><p><strong>April 2026</strong> — Paid promotional articles published on TechBullion and Bitcoin.com. Ads launch targeting XRP holders.</p><hr/><p><strong>April–May 2026</strong> — Fake @joelkatz_ Instagram account active. Withdrawal complaints surface in XRP community channels.</p><hr/><p><strong>May 2026</strong> — ScamAdviser scores domain 6/100. Scam-Detector lists at 11.3/100.</p><hr/><p><strong>June 2026</strong> — Site begins returning 403 Forbidden. Impersonation account and paid ads continue running.</p>`,
      layout: "timeline",
      image: "",
    },
    {
      title: "QUOTE|Ripple has no relationship with BlockLender",
      body: `David Schwartz has no involvement with BlockLender.io. The Instagram account @joelkatz_ impersonating Schwartz is fraudulent and was used solely to mislead XRP holders.`,
      layout: "quote",
      image: "",
    },
    {
      title: "REGISTRATION|Domain & ownership details",
      body: `<p><strong>Domain created:</strong> 2026-03-06</p><p><strong>Registrar:</strong> Namecheap Inc — IANA ID 1068</p><p><strong>Owner:</strong> Withheld for Privacy ehf, Reykjavík, Iceland</p><p><strong>Current status:</strong> 403 Forbidden (active fraud infrastructure)</p>`,
      layout: "highlight",
      image: "",
    },
    {
      title: "PROTECTION|If you sent funds to BlockLender.io",
      body: `<p>Take these actions immediately:</p><ul><li><strong>Do NOT send more funds</strong> to "unlock" your balance. This is a recovery-fee second-stage scam.</li><li>Record every deposit's destination address and transaction hash.</li><li>Report to FBI IC3 (US) or your national cybercrime authority.</li><li>Submit reports to ScamAdviser and Scam-Detector.</li><li>Rotate seeds on any wallet that interacted with the site.</li><li>Review and revoke token approvals on any associated addresses.</li><li>Never trust anyone offering "recovery services" for a fee — they are scammers.</li></ul>`,
      layout: "text",
      image: "",
    },
    {
      title: "TAKEAWAY|Key warning signs every crypto user should know",
      body: `<p><strong>Anonymously-registered domains</strong> + <strong>celebrity impersonation</strong> + <strong>"too good to be true" APY</strong> = avoid. Always:</p><ul><li>Cross-check claimed endorsements directly with the named person</li><li>Verify domain registration history (use whois.is or similar)</li><li>Search for ScamAdviser, Scam-Detector, and TrustPilot scores before depositing</li><li>Treat 12%+ "no-risk" APYs as fraud by default</li><li>Test withdrawals with small amounts before scaling up deposits</li></ul>`,
      layout: "text",
      image: "",
    },
    {
      title: "REPORT|Submit additional intel",
      body: `<p>TruthStrike24 is tracking on-chain movements from identified BlockLender addresses. If you have additional information about the operators, related domains, or further evidence of paid-press placements, contact our newsroom. Sources can request anonymity.</p>`,
      layout: "banner",
      image: "",
    },
  ];

  const data = {
    title: CP_TITLE,
    slug: CP_SLUG,
    headline: "BlockLender.io is a confirmed XRP yield scam",
    subheadline: "INVESTIGATION REPORT · CONFIRMED FRAUD",
    ctaText: "Read the full investigation",
    ctaUrl: `/${SLUG}`,
    logoUrl: "",
    metaTitle: "BlockLender.io Scam Report — Confirmed XRP Fraud | TruthStrike24",
    metaDesc:
      "Confirmed scam: BlockLender.io drained XRP and RLUSD holders by impersonating Ripple CTO David Schwartz. ScamAdviser 6/100. Full evidence and timeline.",
    heroImage: HERO_IMAGE,
    design: "scam-alert",
    content:
      "<p>BlockLender.io marketed a 12% APY native XRP yield product. Independent risk services rate it as fraud. Below is the full evidence file from our investigation.</p>",
    sections: JSON.stringify(sections),
    published: true,
  };

  const existing = await prisma.customPage.findUnique({
    where: { slug: CP_SLUG },
  });
  if (existing) {
    await prisma.customPage.update({
      where: { id: existing.id },
      data: {
        title: data.title,
        headline: data.headline,
        subheadline: data.subheadline,
        ctaText: data.ctaText,
        ctaUrl: data.ctaUrl,
        metaTitle: data.metaTitle,
        metaDesc: data.metaDesc,
        heroImage: data.heroImage,
        design: data.design,
        content: data.content,
        sections: data.sections,
        published: true,
      },
    });
    console.log(`✓ Custom page updated: /p/${CP_SLUG}`);
  } else {
    await prisma.customPage.create({ data });
    console.log(`✓ Custom page created: /p/${CP_SLUG}`);
  }
}

(async () => {
  try {
    // We only create/maintain the custom landing page. The Post variant was
    // removed — the custom page handles both the investigation content AND
    // the SEO surface in a single URL.
    await createCustomPage();
    console.log("\n🎯 Done. Live at:");
    console.log(`   https://www.truthstrike24.com/p/blocklender-io-scam-report`);
    console.log(`\n   Toggle published on/off from: /admin/custom-pages`);
  } catch (e) {
    console.error("FAILED:", e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
