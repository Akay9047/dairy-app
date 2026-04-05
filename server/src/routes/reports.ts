import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, adminOnly, AuthRequest } from "../middleware/auth";
import { heavyLimiter } from "../lib/rateLimiter";

const router = Router();
router.use(authMiddleware, adminOnly);

// Farmer report
router.get("/farmer/:farmerId", async (req: AuthRequest, res: Response) => {
  try {
    const dairyId = req.dairyId!;
    const { from, to } = req.query;

    const farmer = await prisma.farmer.findFirst({
      where: { id: req.params.farmerId, dairyId },
    });
    if (!farmer) return res.status(404).json({ error: "Farmer nahi mila" });

    const dateFilter = from || to ? {
      date: {
        ...(from ? { gte: new Date(String(from)) } : {}),
        ...(to ? { lte: new Date(String(to)) } : {}),
      },
    } : {};

    const [entries, payments] = await Promise.all([
      prisma.milkEntry.findMany({
        where: { farmerId: req.params.farmerId, dairyId, ...dateFilter },
        orderBy: { date: "desc" },
        take: 500, // max 500 entries per report
      }),
      prisma.payment.findMany({
        where: { farmerId: req.params.farmerId, dairyId },
        orderBy: { paidAt: "desc" },
      }),
    ]);

    const totalEarned = entries.reduce((s, e) => s + e.totalAmount, 0);
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

    res.json({
      farmer,
      entries,
      payments,
      totals: {
        liters: parseFloat(entries.reduce((s, e) => s + e.liters, 0).toFixed(2)),
        amount: parseFloat(totalEarned.toFixed(2)),
        paid: parseFloat(totalPaid.toFixed(2)),
        pending: parseFloat((totalEarned - totalPaid).toFixed(2)),
        entries: entries.length,
      },
    });
  } catch { res.status(500).json({ error: "Report load nahi hua" }); }
});

// Monthly summary
router.get("/monthly", heavyLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const dairyId = req.dairyId!;
    const { month, year } = req.query;
    const m = parseInt(String(month ?? new Date().getMonth() + 1));
    const y = parseInt(String(year ?? new Date().getFullYear()));

    if (m < 1 || m > 12 || y < 2020 || y > 2100) {
      return res.status(400).json({ error: "Invalid month or year" });
    }

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const entries = await prisma.milkEntry.findMany({
      where: { dairyId, date: { gte: start, lte: end } },
      include: { farmer: { select: { name: true, code: true, village: true } } },
      orderBy: { date: "asc" },
    });

    const farmerMap: Record<string, {
      farmerName: string; farmerCode: string; village: string;
      entries: number; liters: number; amount: number;
    }> = {};

    entries.forEach(e => {
      if (!farmerMap[e.farmerId]) {
        farmerMap[e.farmerId] = {
          farmerName: e.farmer.name, farmerCode: e.farmer.code,
          village: e.farmer.village, entries: 0, liters: 0, amount: 0,
        };
      }
      farmerMap[e.farmerId].entries += 1;
      farmerMap[e.farmerId].liters += e.liters;
      farmerMap[e.farmerId].amount += e.totalAmount;
    });

    const summary = Object.values(farmerMap)
      .map(f => ({ ...f, liters: parseFloat(f.liters.toFixed(2)), amount: parseFloat(f.amount.toFixed(2)) }))
      .sort((a, b) => a.farmerName.localeCompare(b.farmerName));

    const totals = summary.reduce((acc, f) => ({
      liters: acc.liters + f.liters,
      amount: acc.amount + f.amount,
    }), { liters: 0, amount: 0 });

    res.json({ summary, totals, month: m, year: y, totalEntries: entries.length });
  } catch { res.status(500).json({ error: "Monthly report load nahi hua" }); }
});

// Weekly report
router.get("/weekly", async (req: AuthRequest, res: Response) => {
  try {
    const dairyId = req.dairyId!;
    const { from, to } = req.query;
    const end = to ? new Date(String(to)) : new Date();
    const start = from ? new Date(String(from)) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Max 31 days
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 31) return res.status(400).json({ error: "Max 31 days range allowed" });

    const [entries, payments] = await Promise.all([
      prisma.milkEntry.findMany({
        where: { dairyId, date: { gte: start, lte: end } },
        include: { farmer: { select: { name: true, code: true, village: true } } },
        orderBy: { date: "desc" },
      }),
      prisma.payment.findMany({
        where: { dairyId, paidAt: { gte: start, lte: end } },
        include: { farmer: { select: { name: true, code: true } } },
        orderBy: { paidAt: "desc" },
      }),
    ]);

    const dailyMap: Record<string, { date: string; liters: number; amount: number; count: number }> = {};
    entries.forEach(e => {
      const key = new Date(e.date).toLocaleDateString("en-IN");
      if (!dailyMap[key]) dailyMap[key] = { date: key, liters: 0, amount: 0, count: 0 };
      dailyMap[key].liters += e.liters;
      dailyMap[key].amount += e.totalAmount;
      dailyMap[key].count += 1;
    });

    const totalEarned = entries.reduce((s, e) => s + e.totalAmount, 0);
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

    res.json({
      entries,
      daily: Object.values(dailyMap),
      payments,
      totals: {
        liters: parseFloat(entries.reduce((s, e) => s + e.liters, 0).toFixed(2)),
        amount: parseFloat(totalEarned.toFixed(2)),
        paid: parseFloat(totalPaid.toFixed(2)),
        pending: parseFloat((totalEarned - totalPaid).toFixed(2)),
        count: entries.length,
      },
      from: start, to: end,
    });
  } catch { res.status(500).json({ error: "Weekly report load nahi hua" }); }
});

// CSV export — with limits
router.get("/export/csv", heavyLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { from, to, farmerId } = req.query;
    const dairyId = req.dairyId!;

    // Enforce date range for exports
    if (!from || !to) {
      return res.status(400).json({ error: "CSV export ke liye from aur to date zaroori hai" });
    }

    const start = new Date(String(from));
    const end = new Date(String(to));
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 90) return res.status(400).json({ error: "CSV export max 90 days ka hoga" });

    const entries = await prisma.milkEntry.findMany({
      where: {
        dairyId,
        ...(farmerId ? { farmerId: String(farmerId) } : {}),
        date: { gte: start, lte: end },
      },
      include: { farmer: true },
      orderBy: { date: "desc" },
      take: 5000, // max 5000 rows
    });

    const headers = ["Date", "Time", "Shift", "Farmer Name", "Code", "Village", "Mobile", "Liters", "Fat %", "SNF %", "Rate/Liter", "Total Amount"];
    const rows = entries.map(e => [
      new Date(e.date).toLocaleDateString("en-IN"),
      new Date(e.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      e.shift === "MORNING" ? "Subah" : "Shaam",
      e.farmer.name, e.farmer.code, e.farmer.village, e.farmer.mobile,
      e.liters.toFixed(2), e.fatPercent.toFixed(1), e.snfPercent.toFixed(2),
      e.ratePerLiter.toFixed(2), e.totalAmount.toFixed(2),
    ]);

    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="dairy-report-${Date.now()}.csv"`);
    res.send("\uFEFF" + csv);
  } catch { res.status(500).json({ error: "CSV export nahi hua" }); }
});

export default router;