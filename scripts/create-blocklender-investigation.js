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

const AUTHOR_ID = "cmqxuf5ni00009c1gmwsar8cx";

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

  // Written like a real investigative article — text-heavy, single column,
  // with a small verdict bar, one stat block for the trust scores, and a
  // highlight for the registration WHOIS data. No theatrical sections.
  const sections = [
    {
      title: "VERDICT|Confirmed scam — operators have gone dark",
      body: `<p>Independent risk services classify BlockLender.io as a high-confidence fraud. The site is now returning a 403 Forbidden error and the operators remain untraceable behind a privacy shield in Reykjavík, Iceland.</p>`,
      layout: "verdict",
      image: "",
    },
    {
      title: "LEDE|Inside the BlockLender.io fraud",
      body: `<p>BlockLender.io marketed itself as the first native XRP Ledger yield platform, promising holders of XRP and RLUSD a fixed <strong>12% annual percentage rate</strong> with daily compounding, no lock-up periods, and no minimum deposit. Those promises were designed to satisfy a long-running request from the XRP community for a native yield product — a request Ripple Labs has historically been reluctant to fulfil because of US securities-law overhang.</p><p>What users found instead was a sophisticated theft operation. Once deposits arrived, withdrawals were either blocked outright or silently redirected to wallet addresses controlled by the operators — not the addresses victims entered. The front-end has since returned a 403 error while paid advertising pointing at the domain continues to run.</p>`,
      layout: "text",
      image: "",
    },
    {
      title: "SCORES|Independent risk assessments",
      body: `<p><strong>6/100</strong> ScamAdviser Trust Score</p><p><strong>11.3/100</strong> Scam-Detector Validator Score</p><p><strong>2 of 2</strong> Risk services flagging as fraud</p>`,
      layout: "stats",
      image: "",
    },
    {
      title: "ANATOMY|How the legitimacy theatre was built",
      body: `<p>The operators executed a coordinated campaign that combined paid editorial placements, celebrity impersonation, and AI-generated social proof. Each element was engineered to defeat a specific layer of due diligence that an informed XRP holder might perform.</p><p><strong>Paid press placements.</strong> In April 2026, sponsored articles appeared on TechBullion and Bitcoin.com — both outlets accept paid content that can be mistaken for editorial reporting at a glance, particularly on mobile.</p><p><strong>Ripple CTO impersonation.</strong> A fake verified-looking Instagram account at <em>@joelkatz_</em> — David Schwartz's well-known online alias — was deployed to falsely imply Ripple's endorsement of BlockLender. Schwartz has no involvement with the platform.</p><p><strong>AI-generated content flood.</strong> The site and supporting social channels were padded with AI-written articles to manufacture the appearance of a deep editorial operation behind the brand.</p><p><strong>Withdrawal address substitution.</strong> User-entered withdrawal addresses were silently replaced with scammer-controlled addresses at the protocol layer, defeating victims who believed they were withdrawing to self-custodied wallets.</p>`,
      layout: "text",
      image: "",
    },
    {
      title: "TIMELINE|From registration to 403",
      body: `<p><strong>March 6, 2026</strong> — Domain blocklender.io registered anonymously via Namecheap. Privacy shield masks registrant identity behind Withheld for Privacy ehf in Iceland.</p><hr/><p><strong>April 2026</strong> — Paid promotional articles published on TechBullion and Bitcoin.com. Paid ad campaigns launch, targeting XRP search queries and crypto-influencer audiences.</p><hr/><p><strong>April–May 2026</strong> — Fake @joelkatz_ Instagram impersonation account active. Withdrawal complaints surface in XRP community Telegram and Twitter channels.</p><hr/><p><strong>May 2026</strong> — ScamAdviser scores the domain 6/100. Scam-Detector lists it at 11.3/100.</p><hr/><p><strong>June 2026</strong> — Front-end returns 403 Forbidden. Impersonation account and paid ads continue running, harvesting late-arriving traffic.</p>`,
      layout: "timeline",
      image: "",
    },
    {
      title: "QUOTE|Ripple has no relationship with BlockLender",
      body: `David Schwartz has no involvement with BlockLender.io. The Instagram account impersonating Schwartz is fraudulent and was used solely to mislead XRP holders.`,
      layout: "quote",
      image: "",
    },
    {
      title: "REGISTRATION|Domain & ownership trail",
      body: `<p><strong>Domain created:</strong> March 6, 2026</p><p><strong>Registrar:</strong> Namecheap Inc — IANA Registrar ID 1068</p><p><strong>Owner of record:</strong> Withheld for Privacy ehf, Reykjavík, Iceland</p><p><strong>Current status:</strong> 403 Forbidden (front-end dark, ad infrastructure active)</p>`,
      layout: "highlight",
      image: "",
    },
    {
      title: "VICTIMS|If you sent funds to BlockLender.io",
      body: `<p>Take the following actions immediately:</p><ul><li><strong>Do not send additional funds.</strong> Any message instructing you to deposit more to "unlock" your balance is a recovery-fee second-stage scam.</li><li><strong>Document everything.</strong> Record every deposit's destination address, transaction hash, and timestamp. Screenshot any in-app messages.</li><li><strong>Report the fraud.</strong> File with the FBI's IC3 (US), Action Fraud (UK), or your national cybercrime authority. Submit reports to ScamAdviser and Scam-Detector to support their listings.</li><li><strong>Secure your wallets.</strong> Rotate seeds on any wallet that interacted with the site. Review and revoke token approvals on associated addresses using a tool like XRPL.org's address explorer.</li><li><strong>Ignore "recovery services."</strong> No legitimate firm contacts victims through Telegram or Instagram. Anyone promising recovery for a fee is a scammer.</li></ul>`,
      layout: "text",
      image: "",
    },
    {
      title: "PATTERN|How to spot the next one",
      body: `<p>The BlockLender playbook is recognisable. The combination of an anonymously-registered domain, celebrity impersonation, and a too-good-to-be-true fixed APY has accounted for the majority of crypto scams TruthStrike24 has tracked this year. Before depositing funds into any new yield platform:</p><ul><li>Cross-check claimed endorsements directly with the named person — verified profiles will respond.</li><li>Verify domain registration history using whois.is or a similar tool. Recently-registered domains plus high APY are a red-flag combination.</li><li>Search the domain in ScamAdviser, Scam-Detector, and TrustPilot before depositing. A 6/100 takes seconds to find.</li><li>Treat any "no-risk" APY above 8% as fraud by default. Real yields require real risk.</li><li>Test withdrawals with the smallest possible deposit before scaling. Withdrawal friction is the giveaway.</li></ul>`,
      layout: "text",
      image: "",
    },
    {
      title: "NEXT|Tracking the operators",
      body: `<p>TruthStrike24 has flagged the impersonation account to Instagram and shared deposit-receiving wallet addresses with multiple chain-analysis firms. Updates will be published as the operators attempt to consolidate or off-ramp stolen funds.</p><p>If you have additional information about BlockLender.io, related operators, or further evidence of paid-press placements, contact our newsroom. Sources can request full anonymity.</p>`,
      layout: "text",
      image: "",
    },
  ];

  const data = {
    title: CP_TITLE,
    slug: CP_SLUG,
    headline: "BlockLender.io: anatomy of an XRP yield scam that impersonated Ripple's CTO",
    subheadline: "INVESTIGATION · CRYPTO FRAUD",
    ctaText: "",
    ctaUrl: "",
    logoUrl: "https://res.cloudinary.com/dumhqc5k6/image/upload/f_auto,q_auto/v1780221602/ChatGPT_Image_May_31_2026_03_29_40_PM_sgjcd2.png",
    metaTitle: "BlockLender.io Scam Report — Confirmed XRP Fraud | TruthStrike24",
    metaDesc:
      "Confirmed scam: BlockLender.io drained XRP and RLUSD holders by impersonating Ripple CTO David Schwartz. ScamAdviser 6/100. Full evidence and timeline.",
    heroImage: "", // intentionally empty — logo only belongs in the navbar
    design: "exposure-white",
    content:
      "<p>By the <strong>TruthStrike24 Newsroom</strong> · Filed June 2026</p><p>This investigation documents the rise and disappearance of BlockLender.io, a fraudulent XRP-yield platform that promised holders 12% APY before blocking withdrawals and going dark. Sources include public WHOIS records, independent risk-service ratings, on-chain activity, and our own monitoring of the operators' paid-press and social-impersonation campaigns.</p>",
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
        logoUrl: data.logoUrl,
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
