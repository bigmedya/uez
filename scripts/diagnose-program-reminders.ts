/**
 * Tek seferlik: program oturum hatırlatıcılarının neden tetiklenmediğini özetler.
 * Çalıştır: npx tsx scripts/diagnose-program-reminders.ts
 */
/// <reference types="node" />
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import {
  parseProgramItemStartTime,
  runProgramStartReminders,
} from "../server/services/programStartReminders";

const prisma = new PrismaClient();

const IST_OFFSET = "+03:00";

function istanbulDateTimeForCalendarDay(dayDate: Date, hour: number, minute: number): Date {
  const y = dayDate.getUTCFullYear();
  const mo = dayDate.getUTCMonth();
  const d = dayDate.getUTCDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return new Date(`${y}-${pad(mo + 1)}-${pad(d)}T${pad(hour)}:${pad(minute)}:00${IST_OFFSET}`);
}

async function main() {
  const remindersEnabled =
    !["0", "false", "no"].includes((process.env.PROGRAM_START_REMINDERS_ENABLED ?? "").trim().toLowerCase());
  const graceRaw = process.env.PROGRAM_START_REMINDERS_GRACE_MS?.trim();
  const graceMs = (() => {
    const n = graceRaw ? parseInt(graceRaw, 10) : NaN;
    if (Number.isFinite(n) && n >= 10_000 && n <= 86_400_000) return n;
    return 120_000;
  })();

  const hasOneSignal = !!(
    (process.env.ONESIGNAL_APP_ID?.trim() && process.env.ONESIGNAL_API_KEY?.trim()) ||
    (process.env.ONESIGNAL_APP_ID?.trim() && process.env.ONESIGNAL_REST_API_KEY?.trim()) ||
    process.env.ONESIGNAL_API_KEY?.includes("::")
  );

  console.log("=== Ortam ===");
  console.log("PROGRAM_START_REMINDERS_ENABLED:", process.env.PROGRAM_START_REMINDERS_ENABLED ?? "(boş = açık)");
  console.log("Hatırlatıcılar aktif (yorum):", remindersEnabled);
  console.log("PROGRAM_START_REMINDERS_GRACE_MS:", graceRaw ?? "(varsayılan 120000)");
  console.log("Grace (ms):", graceMs, `= ${graceMs / 1000}s oturum başlangıcından sonra`);
  console.log("OneSignal yapılandırması:", hasOneSignal ? "var" : "EKSİK (bildirim gönderilemez)");

  const now = Date.now();
  console.log("\nŞu an (Unix ms):", now, new Date(now).toISOString());

  const items = await prisma.program_items.findMany({
    where: { reminderSentAt: null },
    include: { program_days: true },
    orderBy: { id: "desc" },
    take: 30,
  });

  console.log("\n=== reminderSentAt=null olan son 30 oturum ===\n");

  for (const item of items) {
    const day = item.program_days;
    const parsed = parseProgramItemStartTime(item.time);
    const startAt = parsed ? istanbulDateTimeForCalendarDay(day.date, parsed.h, parsed.m).getTime() : null;
    const delta = startAt !== null ? now - startAt : null;
    const inWindow =
      delta !== null && delta >= 0 && delta <= graceMs && day.active && parsed;

    let reason = "";
    if (!day.active) reason = "GÜN AKTİF DEĞİL (active=false)";
    else if (!parsed) reason = "SAAT ÇÖZÜLEMEDİ (time formatı: 09:30 veya 09.30)";
    else if (delta !== null && delta < 0) reason = `HENÜZ BAŞLAMADI (${Math.round(-delta / 1000)}s sonra)`;
    else if (delta !== null && delta > graceMs) reason = `PENCERE KAÇTI (başlangıçtan ${Math.round(delta / 1000)}s geçti; max ${graceMs / 1000}s)`;
    else if (inWindow) reason = "ŞU AN GÖNDERİM PENCERESİNDE (tick çalışırsa gitmeli)";

    console.log(
      `item #${item.id} | gün #${day.id} active=${day.active} | tarih=${day.date.toISOString().slice(0, 10)} | saat=${item.time}`,
    );
    console.log(`  → ${reason}`);
  }

  if (items.length === 0) {
    console.log("(Kayıt yok veya tüm oturumlara zaten hatırlatıcı işlendi.)");
  }

  console.log("\n=== runProgramStartReminders() denemesi (gerçek gönderim) ===");
  if (!remindersEnabled) {
    console.log("Atlandı: hatırlatıcılar kapalı.");
  } else {
    await runProgramStartReminders();
    console.log("Tamamlandı (log için sunucu stdout'a bakın).");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
