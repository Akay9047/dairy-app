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
            rateType, useSnf, fatRatePerKg, snfRatePerKg,
            minRatePerLiter, useMinRate,
            buffaloFatRate, cowFatRate, buffaloSnfRate, cowSnfRate,
            buffaloFixedRate, cowFixedRate,
        } = req.body;

        const config = await prisma.rateConfig.upsert({
            where: { dairyId: req.dairyId! },
            update: {
                rateType, useSnf: useSnf ?? false,
                fatRatePerKg, snfRatePerKg, minRatePerLiter,
                useMinRate: useMinRate ?? true,
                buffaloFatRate, cowFatRate, buffaloSnfRate, cowSnfRate,
                buffaloFixedRate, cowFixedRate,
            },
            create: {
                dairyId: req.dairyId!,
                rateType: rateType ?? "fat", useSnf: useSnf ?? false,
                fatRatePerKg: fatRatePerKg ?? 800,
                snfRatePerKg: snfRatePerKg ?? 533,
                minRatePerLiter: minRatePerLiter ?? 40,
                useMinRate: useMinRate ?? true,
                buffaloFatRate: buffaloFatRate ?? 800,
                cowFatRate: cowFatRate ?? 600,
                buffaloSnfRate: buffaloSnfRate ?? 533,
                cowSnfRate: cowSnfRate ?? 400,
                buffaloFixedRate: buffaloFixedRate ?? 60,
                cowFixedRate: cowFixedRate ?? 40,
            },
        });
        res.json(config);
    } catch (err: any) { res.status(500).json({ error: "Rate update nahi hua" }); }
});

export default router;