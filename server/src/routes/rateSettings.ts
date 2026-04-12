import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, adminOnly, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authMiddleware, adminOnly);

router.get("/", async (req: AuthRequest, res: Response) => {
    try {
        const config = await prisma.rateConfig.findUnique({ where: { dairyId: req.dairyId! } });
        res.json(config);
    } catch { res.status(500).json({ error: "Rate config load nahi hua" }); }
});

router.put("/", async (req: AuthRequest, res: Response) => {
    try {
        const {
            rateType, fatRatePerKg, snfRatePerKg, minRatePerLiter, useMinRate,
            buffaloFatRate, cowFatRate, buffaloSnfRate, cowSnfRate,
            buffaloFixedRate, cowFixedRate,
        } = req.body;

        const config = await prisma.rateConfig.upsert({
            where: { dairyId: req.dairyId! },
            update: { rateType, fatRatePerKg, snfRatePerKg, minRatePerLiter, useMinRate, buffaloFatRate, cowFatRate, buffaloSnfRate, cowSnfRate, buffaloFixedRate, cowFixedRate },
            create: { dairyId: req.dairyId!, rateType, fatRatePerKg, snfRatePerKg, minRatePerLiter, useMinRate: useMinRate ?? true, buffaloFatRate, cowFatRate, buffaloSnfRate, cowSnfRate, buffaloFixedRate, cowFixedRate },
        });
        res.json(config);
    } catch { res.status(500).json({ error: "Rate update nahi hua" }); }
});

export default router;