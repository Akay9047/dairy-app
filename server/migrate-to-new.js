const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const prisma = new PrismaClient();

async function main() {
  console.log("\n🐄 Dairy App - Migration to New System");
  console.log("=======================================\n");

  const saCount = await prisma.superAdmin.count();
  if (saCount > 0) {
    console.log("✅ Already migrated!\n");
    const admins = await prisma.admin.findMany({ include: { dairy: true } });
    admins.forEach(a => console.log(`  Admin: ${a.username} | Dairy: ${a.dairy.name}`));
    return;
  }

  const saHash = await bcrypt.hash("super@1234", 10);
  const superAdmin = await prisma.superAdmin.create({
    data: { username: "superadmin", password: saHash, name: "Super Admin" },
  });
  console.log("✅ Super Admin: superadmin / super@1234");

  const adminHash = await bcrypt.hash("dairy@1234", 10);
  await prisma.dairy.create({
    data: {
      name: "Main Dairy", ownerName: "Dairy Admin", mobile: "9999999999",
      superAdminId: superAdmin.id, isActive: true,
      rateConfig: {
        create: {
          rateType: "fat",
          fatRatePerKg: 800, snfRatePerKg: 533,
          minRatePerLiter: 40, useMinRate: true,
          buffaloFatRate: 800, cowFatRate: 600,
          buffaloSnfRate: 533, cowSnfRate: 400,
          buffaloFixedRate: 60, cowFixedRate: 40,
        },
      },
      admins: {
        create: { username: "admin", password: adminHash, name: "Dairy Admin", language: "hinglish" },
      },
    },
  });

  console.log("✅ Admin: admin / dairy@1234");
  console.log("\n🎉 Migration complete!");
  console.log("   Admin    → admin / dairy@1234");
  console.log("   SuperAdmin → superadmin / super@1234\n");
}

main()
  .catch(e => { console.error("❌ Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
