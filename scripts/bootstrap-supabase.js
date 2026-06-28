/* eslint-disable */
/**
 * One-time bootstrap for a fresh Supabase database.
 *
 * Creates:
 *   - Admin user (email + bcrypt-hashed password)
 *   - 6 default categories (Politics, Business, Tech, Sports, Entertainment, Investigations)
 *   - AgentSettings singleton with sensible defaults
 *
 * Run: node scripts/bootstrap-supabase.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const ADMIN_EMAIL = "chatgptforpython@gmail.com";
const ADMIN_PASSWORD = "TruthStrike24!"; // CHANGE in admin UI after first login
const ADMIN_NAME = "Admin";

const CATEGORIES = [
  { name: "Politics", slug: "politics", color: "#2563eb", emoji: "🏛" },
  { name: "Business", slug: "business", color: "#d97706", emoji: "💼" },
  { name: "Technology", slug: "technology", color: "#7c3aed", emoji: "💻" },
  { name: "Sports", slug: "sports", color: "#16a34a", emoji: "⚽" },
  { name: "Entertainment", slug: "entertainment", color: "#db2777", emoji: "🎬" },
  { name: "Investigations", slug: "investigations", color: "#dc2626", emoji: "🔍" },
];

const AGENT_SETTINGS = {
  enabled: false, // start paused — flip on once user is ready
  postProvider: "anthropic",
  model: "claude-sonnet-4-5",
  chatProvider: "groq",
  chatModel: "llama-3.3-70b-versatile",
  imageModel: "wavespeed-ai/flux-schnell",
  watermarkUrl: "",
  useWebSearch: true,
  wordLimit: 800,
  writingStyle:
    "Professional journalism with specific named people, real dates, exact statistics, and direct quotes from named sources. No filler. Active voice.",
  postIntervalMinutes: 60,
  autoReplyEnabled: true,
  autoReplyMinutes: 60,
  imageGenEnabled: true,
  topicFocus:
    "BlockLender XRP scam 2026, crypto rug pulls 2026, DeFi exit scams, NFT phishing schemes, fake exchanges, wallet drainer attacks, RBI monetary policy 2026, Sensex Nifty market today, Adani Group earnings, Reliance Jio subscribers",
};

async function main() {
  console.log("\n🚀 Bootstrapping Supabase database...\n");

  // 1. Admin user
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, name: ADMIN_NAME, role: "admin" },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      name: ADMIN_NAME,
      role: "admin",
    },
  });
  console.log(`✓ Admin user created: ${user.email}`);
  console.log(`  Password: ${ADMIN_PASSWORD}  (CHANGE IT in /admin/settings after first login!)\n`);

  // 2. Categories
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✓ ${CATEGORIES.length} categories created`);

  // 3. AgentSettings singleton
  await prisma.agentSettings.upsert({
    where: { id: "singleton" },
    update: AGENT_SETTINGS,
    create: { id: "singleton", ...AGENT_SETTINGS },
  });
  console.log(`✓ AgentSettings configured (auto-poster paused, web search ON, Anthropic Claude 4.5)\n`);

  // 4. WorkerHeartbeat singleton — for cron-like worker tracking (legacy compat)

  console.log("🎯 Done. Next steps:");
  console.log("   1. Update Vercel env DATABASE_URL → Supabase URL");
  console.log("   2. Redeploy Vercel (auto-trigger by next push, or manual)");
  console.log("   3. Update VPS worker .env DATABASE_URL → Supabase URL, restart it");
  console.log("   4. Log in at /admin with the email + password above");
  console.log("   5. Change password in /admin/settings");
  console.log("   6. Toggle the News Agent ON in /admin/agent-settings\n");
}

main()
  .catch((e) => {
    console.error("FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
