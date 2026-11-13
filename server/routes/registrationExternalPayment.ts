import type { RequestHandler } from "express";
import { prisma } from "../db/prisma";
import type { AuthenticatedRequest } from "../middleware/auth";
import { createAdminLog, getClientIP, LOG_ACTIONS, LOG_ENTITIES } from "../utils/adminLogger";

const KEY = "registration_external_payment";

type Stored = {
  amount?: unknown;
  updatedAt?: string;
  updatedByUserId?: number;
  legacyMigratedAt?: string;
};

function parseStored(v: unknown): Stored {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Stored;
  return {};
}

function coerceAmount(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.round(v));
  if (typeof v === "bigint") return Math.max(0, Number(v));
  if (typeof v === "string") {
    const t = v.replace(/\s*TL\s*/gi, "").trim();
    if (!t) return 0;
    const cleaned = t.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  }
  return 0;
}

async function sumExternalTotal(): Promise<number> {
  const agg = await prisma.external_payment_entries.aggregate({ _sum: { amount: true } });
  return Math.max(0, Math.round(agg._sum.amount ?? 0));
}

async function migrateLegacyExternalTotalIfNeeded(): Promise<void> {
  const row = await prisma.site_settings.findUnique({ where: { key: KEY } });
  const raw = parseStored(row?.value);
  if (raw.legacyMigratedAt) return;
  const n = await prisma.external_payment_entries.count();
  if (n > 0) return;
  const legacy = coerceAmount(raw.amount);
  if (legacy <= 0) return;
  let uid = typeof raw.updatedByUserId === "number" ? raw.updatedByUserId : 1;
  const exists = await prisma.users.findUnique({ where: { id: uid } });
  if (!exists) {
    const first = await prisma.users.findFirst({ orderBy: { id: "asc" } });
    if (!first) return;
    uid = first.id;
  }
  await prisma.external_payment_entries.create({
    data: { amount: legacy, userId: uid },
  });
  const cleared = {
    amount: 0,
    updatedAt: new Date().toISOString(),
    updatedByUserId: uid,
    legacyMigratedAt: new Date().toISOString(),
  };
  await prisma.site_settings.upsert({
    where: { key: KEY },
    create: { key: KEY, value: cleared as object, updatedAt: new Date() },
    update: { value: cleared as object, updatedAt: new Date() },
  });
}

export const getRegistrationExternalPaymentHandler: RequestHandler = async (_req, res) => {
  try {
    await migrateLegacyExternalTotalIfNeeded();
    const [amount, entryCount] = await Promise.all([
      sumExternalTotal(),
      prisma.external_payment_entries.count(),
    ]);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      amount,
      entryCount,
      updatedAt: new Date().toISOString(),
      updatedByUserId: null,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const getRegistrationExternalPaymentHistoryHandler: RequestHandler = async (req, res) => {
  try {
    await migrateLegacyExternalTotalIfNeeded();
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10) || 50));
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      prisma.external_payment_entries.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.external_payment_entries.count(),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      amount: row.amount,
      user: row.user,
    }));

    res.setHeader("Cache-Control", "no-store");
    res.json({
      items,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      page,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const deleteRegistrationExternalPaymentEntryHandler: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;
    if (userId == null) {
      res.status(401).json({ error: "Oturum gerekli" });
      return;
    }

    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "Geçersiz kayıt" });
      return;
    }

    const existing = await prisma.external_payment_entries.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Kayıt bulunamadı" });
      return;
    }

    await prisma.external_payment_entries.delete({ where: { id } });
    const amount = await sumExternalTotal();

    await createAdminLog({
      userId,
      action: LOG_ACTIONS.DELETE,
      entity: LOG_ENTITIES.REGISTRATION_EXTERNAL_PAYMENT,
      entityId: String(id),
      details: { deletedAmount: existing.amount, totalAfter: amount },
      ipAddress: getClientIP(req),
      userAgent: req.headers["user-agent"],
    });

    res.setHeader("Cache-Control", "no-store");
    res.json({ success: true, amount });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const putRegistrationExternalPaymentHandler: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;
    if (userId == null) {
      res.status(401).json({ error: "Oturum gerekli" });
      return;
    }

    await migrateLegacyExternalTotalIfNeeded();

    const body = req.body as { addition?: unknown; amount?: unknown };

    let addition: number;
    if (body.addition !== undefined && body.addition !== null) {
      addition = coerceAmount(body.addition);
    } else if (body.amount !== undefined && body.amount !== null) {
      const targetTotal = coerceAmount(body.amount);
      const current = await sumExternalTotal();
      addition = Math.max(0, targetTotal - current);
    } else {
      res.status(400).json({ error: "addition veya amount gerekli" });
      return;
    }

    if (addition <= 0) {
      res.status(400).json({ error: "Geçerli bir tutar girin" });
      return;
    }

    const created = await prisma.external_payment_entries.create({
      data: { amount: addition, userId },
    });

    const [amount, entryCount] = await Promise.all([
      sumExternalTotal(),
      prisma.external_payment_entries.count(),
    ]);

    await createAdminLog({
      userId,
      action: LOG_ACTIONS.UPDATE,
      entity: LOG_ENTITIES.REGISTRATION_EXTERNAL_PAYMENT,
      entityId: String(created.id),
      details: {
        addition,
        entryId: created.id,
        totalAfter: amount,
      },
      ipAddress: getClientIP(req),
      userAgent: req.headers["user-agent"],
    });

    res.setHeader("Cache-Control", "no-store");
    res.json({
      success: true,
      amount,
      entryCount,
      entryId: created.id,
      updatedAt: new Date().toISOString(),
      updatedByUserId: userId,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};
