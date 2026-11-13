import fs from "fs";
import path from "path";
import { prisma } from "./prisma";

const MOBILE_PAGE_KEY = "mobile_page";
const DATA_FILE = path.join(process.cwd(), "data", "mobile-page.json");

export interface QuickAction {
  id: number;
  key: string;
  title: string;
  title_en?: string;
  icon: string;
  href: string;
  order: number;
  active: boolean;
  description?: string;
  description_en?: string;
}

export interface SocialMedia {
  platform: "linkedin" | "facebook" | "instagram" | "youtube" | "twitter";
  url: string;
  active: boolean;
}

export interface MobilePageData {
  eventDate: string;
  eventDate_en?: string;
  eventTime: string;
  eventTime_en?: string;
  venueName: string;
  venueName_en?: string;
  venueDetails: string;
  venueDetails_en?: string;
  locationLink?: string;
  logoUrl: string;
  ticketButtonText: string;
  ticketButtonText_en?: string;
  ticketButtonLink: string;
  quickActions: QuickAction[];
  aboutText: string;
  aboutText_en?: string;
  aboutLink: string;
  hostName: string;
  hostName_en?: string;
  hostLogo: string;
  socialMedia: SocialMedia[];
  updatedAt: string;
}

const defaultMobilePageData: MobilePageData = {
  eventDate: "12 Kasım - 14 Kasım",
  eventTime: "08:00 - 23:55 (UTC+03:00)",
  venueName: "Haliç Kongre Merkezi",
  venueDetails: "Sütlüce Mah., Karaağaç Cad. Haliç Kongre Merkezi İdari Bina",
  logoUrl: "https://api.builder.io/api/v1/image/assets/TEMP/bc1aefcc49920778079094c811fbb255fd0b276e?width=295",
  ticketButtonText: "Bilet Al",
  ticketButtonLink: "/paketler/",
  quickActions: [],
  aboutText: "",
  aboutLink: "/hakkimizda",
  hostName: "",
  hostLogo: "",
  socialMedia: [],
  updatedAt: new Date().toISOString(),
};

/** Prisma'dan mobil sayfa verisini oku. Yoksa JSON'dan seed yap. */
export async function getMobilePageData(): Promise<MobilePageData> {
  const row = await prisma.site_settings.findUnique({ where: { key: MOBILE_PAGE_KEY } });
  if (row && row.value && typeof row.value === "object") {
    const data = row.value as unknown as MobilePageData;
    if (data.quickActions && Array.isArray(data.quickActions) && data.socialMedia && Array.isArray(data.socialMedia)) {
      return { ...data, updatedAt: row.updatedAt.toISOString() };
    }
  }
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const data = JSON.parse(content) as MobilePageData;
      data.updatedAt = new Date().toISOString();
      await prisma.site_settings.upsert({
        where: { key: MOBILE_PAGE_KEY },
        create: { key: MOBILE_PAGE_KEY, value: data as object, updatedAt: new Date() },
        update: { value: data as object, updatedAt: new Date() },
      });
      return data;
    } catch {
      // ignore
    }
  }
  return defaultMobilePageData;
}

export type MobilePageLocale = "tr" | "en";

/** Site için dile göre çözümlenmiş mobil sayfa verisi */
export async function getMobilePageDataForLocale(locale: MobilePageLocale): Promise<MobilePageData> {
  const raw = await getMobilePageData();
  const isEn = locale === "en";
  return {
    ...raw,
    eventDate: isEn ? (raw.eventDate_en || raw.eventDate) : raw.eventDate,
    eventTime: isEn ? (raw.eventTime_en || raw.eventTime) : raw.eventTime,
    venueName: isEn ? (raw.venueName_en || raw.venueName) : raw.venueName,
    venueDetails: isEn ? (raw.venueDetails_en || raw.venueDetails) : raw.venueDetails,
    ticketButtonText: isEn ? (raw.ticketButtonText_en || raw.ticketButtonText) : raw.ticketButtonText,
    aboutText: isEn ? (raw.aboutText_en ?? raw.aboutText) : raw.aboutText,
    hostName: isEn ? (raw.hostName_en || raw.hostName) : raw.hostName,
    quickActions: raw.quickActions.map((a) => ({
      ...a,
      title: isEn ? (a.title_en || a.title) : a.title,
      description: isEn ? (a.description_en ?? a.description) : a.description,
    })),
    updatedAt: raw.updatedAt,
  };
}

export async function updateMobilePageData(updates: Partial<MobilePageData>): Promise<MobilePageData> {
  const current = await getMobilePageData();
  const updated: MobilePageData = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await prisma.site_settings.upsert({
    where: { key: MOBILE_PAGE_KEY },
    create: { key: MOBILE_PAGE_KEY, value: updated as object, updatedAt: new Date() },
    update: { value: updated as object, updatedAt: new Date() },
  });
  return updated;
}
