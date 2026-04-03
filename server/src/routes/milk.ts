import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { calculateRates, DEFAULT_RATE_CONFIG, RateConfig } from "../lib/rateCalc";

const router = Router();
router.use(authMiddleware);

async function getRateConfig(dairyId: string): Promise<RateConfig> {
  const config = await prisma.rateConfig.findUnique({ where: { dairyId } });
  if (!config) return DEFAULT_RATE_CONFIG;
  return {
    fatRatePerKg: config.fatRatePerKg,
    snfRatePerKg: config.snfRatePerKg,
    minRatePerLiter: config.minRatePerLiter,
    useMinRate: config.useMinRate,
    milkType: (config.milkType as "cow" | "buffalo" | "mixed") ?? "mixed",
  };
}

const MilkSchema = z.object({
  farmerId: z.string().uuid(),
  date: z.string(),
  shift: z.enum(["MORNING", "EVENING"]).default("MORNING"),
  liters: z.number().positive("Liters positive hona chahiye").max(500),
  fatPercent: z.number().min(0.1, "Fat % 0.1 se zyada hona chahiye").max(15),
});

// IMPORTANT: All queries filter by dairyId — data isolation guaranteed
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { farmerId, from, to, shift, page = "1", limit = "50" } = req.query;
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    const where = {
      dairyId: req.dairyId!, // ← Security: only this dairy's data
      ...(farmerId ? { farmerId: String(farmerId) } : {}),
      ...(shift ? { shift: String(shift) as "MORNING" | "EVENING" } : {}),
      ...(from || to ? { date: {
        ...(from ? { gte: new Date(String(from)) } : {}),
        ...(to ? { lte: new Date(String(to)) } : {}),
      }} : {}),
    };
    const [entries, total] = await Promise.all([
      prisma.milkEntry.findMany({
        where, skip, take: parseInt(String(limit)),
        include: { farmer: { select: { name: true, code: true, mobile: true, village: true } } },
        orderBy: { date: "desc" },
      }),
      prisma.milkEntry.count({ where }),
    ]);
    res.json({ entries, total, page: parseInt(String(page)) });
  } catch (err: any) { res.status(500).json({ error: "Entries load nahi hui" }); }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    // dairyId check ensures no cross-dairy access
    const entry = await prisma.milkEntry.findFirst({
      where: { id: req.params.id, dairyId: req.dairyId! },
      include: { farmer: true },
    });
    if (!entry) return res.status(404).json({ error: "Entry nahi mili" });
    res.json(entry);
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const data = MilkSchema.parse(req.body);

    // Verify farmer belongs to this dairy
    const farmer = await prisma.farmer.findFirst({
      where: { id: data.farmerId, dairyId: req.dairyId! },
    });
    if (!farmer) return res.status(403).json({ error: "Yeh kisaan aapki dairy ka nahi hai" });

    const config = await getRateConfig(req.dairyId!);
    const calc = calculateRates(data.liters, data.fatPercent, config);

    const entry = await prisma.milkEntry.create({
      data: {
        farmerId: data.farmerId,
        dairyId: req.dairyId!,
        date: new Date(data.date),
        shift: data.shift,
        liters: data.liters,
        fatPercent: data.fatPercent,
        snfPercent: calc.snfPercent,
        fatKg: calc.fatKg,
        snfKg: calc.snfKg,
        fatAmount: calc.fatAmount,
        snfAmount: calc.snfAmount,
        ratePerLiter: calc.ratePerLiter,
        totalAmount: calc.totalAmount,
      },
      include: { farmer: true },
    });
    res.status(201).json(entry);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Entry save nahi hui" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const data = MilkSchema.partial().parse(req.body);
    const existing = await prisma.milkEntry.findFirst({
      where: { id: req.params.id, dairyId: req.dairyId! },
    });
    if (!existing) return res.status(404).json({ error: "Entry nahi mili" });

    const liters = data.liters ?? existing.liters;
    const fatPercent = data.fatPercent ?? existing.fatPercent;
    const config = await getRateConfig(req.dairyId!);
    const calc = calculateRates(liters, fatPercent, config);

    const entry = await prisma.milkEntry.update({
      where: { id: req.params.id },
      data: {
        ...(data.farmerId ? { farmerId: data.farmerId } : {}),
        ...(data.date ? { date: new Date(data.date) } : {}),
        ...(data.shift ? { shift: data.shift } : {}),
        liters, fatPercent,
        snfPercent: calc.snfPercent,
        fatKg: calc.fatKg, snfKg: calc.snfKg,
        fatAmount: calc.fatAmount, snfAmount: calc.snfAmount,
        ratePerLiter: calc.ratePerLiter, totalAmount: calc.totalAmount,
      },
      include: { farmer: true },
    });
    res.json(entry);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Update nahi hua" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.milkEntry.findFirst({
      where: { id: req.params.id, dairyId: req.dairyId! },
    });
    if (!entry) return res.status(404).json({ error: "Entry nahi mili ya access nahi hai" });
    await prisma.milkEntry.delete({ where: { id: req.params.id } });
    res.json({ message: "Entry delete ho gayi" });
  } catch { res.status(500).json({ error: "Delete nahi hua" }); }
});

export default router;
