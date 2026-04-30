import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { loginLimiter } from "../lib/rateLimiter";
import logger from "../lib/logger";

const router = Router();

const RegisterSchema = z.object({
    ownerName: z.string().min(2).max(100).trim(),
    mobile: z.string().regex(/^[6-9]\d{9}$/, "Valid 10 digit mobile number daalen"),
    dairyName: z.string().min(2).max(100).trim(),
    village: z.string().min(1).max(100).trim(),
    adminUsername: z.string().min(3).max(50).trim().toLowerCase(),
    password: z.string().min(6).max(100),
});

// POST /api/auth/register
router.post("/register", loginLimiter, async (req: Request, res: Response) => {
    try {
        const data = RegisterSchema.parse(req.body);

        // Check username already exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { username: data.adminUsername },
        });
        if (existingAdmin) {
            return res.status(400).json({ error: "Yeh username pehle se liya ja chuka hai. Dusra username chunein." });
        }

        // Check mobile already registered
        const existingDairy = await prisma.dairy.findFirst({
            where: { mobile: data.mobile },
        });
        if (existingDairy) {
            return res.status(400).json({ error: "Is mobile number se pehle se registration ho chuki hai." });
        }

        // Get first super admin (system admin)
        const superAdmin = await prisma.superAdmin.findFirst();
        if (!superAdmin) {
            return res.status(500).json({ error: "System setup nahi hua. Admin se contact karein." });
        }

        // Create dairy + admin — INACTIVE by default
        const hashedPw = await bcrypt.hash(data.password, 12);
        const dairy = await prisma.dairy.create({
            data: {
                name: data.dairyName,
                ownerName: data.ownerName,
                mobile: data.mobile,
                address: data.village,
                isActive: false, // PENDING — activate hogi payment ke baad
                superAdminId: superAdmin.id,
                rateConfig: {
                    create: {
                        pricingMode: "fat_only",
                        fatRate: 0.33,
                        snfRate: 0.07,
                        buffaloFixedRate: 60,
                        cowFixedRate: 40,
                        minRatePerLiter: 25,
                        useMinRate: false,
                        autoCalcSnf: true,
                    },
                },
                admins: {
                    create: {
                        username: data.adminUsername,
                        password: hashedPw,
                        name: data.ownerName,
                        language: "hinglish",
                    },
                },
            },
        });

        logger.info(`New registration: ${data.dairyName} (${data.mobile}) — PENDING activation`);

        res.status(201).json({
            message: "Registration ho gayi! Payment ke baad account activate hoga.",
            dairy: {
                name: dairy.name,
                ownerName: dairy.ownerName,
                mobile: dairy.mobile,
                status: "pending",
            },
        });
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
        logger.error("Registration error:", err);
        res.status(500).json({ error: "Registration nahi hua. Dobara try karein." });
    }
});

export default router;