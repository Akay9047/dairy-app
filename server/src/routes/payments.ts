import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware, adminOnly, AuthRequest } from "../middleware/auth";
import { heavyLimiter } from "../lib/rateLimiter";

const router = Router();
router.use(authMiddleware, adminOnly);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { farmerId } = req.query;
    const payments = await prisma.payment.findMany({
      where: {
        dairyId: req.dairyId!,
        ...(farmerId ? { farmerId: String(farmerId) } : {}),
      },
      include: { farmer: { select: { name: true, code: true, village: true } } },
      orderBy: { paidAt: "desc" },
      take: 200,
    });
    res.json(payments);
  } catch { res.status(500).json({ error: "Payments load nahi hue" }); }
});

// FIXED: SQL aggregation instead of loading all records in memory
router.get("/dues", heavyLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const dairyId = req.dairyId!;

    const dues = await prisma.$queryRaw<Array<{
      farmerId: string;
      farmerName: string;
      farmerCode: string;
      village: string;
      mobile: string;
      totalEarned: number;
      totalPaid: number;
      pending: number;
    }>>`
      SELECT
        f.id as "farmerId",
        f.name as "farmerName",
        f.code as "farmerCode",
        f.village,
        f.mobile,
        COALESCE(SUM(me."totalAmount"), 0)::float as "totalEarned",
        COALESCE((SELECT SUM(p.amount) FROM "Payment" p WHERE p."farmerId" = f.id AND p."dairyId" = ${dairyId}), 0)::float as "totalPaid",
        COALESCE(SUM(me."totalAmount"), 0)::float - COALESCE((SELECT SUM(p.amount) FROM "Payment" p WHERE p."farmerId" = f.id AND p."dairyId" = ${dairyId}), 0)::float as "pending"
      FROM "Farmer" f
      LEFT JOIN "MilkEntry" me ON me."farmerId" = f.id AND me."dairyId" = ${dairyId}
      WHERE f."dairyId" = ${dairyId} AND f."isActive" = true
      GROUP BY f.id, f.name, f.code, f.village, f.mobile
      HAVING COALESCE(SUM(me."totalAmount"), 0) > 0
      ORDER BY "pending" DESC
    `;

    const totalPending = dues.reduce((s, d) => s + Number(d.pending), 0);
    const totalEarned = dues.reduce((s, d) => s + Number(d.totalEarned), 0);
    const totalPaid = dues.reduce((s, d) => s + Number(d.totalPaid), 0);

    res.json({
      dues: dues.map(d => ({
        ...d,
        totalEarned: parseFloat(Number(d.totalEarned).toFixed(2)),
        totalPaid: parseFloat(Number(d.totalPaid).toFixed(2)),
        pending: parseFloat(Number(d.pending).toFixed(2)),
      })),
      totalPending: parseFloat(totalPending.toFixed(2)),
      totalEarned: parseFloat(totalEarned.toFixed(2)),
      totalPaid: parseFloat(totalPaid.toFixed(2)),
    });
  } catch (err: any) {
    res.status(500).json({ error: "Dues load nahi hue" });
  }
});

router.get("/daily-summary", async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query;
    const dairyId = req.dairyId!;
    const d = date ? new Date(String(date)) : new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

    const [milkData, paymentData] = await Promise.all([
      prisma.milkEntry.aggregate({
        where: { dairyId, date: { gte: start, lte: end } },
        _sum: { liters: true, totalAmount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { dairyId, paidAt: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    res.json({
      date: start,
      milkCollected: milkData._sum.liters ?? 0,
      milkAmount: milkData._sum.totalAmount ?? 0,
      milkEntries: milkData._count,
      paymentsMade: paymentData._sum.amount ?? 0,
      paymentCount: paymentData._count,
    });
  } catch { res.status(500).json({ error: "Summary load nahi hua" }); }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const data = z.object({
      farmerId: z.string().uuid(),
      amount: z.number().positive().max(10000000),
      note: z.string().max(200).optional(),
      paidAt: z.string().optional(),
    }).parse(req.body);

    const farmer = await prisma.farmer.findFirst({
      where: { id: data.farmerId, dairyId: req.dairyId! },
    });
    if (!farmer) return res.status(403).json({ error: "Yeh kisaan aapki dairy ka nahi hai" });

    const payment = await prisma.payment.create({
      data: {
        farmerId: data.farmerId,
        dairyId: req.dairyId!,
        amount: data.amount,
        note: data.note,
        paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
      },
      include: { farmer: true },
    });
    res.status(201).json(payment);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Payment save nahi hua" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.payment.findFirst({
      where: { id: req.params.id, dairyId: req.dairyId! },
    });
    if (!existing) return res.status(404).json({ error: "Payment nahi mila" });
    await prisma.payment.delete({ where: { id: req.params.id } });
    res.json({ message: "Payment delete ho gaya" });
  } catch { res.status(500).json({ error: "Delete nahi hua" }); }
});

export default router;