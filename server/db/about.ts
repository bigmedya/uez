import fs from "fs";
import path from "path";
import { prisma } from "./prisma";

const ABOUT_KEY = "about";
const LEGACY_FILE = path.join(process.cwd(), "data", "about.json");

export interface HeroData {
  title: string;
  subtitle: string;
  title_en?: string;
  subtitle_en?: string;
}

export interface Section {
  id: number;
  type: "text" | "image-text" | "text-block" | "image";
  content?: string;
  content_en?: string;
  image?: string;
  imageAlt?: string;
  imageAlt_en?: string;
  paragraphs?: string[];
  paragraphs_en?: string[];
  order: number;
}

export interface AboutData {
  hero: HeroData;
  sections: Section[];
  updatedAt: string;
}

function defaultAboutData(): AboutData {
  return {
    hero: { title: "Hakkımızda", subtitle: "" },
    sections: [],
    updatedAt: new Date().toISOString(),
  };
}

/** Eski data/about.json varsa Prisma'ya taşır (bir kerelik) */
async function migrateFromFileIfNeeded(): Promise<AboutData | null> {
  try {
    if (!fs.existsSync(LEGACY_FILE)) return null;
    const raw = fs.readFileSync(LEGACY_FILE, "utf-8");
    const parsed = JSON.parse(raw) as AboutData;
    const data: AboutData = {
      hero: { ...defaultAboutData().hero, ...parsed.hero },
      sections: (parsed.sections || []).map((s, i) => ({
        ...s,
        order: s.order ?? i + 1,
      })),
      updatedAt: new Date().toISOString(),
    };
    await saveAboutData(data);
    return data;
  } catch {
    return null;
  }
}

/** Ham veri (admin için; _en alanları dahil) */
export async function getAboutData(): Promise<AboutData> {
  const row = await prisma.about_content.findUnique({
    where: { key: ABOUT_KEY },
  });
  if (!row || !row.value) {
    const migrated = await migrateFromFileIfNeeded();
    if (migrated) return migrated;
    return defaultAboutData();
  }
  const value = row.value as unknown as AboutData;
  return {
    ...defaultAboutData(),
    ...value,
    hero: { ...defaultAboutData().hero, ...value.hero },
    sections: value.sections?.length ? value.sections : defaultAboutData().sections,
    updatedAt: value.updatedAt || new Date().toISOString(),
  };
}

export type AboutLocale = "tr" | "en";

function resolveSection(section: Section, isEn: boolean): Section {
  const base = { ...section };
  if (isEn) {
    if (section.content_en != null && section.content_en !== "") base.content = section.content_en;
    if (section.imageAlt_en != null && section.imageAlt_en !== "") base.imageAlt = section.imageAlt_en;
    if (Array.isArray(section.paragraphs_en) && section.paragraphs_en.length > 0) base.paragraphs = section.paragraphs_en;
  }
  return base;
}

/** Site için dile göre çözümlenmiş veri */
export async function getAboutDataForLocale(locale: AboutLocale): Promise<AboutData> {
  const raw = await getAboutData();
  const isEn = locale === "en";

  return {
    hero: {
      title: isEn ? (raw.hero.title_en || raw.hero.title) : raw.hero.title,
      subtitle: isEn ? (raw.hero.subtitle_en ?? raw.hero.subtitle) : raw.hero.subtitle,
    },
    sections: raw.sections.map((s) => resolveSection(s, isEn)),
    updatedAt: raw.updatedAt,
  };
}

export async function saveAboutData(data: AboutData): Promise<AboutData> {
  const updated = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await prisma.about_content.upsert({
    where: { key: ABOUT_KEY },
    create: { key: ABOUT_KEY, value: updated as unknown as object, updatedAt: new Date() },
    update: { value: updated as unknown as object, updatedAt: new Date() },
  });

  return updated;
}

export async function updateHero(heroData: Partial<HeroData>): Promise<AboutData> {
  const current = await getAboutData();
  return saveAboutData({
    ...current,
    hero: { ...current.hero, ...heroData },
  });
}

export async function getSections(): Promise<Section[]> {
  const data = await getAboutData();
  return data.sections.sort((a, b) => a.order - b.order);
}

export async function addSection(section: Omit<Section, "id" | "order">): Promise<Section> {
  const data = await getAboutData();
  const maxId = Math.max(0, ...data.sections.map((s) => s.id));
  const maxOrder = Math.max(0, ...data.sections.map((s) => s.order));

  const newSection: Section = {
    ...section,
    id: maxId + 1,
    order: maxOrder + 1,
  };

  data.sections.push(newSection);
  await saveAboutData(data);
  return newSection;
}

export async function updateSection(id: number, updates: Partial<Section>): Promise<Section | null> {
  const data = await getAboutData();
  const section = data.sections.find((s) => s.id === id);
  if (!section) return null;

  Object.assign(section, updates);
  await saveAboutData(data);
  return section;
}

export async function deleteSection(id: number): Promise<boolean> {
  const data = await getAboutData();
  const index = data.sections.findIndex((s) => s.id === id);
  if (index === -1) return false;

  data.sections.splice(index, 1);
  await saveAboutData(data);
  return true;
}

export async function reorderSections(sectionIds: number[]): Promise<Section[]> {
  const data = await getAboutData();
  sectionIds.forEach((id, index) => {
    const section = data.sections.find((s) => s.id === id);
    if (section) section.order = index + 1;
  });
  await saveAboutData(data);
  return getSections();
}
