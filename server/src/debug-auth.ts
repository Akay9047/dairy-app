/**
 * Debug Script - Admin check karo
 * Run: cd server && npx ts-node src/debug-auth.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("\n🔍 Checking database...\n");

  // 1. Check all admins
  const admins = await prisma.admin.findMany({
    select: { id: true, username: true, name: true, createdAt: true, password: true },
  });

  if (admins.length === 0) {
    console.log("❌ NO ADMIN FOUND in database!");
    console.log("   Run: cd server && npx ts-node src/create-admin.ts");
    return;
  }

  console.log(`✅ ${admins.length} admin(s) found:\n`);

  for (const admin of admins) {
    console.log(`  Username : ${admin.username}`);
    console.log(`  Name     : ${admin.name}`);
    console.log(`  Created  : ${admin.createdAt}`);
    console.log(`  Hash     : ${admin.password.substring(0, 20)}...`);

    // Test common passwords
    const testPasswords = ["dairy@1234", "admin", "password", "dairy1234", "123456"];
    console.log(`\n  🔑 Testing passwords:`);
    for (const pw of testPasswords) {
      const match = await bcrypt.compare(pw, admin.password);
      console.log(`     "${pw}" → ${match ? "✅ MATCH!" : "❌ no match"}`);
    }
    console.log("");
  }

  // 2. Create/reset admin with known password
  console.log("🔧 Resetting admin password to: dairy@1234\n");
  const hashed = await bcrypt.hash("dairy@1234", 10);

  await prisma.admin.upsert({
    where: { username: "admin" },
    update: { password: hashed },
    create: {
      username: "admin",
      password: hashed,
      name: "Dairy Admin",
    },
  });

  // Verify it works
  const fresh = await prisma.admin.findUnique({ where: { username: "admin" } });
  if (fresh) {
    const ok = await bcrypt.compare("dairy@1234", fresh.password);
    console.log(`✅ Verification: admin / dairy@1234 → ${ok ? "LOGIN KAREGA ✅" : "ABHI BHI NAHI KAREGA ❌"}`);
  }

  console.log("\n📋 Ab yeh try karo:");
  console.log("   Username : admin");
  console.log("   Password : dairy@1234");
  console.log("\n   Server restart karo: Ctrl+C phir npm run dev\n");
}

main()
  .catch((e) => {
    console.error("❌ Database Error:", e.message);
    console.log("\n💡 Check karo server/.env mein DATABASE_URL sahi hai?\n");
  })
  .finally(() => prisma.$disconnect());
