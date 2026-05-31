const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const userId = "cmppzvwp700009ci4qm9vxc0k";

const categories = {
  politics: "cmpq17n4300009c0c84hubuzk",
  sports: "cmpq1acc500009cu4hid9uivq",
  technology: "cmpq1aemw00019cu4oe3qa4i1",
  entertainment: "cmpq1ag0e00029cu495899hft",
  business: "cmpq1ahlr00039cu4hkxd9ood",
};

const articles = [
  // POLITICS (6)
  {
    title: "India Parliament Passes Historic Digital Privacy Bill",
    slug: "india-parliament-passes-digital-privacy-bill",
    summary: "The landmark legislation sets new standards for data protection and citizen privacy rights across the nation.",
    category: "politics",
    image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800",
    breaking: true,
  },
  {
    title: "G20 Summit 2026: World Leaders Agree on Climate Action Framework",
    slug: "g20-summit-2026-climate-action-framework",
    summary: "A comprehensive climate agreement was reached after three days of intense negotiations in New Delhi.",
    category: "politics",
    image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800",
  },
  {
    title: "Supreme Court Delivers Landmark Ruling on Electoral Reforms",
    slug: "supreme-court-landmark-ruling-electoral-reforms",
    summary: "The verdict mandates transparent funding and digital voting pilot programs across five states.",
    category: "politics",
    image: "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800",
  },
  {
    title: "New Education Policy Reforms Set to Transform Rural Schools",
    slug: "new-education-policy-reforms-rural-schools",
    summary: "Government unveils a comprehensive plan to bring digital classrooms and trained teachers to 100,000 villages.",
    category: "politics",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
  },
  {
    title: "India-Japan Defense Pact Strengthens Strategic Alliance",
    slug: "india-japan-defense-pact-strategic-alliance",
    summary: "Both nations sign a new defense cooperation agreement covering maritime security and technology sharing.",
    category: "politics",
    image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800",
  },
  {
    title: "National Healthcare Mission Expands to Cover Mental Health Services",
    slug: "national-healthcare-mission-mental-health-expansion",
    summary: "The expanded program will provide free counseling and psychiatric care in all district hospitals.",
    category: "politics",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800",
  },

  // SPORTS (6)
  {
    title: "India Wins Test Series Against Australia in Historic Comeback",
    slug: "india-wins-test-series-australia-historic-comeback",
    summary: "Stunning fourth innings chase of 387 seals the series 3-1 at the Gabba.",
    category: "sports",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800",
    breaking: true,
  },
  {
    title: "Paris Olympics 2026: India Sends Largest Ever Contingent",
    slug: "paris-olympics-2026-india-largest-contingent",
    summary: "Over 200 athletes will represent India across 28 sporting disciplines at the upcoming games.",
    category: "sports",
    image: "https://images.unsplash.com/photo-1461896836934-bd45ba048b7f?w=800",
  },
  {
    title: "IPL 2026 Auction Sees Record-Breaking Bids for Young Talent",
    slug: "ipl-2026-auction-record-breaking-bids",
    summary: "Three uncapped players cross the 15 crore mark as franchises invest heavily in future stars.",
    category: "sports",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800",
  },
  {
    title: "FIFA World Cup Qualifiers: India Secures Crucial Victory Over Qatar",
    slug: "fifa-world-cup-qualifiers-india-defeats-qatar",
    summary: "A stoppage-time winner from Sunil Chhetri keeps World Cup dream alive for the Blue Tigers.",
    category: "sports",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
  },
  {
    title: "Neeraj Chopra Breaks Own Javelin World Record at Diamond League",
    slug: "neeraj-chopra-breaks-javelin-world-record",
    summary: "The Olympic champion throws 90.97 meters to set a new world record in Zurich.",
    category: "sports",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800",
  },
  {
    title: "Indian Women's Hockey Team Qualifies for World Cup Final",
    slug: "indian-womens-hockey-qualifies-world-cup-final",
    summary: "A dominant 4-1 semifinal victory over Netherlands books India's place in the championship match.",
    category: "sports",
    image: "https://images.unsplash.com/photo-1580748142473-e547c923ee41?w=800",
  },

  // TECHNOLOGY (6)
  {
    title: "ISRO Successfully Tests Reusable Launch Vehicle in Orbital Flight",
    slug: "isro-reusable-launch-vehicle-orbital-flight-test",
    summary: "India becomes the fourth nation to demonstrate full orbital reusable rocket technology.",
    category: "technology",
    image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=800",
    breaking: true,
  },
  {
    title: "India's AI Startup Ecosystem Valued at $50 Billion",
    slug: "india-ai-startup-ecosystem-50-billion-valuation",
    summary: "New report highlights India as the fastest growing AI hub with over 3,000 active startups.",
    category: "technology",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
  },
  {
    title: "5G Network Coverage Reaches 90% of Indian Urban Areas",
    slug: "5g-network-coverage-90-percent-indian-urban-areas",
    summary: "Major telecom operators achieve near-complete urban coverage ahead of government deadlines.",
    category: "technology",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
  },
  {
    title: "Indian Scientists Develop Breakthrough Battery Technology",
    slug: "indian-scientists-breakthrough-battery-technology",
    summary: "The new sodium-ion battery offers 3x longer life and charges in under 10 minutes.",
    category: "technology",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800",
  },
  {
    title: "Digital Rupee Adoption Crosses 100 Million Users Milestone",
    slug: "digital-rupee-adoption-100-million-users",
    summary: "RBI's central bank digital currency sees explosive growth in retail and wholesale transactions.",
    category: "technology",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
  },
  {
    title: "Quantum Computing Lab Opens at IIT Madras with Global Partnership",
    slug: "quantum-computing-lab-iit-madras-global-partnership",
    summary: "The state-of-the-art facility will research quantum algorithms for drug discovery and cryptography.",
    category: "technology",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
  },

  // ENTERTAINMENT (6)
  {
    title: "Bollywood Blockbuster Crosses 1000 Crore at Global Box Office",
    slug: "bollywood-blockbuster-1000-crore-global-box-office",
    summary: "The sci-fi epic becomes only the third Indian film to reach the prestigious milestone worldwide.",
    category: "entertainment",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800",
  },
  {
    title: "AR Rahman Wins Grammy for Best World Music Album",
    slug: "ar-rahman-wins-grammy-best-world-music-album",
    summary: "The legendary composer takes home his third Grammy for an album blending classical Indian and electronic music.",
    category: "entertainment",
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800",
  },
  {
    title: "Indian Web Series Nominated for International Emmy Awards",
    slug: "indian-web-series-nominated-international-emmy",
    summary: "Three productions from Indian streaming platforms receive nominations across multiple categories.",
    category: "entertainment",
    image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800",
  },
  {
    title: "Cannes Film Festival Features Record Number of Indian Films",
    slug: "cannes-film-festival-record-indian-films",
    summary: "Five Indian productions selected across competition, Un Certain Regard, and Directors' Fortnight sections.",
    category: "entertainment",
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800",
  },
  {
    title: "India's Gaming Industry Revenue Surpasses $5 Billion",
    slug: "india-gaming-industry-revenue-surpasses-5-billion",
    summary: "Mobile gaming leads the charge as India becomes the world's second largest gaming market by users.",
    category: "entertainment",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
  },
  {
    title: "National Theatre Festival Celebrates 50 Years of Indian Drama",
    slug: "national-theatre-festival-50-years-indian-drama",
    summary: "A month-long celebration features 200 performances spanning regional and contemporary theater traditions.",
    category: "entertainment",
    image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800",
  },

  // BUSINESS (6)
  {
    title: "Sensex Crosses 90,000 Mark for First Time in Market History",
    slug: "sensex-crosses-90000-mark-first-time-history",
    summary: "Strong corporate earnings and foreign investment inflows drive the benchmark index to unprecedented heights.",
    category: "business",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
    breaking: true,
  },
  {
    title: "India Becomes World's Third Largest Economy by GDP",
    slug: "india-third-largest-economy-gdp-ranking",
    summary: "The milestone achievement comes as India's GDP growth rate outpaces all major economies for the third consecutive year.",
    category: "business",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800",
  },
  {
    title: "Electric Vehicle Sales in India Triple Year Over Year",
    slug: "electric-vehicle-sales-india-triple-year-over-year",
    summary: "Government subsidies and expanding charging infrastructure drive massive shift toward sustainable transport.",
    category: "business",
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800",
  },
  {
    title: "Indian Tech Giants Lead Global Cloud Computing Expansion",
    slug: "indian-tech-giants-global-cloud-computing-expansion",
    summary: "TCS, Infosys, and Wipro collectively invest $12 billion in new data centers across three continents.",
    category: "business",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
  },
  {
    title: "Startup India Program Creates 2 Million Jobs in 2026",
    slug: "startup-india-program-creates-2-million-jobs-2026",
    summary: "The entrepreneurship initiative reaches a new record with over 100,000 registered startups.",
    category: "business",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800",
  },
  {
    title: "India's Renewable Energy Capacity Surpasses Coal for First Time",
    slug: "india-renewable-energy-surpasses-coal-first-time",
    summary: "Solar and wind installations push green energy to 52% of total installed capacity, a landmark achievement.",
    category: "business",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800",
  },
];

