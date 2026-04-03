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
    console.log("\nLogin: http://localhost:5173");
    return;
  }

  console.log("📦 Setting up new system...\n");
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
          fatRatePerKg: 800.0,
          snfRatePerKg: 533.0,
          minRatePerLiter: 40.0,
          useMinRate: true,
          milkType: "mixed",
        },
      },
      admins: {
        create: { username: "admin", password: adminHash, name: "Dairy Admin", language: "hinglish" },
      },
    },
  });

  console.log("✅ Admin: admin / dairy@1234");
  console.log("\n========================================");
  console.log("🎉 Migration complete!\n");
  console.log("   Admin Login  → admin / dairy@1234");
  console.log("   Super Admin  → superadmin / super@1234");
  console.log("\n   Rate Formula (Rajasthan Standard):");
  console.log("   Fat Rate: ₹800/kg fat");
  console.log("   SNF Rate: ₹533/kg SNF");
  console.log("   Min Rate: ₹40/liter");
  console.log("========================================\n");
}

main()
  .catch(e => { console.error("❌ Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
