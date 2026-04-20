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
            pricingMode, fatRate, snfRate,
            buffaloFixedRate, cowFixedRate,
            minRatePerLiter, useMinRate, autoCalcSnf,
        } = req.body;

        const config = await prisma.rateConfig.upsert({
            where: { dairyId: req.dairyId! },
            update: {
                pricingMode: pricingMode ?? "fat_only",
                fatRate: fatRate ?? 0.33,
                snfRate: snfRate ?? 0.07,
                buffaloFixedRate: buffaloFixedRate ?? 60,
                cowFixedRate: cowFixedRate ?? 40,
                minRatePerLiter: minRatePerLiter ?? 25,
                useMinRate: useMinRate ?? false,
                autoCalcSnf: autoCalcSnf ?? true,
            },
            create: {
                dairyId: req.dairyId!,
                pricingMode: pricingMode ?? "fat_only",
                fatRate: fatRate ?? 0.33,
                snfRate: snfRate ?? 0.07,
                buffaloFixedRate: buffaloFixedRate ?? 60,
                cowFixedRate: cowFixedRate ?? 40,
                minRatePerLiter: minRatePerLiter ?? 25,
                useMinRate: useMinRate ?? false,
                autoCalcSnf: autoCalcSnf ?? true,
            },
        });
        res.json(config);
    } catch (err: any) { res.status(500).json({ error: "Rate update nahi hua: " + err.message }); }
});

export default router;