async function seed() {
  let count = 0;
  const now = new Date();

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const publishedAt = new Date(now.getTime() - i * 2 * 60 * 60 * 1000); // stagger by 2 hours

    const content = `<p>${a.summary} This is a developing story with more details emerging as events unfold across the region.</p>
<p>Officials and experts have weighed in on the significance of this development, noting its far-reaching implications for the industry and the broader public. Analysts suggest this could mark a turning point in how the sector operates going forward.</p>
<h2>Key Details</h2>
<p>According to sources familiar with the matter, the developments have been in the works for several months. Multiple stakeholders have been involved in the process, ensuring that all perspectives are represented in the final outcome.</p>
<p>The announcement has generated significant attention from both domestic and international observers. Industry leaders have expressed cautious optimism about the potential impact on growth and innovation.</p>
<h2>What Comes Next</h2>
<p>Experts predict that this development will trigger a series of follow-up actions across related sectors. The timeline for implementation remains under discussion, with early estimates pointing to a phased rollout over the coming quarters.</p>
<p>Stay tuned to TruthStrike24 for continued coverage and analysis of this breaking story as more information becomes available.</p>`;

    try {
      await p.post.create({
        data: {
          title: a.title,
          slug: a.slug,
          summary: a.summary,
          content,
          featuredImage: a.image,
          seoTitle: a.title,
          metaDescription: a.summary,
          status: "published",
          publishedAt,
          authorId: userId,
          categoryId: categories[a.category],
          isBreaking: a.breaking || false,
          isAgentPost: false,
        },
      });
      count++;
      process.stdout.write(`\r${count}/${articles.length} articles created`);
    } catch (e) {
      console.error(`\nSkipped "${a.slug}": ${e.message}`);
    }
  }

  console.log(`\nDone! ${count} articles seeded.`);
  await p.$disconnect();
}

seed();
