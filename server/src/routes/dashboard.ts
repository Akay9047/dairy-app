import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const dairyId = req.dairyId!;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalFarmers, todayEntries, monthEntries, recentEntries, rateConfig] = await Promise.all([
      prisma.farmer.count({ where: { dairyId, isActive: true } }),
      prisma.milkEntry.aggregate({
        where: { dairyId, date: { gte: todayStart } },
        _sum: { liters: true, totalAmount: true },
        _count: true,
      }),
      prisma.milkEntry.aggregate({
        where: { dairyId, date: { gte: monthStart } },
        _sum: { liters: true, totalAmount: true },
        _count: true,
      }),
      prisma.milkEntry.findMany({
        where: { dairyId },
        take: 8,
        orderBy: { date: "desc" },
        include: { farmer: { select: { name: true, code: true, village: true } } },
      }),
      prisma.rateConfig.findUnique({ where: { dairyId } }),
    ]);

    res.json({
      totalFarmers,
      todayMilk: todayEntries._sum.liters ?? 0,
      todayAmount: todayEntries._sum.totalAmount ?? 0,
      todayCount: todayEntries._count,
      monthMilk: monthEntries._sum.liters ?? 0,
      monthAmount: monthEntries._sum.totalAmount ?? 0,
      monthCount: monthEntries._count,
      recentEntries,
      rateConfig,
    });
  } catch (err: any) { res.status(500).json({ error: "Stats load nahi hue" }); }
});

router.get("/chart", async (req: AuthRequest, res: Response) => {
  try {
    const dairyId = req.dairyId!;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const entries = await prisma.milkEntry.findMany({
      where: { dairyId, date: { gte: sixMonthsAgo } },
      select: { date: true, liters: true, totalAmount: true },
      orderBy: { date: "asc" },
    });

    const monthly: Record<string, { liters: number; amount: number; label: string }> = {};
    entries.forEach(e => {
      const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
      const label = e.date.toLocaleString("en-IN", { month: "short", year: "2-digit" });
      if (!monthly[key]) monthly[key] = { liters: 0, amount: 0, label };
      monthly[key].liters += e.liters;
      monthly[key].amount += e.totalAmount;
    });

    res.json(Object.values(monthly));
  } catch { res.status(500).json({ error: "Chart data load nahi hua" }); }
});

export default router;
