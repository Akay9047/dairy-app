import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// GET all payments — dairyId filtered
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

// GET dues — earned vs paid per farmer
router.get("/dues", async (req: AuthRequest, res: Response) => {
  try {
    const dairyId = req.dairyId!;
    const farmers = await prisma.farmer.findMany({
      where: { dairyId, isActive: true },
      include: {
        milkEntries: { where: { dairyId }, select: { totalAmount: true, date: true } },
        payments: { where: { dairyId }, select: { amount: true, paidAt: true } },
      },
    });

    const dues = farmers.map(f => {
      const totalEarned = f.milkEntries.reduce((s, e) => s + e.totalAmount, 0);
      const totalPaid = f.payments.reduce((s, p) => s + p.amount, 0);
      const pending = totalEarned - totalPaid;
      const lastEntry = f.milkEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const lastPayment = f.payments.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())[0];
      return {
        farmerId: f.id,
        farmerName: f.name,
        farmerCode: f.code,
        village: f.village,
        mobile: f.mobile,
        totalEarned: parseFloat(totalEarned.toFixed(2)),
        totalPaid: parseFloat(totalPaid.toFixed(2)),
        pending: parseFloat(pending.toFixed(2)),
        lastEntryDate: lastEntry?.date ?? null,
        lastPaymentDate: lastPayment?.paidAt ?? null,
      };
    }).filter(d => d.totalEarned > 0).sort((a, b) => b.pending - a.pending);

    const totalPending = dues.reduce((s, d) => s + d.pending, 0);
    const totalEarned = dues.reduce((s, d) => s + d.totalEarned, 0);
    const totalPaid = dues.reduce((s, d) => s + d.totalPaid, 0);

    res.json({
      dues,
      totalPending: parseFloat(totalPending.toFixed(2)),
      totalEarned: parseFloat(totalEarned.toFixed(2)),
      totalPaid: parseFloat(totalPaid.toFixed(2)),
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET daily summary
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
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST create payment
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const data = z.object({
      farmerId: z.string().uuid(),
      amount: z.number().positive(),
      note: z.string().optional(),
      paidAt: z.string().optional(),
    }).parse(req.body);

    // Verify farmer belongs to this dairy
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