/**
 * Quick Admin Setup Script
 * Run: npx ts-node src/create-admin.ts
 * Or:  node -e "require('./dist/create-admin.js')"
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

const USERNAME = process.env.ADMIN_USERNAME || "admin";
const PASSWORD = process.env.ADMIN_PASSWORD || "dairy@1234";
const NAME = process.env.ADMIN_NAME || "Dairy Admin";

async function main() {
  console.log("🐄 Smart Dairy - Admin Setup");
  console.log("================================");

  // Check if admin already exists
  const existing = await prisma.admin.findUnique({ where: { username: USERNAME } });

  if (existing) {
    // Update password for existing admin
    const hashed = await bcrypt.hash(PASSWORD, 10);
    await prisma.admin.update({
      where: { username: USERNAME },
      data: { password: hashed, name: NAME },
    });
    console.log(`✅ Admin password reset kar diya!`);
  } else {
    // Create new admin
    const hashed = await bcrypt.hash(PASSWORD, 10);
    await prisma.admin.create({
      data: { username: USERNAME, password: hashed, name: NAME },
    });
    console.log(`✅ Naya admin create ho gaya!`);
  }

  console.log(`\n📋 Login Details:`);
  console.log(`   Username : ${USERNAME}`);
  console.log(`   Password : ${PASSWORD}`);
  console.log(`\n🌐 App kholein: http://localhost:5173`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
