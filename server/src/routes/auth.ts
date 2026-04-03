import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

// ── Super Admin Login ──────────────────────────────────────────
router.post("/super/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    }).parse(req.body);

    const sa = await prisma.superAdmin.findUnique({ where: { username } });
    if (!sa || !(await bcrypt.compare(password, sa.password))) {
      return res.status(401).json({ error: "Galat username ya password" });
    }
    const token = jwt.sign(
      { superAdminId: sa.id, name: sa.name, role: "superadmin" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
    res.json({ token, superAdmin: { id: sa.id, name: sa.name, username: sa.username } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: "Server error" });
  }
});

// ── Admin Login ────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    }).parse(req.body);

    const admin = await prisma.admin.findUnique({
      where: { username },
      include: { dairy: { include: { rateConfig: true } } },
    });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ error: "Username ya password galat hai" });
    }
    if (!admin.dairy.isActive) {
      return res.status(403).json({ error: "Aapki dairy ka access band hai. Super admin se sampark karein." });
    }
    const token = jwt.sign(
      { adminId: admin.id, adminName: admin.name, dairyId: admin.dairyId, role: "admin" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
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
    res.status(500).json({ error: "Server error" });
  }
});

// ── Update language preference ─────────────────────────────────
router.patch("/language", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as { adminId: string };
    const { language } = z.object({ language: z.enum(["hindi", "english", "hinglish"]) }).parse(req.body);
    await prisma.admin.update({ where: { id: decoded.adminId }, data: { language } });
    res.json({ success: true, language });
  } catch {
    res.status(400).json({ error: "Language update nahi hua" });
  }
});

// ── First time setup ───────────────────────────────────────────
router.post("/setup", async (req: Request, res: Response) => {
  try {
    const saCount = await prisma.superAdmin.count();
    if (saCount > 0) return res.status(400).json({ error: "Already setup ho chuka hai" });

    const { username = "superadmin", password = "super@1234", name = "Super Admin",
      dairyName = "Main Dairy", ownerName = "Dairy Owner", mobile = "9999999999",
      adminUsername = "admin", adminPassword = "dairy@1234" } = req.body;

    const saHash = await bcrypt.hash(password, 10);
    const adminHash = await bcrypt.hash(adminPassword, 10);

    const sa = await prisma.superAdmin.create({
      data: { username, password: saHash, name },
    });

    const dairy = await prisma.dairy.create({
      data: {
        name: dairyName, ownerName, mobile,
        superAdminId: sa.id,
        rateConfig: {
          create: { minRatePerLiter: 50, fatRatePerKg: 0.33, snfRatePerKg: 0.21, useMinRate: true },
        },
        admins: {
          create: { username: adminUsername, password: adminHash, name: ownerName, language: "hinglish" },
        },
      },
    });

    res.json({
      message: "Setup complete!",
      superAdmin: { username, password },
      admin: { username: adminUsername, password: adminPassword },
      dairyId: dairy.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Setup failed" });
  }
});

export default router;

// Admin apna password change kare
router.patch("/change-password", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as { adminId: string };
    if (!decoded.adminId) return res.status(403).json({ error: "Sirf admin apna password change kar sakta hai" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Current aur new password dono zaroori hain" });
    if (newPassword.length < 6)
      return res.status(400).json({ error: "Naya password kam se kam 6 characters ka hona chahiye" });

    const admin = await prisma.admin.findUnique({ where: { id: decoded.adminId } });
    if (!admin) return res.status(404).json({ error: "Admin nahi mila" });

    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) return res.status(400).json({ error: "Current password galat hai" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({ where: { id: decoded.adminId }, data: { password: hashed } });
    res.json({ message: "Password change ho gaya! ✅" });
  } catch {
    res.status(500).json({ error: "Password change nahi hua" });
  }
});

