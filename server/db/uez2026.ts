import fs from "fs";
import path from "path";
import { prisma } from "./prisma";

const DATA_FILE = path.join(process.cwd(), "data", "uez2026.json");
const UEZ2026_KEY = "data";

export type Locale = "tr" | "en";

/** Raw hero (stored: TR + EN) */
export interface HeroDataRaw {
  title_tr: string;
  title_en: string;
  subtitle_tr: string;
  subtitle_en: string;
  location_tr: string;
  location_en: string;
}

/** Resolved hero for public (single locale) */
export interface HeroData {
  title: string;
  subtitle: string;
  location: string;
}

/** Raw intro (stored: TR + EN per paragraph) */
export interface IntroDataRaw {
  paragraphs: Array<{ tr: string; en: string }>;
}

/** Resolved intro for public */
export interface IntroData {
  paragraphs: string[];
}

/** Raw topics section (stored: TR + EN) */
export interface TopicsSectionDataRaw {
  titleLine1_tr: string;
  titleLine1_en: string;
  titleLine2_tr: string;
  titleLine2_en: string;
}

/** Resolved topics section for public */
export interface TopicsSectionData {
  titleLine1: string;
  titleLine2: string;
}

/** Raw topic (stored: TR + EN) */
export interface TopicRaw {
  id: number;
  title_tr: string;
  title_en: string;
  description_tr: string;
  description_en: string;
  image: string;
  order: number;
  active: boolean;
}

/** Resolved topic for public */
export interface Topic {
  id: number;
  title: string;
  description: string;
  image: string;
  order: number;
  active: boolean;
}

/** Full stored data (admin) */
export interface UEZ2026DataRaw {
  hero: HeroDataRaw;
  intro: IntroDataRaw;
  topicsSection: TopicsSectionDataRaw;
  topics: TopicRaw[];
  updatedAt: string;
}

/** Resolved data for public (single locale) */
export interface UEZ2026Data {
  hero: HeroData;
  intro: IntroData;
  topicsSection: TopicsSectionData;
  topics: Topic[];
  updatedAt: string;
}

function defaultData(): UEZ2026DataRaw {
  return {
    hero: {
      title_tr: "UEZ 2026",
      title_en: "UEZ 2026",
      subtitle_tr: "",
      subtitle_en: "",
      location_tr: "",
      location_en: "",
    },
    intro: { paragraphs: [] },
    topicsSection: {
      titleLine1_tr: "",
      titleLine1_en: "",
      titleLine2_tr: "",
      titleLine2_en: "",
    },
    topics: [],
    updatedAt: new Date().toISOString(),
  };
}

function ensureDataFile(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData(), null, 2));
  }
}

function pickLocale<T extends string>(tr: T, en: T, locale: Locale): T {
  const isEn = locale === "en";
  return (isEn ? en : tr) ?? (tr ?? en);
}

