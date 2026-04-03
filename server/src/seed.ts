import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // Create admin
  const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || "dairy@1234", 10);
  await prisma.admin.upsert({
    where: { username: process.env.ADMIN_USERNAME || "admin" },
    update: {},
    create: {
      username: process.env.ADMIN_USERNAME || "admin",
      password: hashed,
      name: process.env.ADMIN_NAME || "Dairy Admin",
    },
  });

  // Sample farmers
  const farmers = [
    { name: "Ramesh Kumar", mobile: "9876543210", code: "RK001", village: "Sikar" },
    { name: "Suresh Sharma", mobile: "9876543211", code: "SS002", village: "Fatehpur" },
    { name: "Mahesh Yadav", mobile: "9876543212", code: "MY003", village: "Laxmangarh" },
    { name: "Dinesh Meena", mobile: "9876543213", code: "DM004", village: "Neem Ka Thana" },
    { name: "Ganesh Patel", mobile: "9876543214", code: "GP005", village: "Jhunjhunu" },
  ];

  for (const f of farmers) {
    await prisma.farmer.upsert({
      where: { code: f.code },
      update: {},
      create: f,
    });
  }

  console.log("✅ Seed complete! Admin:", process.env.ADMIN_USERNAME || "admin");
  console.log("🔑 Password:", process.env.ADMIN_PASSWORD || "dairy@1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
