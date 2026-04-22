import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware, adminOnly, AuthRequest } from "../middleware/auth";
import { calcRates, DEFAULT_CONFIG, RateConfig } from "../lib/rateCalc";

const router = Router();
router.use(authMiddleware, adminOnly);

async function getRateConfig(dairyId: string): Promise<RateConfig> {
  const c = await prisma.rateConfig.findUnique({ where: { dairyId } });
  if (!c) return DEFAULT_CONFIG;
  return {
    pricingMode: ((c as any).pricingMode ?? "fat_only") as "fat_only" | "fat_snf" | "fixed",
    fatRate: (c as any).fatRate ?? 0.33,
    snfRate: (c as any).snfRate ?? 0.07,
    buffaloFixedRate: c.buffaloFixedRate,
    cowFixedRate: c.cowFixedRate,
    minRatePerLiter: c.minRatePerLiter,
    useMinRate: c.useMinRate,
    autoCalcSnf: (c as any).autoCalcSnf ?? true,
  };
}

const MilkSchema = z.object({
  farmerId: z.string().uuid(),
  date: z.string(),
  shift: z.enum(["MORNING", "EVENING"]).default("MORNING"),
  milkType: z.enum(["BUFFALO", "COW", "MIXED"]).default("MIXED"),
  liters: z.number().positive().max(1000),
  fatPercent: z.number().min(0.1).max(15),
  snfPercent: z.number().min(0).max(15).optional(),
  clr: z.number().min(0).max(40).optional(),
});

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { farmerId, from, to, shift, milkType, page = "1", limit = "50" } = req.query;
    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.min(100, parseInt(String(limit)));
    const where: any = {
      dairyId: req.dairyId!,
      ...(farmerId ? { farmerId: String(farmerId) } : {}),
      ...(shift ? { shift: String(shift) } : {}),
      ...(milkType ? { milkType: String(milkType) } : {}),
      ...(from || to ? { date: { ...(from ? { gte: new Date(String(from)) } : {}), ...(to ? { lte: new Date(String(to)) } : {}) } } : {}),
    };
    const [entries, total] = await Promise.all([
      prisma.milkEntry.findMany({ where, skip: (pageNum - 1) * limitNum, take: limitNum, include: { farmer: { select: { name: true, code: true, mobile: true, village: true } } }, orderBy: { date: "desc" } }),
      prisma.milkEntry.count({ where }),
    ]);
    res.json({ entries, total, page: pageNum });
  } catch { res.status(500).json({ error: "Entries load nahi hui" }); }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.milkEntry.findFirst({ where: { id: req.params.id, dairyId: req.dairyId! }, include: { farmer: true } });
    if (!entry) return res.status(404).json({ error: "Entry nahi mili" });
    res.json(entry);
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const data = MilkSchema.parse(req.body);
    const farmer = await prisma.farmer.findFirst({ where: { id: data.farmerId, dairyId: req.dairyId!, isActive: true } });
    if (!farmer) return res.status(403).json({ error: "Yeh kisaan aapki dairy ka nahi hai" });
    const config = await getRateConfig(req.dairyId!);
    const calc = calcRates(data.liters, data.fatPercent, data.milkType, config, data.snfPercent, data.clr);
    const entry = await prisma.milkEntry.create({
      data: { farmerId: data.farmerId, dairyId: req.dairyId!, date: new Date(data.date), shift: data.shift, milkType: data.milkType, liters: data.liters, fatPercent: data.fatPercent, snfPercent: calc.snfPercent, clr: data.clr, fatKg: calc.fatKg, snfKg: calc.snfKg, fatAmount: calc.fatAmount, snfAmount: calc.snfAmount, ratePerLiter: calc.ratePerLiter, totalAmount: calc.totalAmount, formula: calc.formula },
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
    const existing = await prisma.milkEntry.findFirst({ where: { id: req.params.id, dairyId: req.dairyId! } });
    if (!existing) return res.status(404).json({ error: "Entry nahi mili" });
    const data = MilkSchema.partial().parse(req.body);
    const liters = data.liters ?? existing.liters;
    const fatPercent = data.fatPercent ?? existing.fatPercent;
    const milkType = (data.milkType ?? existing.milkType) as "BUFFALO" | "COW" | "MIXED";
    const config = await getRateConfig(req.dairyId!);
    const calc = calcRates(liters, fatPercent, milkType, config, data.snfPercent, data.clr);
    const entry = await prisma.milkEntry.update({
      where: { id: req.params.id },
      data: { ...(data.farmerId ? { farmerId: data.farmerId } : {}), ...(data.date ? { date: new Date(data.date) } : {}), ...(data.shift ? { shift: data.shift } : {}), milkType, liters, fatPercent, snfPercent: calc.snfPercent, ...(data.clr !== undefined ? { clr: data.clr } : {}), fatKg: calc.fatKg, snfKg: calc.snfKg, fatAmount: calc.fatAmount, snfAmount: calc.snfAmount, ratePerLiter: calc.ratePerLiter, totalAmount: calc.totalAmount, formula: calc.formula },
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
    const entry = await prisma.milkEntry.findFirst({ where: { id: req.params.id, dairyId: req.dairyId! } });
    if (!entry) return res.status(404).json({ error: "Entry nahi mili" });
    await prisma.milkEntry.delete({ where: { id: req.params.id } });
    res.json({ message: "Entry delete ho gayi" });
  } catch { res.status(500).json({ error: "Delete nahi hua" }); }
});

router.post("/preview-rate", async (req: AuthRequest, res: Response) => {
  try {
    const { liters = 10, fatPercent, milkType = "BUFFALO", snfPercent, clr } = req.body;
    if (!fatPercent) return res.status(400).json({ error: "fatPercent zaroori hai" });
    const config = await getRateConfig(req.dairyId!);
    const calc = calcRates(Number(liters), Number(fatPercent), milkType, config, snfPercent, clr);
    res.json({ ...calc, pricingMode: config.pricingMode });
  } catch { res.status(500).json({ error: "Rate calculate nahi hua" }); }
});

export default router;