/** Migrate legacy single-language format to TR/EN */
function migrateFromLegacy(raw: unknown): UEZ2026DataRaw {
  const o = raw as Record<string, unknown>;
  const hero = (o.hero ?? {}) as Record<string, string>;
  const intro = (o.intro ?? { paragraphs: [] }) as { paragraphs: unknown[] };
  const topicsSection = (o.topicsSection ?? {}) as Record<string, string>;
  const topics = (Array.isArray(o.topics) ? o.topics : []) as Array<Record<string, unknown>>;

  const heroRaw: HeroDataRaw = {
    title_tr: hero.title_tr ?? hero.title ?? "",
    title_en: hero.title_en ?? hero.title ?? "",
    subtitle_tr: hero.subtitle_tr ?? hero.subtitle ?? "",
    subtitle_en: hero.subtitle_en ?? hero.subtitle ?? "",
    location_tr: hero.location_tr ?? hero.location ?? "",
    location_en: hero.location_en ?? hero.location ?? "",
  };

  const paragraphsRaw: Array<{ tr: string; en: string }> = intro.paragraphs.map((p) => {
    if (typeof p === "object" && p !== null && "tr" in p && "en" in p) {
      return { tr: String((p as { tr: string }).tr), en: String((p as { en: string }).en) };
    }
    const s = String(p ?? "");
    return { tr: s, en: s };
  });

  const topicsSectionRaw: TopicsSectionDataRaw = {
    titleLine1_tr: topicsSection.titleLine1_tr ?? topicsSection.titleLine1 ?? "",
    titleLine1_en: topicsSection.titleLine1_en ?? topicsSection.titleLine1 ?? "",
    titleLine2_tr: topicsSection.titleLine2_tr ?? topicsSection.titleLine2 ?? "",
    titleLine2_en: topicsSection.titleLine2_en ?? topicsSection.titleLine2 ?? "",
  };

  const topicsRaw: TopicRaw[] = topics.map((t) => ({
    id: Number(t.id),
    title_tr: (t.title_tr as string) ?? (t.title as string) ?? "",
    title_en: (t.title_en as string) ?? (t.title as string) ?? "",
    description_tr: (t.description_tr as string) ?? (t.description as string) ?? "",
    description_en: (t.description_en as string) ?? (t.description as string) ?? "",
    image: String(t.image ?? ""),
    order: Number(t.order ?? 0),
    active: t.active !== false,
  }));

  return {
    hero: heroRaw,
    intro: { paragraphs: paragraphsRaw },
    topicsSection: topicsSectionRaw,
    topics: topicsRaw,
    updatedAt: String(o.updatedAt ?? new Date().toISOString()),
  };
}

function isLegacyFormat(o: unknown): boolean {
  const obj = o as Record<string, unknown>;
  const hero = obj.hero as Record<string, string> | undefined;
  return Boolean(hero && "title" in hero && !("title_tr" in hero));
}

/** Load from JSON file (fallback) */
function loadFromJson(): UEZ2026DataRaw {
  ensureDataFile();
  const content = fs.readFileSync(DATA_FILE, "utf-8");
  const parsed = JSON.parse(content) as unknown;
  const migrated = migrateFromLegacy(parsed);
  return migrated;
}

/** Prisma boşken bir kez JSON'dan seed et; JSON yoksa default ile seed et */
async function seedFromJson(): Promise<UEZ2026DataRaw> {
  let data: UEZ2026DataRaw;
  try {
    data = loadFromJson();
  } catch {
    data = defaultData();
  }
  data.updatedAt = new Date().toISOString();
  await prisma.uez2026_content.upsert({
    where: { key: UEZ2026_KEY },
    create: { key: UEZ2026_KEY, value: data as unknown as object, updatedAt: new Date() },
    update: { value: data as unknown as object, updatedAt: new Date() },
  });
  return data;
}

/** Get UEZ 2026 data: only from Prisma (dynamic). If empty, seed once from JSON then return. */
export async function getUEZ2026Data(): Promise<UEZ2026DataRaw> {
  const row = await prisma.uez2026_content.findUnique({
    where: { key: UEZ2026_KEY },
  });
  if (row?.value && typeof row.value === "object") {
    const value = row.value as unknown as UEZ2026DataRaw;
    return {
      ...defaultData(),
      ...value,
      hero: { ...defaultData().hero, ...value.hero },
      intro: value.intro?.paragraphs ? value.intro : defaultData().intro,
      topicsSection: { ...defaultData().topicsSection, ...value.topicsSection },
      topics: Array.isArray(value.topics) ? value.topics : defaultData().topics,
      updatedAt: value.updatedAt ?? new Date().toISOString(),
    };
  }
  // Prisma boş: bir kez JSON'dan seed et, sonra Prisma'dan dön
  return seedFromJson();
}

/** Persist: only Prisma (dynamic). */
export async function saveUEZ2026Data(data: UEZ2026DataRaw): Promise<UEZ2026DataRaw> {
  data.updatedAt = new Date().toISOString();
  await prisma.uez2026_content.upsert({
    where: { key: UEZ2026_KEY },
    create: { key: UEZ2026_KEY, value: data as unknown as object, updatedAt: new Date() },
    update: { value: data as unknown as object, updatedAt: new Date() },
  });
  return data;
}

