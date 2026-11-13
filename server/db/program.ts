import { prisma } from "./prisma";
import { cleanText } from "../utils/textCleaner";
import { sanitizeProgramNoteForStorage, sanitizeProgramNoteImageUrl } from "../utils/programNoteSanitize";
import { getSpeakers } from "./speakers";
import { isValidProgramLocation } from "../../shared/programLocations";

function normalizeProgramLocation(raw: string | null | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  return isValidProgramLocation(t) ? t : null;
}

export interface ScheduleItemModerator {
  name: string;
  title?: string;
  photo?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
}

export interface ScheduleItemSpeaker {
  id: number;
  name: string;
  title?: string;
  photo?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
}

export interface ScheduleItem {
  id: number;
  time: string;
  /** Amber Salonu, Ihlamur Restaurant, Lobby Fuaye */
  location?: string | null;
  title: string;
  title_en?: string;
  note?: string;
  note_en?: string;
  note_image?: string;
  moderator?: string;
  moderator_en?: string;
  moderatorTitle?: string;
  moderator_title_en?: string;
  moderatorIds?: number[];
  moderators?: ScheduleItemModerator[];
  speakerId?: number;
  speakerIds?: number[];
  speakers?: ScheduleItemSpeaker[];
  wpSpeakerId?: string;
  wpSpeakerIds?: string[];
  isMultiSpeaker: boolean;
  order: number;
}

export interface ScheduleDay {
  id: number;
  title: string;
  title_en?: string;
  slug: string;
  categoryId: number;
  scheduleItems: ScheduleItem[];
  order: number;
  wpPostId?: number;
  label?: string;
  label_en?: string;
}

export interface ScheduleCategory {
  id: number;
  name: string;
  name_en?: string;
  slug: string;
  order: number;
}

export interface ProgramData {
  categories: ScheduleCategory[];
  days: ScheduleDay[];
  updatedAt: string;
}

// Helper: pick text by locale for program entities
function programLocale(locale?: string) {
  const useEn = locale === "en";
  return {
    catName: (c: { name: string; name_en?: string | null }) => (useEn && c.name_en ? c.name_en : c.name),
    dayTitle: (d: { title: string | null; label: string; title_en?: string | null; label_en?: string | null }) =>
      cleanText(useEn && d.title_en ? d.title_en : (useEn && d.label_en ? d.label_en : (d.title || d.label))),
    itemTitle: (item: { title: string; title_en?: string | null }) => cleanText(useEn && item.title_en ? item.title_en : item.title),
    itemNote: (item: { note: string | null; note_en?: string | null }) => {
      const raw =
        useEn && item.note_en != null && String(item.note_en).trim() !== ""
          ? item.note_en
          : item.note;
      if (raw == null || String(raw).trim() === "") return undefined;
      return String(raw).trim();
    },
    itemNoteImage: (item: { note_image: string | null }) =>
      sanitizeProgramNoteImageUrl(item.note_image),
    itemModerator: (item: { moderator: string | null; moderator_en?: string | null }) => (useEn && item.moderator_en ? item.moderator_en : item.moderator) || undefined,
    itemModeratorTitle: (item: { moderatorTitle: string | null; moderator_title_en?: string | null }) => (useEn && item.moderator_title_en ? item.moderator_title_en : item.moderatorTitle) || undefined,
  };
}

type SpeakerMapEntry = {
  name: string;
  title?: string;
  photo?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
};

