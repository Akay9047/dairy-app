import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// Farmer-wise report — FIXED: dairyId filter added
router.get("/farmer/:farmerId", async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = req.query;
    const dairyId = req.dairyId!;

    // Verify farmer belongs to this dairy
    const farmer = await prisma.farmer.findFirst({
      where: { id: req.params.farmerId, dairyId },
    });
    if (!farmer) return res.status(404).json({ error: "Farmer nahi mila" });

    const entries = await prisma.milkEntry.findMany({
      where: {
        farmerId: req.params.farmerId,
        dairyId, // ← CRITICAL FIX
        ...(from || to ? { date: {
          ...(from ? { gte: new Date(String(from)) } : {}),
          ...(to ? { lte: new Date(String(to)) } : {}),
        }} : {}),
      },
      orderBy: { date: "desc" },
    });

    // Payment info
    const payments = await prisma.payment.findMany({
      where: { farmerId: req.params.farmerId, dairyId },
      orderBy: { paidAt: "desc" },
    });

    const totalEarned = entries.reduce((s, e) => s + e.totalAmount, 0);
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

    res.json({
      farmer,
      entries,
      payments,
      totals: {
        liters: entries.reduce((s, e) => s + e.liters, 0),
        amount: totalEarned,
        paid: totalPaid,
        pending: totalEarned - totalPaid,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "Report load nahi hua" });
  }
});

// Monthly summary — FIXED: dairyId filter added
router.get("/monthly", async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;
    const dairyId = req.dairyId!;
    const m = parseInt(String(month ?? new Date().getMonth() + 1));
    const y = parseInt(String(year ?? new Date().getFullYear()));
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const entries = await prisma.milkEntry.findMany({
      where: { dairyId, date: { gte: start, lte: end } }, // ← CRITICAL FIX
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

    const summary = Object.values(farmerMap).sort((a, b) => a.farmerName.localeCompare(b.farmerName));
    const totals = summary.reduce((acc, f) => ({ liters: acc.liters + f.liters, amount: acc.amount + f.amount }), { liters: 0, amount: 0 });

    res.json({ summary, totals, month: m, year: y, totalEntries: entries.length });
  } catch {
    res.status(500).json({ error: "Monthly report load nahi hua" });
  }
});

// Weekly summary — NEW
router.get("/weekly", async (req: AuthRequest, res: Response) => {
  try {
    const dairyId = req.dairyId!;
    const { from, to } = req.query;
    const end = to ? new Date(String(to)) : new Date();
    const start = from ? new Date(String(from)) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

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

    // Group by date
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
        liters: entries.reduce((s, e) => s + e.liters, 0),
        amount: totalEarned,
        paid: totalPaid,
        pending: totalEarned - totalPaid,
        count: entries.length,
      },
      from: start,
      to: end,
    });
  } catch {
    res.status(500).json({ error: "Weekly report load nahi hua" });
  }
});

// CSV export — FIXED: dairyId filter added
router.get("/export/csv", async (req: AuthRequest, res: Response) => {
  try {
    const { from, to, farmerId } = req.query;
    const dairyId = req.dairyId!;

    const entries = await prisma.milkEntry.findMany({
      where: {
        dairyId, // ← CRITICAL FIX
        ...(farmerId ? { farmerId: String(farmerId) } : {}),
        ...(from || to ? { date: {
          ...(from ? { gte: new Date(String(from)) } : {}),
          ...(to ? { lte: new Date(String(to)) } : {}),
        }} : {}),
      },
      include: { farmer: true },
      orderBy: { date: "desc" },
    });

    const headers = ["Date", "Time", "Shift", "Farmer Name", "Farmer Code", "Village", "Mobile", "Liters", "Fat %", "SNF %", "Fat Amount", "SNF Amount", "Rate/Liter", "Total Amount"];
    const rows = entries.map(e => [
      new Date(e.date).toLocaleDateString("en-IN"),
      new Date(e.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      e.shift === "MORNING" ? "Subah" : "Shaam",
      e.farmer.name, e.farmer.code, e.farmer.village, e.farmer.mobile,
      e.liters.toFixed(2), e.fatPercent.toFixed(1), e.snfPercent.toFixed(2),
      e.fatAmount.toFixed(2), e.snfAmount.toFixed(2),
      e.ratePerLiter.toFixed(2), e.totalAmount.toFixed(2),
    ]);

    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="dairy-report-${Date.now()}.csv"`);
    res.send("\uFEFF" + csv); // BOM for Excel Hindi support
  } catch {
    res.status(500).json({ error: "CSV export nahi hua" });
  }
});

export default router;