/** Resolve raw data for a locale (public API) */
export function resolveForLocale(raw: UEZ2026DataRaw, locale: Locale): UEZ2026Data {
  const L: Locale = locale === "en" ? "en" : "tr";
  return {
    hero: {
      title: pickLocale(raw.hero.title_tr, raw.hero.title_en, L),
      subtitle: pickLocale(raw.hero.subtitle_tr, raw.hero.subtitle_en, L),
      location: pickLocale(raw.hero.location_tr, raw.hero.location_en, L),
    },
    intro: {
      paragraphs: raw.intro.paragraphs.map((p) => pickLocale(p.tr, p.en, L)),
    },
    topicsSection: {
      titleLine1: pickLocale(raw.topicsSection.titleLine1_tr, raw.topicsSection.titleLine1_en, L),
      titleLine2: pickLocale(raw.topicsSection.titleLine2_tr, raw.topicsSection.titleLine2_en, L),
    },
    topics: raw.topics
      .filter((t) => t.active)
      .sort((a, b) => a.order - b.order)
      .map((t) => ({
        id: t.id,
        title: pickLocale(t.title_tr, t.title_en, L),
        description: pickLocale(t.description_tr, t.description_en, L),
        image: t.image,
        order: t.order,
        active: t.active,
      })),
    updatedAt: raw.updatedAt,
  };
}

export async function updateHero(heroData: Partial<HeroDataRaw>): Promise<UEZ2026DataRaw> {
  const data = await getUEZ2026Data();
  data.hero = { ...data.hero, ...heroData };
  return saveUEZ2026Data(data);
}

export async function updateIntro(introData: IntroDataRaw): Promise<UEZ2026DataRaw> {
  const data = await getUEZ2026Data();
  data.intro = introData;
  return saveUEZ2026Data(data);
}

export async function updateTopicsSection(
  sectionData: Partial<TopicsSectionDataRaw>
): Promise<UEZ2026DataRaw> {
  const data = await getUEZ2026Data();
  data.topicsSection = { ...data.topicsSection, ...sectionData };
  return saveUEZ2026Data(data);
}

export async function getTopics(): Promise<TopicRaw[]> {
  const data = await getUEZ2026Data();
  return [...data.topics].sort((a, b) => a.order - b.order);
}

export async function getActiveTopicsRaw(): Promise<TopicRaw[]> {
  const topics = await getTopics();
  return topics.filter((t) => t.active);
}

export async function addTopic(
  topic: Omit<TopicRaw, "id" | "order">
): Promise<TopicRaw> {
  const data = await getUEZ2026Data();
  const maxId = Math.max(0, ...data.topics.map((t) => t.id));
  const maxOrder = Math.max(0, ...data.topics.map((t) => t.order));

  const newTopic: TopicRaw = {
    ...topic,
    id: maxId + 1,
    order: maxOrder + 1,
  };

  data.topics.push(newTopic);
  await saveUEZ2026Data(data);
  return newTopic;
}

export async function updateTopic(
  id: number,
  updates: Partial<TopicRaw>
): Promise<TopicRaw | null> {
  const data = await getUEZ2026Data();
  const topic = data.topics.find((t) => t.id === id);
  if (!topic) return null;

  Object.assign(topic, updates);
  await saveUEZ2026Data(data);
  return topic;
}

export async function deleteTopic(id: number): Promise<boolean> {
  const data = await getUEZ2026Data();
  const index = data.topics.findIndex((t) => t.id === id);
  if (index === -1) return false;

  data.topics.splice(index, 1);
  await saveUEZ2026Data(data);
  return true;
}

export async function reorderTopics(topicIds: number[]): Promise<TopicRaw[]> {
  const data = await getUEZ2026Data();
  topicIds.forEach((id, index) => {
    const topic = data.topics.find((t) => t.id === id);
    if (topic) {
      topic.order = index + 1;
    }
  });
  await saveUEZ2026Data(data);
  return getTopics();
}
