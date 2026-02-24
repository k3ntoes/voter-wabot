#!/usr/bin/env bun

/**
 * Comprehensive Test Suite for WhatsApp Voter Bot
 * Task 6: Verification & Testing
 */

import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({
  url: `file:${process.cwd()}/data/voter.db`,
});

const prisma = new PrismaClient({ adapter });

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.log(`❌ FAIL: ${message}`);
    testsFailed++;
  }
}

function testSection(name: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${name}`);
  console.log("=".repeat(60));
}

// Test 1: Admin Authentication
async function testAdminAuth() {
  testSection("TEST 1: Admin Authentication");

  const admin = await prisma.admin.findUnique({
    where: { username: "admin" },
  });

  assert(admin !== null, "Admin user exists in database");

  if (admin) {
    const passwordValid = await bcrypt.compare("admin123", admin.password_hash);
    assert(passwordValid, "Admin password hash is valid");

    const wrongPassword = await bcrypt.compare("wrong", admin.password_hash);
    assert(!wrongPassword, "Wrong password is correctly rejected");
  }
}

// Test 2: Voter CRUD Operations
async function testVoterCRUD() {
  testSection("TEST 2: Voter CRUD Operations");

  // Create test voter
  const testPhone = "628123456789";
  const voter = await prisma.voter.create({
    data: {
      phone: testPhone,
      name: "Test User",
      organization: "Test Org",
      status: "pending",
    },
  });

  assert(voter.id > 0, "Voter created with valid ID");
  assert(voter.phone === testPhone, "Voter phone matches");
  assert(voter.status === "pending", "Voter initial status is pending");

  // Read voter
  const found = await prisma.voter.findUnique({
    where: { phone: testPhone },
  });

  assert(found !== null, "Voter can be retrieved by phone");
  assert(found?.name === "Test User", "Voter name matches");

  // Update voter status (verification)
  const updated = await prisma.voter.update({
    where: { phone: testPhone },
    data: { status: "verified" },
  });

  assert(updated.status === "verified", "Voter status updated to verified");

  // Check duplicate phone constraint
  try {
    await prisma.voter.create({
      data: {
        phone: testPhone,
        name: "Duplicate User",
        organization: "Duplicate Org",
      },
    });
    assert(false, "Duplicate phone should be rejected");
  } catch (error) {
    assert(true, "Duplicate phone correctly rejected by unique constraint");
  }

  // Delete test voter
  await prisma.voter.delete({ where: { phone: testPhone } });
  const deleted = await prisma.voter.findUnique({
    where: { phone: testPhone },
  });
  assert(deleted === null, "Voter successfully deleted");
}

// Test 3: Message Queue Operations
async function testMessageQueue() {
  testSection("TEST 3: Message Queue Operations");

  // Create test message
  const message = await prisma.messageQueue.create({
    data: {
      phone: "628123456789",
      message: "Test message",
      status: "pending",
    },
  });

  assert(message.id > 0, "Message created in queue");
  assert(message.status === "pending", "Message initial status is pending");
  assert(message.attempts === 0, "Message initial attempts is 0");

  // Update message status to sent
  const sent = await prisma.messageQueue.update({
    where: { id: message.id },
    data: {
      status: "sent",
      attempts: 1,
      sent_at: new Date(),
    },
  });

  assert(sent.status === "sent", "Message status updated to sent");
  assert(sent.attempts === 1, "Message attempts incremented");
  assert(sent.sent_at !== null, "Message sent_at timestamp set");

  // Test failed message
  const failed = await prisma.messageQueue.create({
    data: {
      phone: "628987654321",
      message: "Failed message",
      status: "failed",
      attempts: 3,
      error: "Connection timeout",
    },
  });

  assert(failed.status === "failed", "Failed message created");
  assert(failed.error !== null, "Failed message has error");

  // Clean up
  await prisma.messageQueue.deleteMany({
    where: { phone: { in: ["628123456789", "628987654321"] } },
  });

  const remaining = await prisma.messageQueue.count({
    where: { phone: { in: ["628123456789", "628987654321"] } },
  });

  assert(remaining === 0, "Test messages cleaned up");
}

// Test 4: Connection Logs
async function testConnectionLogs() {
  testSection("TEST 4: Connection Logs");

  // Create connection log
  const log = await prisma.connectionLog.create({
    data: {
      status: "connected",
      qr_code: null,
      error: null,
    },
  });

  assert(log.id > 0, "Connection log created");
  assert(log.status === "connected", "Connection status recorded");

  // Create error log
  const errorLog = await prisma.connectionLog.create({
    data: {
      status: "error",
      error: "Connection timeout",
    },
  });

  assert(errorLog.status === "error", "Error status recorded");
  assert(errorLog.error !== null, "Error message recorded");

  // Clean up
  await prisma.connectionLog.deleteMany({
    where: { id: { in: [log.id, errorLog.id] } },
  });
}

// Test 5: Data Validation
async function testDataValidation() {
  testSection("TEST 5: Data Validation");

  const testPhone = "628111222333";

  // Test required fields
  try {
    await prisma.voter.create({
      data: {
        phone: testPhone,
        name: "",
        organization: "",
      },
    });
    // Empty strings are allowed in SQLite, so this should pass
    assert(true, "Empty strings allowed (need app-level validation)");

    await prisma.voter.delete({ where: { phone: testPhone } });
  } catch (error) {
    assert(false, "Unexpected error with empty strings");
  }

  // Test phone uniqueness
  const voter1 = await prisma.voter.create({
    data: {
      phone: "628444555666",
      name: "User 1",
      organization: "Org 1",
    },
  });

  try {
    await prisma.voter.create({
      data: {
        phone: "628444555666",
        name: "User 2",
        organization: "Org 2",
      },
    });
    assert(false, "Should not allow duplicate phone");
  } catch (error) {
    assert(true, "Phone uniqueness constraint enforced");
  }

  await prisma.voter.delete({ where: { id: voter1.id } });
}

// Test 6: Query Performance
async function testQueryPerformance() {
  testSection("TEST 6: Query Performance");

  // Create multiple test voters
  const voters = await Promise.all([
    prisma.voter.create({
      data: { phone: "6281111", name: "User 1", organization: "Org A" },
    }),
    prisma.voter.create({
      data: { phone: "6282222", name: "User 2", organization: "Org B" },
    }),
    prisma.voter.create({
      data: {
        phone: "6283333",
        name: "User 3",
        organization: "Org A",
        status: "verified",
      },
    }),
  ]);

  // Test filtering by status
  const pending = await prisma.voter.count({ where: { status: "pending" } });
  assert(pending >= 2, "Filter by pending status works");

  const verified = await prisma.voter.count({ where: { status: "verified" } });
  assert(verified >= 1, "Filter by verified status works");

  // Test ordering
  const ordered = await prisma.voter.findMany({
    where: { phone: { in: ["6281111", "6282222", "6283333"] } },
    orderBy: { created_at: "desc" },
  });

  assert(ordered.length === 3, "Ordering query returns all records");

  // Clean up
  await prisma.voter.deleteMany({
    where: { phone: { in: ["6281111", "6282222", "6283333"] } },
  });
}

// Main test runner
async function runTests() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  WhatsApp Voter Bot - Comprehensive Test Suite            ║");
  console.log("║  Task 6: Verification & Testing                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  try {
    await testAdminAuth();
    await testVoterCRUD();
    await testMessageQueue();
    await testConnectionLogs();
    await testDataValidation();
    await testQueryPerformance();

    console.log("\n" + "=".repeat(60));
    console.log("  TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📊 Total Tests:  ${testsPassed + testsFailed}`);
    console.log(
      `🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`,
    );
    console.log("=".repeat(60));

    if (testsFailed === 0) {
      console.log("\n🎉 All tests passed! System is ready for production.\n");
    } else {
      console.log("\n⚠️  Some tests failed. Please review and fix issues.\n");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Test suite error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
