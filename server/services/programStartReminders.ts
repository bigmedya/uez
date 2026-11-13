/** Aktif program günlerinde, oturum satırındaki başlangıç saatinde (Europe/Istanbul)*/

import { prisma } from "../db/prisma";
import { sendNotification } from "./onesignal";
import { programNotificationTemplates, replacePlaceholders } from "../config/notificationMessages";
import { locationPhraseInLocative } from "../../shared/programLocations";
import { getSpeakers } from "../db/speakers";

const IST_OFFSET = "+03:00";

export function parseProgramItemStartTime(timeStr: string): { h: number; m: number } | null {
  const m = timeStr.trim().match(/(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

function istanbulDateTimeForCalendarDay(dayDate: Date, hour: number, minute: number): Date {
  const y = dayDate.getUTCFullYear();
  const mo = dayDate.getUTCMonth();
  const d = dayDate.getUTCDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return new Date(`${y}-${pad(mo + 1)}-${pad(d)}T${pad(hour)}:${pad(minute)}:00${IST_OFFSET}`);
}

function isLikelyServerlessRuntime(): boolean {
  return !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL);
}

function remindersEnabled(): boolean {
  const v = process.env.PROGRAM_START_REMINDERS_ENABLED?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no") return false;
  return true;
}

function graceMs(): number {
  const raw = process.env.PROGRAM_START_REMINDERS_GRACE_MS?.trim();
  const n = raw ? parseInt(raw, 10) : NaN;
  if (Number.isFinite(n) && n >= 10_000 && n <= 86_400_000) return n;
  return 120_000;
}

function parseJsonSpeakerIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => {
      if (typeof x === "number" && Number.isFinite(x)) return Math.trunc(x);
      if (typeof x === "string" && x.trim() !== "") {
        const n = parseInt(x, 10);
        return Number.isFinite(n) ? n : NaN;
      }
      return NaN;
    })
    .filter((n) => !Number.isNaN(n));
}

function formatTurkishNameList(names: string[]): string {
  const n = names.filter(Boolean);
  if (n.length === 0) return "";
  if (n.length === 1) return n[0];
  if (n.length === 2) return `${n[0]} ve ${n[1]}`;
  return `${n.slice(0, -1).join(", ")} ve ${n[n.length - 1]}`;
}

function plainTextFromNote(htmlOrText: string | null | undefined): string | null {
  if (!htmlOrText?.trim()) return null;
  const t = htmlOrText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return t || null;
}

function buildSessionStartingBody(params: {
  timeLabel: string;
  locationKey: string | null;
  moderatorNames: string[];
  speakerNames: string[];
  notePlain: string | null;
}): string {
  const { timeLabel, locationKey, moderatorNames, speakerNames, notePlain } = params;
  const timePart = `Saat ${timeLabel}'da`;
  const locationSegment = locationKey
    ? ` ${locationPhraseInLocative(locationKey)} gerçekleşecek oturumda`
    : ` gerçekleşecek oturumda`;

  let message: string;
  if (moderatorNames.length > 0 && speakerNames.length > 0) {
    const modList = formatTurkishNameList(moderatorNames);
    const spList = formatTurkishNameList(speakerNames);
    message = `${timePart}${locationSegment} moderatör ${modList} eşliğinde; ${spList} konuşmacı olarak yer alacaktır.`;
  } else if (moderatorNames.length > 0) {
    const modList = formatTurkishNameList(moderatorNames);
    message = `${timePart}${locationSegment} moderatör ${modList} eşliğinde.`;
  } else if (speakerNames.length > 0) {
    const spList = formatTurkishNameList(speakerNames);
    message = `${timePart}${locationSegment} ${spList} konuşmacı olarak yer alacaktır.`;
  } else {
    message = `${timePart}${locationSegment} Oturum başlıyor.`;
  }

  if (notePlain) {
    message += `\n\nNot: ${notePlain}`;
  }
  return message;
}

let intervalId: ReturnType<typeof setInterval> | undefined;

export function startProgramStartReminderScheduler(): void {
  if (intervalId !== undefined) return;
  if (isLikelyServerlessRuntime()) {
    console.log("[ProgramReminders] Sunucusuz ortamda zamanlayıcı yok; uzun süre çalışan Node sürecinde kullanın veya cron + API ekleyin.");
    return;
  }
  if (!remindersEnabled()) {
    console.log("[ProgramReminders] Kapalı (PROGRAM_START_REMINDERS_ENABLED=0).");
    return;
  }

  const tick = () => {
    runProgramStartReminders().catch((e) =>
      console.error("[ProgramReminders]", e)
    );
  };
  tick();
  intervalId = setInterval(tick, 60_000);
}

export async function runProgramStartReminders(): Promise<void> {
  if (!remindersEnabled()) return;

  const now = Date.now();
  const grace = graceMs();

  const items = await prisma.program_items.findMany({
    where: { reminderSentAt: null },
    include: {
      program_days: true,
    },
  });

  const speakers = await getSpeakers(undefined);
  const speakerNameById = new Map(speakers.map((s) => [s.id, s.name]));

  for (const item of items) {
    const day = item.program_days;
    if (!day.active) continue;

    const parsed = parseProgramItemStartTime(item.time);
    if (!parsed) continue;

    const startAt = istanbulDateTimeForCalendarDay(day.date, parsed.h, parsed.m).getTime();
    const delta = now - startAt;
    if (delta < 0 || delta > grace) continue;

    const claim = await prisma.program_items.updateMany({
      where: { id: item.id, reminderSentAt: null },
      data: { reminderSentAt: new Date() },
    });
    if (claim.count === 0) continue;

    const timeLabel = `${String(parsed.h).padStart(2, "0")}:${String(parsed.m).padStart(2, "0")}`;

    const modIds = parseJsonSpeakerIds(item.moderator_ids);
    const moderatorNames = modIds.map((id) => speakerNameById.get(id)).filter(Boolean) as string[];

    const speakerIds = parseJsonSpeakerIds(item.speakers);
    const speakerNames = speakerIds.map((id) => speakerNameById.get(id)).filter(Boolean) as string[];

    const locationKey = item.location?.trim() || null;
    const notePlain = plainTextFromNote(item.note);

    const message = buildSessionStartingBody({
      timeLabel,
      locationKey,
      moderatorNames,
      speakerNames,
      notePlain,
    });

    const titleTpl = item.title.trim()
      ? programNotificationTemplates.sessionStarting.title
      : programNotificationTemplates.sessionStarting.titleNoTitle;
    const title = replacePlaceholders(titleTpl, {
      title: item.title.trim() || "Oturum",
      time: timeLabel,
    });

    const result = await sendNotification({
      title,
      message,
      segments: ["All"],
      language: "tr",
      data: {
        source: "program_session_start",
        itemId: String(item.id),
        dayId: String(day.id),
      },
    });

    if (!result.success) {
      console.warn("[ProgramReminders] Gönderilemedi, reminder geri alınıyor:", item.id, result.message);
      await prisma.program_items.update({
        where: { id: item.id },
        data: { reminderSentAt: null },
      });
    }
  }
}
