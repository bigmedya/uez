import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
    type: string;
    roleId?: number;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Token gerekli" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      type: decoded.type,
      roleId: decoded.roleId,
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: "Geçersiz token" });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.type !== "admin") {
    return res.status(403).json({ error: "Admin yetkisi gerekli" });
  }
  next();
}