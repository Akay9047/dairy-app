import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

const FarmerSchema = z.object({
  name: z.string().min(1, "Naam zaroori hai"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Valid 10 digit mobile number daalen"),
  code: z.string().min(1, "Code zaroori hai").max(20),
  village: z.string().min(1, "Gaon ka naam daalen"),
});

// All queries enforce dairyId — complete data isolation
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    const farmers = await prisma.farmer.findMany({
      where: {
        dairyId: req.dairyId!, // ← Only this dairy's farmers
        isActive: true,
        ...(search ? {
          OR: [
            { name: { contains: String(search), mode: "insensitive" } },
            { mobile: { contains: String(search) } },
            { code: { contains: String(search), mode: "insensitive" } },
            { village: { contains: String(search), mode: "insensitive" } },
          ],
        } : {}),
      },
      orderBy: { name: "asc" },
    });
    res.json(farmers);
  } catch { res.status(500).json({ error: "Farmers load nahi hue" }); }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const farmer = await prisma.farmer.findFirst({
      where: { id: req.params.id, dairyId: req.dairyId! },
      include: {
        milkEntries: { orderBy: { date: "desc" }, take: 30 },
        payments: { orderBy: { paidAt: "desc" }, take: 10 },
      },
    });
    if (!farmer) return res.status(404).json({ error: "Farmer nahi mila" });
    res.json(farmer);
  } catch { res.status(500).json({ error: "Server error" }); }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const data = FarmerSchema.parse(req.body);
    const existing = await prisma.farmer.findFirst({
      where: {
        dairyId: req.dairyId!,
        OR: [{ mobile: data.mobile }, { code: data.code }],
      },
    });
    if (existing) return res.status(400).json({ error: "Is mobile ya code se farmer pehle se hai" });
    const farmer = await prisma.farmer.create({
      data: { ...data, dairyId: req.dairyId! },
    });
    res.status(201).json(farmer);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Farmer add nahi hua" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.farmer.findFirst({
      where: { id: req.params.id, dairyId: req.dairyId! },
    });
    if (!existing) return res.status(404).json({ error: "Farmer nahi mila" });
    const data = FarmerSchema.partial().parse(req.body);
    const farmer = await prisma.farmer.update({ where: { id: req.params.id }, data });
    res.json(farmer);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Update nahi hua" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.farmer.findFirst({
      where: { id: req.params.id, dairyId: req.dairyId! },
    });
    if (!existing) return res.status(404).json({ error: "Farmer nahi mila" });
    await prisma.farmer.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: "Farmer delete ho gaya" });
  } catch { res.status(500).json({ error: "Delete nahi hua" }); }
});

export default router;