/** Json alanından moderatör id listesi (sayı veya string id'ler) */
function parseSpeakerIdList(raw: unknown): number[] {
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

function trimOpt(v: string | undefined): string | undefined {
  const t = v?.trim();
  return t || undefined;
}

// Resolve moderator_ids to moderators array using speakers list; fallback to legacy single moderator
function resolveModerators(
  item: { moderator_ids: unknown; moderator: string | null; moderator_en?: string | null; moderatorTitle: string | null; moderator_title_en?: string | null },
  locale: string | undefined,
  speakerMap: Map<number, SpeakerMapEntry>
): ScheduleItemModerator[] {
  const ids = parseSpeakerIdList(item.moderator_ids);
  if (ids.length > 0) {
    const loc = programLocale(locale);
    const legacyTitleFirst = loc.itemModeratorTitle(item);
    return ids
      .map((id, index): ScheduleItemModerator | null => {
        const s = speakerMap.get(id);
        if (!s) return null;
        const title = trimOpt(s.title) || (index === 0 ? legacyTitleFirst : undefined);
        return {
          name: s.name,
          title,
          photo: s.photo,
          company: trimOpt(s.company),
          companyEn: trimOpt(s.companyEn),
          position: trimOpt(s.position),
          positionEn: trimOpt(s.positionEn),
        };
      })
      .filter((m): m is ScheduleItemModerator => m != null);
  }
  const name = (locale === "en" && item.moderator_en ? item.moderator_en : item.moderator) || undefined;
  const title = (locale === "en" && item.moderator_title_en ? item.moderator_title_en : item.moderatorTitle) || undefined;
  if (name) return [{ name, title }];
  return [];
}

// Get all program data (locale?: "en" for _en fields)
export async function getProgramData(locale?: string): Promise<ProgramData> {
  try {
    const loc = programLocale(locale);
    const [categories, days, allSpeakers] = await Promise.all([
      prisma.program_categories.findMany({ orderBy: { order: "asc" } }),
      prisma.program_days.findMany({
        include: { program_items: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      }),
      getSpeakers(locale),
    ]);
    const speakerMap = new Map<number, SpeakerMapEntry>(allSpeakers.map((s) => [s.id, { name: s.name, title: s.title, photo: s.photo, company: s.company, companyEn: s.companyEn, position: s.position, positionEn: s.positionEn }]));

    return {
      categories: categories.map((c) => ({
        id: c.id,
        name: loc.catName(c),
        slug: c.slug,
        order: c.order,
      })),
      days: days.map((d) => ({
        id: d.id,
        title: loc.dayTitle(d),
        slug: d.slug || "",
        categoryId: d.categoryId || 0,
        scheduleItems: d.program_items.map((item) => {
          const speakersData = item.speakers as any;
          const speakerIds = Array.isArray(speakersData) ? speakersData : [];
          const moderatorIdsParsed = parseSpeakerIdList(item.moderator_ids);
          return {
            id: item.id,
            time: cleanText(item.time),
            location: item.location ?? undefined,
            title: loc.itemTitle(item),
            note: loc.itemNote(item),
            note_image: loc.itemNoteImage(item),
            moderator: loc.itemModerator(item),
            moderatorTitle: loc.itemModeratorTitle(item),
            moderatorIds: moderatorIdsParsed.length > 0 ? moderatorIdsParsed : undefined,
            moderators: resolveModerators(item, locale, speakerMap),
            speakerId: undefined,
            speakerIds: speakerIds,
            wpSpeakerId: item.wpSpeakerId || undefined,
            wpSpeakerIds: item.wpSpeakerIds ? (item.wpSpeakerIds as any) : undefined,
            isMultiSpeaker: item.isMultiSpeaker,
            order: item.order,
          };
        }),
        order: d.order,
        wpPostId: d.wpPostId || undefined,
      })),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting program data:", error);
    throw error;
  }
}

// Get program data for homepage (2026; ana sayfa ile uyumlu, locale?: "en")
export async function getProgramDataForHomepage(locale?: string): Promise<ProgramData> {
  try {
    const loc = programLocale(locale);
    const allCategories = await prisma.program_categories.findMany({
      orderBy: { order: "asc" },
    });

    const categories2026 = allCategories.filter((c) => {
      const nameLower = c.name.toLowerCase();
      const slugLower = c.slug.toLowerCase();
      return nameLower.includes("2026") || slugLower.includes("2026");
    });

    const categoryIds2026 = categories2026.map((c) => c.id);

    const [days, allSpeakers] = await Promise.all([
      prisma.program_days.findMany({
        where: { categoryId: { in: categoryIds2026 } },
        include: { program_items: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      }),
      getSpeakers(locale),
    ]);
    const speakerMap = new Map<number, SpeakerMapEntry>(allSpeakers.map((s) => [s.id, { name: s.name, title: s.title, photo: s.photo, company: s.company, companyEn: s.companyEn, position: s.position, positionEn: s.positionEn }]));

    return {
      categories: categories2026.map((c) => ({
        id: c.id,
        name: loc.catName(c),
        slug: c.slug,
        order: c.order,
      })),
      days: days.map((d) => ({
        id: d.id,
        title: loc.dayTitle(d),
        slug: d.slug || "",
        categoryId: d.categoryId || 0,
        scheduleItems: d.program_items.map((item) => {
          const speakersData = item.speakers as any;
          const speakerIds = Array.isArray(speakersData) ? speakersData : [];
          const moderatorIdsParsed = parseSpeakerIdList(item.moderator_ids);
          const moderators = resolveModerators(item, locale, speakerMap);
          const first = moderators[0];
          return {
            id: item.id,
            time: cleanText(item.time),
            location: item.location ?? undefined,
            title: loc.itemTitle(item),
            note: loc.itemNote(item),
            note_image: loc.itemNoteImage(item),
            moderator: first?.name,
            moderatorTitle: first?.title,
            moderatorIds: moderatorIdsParsed.length > 0 ? moderatorIdsParsed : undefined,
            moderators,
            speakerId: undefined,
            speakerIds: speakerIds,
            wpSpeakerId: item.wpSpeakerId || undefined,
            wpSpeakerIds: item.wpSpeakerIds ? (item.wpSpeakerIds as any) : undefined,
            isMultiSpeaker: item.isMultiSpeaker,
            order: item.order,
          };
        }),
        order: d.order,
        wpPostId: d.wpPostId || undefined,
      })),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting program data for homepage:", error);
    throw error;
  }
}

// Get program data by year (for archive pages, locale?: "en")
export async function getProgramDataByYear(year: number, locale?: string): Promise<ProgramData> {
  try {
    const loc = programLocale(locale);
    const allCategories = await prisma.program_categories.findMany({
      orderBy: { order: "asc" },
    });

    const yearString = year.toString();
    const categoriesForYear = allCategories.filter((c) => {
      const nameLower = c.name.toLowerCase();
      const slugLower = c.slug.toLowerCase();
      return nameLower.includes(yearString) || slugLower.includes(yearString);
    });

    const categoryIdsForYear = categoriesForYear.map((c) => c.id);

    const days = await prisma.program_days.findMany({
      where: {
        categoryId: {
          in: categoryIdsForYear,
        },
      },
      include: {
        program_items: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    const allSpeakers = await getSpeakers(locale);
    const speakerIdToName: Record<number, string> = {};
    const speakerMap = new Map<number, SpeakerMapEntry>();
    allSpeakers.forEach((s) => {
      speakerIdToName[s.id] = s.name;
      speakerMap.set(s.id, { name: s.name, title: s.title, photo: s.photo, company: s.company, companyEn: s.companyEn, position: s.position, positionEn: s.positionEn });
    });

    return {
      categories: categoriesForYear.map((c) => ({
        id: c.id,
        name: loc.catName(c),
        slug: c.slug,
        order: c.order,
      })),
      days: days.map((d) => ({
        id: d.id,
        title: loc.dayTitle(d),
        slug: d.slug || "",
        categoryId: d.categoryId || 0,
        scheduleItems: d.program_items.map((item) => {
          const speakerIds = parseSpeakerIdList(item.speakers);
          const speakerNames = speakerIds
            .map((id) => speakerIdToName[id])
            .filter(Boolean);
          const resolvedSpeakers = speakerIds
            .map((id) => {
              const s = speakerMap.get(id);
              if (!s) return null;
              return {
                id,
                name: s.name,
                title: trimOpt(s.title),
                photo: s.photo,
                company: trimOpt(s.company),
                companyEn: trimOpt(s.companyEn),
                position: trimOpt(s.position),
                positionEn: trimOpt(s.positionEn),
              };
            })
            .filter((x): x is NonNullable<typeof x> => x != null);
          const moderatorIdsParsed = parseSpeakerIdList(item.moderator_ids);
          const moderators = resolveModerators(item, locale, speakerMap);
          const first = moderators[0];
          return {
            id: item.id,
            time: cleanText(item.time),
            location: item.location ?? undefined,
            title: loc.itemTitle(item),
            note: loc.itemNote(item),
            note_image: loc.itemNoteImage(item),
            moderator: first?.name,
            moderatorTitle: first?.title,
            moderatorIds: moderatorIdsParsed.length > 0 ? moderatorIdsParsed : undefined,
            moderators,
            speakerId: undefined,
            speakerIds: speakerIds,
            speakers: resolvedSpeakers,
            speakerNames,
            wpSpeakerId: item.wpSpeakerId || undefined,
            wpSpeakerIds: item.wpSpeakerIds ? (item.wpSpeakerIds as any) : undefined,
            isMultiSpeaker: item.isMultiSpeaker,
            order: item.order,
          };
        }),
        order: d.order,
        wpPostId: d.wpPostId || undefined,
      })),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting program data by year:", error);
    throw error;
  }
}

// Categories (locale?: "en" for name_en; admin gets both)
export async function getCategories(locale?: string): Promise<ScheduleCategory[]> {
  try {
    const categories = await prisma.program_categories.findMany({
      orderBy: { order: "asc" },
    });
    const useEn = locale === "en";
    return categories.map((c) => ({
      id: c.id,
      name: useEn && c.name_en ? c.name_en : c.name,
      name_en: c.name_en ?? undefined,
      slug: c.slug,
      order: c.order,
    }));
  } catch (error) {
    console.error("Error getting categories:", error);
    throw error;
  }
}

export async function addCategory(
  category: Omit<ScheduleCategory, "id" | "order"> & { name_en?: string }
): Promise<ScheduleCategory> {
  try {
    const maxOrder = await prisma.program_categories.aggregate({
      _max: { order: true },
    });

    const newCategory = await prisma.program_categories.create({
      data: {
        name: category.name,
        name_en: category.name_en ?? null,
        slug: category.slug,
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    return {
      id: newCategory.id,
      name: newCategory.name,
      name_en: newCategory.name_en ?? undefined,
      slug: newCategory.slug,
      order: newCategory.order,
    };
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
}

export async function updateCategory(
  id: number,
  updates: Partial<Omit<ScheduleCategory, "id" | "order">> & { name_en?: string }
): Promise<ScheduleCategory | null> {
  try {
    const data: Record<string, unknown> = { ...updates };
    if ("name_en" in updates) data.name_en = updates.name_en ?? null;
    const updatedCategory = await prisma.program_categories.update({
      where: { id },
      data: data as Parameters<typeof prisma.program_categories.update>[0]["data"],
    });

    return {
      id: updatedCategory.id,
      name: updatedCategory.name,
      name_en: updatedCategory.name_en ?? undefined,
      slug: updatedCategory.slug,
      order: updatedCategory.order,
    };
  } catch (error) {
    console.error("Error updating category:", error);
    return null;
  }
}

export async function deleteCategory(id: number): Promise<boolean> {
  try {
    await prisma.program_categories.delete({
      where: { id },
    });
  return true;
  } catch (error) {
    console.error("Error deleting category:", error);
    return false;
  }
}

// Days
export async function getDays(categoryId?: number): Promise<ScheduleDay[]> {
  try {
    const where = categoryId ? { categoryId } : {};
    const days = await prisma.program_days.findMany({
      where,
      include: {
        program_items: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    return days.map((d) => ({
      id: d.id,
      title: d.title || d.label,
      title_en: d.title_en ?? undefined,
      label: d.label,
      label_en: d.label_en ?? undefined,
      slug: d.slug || "",
      categoryId: d.categoryId || 0,
      scheduleItems: d.program_items.map((item) => {
        const speakersData = item.speakers as any;
        const speakerIds = Array.isArray(speakersData) ? speakersData : [];
        const moderatorIds = Array.isArray(item.moderator_ids) ? (item.moderator_ids as number[]) : [];
        return {
          id: item.id,
          time: item.time,
          location: item.location ?? undefined,
          title: item.title,
          title_en: item.title_en ?? undefined,
          note: item.note || undefined,
          note_en: item.note_en ?? undefined,
          note_image: item.note_image || undefined,
          moderator: item.moderator || undefined,
          moderator_en: item.moderator_en ?? undefined,
          moderatorTitle: item.moderatorTitle || undefined,
          moderator_title_en: item.moderator_title_en ?? undefined,
          moderatorIds: moderatorIds.length > 0 ? moderatorIds : undefined,
          speakerId: undefined,
          speakerIds: speakerIds,
          wpSpeakerId: item.wpSpeakerId || undefined,
          wpSpeakerIds: item.wpSpeakerIds ? (item.wpSpeakerIds as any) : undefined,
          isMultiSpeaker: item.isMultiSpeaker,
          order: item.order,
        };
      }),
      order: d.order,
      wpPostId: d.wpPostId || undefined,
    }));
  } catch (error) {
    console.error("Error getting days:", error);
    throw error;
  }
}

export async function getDay(id: number): Promise<ScheduleDay | undefined> {
  try {
    const day = await prisma.program_days.findUnique({
      where: { id },
      include: {
        program_items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!day) return undefined;

    return {
      id: day.id,
      title: day.title || day.label,
      title_en: day.title_en ?? undefined,
      label: day.label,
      label_en: day.label_en ?? undefined,
      slug: day.slug || "",
      categoryId: day.categoryId || 0,
      scheduleItems: day.program_items.map((item) => {
        const speakersData = item.speakers as any;
        const speakerIds = Array.isArray(speakersData) ? speakersData : [];
        const moderatorIds = Array.isArray(item.moderator_ids) ? (item.moderator_ids as number[]) : [];
        return {
          id: item.id,
          time: item.time,
          location: item.location ?? undefined,
          title: item.title,
          title_en: item.title_en ?? undefined,
          note: item.note || undefined,
          note_en: item.note_en ?? undefined,
          note_image: item.note_image || undefined,
          moderator: item.moderator || undefined,
          moderator_en: item.moderator_en ?? undefined,
          moderatorTitle: item.moderatorTitle || undefined,
          moderator_title_en: item.moderator_title_en ?? undefined,
          moderatorIds: moderatorIds.length > 0 ? moderatorIds : undefined,
          speakerId: undefined,
          speakerIds: speakerIds,
          wpSpeakerId: item.wpSpeakerId || undefined,
          wpSpeakerIds: item.wpSpeakerIds ? (item.wpSpeakerIds as any) : undefined,
          isMultiSpeaker: item.isMultiSpeaker,
          order: item.order,
        };
      }),
      order: day.order,
      wpPostId: day.wpPostId || undefined,
    };
  } catch (error) {
    console.error("Error getting day:", error);
    throw error;
  }
}

export async function addDay(
  day: Omit<ScheduleDay, "id" | "order" | "scheduleItems"> & { title_en?: string; label_en?: string }
): Promise<ScheduleDay> {
  try {
    // Validate required fields
    if (!day.title || !day.title.trim()) {
      throw new Error("Title is required");
    }
    if (!day.categoryId) {
      throw new Error("Category ID is required");
    }
    if (!day.slug || !day.slug.trim()) {
      throw new Error("Slug is required");
    }

    const categoryDays = await prisma.program_days.findMany({
      where: { categoryId: day.categoryId },
      orderBy: { order: "desc" },
      take: 1,
    });

    const maxOrder = categoryDays[0]?.order || 0;

    // Ensure label is not empty (it's required in schema)
    const label = day.title.trim() || day.slug;

    // Check if slug already exists and make it unique if needed
    let finalSlug = day.slug.trim();
    let slugExists = await prisma.program_days.findFirst({
      where: { slug: finalSlug },
    });

    // If slug exists, append a number to make it unique
    if (slugExists) {
      let counter = 1;
      while (slugExists) {
        finalSlug = `${day.slug.trim()}-${counter}`;
        slugExists = await prisma.program_days.findFirst({
          where: { slug: finalSlug },
        });
        counter++;
      }
    }

    const newDay = await prisma.program_days.create({
      data: {
        title: day.title.trim(),
        title_en: (day as any).title_en?.trim() || null,
        label: label, // Required field, use title or slug as fallback
        label_en: (day as any).label_en?.trim() || null,
        slug: finalSlug,
        categoryId: day.categoryId,
        date: new Date(), // Default date
        active: true,
        order: maxOrder + 1,
        updatedAt: new Date(),
        ...(day.wpPostId ? { wpPostId: day.wpPostId } : {}),
      },
      include: {
        program_items: true,
      },
    });

    return {
      id: newDay.id,
      title: newDay.title || newDay.label,
      slug: newDay.slug || "",
      categoryId: newDay.categoryId || 0,
      scheduleItems: [],
      order: newDay.order,
      wpPostId: newDay.wpPostId || undefined,
    };
  } catch (error) {
    console.error("Error adding day:", error);
    throw error;
  }
}

export async function updateDay(
  id: number,
  updates: Partial<Omit<ScheduleDay, "id" | "scheduleItems">> & { title_en?: string; label_en?: string }
): Promise<ScheduleDay | null> {
  try {
    const data: Record<string, unknown> = {
      title: updates.title,
      slug: updates.slug,
      categoryId: updates.categoryId,
      order: updates.order,
      wpPostId: updates.wpPostId,
    };
    if (updates.label !== undefined) data.label = updates.label;
    if ("title_en" in updates) data.title_en = updates.title_en ?? null;
    if ("label_en" in updates) data.label_en = updates.label_en ?? null;
    const updatedDay = await prisma.program_days.update({
      where: { id },
      data: data as Parameters<typeof prisma.program_days.update>[0]["data"],
      include: {
        program_items: {
          orderBy: { order: "asc" },
        },
      },
    });

    return {
      id: updatedDay.id,
      title: updatedDay.title || updatedDay.label,
      title_en: updatedDay.title_en ?? undefined,
      label: updatedDay.label,
      label_en: updatedDay.label_en ?? undefined,
      slug: updatedDay.slug || "",
      categoryId: updatedDay.categoryId || 0,
      scheduleItems: updatedDay.program_items.map((item) => {
        const speakersData = item.speakers as any;
        const speakerIds = Array.isArray(speakersData) ? speakersData : [];
        
        return {
          id: item.id,
          time: item.time,
          location: item.location ?? undefined,
          title: item.title,
          title_en: item.title_en ?? undefined,
          note: item.note || undefined,
          note_en: item.note_en ?? undefined,
          note_image: item.note_image || undefined,
          moderator: item.moderator || undefined,
          moderator_en: item.moderator_en ?? undefined,
          moderatorTitle: item.moderatorTitle || undefined,
          moderator_title_en: item.moderator_title_en ?? undefined,
          speakerId: undefined,
          speakerIds: speakerIds,
          wpSpeakerId: item.wpSpeakerId || undefined,
          wpSpeakerIds: item.wpSpeakerIds ? (item.wpSpeakerIds as any) : undefined,
          isMultiSpeaker: item.isMultiSpeaker,
          order: item.order,
        };
      }),
      order: updatedDay.order,
      wpPostId: updatedDay.wpPostId || undefined,
    };
  } catch (error) {
    console.error("Error updating day:", error);
    return null;
  }
}

export async function deleteDay(id: number): Promise<boolean> {
  try {
    await prisma.program_days.delete({
      where: { id },
    });
  return true;
  } catch (error) {
    console.error("Error deleting day:", error);
    return false;
  }
}

// Schedule Items
export async function addScheduleItem(
  dayId: number,
  item: Omit<ScheduleItem, "id" | "order"> & { title_en?: string; note_en?: string; moderator_en?: string; moderator_title_en?: string }
): Promise<ScheduleItem | null> {
  try {
    if (!item.time || !item.time.trim()) {
      throw new Error("Time is required");
    }

    const day = await prisma.program_days.findUnique({
      where: { id: dayId },
      include: {
        program_items: { orderBy: { order: "desc" }, take: 1 },
      },
    });

    if (!day) return null;

    const maxOrder = day.program_items[0]?.order || 0;
    const moderatorIds = (item as any).moderatorIds as number[] | undefined;
    const moderatorIdsArray = Array.isArray(moderatorIds) ? moderatorIds : [];

    let moderator: string | null = item.moderator || null;
    let moderator_en: string | null = (item as any).moderator_en?.trim() || null;
    let moderatorTitle: string | null = item.moderatorTitle || null;
    let moderator_title_en: string | null = (item as any).moderator_title_en?.trim() || null;
    if (moderatorIdsArray.length > 0) {
      const allSpeakers = await getSpeakers(undefined);
      const firstId = moderatorIdsArray[0];
      const firstSpeaker = allSpeakers.find((s) => s.id === firstId);
      if (firstSpeaker) {
        moderator = firstSpeaker.name;
        moderator_en = firstSpeaker.name;
        moderatorTitle = firstSpeaker.title || null;
        moderator_title_en = (firstSpeaker as any).titleEn?.trim() || null;
      }
    }

    const newItem = await prisma.program_items.create({
      data: {
        dayId,
        time: item.time,
        location: normalizeProgramLocation((item as any).location),
        title: item.title || "",
        title_en: (item as any).title_en?.trim() || null,
        note: sanitizeProgramNoteForStorage(item.note ?? "") || null,
        note_en: sanitizeProgramNoteForStorage((item as any).note_en ?? "") || null,
        note_image: sanitizeProgramNoteImageUrl((item as any).note_image) ?? null,
        moderator,
        moderator_en,
        moderatorTitle,
        moderator_title_en,
        moderator_ids: moderatorIdsArray.length > 0 ? moderatorIdsArray : null,
        isMultiSpeaker: item.isMultiSpeaker,
        wpSpeakerId: item.wpSpeakerId || null,
        wpSpeakerIds: item.wpSpeakerIds ? item.wpSpeakerIds : null,
        speakers:
          Array.isArray(item.speakerIds) && item.speakerIds.length > 0
            ? item.speakerIds
            : item.speakerId != null
              ? [item.speakerId]
              : [],
        order: maxOrder + 1,
        updatedAt: new Date(),
      },
    });

    const outModeratorIds = Array.isArray(newItem.moderator_ids) ? (newItem.moderator_ids as number[]) : [];
    return {
      id: newItem.id,
      time: newItem.time,
      location: newItem.location ?? undefined,
      title: newItem.title,
      title_en: newItem.title_en ?? undefined,
      note: newItem.note || undefined,
      note_en: newItem.note_en ?? undefined,
      note_image: newItem.note_image || undefined,
      moderator: newItem.moderator || undefined,
      moderator_en: newItem.moderator_en ?? undefined,
      moderatorTitle: newItem.moderatorTitle || undefined,
      moderator_title_en: newItem.moderator_title_en ?? undefined,
      moderatorIds: outModeratorIds.length > 0 ? outModeratorIds : undefined,
      speakerId: undefined,
      speakerIds: Array.isArray(newItem.speakers) ? (newItem.speakers as any) : [],
      wpSpeakerId: newItem.wpSpeakerId || undefined,
      wpSpeakerIds: newItem.wpSpeakerIds ? (newItem.wpSpeakerIds as any) : undefined,
      isMultiSpeaker: newItem.isMultiSpeaker,
      order: newItem.order,
    };
  } catch (error) {
    console.error("Error adding schedule item:", error);
    return null;
  }
}

export async function updateScheduleItem(
  _dayId: number,
  itemId: number,
  updates: Partial<ScheduleItem>
): Promise<ScheduleItem | null> {
  try {
    const item = await prisma.program_items.findUnique({
      where: { id: itemId },
    });
    if (!item) return null;
  
    // Determine speakers array based on isMultiSpeaker and provided data
    let speakersArray: number[] = item.speakers as any || [];
    
    if (updates.isMultiSpeaker === false && updates.speakerId !== undefined) {
      // Single speaker mode: use speakerId
      speakersArray = updates.speakerId ? [updates.speakerId] : [];
    } else if (updates.isMultiSpeaker === true && updates.speakerIds !== undefined) {
      // Multi speaker mode: use speakerIds
      speakersArray = updates.speakerIds || [];
    } else if (updates.speakerIds !== undefined) {
      // If speakerIds is provided, use it
      speakersArray = updates.speakerIds;
    } else if (updates.speakerId !== undefined) {
      // If only speakerId is provided, use it as array
      speakersArray = updates.speakerId ? [updates.speakerId] : [];
    }
  
    let moderatorIdsArray: number[] = Array.isArray(item.moderator_ids) ? (item.moderator_ids as number[]) : [];
    if ("moderatorIds" in updates && updates.moderatorIds !== undefined) {
      moderatorIdsArray = Array.isArray(updates.moderatorIds) ? updates.moderatorIds : [];
    }

    let moderator: string | null = item.moderator;
    let moderator_en: string | null = item.moderator_en;
    let moderatorTitle: string | null = item.moderatorTitle;
    let moderator_title_en: string | null = item.moderator_title_en;
    if (moderatorIdsArray.length > 0) {
      const allSpeakers = await getSpeakers(undefined);
      const firstSpeaker = allSpeakers.find((s) => s.id === moderatorIdsArray[0]);
      if (firstSpeaker) {
        moderator = firstSpeaker.name;
        moderator_en = firstSpeaker.name;
        moderatorTitle = firstSpeaker.title || null;
        moderator_title_en = (firstSpeaker as any).titleEn?.trim() || null;
      }
    } else {
      moderator = null;
      moderator_en = null;
      moderatorTitle = null;
      moderator_title_en = null;
    }

    const data: Record<string, unknown> = {
      time: updates.time,
      title: updates.title,
      isMultiSpeaker: updates.isMultiSpeaker !== undefined ? updates.isMultiSpeaker : item.isMultiSpeaker,
      wpSpeakerId: updates.wpSpeakerId !== undefined ? (updates.wpSpeakerId || null) : item.wpSpeakerId,
      wpSpeakerIds: updates.wpSpeakerIds !== undefined ? (updates.wpSpeakerIds || null) : item.wpSpeakerIds,
      speakers: speakersArray,
      order: updates.order !== undefined ? updates.order : item.order,
      moderator,
      moderator_en,
      moderatorTitle,
      moderator_title_en,
      moderator_ids: moderatorIdsArray.length > 0 ? moderatorIdsArray : null,
    };
    if ("title_en" in updates) data.title_en = updates.title_en ?? null;
    if ("note" in updates) data.note = sanitizeProgramNoteForStorage(updates.note ?? "") || null;
    if ("note_en" in updates) data.note_en = sanitizeProgramNoteForStorage(updates.note_en ?? "") || null;
    if ("note_image" in updates) data.note_image = sanitizeProgramNoteImageUrl(updates.note_image) ?? null;

    if ("location" in updates) {
      const nextLoc = normalizeProgramLocation((updates as { location?: string | null }).location);
      data.location = nextLoc;
      if (nextLoc !== item.location) data.reminderSentAt = null;
    }

    if (updates.time !== undefined && updates.time !== item.time) {
      data.reminderSentAt = null;
    }

    const updatedItem = await prisma.program_items.update({
      where: { id: itemId },
      data: data as Parameters<typeof prisma.program_items.update>[0]["data"],
    });

    const outModeratorIds = Array.isArray(updatedItem.moderator_ids) ? (updatedItem.moderator_ids as number[]) : [];
    return {
      id: updatedItem.id,
      time: updatedItem.time,
      location: updatedItem.location ?? undefined,
      title: updatedItem.title,
      title_en: updatedItem.title_en ?? undefined,
      note: updatedItem.note || undefined,
      note_en: updatedItem.note_en ?? undefined,
      note_image: updatedItem.note_image || undefined,
      moderator: updatedItem.moderator || undefined,
      moderator_en: updatedItem.moderator_en ?? undefined,
      moderatorTitle: updatedItem.moderatorTitle || undefined,
      moderator_title_en: updatedItem.moderator_title_en ?? undefined,
      moderatorIds: outModeratorIds.length > 0 ? outModeratorIds : undefined,
      speakerId: undefined,
      speakerIds: Array.isArray(updatedItem.speakers) ? (updatedItem.speakers as any) : [],
      wpSpeakerId: updatedItem.wpSpeakerId || undefined,
      wpSpeakerIds: updatedItem.wpSpeakerIds ? (updatedItem.wpSpeakerIds as any) : undefined,
      isMultiSpeaker: updatedItem.isMultiSpeaker,
      order: updatedItem.order,
    };
  } catch (error) {
    console.error("Error updating schedule item:", error);
    return null;
  }
}

export async function deleteScheduleItem(_dayId: number, itemId: number): Promise<boolean> {
  try {
    const item = await prisma.program_items.findUnique({
      where: { id: itemId },
    });
    if (!item) return false;

    await prisma.program_items.delete({
      where: { id: itemId },
    });
    return true;
  } catch (error) {
    console.error("Error deleting schedule item:", error);
    return false;
  }
}

export async function reorderScheduleItems(
  dayId: number,
  itemIds: number[]
): Promise<ScheduleItem[]> {
  try {
    await Promise.all(
      itemIds.map((id, index) =>
        prisma.program_items.update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    );

    const day = await prisma.program_days.findUnique({
      where: { id: dayId },
      include: {
        program_items: {
          orderBy: { order: "asc" },
        },
      },
    });

  if (!day) return [];
  
    return day.program_items.map((item) => {
      const speakersData = item.speakers as any;
      const speakerIds = Array.isArray(speakersData) ? speakersData : [];
      
      return {
        id: item.id,
        time: item.time,
        location: item.location ?? undefined,
        title: item.title,
        note: item.note || undefined,
        speakerId: undefined,
        speakerIds: speakerIds,
        wpSpeakerId: item.wpSpeakerId || undefined,
        wpSpeakerIds: item.wpSpeakerIds ? (item.wpSpeakerIds as any) : undefined,
        isMultiSpeaker: item.isMultiSpeaker,
        order: item.order,
      };
    });
  } catch (error) {
    console.error("Error reordering schedule items:", error);
    throw error;
  }
}

// Import from parsed XML data
export async function importProgramData(
  days: ScheduleDay[],
  clearExisting: boolean = false
): Promise<number> {
  try {
  if (clearExisting) {
      await prisma.program_items.deleteMany({});
      await prisma.program_days.deleteMany({});
  }
  
  let imported = 0;
  for (const day of days) {
      const newDay = await prisma.program_days.create({
        data: {
          title: day.title,
          slug: day.slug,
          categoryId: day.categoryId,
          label: day.title || day.slug,
          date: new Date(),
          active: true,
          order: day.order,
          updatedAt: new Date(),
          ...(day.wpPostId ? { wpPostId: day.wpPostId } : {}),
          program_items: {
            create: day.scheduleItems.map((item, idx) => ({
              time: item.time,
              title: item.title,
              location: normalizeProgramLocation((item as ScheduleItem).location),
              note: item.note || null,
              isMultiSpeaker: item.isMultiSpeaker,
              wpSpeakerId: item.wpSpeakerId || null,
              wpSpeakerIds: item.wpSpeakerIds || null,
              speakers: item.speakerIds || [],
              order: item.order || idx + 1,
              updatedAt: new Date(),
            })),
          },
        },
      });
    imported++;
  }
  
  return imported;
  } catch (error) {
    console.error("Error importing program data:", error);
    throw error;
  }
}

export async function clearProgram(): Promise<void> {
  try {
    await prisma.program_items.deleteMany({});
    await prisma.program_days.deleteMany({});
  } catch (error) {
    console.error("Error clearing program:", error);
    throw error;
  }
}

// Link WordPress speaker IDs to system speaker IDs
export async function linkSpeakersToProgram(
  wpToSystemMap: Map<string, number>
): Promise<{ updated: number; notFound: string[] }> {
  try {
    const items = await prisma.program_items.findMany({
      where: {
        OR: [
          { wpSpeakerId: { not: null } },
          { wpSpeakerIds: { not: null } },
        ],
      },
    });

  let updated = 0;
  const notFound: string[] = [];
  
    for (const item of items) {
      const speakerIds: number[] = [];

      // Link single speaker
      if (item.wpSpeakerId) {
        const systemId = wpToSystemMap.get(item.wpSpeakerId);
        if (systemId) {
          speakerIds.push(systemId);
          updated++;
        } else if (!notFound.includes(item.wpSpeakerId)) {
          notFound.push(item.wpSpeakerId);
        }
      }
      
      // Link multi speakers
      if (item.wpSpeakerIds && Array.isArray(item.wpSpeakerIds)) {
        for (const wpId of item.wpSpeakerIds) {
          const systemId = wpToSystemMap.get(String(wpId));
          if (systemId) {
            speakerIds.push(systemId);
          } else if (!notFound.includes(String(wpId))) {
            notFound.push(String(wpId));
          }
        }
        if (speakerIds.length > 0) {
          updated++;
        }
      }

      if (speakerIds.length > 0) {
        await prisma.program_items.update({
          where: { id: item.id },
          data: { speakers: speakerIds },
        });
      }
    }

  return { updated, notFound };
  } catch (error) {
    console.error("Error linking speakers to program:", error);
    throw error;
  }
}
