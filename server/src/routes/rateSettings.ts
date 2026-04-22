import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, adminOnly, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authMiddleware, adminOnly);

const DEFAULT_RATE = {
    pricingMode: "fat_only",
    fatRate: 0.33,
    snfRate: 0.07,
    buffaloFixedRate: 60,
    cowFixedRate: 40,
    minRatePerLiter: 25,
    useMinRate: false,
    autoCalcSnf: true,
};

router.get("/", async (req: AuthRequest, res: Response) => {
    try {
        let config = await prisma.rateConfig.findUnique({ where: { dairyId: req.dairyId! } });
        if (!config) {
            config = await prisma.rateConfig.create({ data: { dairyId: req.dairyId!, ...DEFAULT_RATE } });
        }
        res.json(config);
    } catch { res.status(500).json({ error: "Rate config load nahi hua" }); }
});

router.put("/", async (req: AuthRequest, res: Response) => {
    try {
        const { pricingMode, fatRate, snfRate, buffaloFixedRate, cowFixedRate, minRatePerLiter, useMinRate, autoCalcSnf } = req.body;
        const data = {
            pricingMode: pricingMode ?? "fat_only",
            fatRate: parseFloat(fatRate) || 0.33,
            snfRate: parseFloat(snfRate) || 0.07,
            buffaloFixedRate: parseFloat(buffaloFixedRate) || 60,
            cowFixedRate: parseFloat(cowFixedRate) || 40,
            minRatePerLiter: parseFloat(minRatePerLiter) || 25,
            useMinRate: useMinRate === true || useMinRate === "true",
            autoCalcSnf: autoCalcSnf !== false && autoCalcSnf !== "false",
        };
        const config = await prisma.rateConfig.upsert({
            where: { dairyId: req.dairyId! },
            update: data,
            create: { dairyId: req.dairyId!, ...data },
        });
        res.json(config);
    } catch (err: any) {
        res.status(500).json({ error: "Rate update nahi hua: " + err.message });
    }
});

export default router;