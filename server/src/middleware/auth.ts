import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  adminId?: string;
  adminName?: string;
  dairyId?: string;
  role?: string;
  superAdminId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Token nahi mila. Login karein." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
      adminId?: string; adminName?: string; dairyId?: string;
      role?: string; superAdminId?: string; name?: string;
    };
    req.adminId = decoded.adminId;
    req.adminName = decoded.adminName;
    req.dairyId = decoded.dairyId;
    req.role = decoded.role;
    req.superAdminId = decoded.superAdminId;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalid. Dobara login karein." });
  }
}

export function superAdminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role !== "superadmin") return res.status(403).json({ error: "Super admin access required" });
  next();
}
