import { RequestHandler } from "express";
import { getUserByEmailOrName, verifyUserPassword } from "../db/users";
import jwt from "jsonwebtoken";
import { createAdminLog, getClientIP, LOG_ACTIONS, LOG_ENTITIES } from "../utils/adminLogger";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// --- Giriş deneme sınırlaması (Rate Limiting) ---
const MAX_ATTEMPTS = 4;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 dakika

interface LoginAttemptRecord {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

const loginAttempts = new Map<string, LoginAttemptRecord>();

// Her 30 dakikada süresi dolmuş kayıtları temizle
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    // Kilidi kalkmış ve son denemeden 30+ dk geçmişse temizle
    if (
      (!record.lockedUntil || record.lockedUntil < now) &&
      now - record.lastAttempt > 30 * 60 * 1000
    ) {
      loginAttempts.delete(ip);
    }
  }
}, 30 * 60 * 1000);

function getClientIP(req: any): string {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.headers["x-real-ip"]?.toString() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );
}

function getAttemptRecord(ip: string): LoginAttemptRecord {
  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, { attempts: 0, lastAttempt: 0, lockedUntil: null });
  }
  return loginAttempts.get(ip)!;
}

export const login: RequestHandler = async (req, res) => {
  try {
    const ip = getClientIP(req);
    const record = getAttemptRecord(ip);
    const now = Date.now();

    // Kilit kontrolü
    if (record.lockedUntil && record.lockedUntil > now) {
      const remainingMs = record.lockedUntil - now;
      const remainingMin = Math.ceil(remainingMs / 60000);
      res.status(429).json({
        error: `Çok fazla başarısız giriş denemesi. ${remainingMin} dakika sonra tekrar deneyin.`,
        locked: true,
        lockedUntil: record.lockedUntil,
        remainingMs,
      });
      return;
    }

    // Kilit süresi dolduysa sıfırla
    if (record.lockedUntil && record.lockedUntil <= now) {
      record.attempts = 0;
      record.lockedUntil = null;
    }

    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Kullanıcı adı ve şifre gereklidir" });
      return;
    }

    // Email veya kullanıcı adı ile giriş
    const isValid = await verifyUserPassword(username, password);

    if (!isValid) {
      record.attempts += 1;
      record.lastAttempt = now;
      const remaining = MAX_ATTEMPTS - record.attempts;

      // Limit aşıldıysa kilitle
      if (record.attempts >= MAX_ATTEMPTS) {
        record.lockedUntil = now + LOCKOUT_DURATION_MS;
        res.status(429).json({
          error: `${MAX_ATTEMPTS} başarısız deneme. Hesap 15 dakika süreyle kilitlendi.`,
          locked: true,
          lockedUntil: record.lockedUntil,
          remainingMs: LOCKOUT_DURATION_MS,
          remainingAttempts: 0,
        });
        return;
      }

      res.status(401).json({
        error: `Kullanıcı adı veya şifre hatalı. Kalan deneme hakkı: ${remaining}`,
        remainingAttempts: remaining,
        locked: false,
      });
      return;
    }

    loginAttempts.delete(ip);

    try {
      const user = await getUserByEmailOrName(username);
      if (!user) {
        res.status(401).json({ error: "Kullanıcı bulunamadı" });
        return;
      }
      const permissions: string[] | null =
        user.roleId == null
          ? null
          : ((user.admin_role?.permissions as string[]) ?? []);

      const token = jwt.sign(
        { username, type: "admin", userId: user.id, roleId: user.roleId ?? undefined },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Başarılı giriş logla
      await createAdminLog({
        userId: user.id,
        action: LOG_ACTIONS.LOGIN,
        entity: LOG_ENTITIES.USER,
        entityId: user.id.toString(),
        details: { 
          username,
          roleId: user.roleId ?? undefined 
        },
        ipAddress: getClientIP(req),
        userAgent: req.headers["user-agent"],
      });

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username,
          name: user.name ?? undefined,
          roleId: user.roleId ?? undefined,
          permissions,
        },
      });
    } catch (roleErr) {
      console.error("Login (role/permissions) fallback:", roleErr);
      const token = jwt.sign(
        { username, type: "admin" },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      return res.json({
        success: true,
        token,
        user: { id: null, username, permissions: null },
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Giriş yapılırken bir hata oluştu" });
  }
};

export const logout: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.userId) {
          // Logout işlemini logla
          await createAdminLog({
            userId: decoded.userId,
            action: LOG_ACTIONS.LOGOUT,
            entity: LOG_ENTITIES.USER,
            entityId: decoded.userId.toString(),
            details: { 
              username: decoded.username 
            },
            ipAddress: getClientIP(req),
            userAgent: req.headers["user-agent"],
          });
        }
      } catch (tokenError) {
        // Token geçersizse loglama yapmayız
      }
    }

    res.json({ success: true, message: "Başarıyla çıkış yapıldı" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Çıkış yapılırken bir hata oluştu" });
  }
};
