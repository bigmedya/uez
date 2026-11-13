import { prisma } from "../db/prisma";
import { Request } from "express";

export interface LogAction {
  userId: number;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
}

export interface AdminLogEntry {
  id: number;
  userId: number;
  action: string;
  entity: string;
  entityId: string | null;
  details: any;
  ipAddress: string;
  userAgent: string | null;
  createdAt: Date;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

// IP adresini almak için yardımcı fonksiyon
export function getClientIP(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );
}

// Admin log kaydı oluşturma
export async function createAdminLog(logData: LogAction): Promise<void> {
  try {
    await prisma.admin_logs.create({
      data: {
        userId: logData.userId,
        action: logData.action,
        entity: logData.entity,
        entityId: logData.entityId || null,
        details: logData.details || null,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent || null,
      },
    });
  } catch (error) {
    console.error("Admin log oluşturulurken hata:", error);
  }
}

// Admin loglarını getirme (sayfalama ile)
export async function getAdminLogs(
  page: number = 1,
  limit: number = 50,
  filters?: {
    userId?: number;
    action?: string;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{ logs: AdminLogEntry[]; total: number; totalPages: number }> {
  const offset = (page - 1) * limit;
  
  const where: any = {};
  
  if (filters?.userId) {
    where.userId = filters.userId;
  }
  
  if (filters?.action) {
    where.action = {
      contains: filters.action,
    };
  }
  
  if (filters?.entity) {
    where.entity = {
      contains: filters.entity,
    };
  }
  
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.admin_logs.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    }),
    prisma.admin_logs.count({ where }),
  ]);

  return {
    logs: logs as AdminLogEntry[],
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// Belirli bir kullanıcının loglarını getirme
export async function getUserLogs(
  userId: number,
  page: number = 1,
  limit: number = 20
): Promise<{ logs: AdminLogEntry[]; total: number; totalPages: number }> {
  return getAdminLogs(page, limit, { userId });
}

// Log istatistikleri
export async function getLogStats(): Promise<{
  totalLogs: number;
  todayLogs: number;
  weekLogs: number;
  topActions: Array<{ action: string; count: number }>;
  topEntities: Array<{ entity: string; count: number }>;
}> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalLogs, todayLogs, weekLogs, actionStats, entityStats] = await Promise.all([
    prisma.admin_logs.count(),
    prisma.admin_logs.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    }),
    prisma.admin_logs.count({
      where: {
        createdAt: {
          gte: weekStart,
        },
      },
    }),
    prisma.$queryRaw`
      SELECT action, COUNT(*) as count 
      FROM admin_logs 
      GROUP BY action 
      ORDER BY count DESC 
      LIMIT 10
    ` as Array<{ action: string; count: bigint }>,
    prisma.$queryRaw`
      SELECT entity, COUNT(*) as count 
      FROM admin_logs 
      GROUP BY entity 
      ORDER BY count DESC 
      LIMIT 10
    ` as Array<{ entity: string; count: bigint }>,
  ]);

  return {
    totalLogs,
    todayLogs,
    weekLogs,
    topActions: actionStats.map(item => ({
      action: item.action,
      count: Number(item.count),
    })),
    topEntities: entityStats.map(item => ({
      entity: item.entity,
      count: Number(item.count),
    })),
  };
}

// Yaygın log aksiyonları için sabitler
export const LOG_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE", 
  DELETE: "DELETE",
  VIEW: "VIEW",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  UPLOAD: "UPLOAD",
  DOWNLOAD: "DOWNLOAD",
  EXPORT: "EXPORT",
  IMPORT: "IMPORT",
} as const;

// Yaygın entity türleri için sabitler
export const LOG_ENTITIES = {
  USER: "users",
  ROLE: "admin_roles",
  PROGRAM: "program_items",
  PROGRAM_DAY: "program_days",
  PROGRAM_CATEGORY: "program_categories",
  SPEAKER: "speakers",
  SPONSOR: "sponsors",
  SPONSOR_CATEGORY: "sponsor_categories",
  REGISTRATION: "registrations",
  PACKAGE: "packages",
  FAQ: "faqs",
  CONTRACT: "contracts",
  SITE_SETTINGS: "site_settings",
  HOMEPAGE_CONTENT: "homepage_content",
  ABOUT_CONTENT: "about_content",
  UEZ2026_CONTENT: "uez2026_content",
  CONTACT_SETTINGS: "contact_settings",
  ARCHIVE_DESCRIPTION: "archive_descriptions",
  FORM_RESPONSE: "form_responses",
  REGISTRATION_EXTERNAL_PAYMENT: "registration_external_payment",
} as const;