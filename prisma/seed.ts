import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Vivek@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "7xnobi@gmail.com" },
    update: {},
    create: {
      email: "7xnobi@gmail.com",
      passwordHash,
      name: "Admin",
      role: "admin",
    },
  });

  console.log("Admin user seeded:", admin.email);

  await prisma.agentSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      model: "claude-sonnet-4-6",
      enabled: true,
      topicFocus: "Indian news, politics, sports, tech, entertainment",
    },
  });

  console.log("Agent settings seeded");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
