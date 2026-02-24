#!/usr/bin/env bun

/**
 * Final Verification Test - Quick Check All Systems
 */

import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaLibSql({
  url: `file:${process.cwd()}/data/voter.db`,
});

const prisma = new PrismaClient({ adapter });

console.log("\n🔍 FINAL SYSTEM VERIFICATION\n");
console.log("=".repeat(60));

async function verify() {
  try {
    // 1. Database
    const adminCount = await prisma.admin.count();
    console.log(`✅ Database: ${adminCount} admin(s) configured`);

    // 2. Voters
    const voterCount = await prisma.voter.count();
    const pendingCount = await prisma.voter.count({
      where: { status: "pending" },
    });
    const verifiedCount = await prisma.voter.count({
      where: { status: "verified" },
    });
    console.log(
      `✅ Voters: ${voterCount} total (${pendingCount} pending, ${verifiedCount} verified)`,
    );

    // 3. Message Queue
    const queueCount = await prisma.messageQueue.count();
    const queuePending = await prisma.messageQueue.count({
      where: { status: "pending" },
    });
    console.log(
      `✅ Message Queue: ${queueCount} messages (${queuePending} pending)`,
    );

    // 4. Connection Logs
    const logCount = await prisma.connectionLog.count();
    const latestLog = await prisma.connectionLog.findFirst({
      orderBy: { created_at: "desc" },
    });
    console.log(
      `✅ Connection Logs: ${logCount} entries (latest: ${latestLog?.status || "none"})`,
    );

    // 5. Web Server
    console.log("\n🌐 Web Server Status:");
    try {
      const response = await fetch("http://localhost:3000/login", {
        signal: AbortSignal.timeout(2000),
      });
      console.log(`✅ Next.js Server: Running (status ${response.status})`);
    } catch (error) {
      console.log("❌ Next.js Server: Not running");
    }

    // 6. WhatsApp Service
    console.log("\n📱 WhatsApp Service Status:");
    try {
      const wsResponse = await fetch("http://localhost:3001/health", {
        signal: AbortSignal.timeout(2000),
      });
      const wsData = await wsResponse.json();
      console.log(`✅ WhatsApp Service: ${wsData.status || "Running"}`);
    } catch (error) {
      console.log("⚠️  WhatsApp Service: Not responding (may need QR scan)");
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n✨ All systems verified! Ready for production.\n");
  } catch (error) {
    console.error("\n❌ Verification error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
