import fs from "fs";
import path from "path";
import { prisma } from "./prisma";

const DB_PATH = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DB_PATH, "site-settings.json");

const SETTINGS_KEY = "main";

export interface SiteSettingsRecord {
  siteTitle: string;
  siteTitle_en?: string;
  metaDescription: string;
  metaDescription_en?: string;
  metaKeywords: string;
  metaKeywords_en?: string;
  email: string;
  phone: string;
  address: string;
  address_en?: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  instagram: string;
  facebook: string;
  copyrightText: string;
  copyrightText_en?: string;
  logoUrl: string;
  faviconUrl: string;
  liveButtonActive: boolean;
  liveButtonUrl: string;
  /** Canlı İngilizce yayın butonu URL’si */
  liveButtonUrl_en: string;
  updatedAt: string;
}

export interface SiteSettings {
  siteTitle: string;
  metaDescription: string;
  metaKeywords: string;
  email: string;
  phone: string;
  address: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  instagram: string;
  facebook: string;
  copyrightText: string;
  logoUrl: string;
  faviconUrl: string;
  liveButtonActive: boolean;
  liveButtonUrl: string;
  liveButtonUrl_en: string;
  updatedAt: string;
}

const defaultRecord: SiteSettingsRecord = {
  siteTitle: "UEZ 2026 - Uluslararası Ekonomi Zirvesi",
  siteTitle_en: "UEZ 2026 - International Economics Summit",
  metaDescription: "Uluslararası Ekonomi Zirvesi 2026 - Büyük Dönüşüm: Dayanıklı ve Sürdürülebilir Bir Küresel Sisteme Geçişin Pusulası",
  metaDescription_en: "International Economics Summit 2026 - The Great Transformation: Compass for Transition to a Resilient and Sustainable Global System",
  metaKeywords: "ekonomi zirvesi, uez, uluslararası ekonomi, sapanca, türkiye",
  metaKeywords_en: "economics summit, uez, international economics, sapanca, turkey",
  email: "info@uez.org.tr",
  phone: "+90 212 123 4567",
  address: "NG Sapanca Wellness & Convention, Sapanca/Sakarya",
  address_en: "NG Sapanca Wellness & Convention, Sapanca/Sakarya",
  twitter: "https://x.com/UEkonomiZirvesi",
  linkedin: "https://www.linkedin.com/company/uluslararasiekonomizirvesi",
  youtube: "https://www.youtube.com/@UluslararasiEkonomiZirvesi",
  instagram: "https://www.instagram.com/uluslararasiekonomizirvesi/",
  facebook: "https://www.facebook.com/UEkonomiZirvesi",
  copyrightText: "© 2026 Uluslararası Ekonomi Zirvesi. Tüm hakları saklıdır.",
  copyrightText_en: "© 2026 International Economics Summit. All rights reserved.",
  logoUrl: "",
  faviconUrl: "",
  liveButtonActive: false,
  liveButtonUrl: "",
  liveButtonUrl_en: "",
  updatedAt: new Date().toISOString(),
};

function recordToSettings(record: SiteSettingsRecord, locale?: string): SiteSettings {
  const isEn = locale === "en";
  return {
    siteTitle: isEn && record.siteTitle_en ? record.siteTitle_en : record.siteTitle,
    metaDescription: isEn && record.metaDescription_en ? record.metaDescription_en : record.metaDescription,
    metaKeywords: isEn && record.metaKeywords_en ? record.metaKeywords_en : record.metaKeywords,
    email: record.email,
    phone: record.phone,
    address: isEn && record.address_en ? record.address_en : record.address,
    twitter: record.twitter,
    linkedin: record.linkedin,
    youtube: record.youtube,
    instagram: record.instagram,
    facebook: record.facebook,
    copyrightText: isEn && record.copyrightText_en ? record.copyrightText_en : record.copyrightText,
    logoUrl: record.logoUrl,
    faviconUrl: record.faviconUrl,
    liveButtonActive: record.liveButtonActive,
    liveButtonUrl: record.liveButtonUrl,
    liveButtonUrl_en: record.liveButtonUrl_en ?? "",
    updatedAt: record.updatedAt,
  };
}

async function ensureSettingsRow(): Promise<SiteSettingsRecord> {
  const row = await prisma.site_settings.findUnique({ where: { key: SETTINGS_KEY } });
  if (row && row.value && typeof row.value === "object") {
    return { ...defaultRecord, ...(row.value as object), updatedAt: (row.updatedAt as unknown as Date).toISOString() } as SiteSettingsRecord;
  }
  let record: SiteSettingsRecord = { ...defaultRecord };
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
      record = { ...defaultRecord, ...data, updatedAt: data.updatedAt || new Date().toISOString() };
    } catch {
      // ignore
    }
  }
  await prisma.site_settings.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: record as unknown as object, updatedAt: new Date() },
    update: { value: record as unknown as object, updatedAt: new Date() },
  });
  return record;
}

export async function getSettings(locale?: string, forAdmin?: boolean): Promise<SiteSettings | SiteSettingsRecord> {
  const record = await ensureSettingsRow();
  if (forAdmin) return record;
  return recordToSettings(record, locale);
}

export async function updateSettings(updates: Partial<SiteSettingsRecord>): Promise<SiteSettings> {
  const record = await ensureSettingsRow();
  const updatedAt = new Date().toISOString();
  const merged: SiteSettingsRecord = {
    ...record,
    ...updates,
    updatedAt,
  };
  await prisma.site_settings.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: merged as unknown as object, updatedAt: new Date() },
    update: { value: merged as unknown as object, updatedAt: new Date() },
  });
  return recordToSettings(merged);
}

export async function resetSettings(): Promise<SiteSettings> {
  const record = { ...defaultRecord, updatedAt: new Date().toISOString() };
  await prisma.site_settings.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: record as unknown as object, updatedAt: new Date() },
    update: { value: record as unknown as object, updatedAt: new Date() },
  });
  return recordToSettings(record);
}
