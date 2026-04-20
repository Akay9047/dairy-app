import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { loginLimiter, setupLimiter } from "../lib/rateLimiter";
import logger from "../lib/logger";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "unsafe-fallback";
const JWT_EXPIRES = "7d";

const LoginSchema = z.object({
  username: z.string().min(1).max(50).trim(),
  password: z.string().min(1).max(100),
});

// ── Super Admin Login ──────────────────────────────────────────
router.post("/super/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const { username, password } = LoginSchema.parse(req.body);
    const sa = await prisma.superAdmin.findUnique({ where: { username } });

    // Timing-safe comparison — prevent timing attacks
    const dummyHash = "$2a$10$dummyhashtopreventtimingattacks123456789";
    const valid = sa ? await bcrypt.compare(password, sa.password) : await bcrypt.compare(password, dummyHash);

    if (!sa || !valid) {
      logger.warn(`Failed super admin login attempt: ${username}`);
      return res.status(401).json({ error: "Galat username ya password" });
    }

    const token = jwt.sign(
      { superAdminId: sa.id, name: sa.name, role: "superadmin" },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    res.json({ token, superAdmin: { id: sa.id, name: sa.name, username: sa.username } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    logger.error("Super login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Admin Login ────────────────────────────────────────────────
router.post("/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const { username, password } = LoginSchema.parse(req.body);
    const admin = await prisma.admin.findUnique({
      where: { username },
      include: { dairy: { include: { rateConfig: true } } },
    });

    // Timing-safe comparison
    const dummyHash = "$2a$10$dummyhashtopreventtimingattacks123456789";
    const valid = admin ? await bcrypt.compare(password, admin.password) : await bcrypt.compare(password, dummyHash);

    if (!admin || !valid) {
      logger.warn(`Failed admin login attempt: ${username}`);
      return res.status(401).json({ error: "Username ya password galat hai" });
    }

    if (!admin.dairy.isActive) {
      return res.status(403).json({ error: "Aapki dairy ka access band hai. Super admin se sampark karein." });
    }

    const token = jwt.sign(
      { adminId: admin.id, adminName: admin.name, dairyId: admin.dairyId, role: "admin" },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        language: admin.language,
        dairyId: admin.dairyId,
        dairyName: admin.dairy.name,
        rateConfig: admin.dairy.rateConfig,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    logger.error("Admin login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Language preference ────────────────────────────────────────
router.patch("/language", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId?: string };
    if (!decoded.adminId) return res.status(403).json({ error: "Admin only" });
    const { language } = z.object({ language: z.enum(["hindi", "english", "hinglish"]) }).parse(req.body);
    await prisma.admin.update({ where: { id: decoded.adminId }, data: { language } });
    res.json({ success: true, language });
  } catch {
    res.status(400).json({ error: "Language update nahi hua" });
  }
});

// ── Admin self password change ─────────────────────────────────
router.patch("/change-password", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId?: string };
    if (!decoded.adminId) return res.status(403).json({ error: "Admin only" });

    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6, "Password kam se kam 6 characters ka hona chahiye"),
    }).parse(req.body);

    const admin = await prisma.admin.findUnique({ where: { id: decoded.adminId } });
    if (!admin) return res.status(404).json({ error: "Admin nahi mila" });

    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) return res.status(400).json({ error: "Current password galat hai" });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.admin.update({ where: { id: decoded.adminId }, data: { password: hashed } });
    res.json({ message: "Password change ho gaya! ✅" });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Password change nahi hua" });
  }
});

// ── Super Admin self password change ──────────────────────────
router.patch("/super/change-password", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = jwt.verify(token, JWT_SECRET) as { superAdminId?: string };
    if (!decoded.superAdminId) return res.status(403).json({ error: "Super admin only" });

    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6, "Password kam se kam 6 characters ka hona chahiye"),
    }).parse(req.body);

    const sa = await prisma.superAdmin.findUnique({ where: { id: decoded.superAdminId } });
    if (!sa) return res.status(404).json({ error: "Super admin nahi mila" });

    const valid = await bcrypt.compare(currentPassword, sa.password);
    if (!valid) return res.status(400).json({ error: "Current password galat hai" });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.superAdmin.update({ where: { id: decoded.superAdminId }, data: { password: hashed } });
    res.json({ message: "Password change ho gaya! ✅" });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Password change nahi hua" });
  }
});

// ── First time setup — heavily restricted ─────────────────────
router.post("/setup", setupLimiter, async (req: Request, res: Response) => {
  try {
    // Only allow in non-production OR with a secret key
    const setupKey = req.headers["x-setup-key"];
    if (process.env.NODE_ENV === "production" && setupKey !== process.env.SETUP_SECRET) {
      return res.status(403).json({ error: "Setup not allowed in production without setup key." });
    }

    const saCount = await prisma.superAdmin.count();
    if (saCount > 0) return res.status(400).json({ error: "Already setup ho chuka hai" });

    const {
      username = "superadmin", password = "super@1234", name = "Super Admin",
      dairyName = "Main Dairy", ownerName = "Admin", mobile = "9999999999",
      adminUsername = "admin", adminPassword = "dairy@1234"
    } = req.body;

    const saHash = await bcrypt.hash(password, 12);
    const adminHash = await bcrypt.hash(adminPassword, 12);

    const sa = await prisma.superAdmin.create({ data: { username, password: saHash, name } });
    await prisma.dairy.create({
      data: {
        name: dairyName, ownerName, mobile, superAdminId: sa.id, isActive: true,
        rateConfig: { create: { pricingMode: 'fat_only', fatRate: 0.33, snfRate: 0.07, buffaloFixedRate: 60, cowFixedRate: 40, minRatePerLiter: 25, useMinRate: false, autoCalcSnf: true } },
        admins: { create: { username: adminUsername, password: adminHash, name: ownerName, language: "hinglish" } },
      },
    });

    logger.info("Initial setup completed successfully");
    res.json({
      message: "Setup complete!",
      superAdmin: { username, password },
      admin: { username: adminUsername, password: adminPassword },
    });
  } catch (err) {
    logger.error("Setup error:", err);
    res.status(500).json({ error: "Setup failed" });
  }
});

export default router;