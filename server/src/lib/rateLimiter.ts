import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";

export interface AuthRequest extends Request {
    adminId?: string;
    adminName?: string;
    dairyId?: string;
    role?: string;
    superAdminId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    logger.error("FATAL: JWT_SECRET missing or too short! Min 32 chars required.");
    if (process.env.NODE_ENV === "production") process.exit(1);
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token nahi mila. Login karein." });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return res.status(401).json({ error: "Invalid token format." });

    try {
        const decoded = jwt.verify(token, JWT_SECRET || "fallback-unsafe") as {
            adminId?: string;
            adminName?: string;
            dairyId?: string;
            role?: string;
            superAdminId?: string;
            name?: string;
            iat?: number;
            exp?: number;
        };

        req.adminId = decoded.adminId;
        req.adminName = decoded.adminName;
        req.dairyId = decoded.dairyId;
        req.role = decoded.role;
        req.superAdminId = decoded.superAdminId;
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: "Session expire ho gayi. Dobara login karein." });
        }
        return res.status(401).json({ error: "Token invalid hai. Dobara login karein." });
    }
}

// DB-verified super admin check — JWT role alone nahi chalega
export async function superAdminOnly(req: AuthRequest, res: Response, next: NextFunction) {
    if (req.role !== "superadmin" || !req.superAdminId) {
        return res.status(403).json({ error: "Super admin access required." });
    }
    try {
        // Verify in DB — prevents JWT role tampering
        const sa = await prisma.superAdmin.findUnique({
            where: { id: req.superAdminId },
            select: { id: true },
        });
        if (!sa) return res.status(403).json({ error: "Super admin nahi mila." });
        next();
    } catch {
        return res.status(500).json({ error: "Auth verification failed." });
    }
}

// DB-verified admin check
export async function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
    if (req.role !== "admin" || !req.adminId || !req.dairyId) {
        return res.status(403).json({ error: "Admin access required." });
    }
    try {
        // Verify admin + dairy match in DB — prevents dairyId tampering
        const admin = await prisma.admin.findFirst({
            where: { id: req.adminId, dairyId: req.dairyId },
            include: { dairy: { select: { isActive: true } } },
        });
        if (!admin) return res.status(403).json({ error: "Admin nahi mila." });
        if (!admin.dairy.isActive) {
            return res.status(403).json({ error: "Aapki dairy ka access band hai. Super admin se sampark karein." });
        }
        next();
    } catch {
        return res.status(500).json({ error: "Auth verification failed." });
    }
}