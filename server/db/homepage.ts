import { prisma } from "./prisma";

const HOMEPAGE_KEY = "homepage";

export interface HeroData {
  dateText: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  videoImage: string;
  videoUrl: string;
  eventDate: string;
  dateText_en?: string;
  title_en?: string;
  subtitle_en?: string;
  buttonText_en?: string;
}

export interface CounterItem {
  id: number;
  label: string;
  value: string;
  label_en?: string;
}

export interface InfoBannerData {
  text: string;
  buttonText: string;
  buttonLink: string;
  text_en?: string;
  buttonText_en?: string;
}

export interface HomepageData {
  hero: HeroData;
  counters: CounterItem[];
  infoBanner: InfoBannerData;
  updatedAt: string;
}

function defaultHomepageData(): HomepageData {
  return {
    hero: {
      dateText: "9 - 12 Nisan da",
      title: "BÜYÜK DÖNÜŞÜM:",
      subtitle: "Dayanıklı ve sürdürülebilir bir küresel sisteme geçişin pusulası",
      buttonText: "Keşfet",
      buttonLink: "/uez-2026",
      videoImage: "",
      videoUrl: "",
      eventDate: "2026-03-25T09:00:00",
    },
    counters: [
      { id: 1, label: "Konuşmacı", value: "70+" },
      { id: 2, label: "Katılımcı", value: "2000+" },
      { id: 3, label: "Yıllık Deneyim", value: "13" },
      { id: 4, label: "Panel", value: "25+" },
    ],
    infoBanner: {
      text: "",
      buttonText: "Paketler",
      buttonLink: "/paketler/",
    },
    updatedAt: new Date().toISOString(),
  };
}

/** Ham veri (admin için; _en alanları dahil) */
export async function getHomepageData(): Promise<HomepageData> {
  const row = await prisma.homepage_content.findUnique({
    where: { key: HOMEPAGE_KEY },
  });
  if (!row || !row.value) {
    return defaultHomepageData();
  }
  const value = row.value as unknown as HomepageData;
  return {
    ...defaultHomepageData(),
    ...value,
    hero: { ...defaultHomepageData().hero, ...value.hero },
    counters: value.counters?.length ? value.counters : defaultHomepageData().counters,
    infoBanner: { ...defaultHomepageData().infoBanner, ...value.infoBanner },
    updatedAt: value.updatedAt || new Date().toISOString(),
  };
}

export type HomepageLocale = "tr" | "en";

/** Site için dile göre çözümlenmiş veri (_en alanları ana alanlara yansıtılır) */
export async function getHomepageDataForLocale(locale: HomepageLocale): Promise<HomepageData> {
  const raw = await getHomepageData();
  const isEn = locale === "en";

  return {
    hero: {
      dateText: isEn ? (raw.hero.dateText_en || raw.hero.dateText) : raw.hero.dateText,
      title: isEn ? (raw.hero.title_en || raw.hero.title) : raw.hero.title,
      subtitle: isEn ? (raw.hero.subtitle_en || raw.hero.subtitle) : raw.hero.subtitle,
      buttonText: isEn ? (raw.hero.buttonText_en || raw.hero.buttonText) : raw.hero.buttonText,
      buttonLink: raw.hero.buttonLink,
      videoImage: raw.hero.videoImage,
      videoUrl: raw.hero.videoUrl,
      eventDate: raw.hero.eventDate,
    },
    counters: raw.counters.map((c) => ({
      id: c.id,
      label: isEn ? (c.label_en || c.label) : c.label,
      value: c.value,
    })),
    infoBanner: {
      text: isEn ? (raw.infoBanner.text_en ?? raw.infoBanner.text) : raw.infoBanner.text,
      buttonText: isEn ? (raw.infoBanner.buttonText_en || raw.infoBanner.buttonText) : raw.infoBanner.buttonText,
      buttonLink: raw.infoBanner.buttonLink,
    },
    updatedAt: raw.updatedAt,
  };
}

export async function updateHomepageData(updates: Partial<HomepageData>): Promise<HomepageData> {
  const current = await getHomepageData();
  const updated: HomepageData = {
    ...current,
    ...updates,
    hero: { ...current.hero, ...updates.hero },
    counters: updates.counters ?? current.counters,
    infoBanner: { ...current.infoBanner, ...updates.infoBanner },
    updatedAt: new Date().toISOString(),
  };

  await prisma.homepage_content.upsert({
    where: { key: HOMEPAGE_KEY },
    create: { key: HOMEPAGE_KEY, value: updated as unknown as object, updatedAt: new Date() },
    update: { value: updated as unknown as object, updatedAt: new Date() },
  });

  return updated;
}

export async function updateHero(heroData: Partial<HeroData>): Promise<HomepageData> {
  const current = await getHomepageData();
  return updateHomepageData({
    hero: { ...current.hero, ...heroData },
  });
}

export async function updateCounters(counters: CounterItem[]): Promise<HomepageData> {
  return updateHomepageData({ counters });
}

export async function updateInfoBanner(bannerData: Partial<InfoBannerData>): Promise<HomepageData> {
  const current = await getHomepageData();
  return updateHomepageData({
    infoBanner: { ...current.infoBanner, ...bannerData },
  });
}
