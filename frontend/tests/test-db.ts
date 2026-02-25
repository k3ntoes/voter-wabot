import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaLibSql({
  url: `file:${process.cwd()}/data/voter.db`,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== Database Status ===\n");

  // Count voters
  const voterCount = await prisma.voter.count();
  console.log(`Total Voters: ${voterCount}`);

  // Get all voters
  const voters = await prisma.voter.findMany({
    orderBy: { created_at: "desc" },
  });
  console.log("\nVoters:");
  voters.forEach((v) => {
    console.log(
      `  - ${v.name} (${v.phone}) - ${v.organization} - Status: ${v.status}`,
    );
  });

  // Count admins
  const adminCount = await prisma.admin.count();
  console.log(`\nTotal Admins: ${adminCount}`);

  // Count message queue
  const queueCount = await prisma.messageQueue.count();
  const pendingCount = await prisma.messageQueue.count({
    where: { status: "pending" },
  });
  console.log(`\nMessage Queue: ${queueCount} total, ${pendingCount} pending`);

  // Get latest messages
  const messages = await prisma.messageQueue.findMany({
    orderBy: { created_at: "desc" },
    take: 5,
  });
  console.log("\nRecent Messages:");
  messages.forEach((m) => {
    console.log(
      `  - To: ${m.phone}, Status: ${m.status}, Attempts: ${m.attempts}`,
    );
  });

  // Get connection logs
  const logs = await prisma.connectionLog.findMany({
    orderBy: { created_at: "desc" },
    take: 5,
  });
  console.log("\nRecent Connection Logs:");
  logs.forEach((l) => {
    console.log(`  - ${l.status} at ${l.created_at}`);
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
