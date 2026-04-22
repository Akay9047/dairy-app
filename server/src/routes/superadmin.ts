import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { authMiddleware, superAdminOnly, AuthRequest } from "../middleware/auth";

const router = Router();

const DEFAULT_RATE = {
  pricingMode: "fat_only",
  fatRate: 0.33,
  snfRate: 0.07,
  buffaloFixedRate: 60,
  cowFixedRate: 40,
  minRatePerLiter: 25,
  useMinRate: false,
  autoCalcSnf: true,
};

router.post("/setup", async (req: any, res: Response) => {
  try {
    const saCount = await prisma.superAdmin.count();
    if (saCount > 0) return res.status(400).json({ error: "Already setup ho chuka hai" });
    const { username = "superadmin", password = "super@1234", name = "Super Admin",
      dairyName = "Main Dairy", ownerName = "Admin", mobile = "9999999999",
      adminUsername = "admin", adminPassword = "dairy@1234" } = req.body;
    const saHash = await bcrypt.hash(password, 12);
    const adminHash = await bcrypt.hash(adminPassword, 12);
    const sa = await prisma.superAdmin.create({ data: { username, password: saHash, name } });
    await prisma.dairy.create({
      data: {
        name: dairyName, ownerName, mobile, superAdminId: sa.id, isActive: true,
        rateConfig: { create: DEFAULT_RATE },
        admins: { create: { username: adminUsername, password: adminHash, name: ownerName, language: "hinglish" } },
      },
    });
    res.json({ message: "Setup done!", superAdmin: { username, password }, admin: { username: adminUsername, password: adminPassword } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.use(authMiddleware, superAdminOnly);

router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const [totalDairies, activeDairies, totalFarmers, monthData, todayData] = await Promise.all([
      prisma.dairy.count({ where: { superAdminId: req.superAdminId } }),
      prisma.dairy.count({ where: { superAdminId: req.superAdminId, isActive: true } }),
      prisma.farmer.count({ where: { dairy: { superAdminId: req.superAdminId }, isActive: true } }),
      prisma.milkEntry.aggregate({
        where: { dairy: { superAdminId: req.superAdminId }, date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
        _sum: { liters: true, totalAmount: true },
      }),
      prisma.milkEntry.aggregate({
        where: { dairy: { superAdminId: req.superAdminId }, date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        _sum: { liters: true, totalAmount: true }, _count: true,
      }),
    ]);
    res.json({
      totalDairies, activeDairies, totalFarmers,
      monthMilk: monthData._sum.liters ?? 0, monthAmount: monthData._sum.totalAmount ?? 0,
      todayMilk: todayData._sum.liters ?? 0, todayAmount: todayData._sum.totalAmount ?? 0,
      todayEntries: todayData._count,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/dairies", async (req: AuthRequest, res: Response) => {
  try {
    const dairies = await prisma.dairy.findMany({
      where: { superAdminId: req.superAdminId },
      include: {
        admins: { select: { id: true, username: true, name: true } },
        rateConfig: true,
        _count: { select: { farmers: true, milkEntries: true, payments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(dairies);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/dairies/:id", async (req: AuthRequest, res: Response) => {
  try {
    const dairy = await prisma.dairy.findFirst({
      where: { id: req.params.id, superAdminId: req.superAdminId },
      include: {
        admins: { select: { id: true, username: true, name: true } },
        rateConfig: true,
        farmers: { where: { isActive: true }, orderBy: { name: "asc" } },
        _count: { select: { farmers: true, milkEntries: true, payments: true } },
      },
    });
    if (!dairy) return res.status(404).json({ error: "Dairy nahi mili" });
    res.json(dairy);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/dairies/:id/report", async (req: AuthRequest, res: Response) => {
  try {
    const dairy = await prisma.dairy.findFirst({ where: { id: req.params.id, superAdminId: req.superAdminId } });
    if (!dairy) return res.status(404).json({ error: "Dairy nahi mili" });
    const { period } = req.query;
    const end = new Date();
    const start = period === "week"
      ? new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [milkData, paymentData, farmerCount, entries] = await Promise.all([
      prisma.milkEntry.aggregate({
        where: { dairyId: req.params.id, date: { gte: start, lte: end } },
        _sum: { liters: true, totalAmount: true }, _count: true,
        _avg: { fatPercent: true, ratePerLiter: true },
      }),
      prisma.payment.aggregate({
        where: { dairyId: req.params.id, paidAt: { gte: start, lte: end } },
        _sum: { amount: true }, _count: true,
      }),
      prisma.farmer.count({ where: { dairyId: req.params.id, isActive: true } }),
      prisma.milkEntry.findMany({
        where: { dairyId: req.params.id, date: { gte: start, lte: end } },
        include: { farmer: { select: { name: true, code: true } } },
        orderBy: { date: "desc" }, take: 50,
      }),
    ]);
    const earned = milkData._sum.totalAmount ?? 0;
    const paid = paymentData._sum.amount ?? 0;
    res.json({
      dairy: { id: dairy.id, name: dairy.name, ownerName: dairy.ownerName },
      period: { from: start, to: end }, farmers: farmerCount,
      milk: { liters: milkData._sum.liters ?? 0, amount: earned, entries: milkData._count, avgFat: milkData._avg.fatPercent ?? 0, avgRate: milkData._avg.ratePerLiter ?? 0 },
      payments: { paid, count: paymentData._count },
      balance: { earned, paid, pending: earned - paid },
      recentEntries: entries,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/dairies", async (req: AuthRequest, res: Response) => {
  try {
    const { name, ownerName, mobile, address, adminUsername, adminPassword } = req.body;
    if (!name || !ownerName || !mobile || !adminUsername || !adminPassword)
      return res.status(400).json({ error: "Saari zaroori details bharein" });
    const hashed = await bcrypt.hash(adminPassword, 12);
    const dairy = await prisma.dairy.create({
      data: {
        name, ownerName, mobile, address,
        superAdminId: req.superAdminId!, isActive: true,
        rateConfig: { create: DEFAULT_RATE },
        admins: { create: { username: adminUsername, password: hashed, name: ownerName, language: "hinglish" } },
      },
      include: { admins: { select: { username: true } }, rateConfig: true },
    });
    res.status(201).json({ dairy, message: "Dairy + admin create ho gaya! 🎉" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put("/dairies/:id", async (req: AuthRequest, res: Response) => {
  try {
    const dairy = await prisma.dairy.findFirst({ where: { id: req.params.id, superAdminId: req.superAdminId } });
    if (!dairy) return res.status(404).json({ error: "Dairy nahi mili" });
    const { name, ownerName, mobile, address } = req.body;
    const updated = await prisma.dairy.update({ where: { id: req.params.id }, data: { name, ownerName, mobile, address } });
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch("/dairies/:id/toggle", async (req: AuthRequest, res: Response) => {
  try {
    const dairy = await prisma.dairy.findFirst({ where: { id: req.params.id, superAdminId: req.superAdminId } });
    if (!dairy) return res.status(404).json({ error: "Dairy nahi mili" });
    const updated = await prisma.dairy.update({ where: { id: req.params.id }, data: { isActive: !dairy.isActive } });
    res.json({ isActive: updated.isActive, message: updated.isActive ? "✅ Access de diya" : "🔒 Access band kar diya" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete("/dairies/:id", async (req: AuthRequest, res: Response) => {
  try {
    const dairy = await prisma.dairy.findFirst({ where: { id: req.params.id, superAdminId: req.superAdminId } });
    if (!dairy) return res.status(404).json({ error: "Dairy nahi mili" });
    await prisma.dairy.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: "Dairy band kar di gayi. Data safe hai." });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put("/dairies/:id/rates", async (req: AuthRequest, res: Response) => {
  try {
    const dairy = await prisma.dairy.findFirst({ where: { id: req.params.id, superAdminId: req.superAdminId } });
    if (!dairy) return res.status(404).json({ error: "Dairy nahi mili" });
    const { pricingMode, fatRate, snfRate, buffaloFixedRate, cowFixedRate, minRatePerLiter, useMinRate, autoCalcSnf } = req.body;
    const config = await prisma.rateConfig.upsert({
      where: { dairyId: req.params.id },
      update: { pricingMode, fatRate, snfRate, buffaloFixedRate, cowFixedRate, minRatePerLiter, useMinRate, autoCalcSnf },
      create: { dairyId: req.params.id, ...DEFAULT_RATE, pricingMode, fatRate, snfRate, buffaloFixedRate, cowFixedRate, minRatePerLiter, useMinRate, autoCalcSnf },
    });
    res.json(config);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch("/dairies/:dairyId/admin/:adminId/password", async (req: AuthRequest, res: Response) => {
  try {
    const dairy = await prisma.dairy.findFirst({ where: { id: req.params.dairyId, superAdminId: req.superAdminId } });
    if (!dairy) return res.status(404).json({ error: "Dairy nahi mili" });
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: "Password kam se kam 6 characters" });
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.admin.update({ where: { id: req.params.adminId }, data: { password: hashed } });
    res.json({ message: "Password change ho gaya! ✅" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;