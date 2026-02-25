import { PrismaClient } from "@/lib/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({
  url: `file:${process.cwd()}/data/voter.db`,
});

const prisma = new PrismaClient({ adapter });

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

async function seedAdmin() {
  const count = await prisma.admin.count();
  if (count === 0) {
    const password_hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    await prisma.admin.create({
      data: {
        username: ADMIN_USERNAME,
        password_hash,
      },
    });
    console.log(`✅ Admin user created: ${ADMIN_USERNAME}`);
  } else {
    console.log(`ℹ️  Admin user already exists. Skipping...`);
  }
}

async function main() {
  console.log("🌱 Seeding database...");

  await seedAdmin();

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
