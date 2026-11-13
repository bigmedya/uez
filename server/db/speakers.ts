import { prisma } from "./prisma";

export interface Speaker {
  id: number;
  name: string;
  slug: string;
  title: string;
  titleEn?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
  photo: string;
  bio: string;
  biographyEn?: string;
  year: string;
  order: number;
  pinnedYears: string[];
  wpPostId?: number;
  createdAt: string;
  updatedAt: string;
}

function mapSpeakerWithLocale(s: {
  id: number;
  name: string;
  slug: string | null;
  title: string | null;
  titleEn?: string | null;
  company?: string | null;
  companyEn?: string | null;
  position?: string | null;
  positionEn?: string | null;
  image: string | null;
  biography: string | null;
  biographyEn?: string | null;
  year: string | null;
  order: number;
  pinnedYears: unknown;
  wpPostId: string | number | null;
  createdAt: Date;
  updatedAt: Date;
}, locale?: string): Speaker {
  const useEn = locale === "en";
  const titleEnVal = s.titleEn ?? null;
  const biographyEnVal = s.biographyEn ?? null;
  const companyEnVal = s.companyEn ?? null;
  const positionEnVal = s.positionEn ?? null;
  return {
    id: s.id,
    name: s.name,
    slug: s.slug || "",
    title: useEn && titleEnVal ? titleEnVal : (s.title || ""),
    titleEn: titleEnVal || undefined,
    company: s.company ?? undefined,
    companyEn: companyEnVal ?? undefined,
    position: s.position ?? undefined,
    positionEn: positionEnVal ?? undefined,
    photo: s.image || "",
    bio: useEn && biographyEnVal ? biographyEnVal : (s.biography || ""),
    biographyEn: biographyEnVal || undefined,
    year: s.year || "",
    order: s.order,
    pinnedYears: Array.isArray(s.pinnedYears) ? (s.pinnedYears as string[]) : [],
    wpPostId: typeof s.wpPostId === "number" ? s.wpPostId : undefined,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

// Get all speakers (locale: "tr" | "en" for localized title/bio)
export async function getSpeakers(locale?: string): Promise<Speaker[]> {
  try {
    const speakers = await prisma.speakers.findMany({
      orderBy: { order: "asc" },
    });
    return speakers.map((s) => mapSpeakerWithLocale(s, locale));
  } catch (error) {
    console.error("Error getting speakers:", error);
    throw error;
  }
}

// Get speaker by ID (locale: "tr" | "en" for localized title/bio)
export async function getSpeakerById(id: number, locale?: string): Promise<Speaker | undefined> {
  try {
    const speaker = await prisma.speakers.findUnique({
      where: { id },
    });
    if (!speaker) return undefined;
    return mapSpeakerWithLocale(speaker, locale);
  } catch (error) {
    console.error("Error getting speaker by id:", error);
    throw error;
  }
}

// Get speakers by year with year-specific pinning (locale: "tr" | "en")
export async function getSpeakersByYear(year: string, locale?: string): Promise<Speaker[]> {
  try {
    const allSpeakers = await prisma.speakers.findMany({
      orderBy: { order: "asc" },
    });

    const filteredSpeakers = allSpeakers.filter((s) => {
      if (!s.year) return false;
      const years = s.year.split(',').map(y => y.trim());
      return years.includes(year);
    });

    const speakersWithPinning = filteredSpeakers.map((s) => mapSpeakerWithLocale(s, locale));

    const collatorLocale = locale === "en" ? "en-US" : "tr-TR";
    speakersWithPinning.sort((a, b) => {
      const aIsPinned = a.pinnedYears.includes(year);
      const bIsPinned = b.pinnedYears.includes(year);
      
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      
      if (aIsPinned && bIsPinned) {
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        return (a.name || "").trim().localeCompare((b.name || "").trim(), collatorLocale, { sensitivity: "accent" });
      } else {
        return (a.name || "").trim().localeCompare((b.name || "").trim(), collatorLocale, { sensitivity: "accent" });
      }
    });

    return speakersWithPinning;
  } catch (error) {
    console.error("Error getting speakers by year:", error);
    throw error;
  }
}

// Add speaker (titleEn, biographyEn, companyEn, positionEn optional; company+position for new format)
export async function addSpeaker(
  speaker: Omit<Speaker, "id" | "createdAt" | "updatedAt"> & {
    titleEn?: string;
    biographyEn?: string;
    company?: string;
    companyEn?: string;
    position?: string;
    positionEn?: string;
  }
): Promise<Speaker> {
  try {
    const newSpeaker = await prisma.speakers.create({
      data: {
        name: speaker.name,
        slug: speaker.slug,
        title: speaker.title ?? null,
        titleEn: speaker.titleEn ?? null,
        company: speaker.company ?? null,
        companyEn: speaker.companyEn ?? null,
        position: speaker.position ?? null,
        positionEn: speaker.positionEn ?? null,
        image: speaker.photo,
        biography: speaker.bio,
        biographyEn: speaker.biographyEn ?? null,
        year: speaker.year,
        order: speaker.order,
        pinnedYears: speaker.pinnedYears || [],
        wpPostId: speaker.wpPostId,
        updatedAt: new Date(),
      },
    });

    return mapSpeakerWithLocale(newSpeaker);
  } catch (error) {
    console.error("Error adding speaker:", error);
    throw error;
  }
}

// Update speaker (titleEn, biographyEn, company, companyEn, position, positionEn optional)
export async function updateSpeaker(
  id: number,
  updates: Partial<Omit<Speaker, "id" | "createdAt" | "updatedAt">> & {
    titleEn?: string;
    biographyEn?: string;
    company?: string;
    companyEn?: string;
    position?: string;
    positionEn?: string;
  }
): Promise<Speaker | null> {
  try {
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.slug !== undefined) data.slug = updates.slug;
    if (updates.title !== undefined) data.title = updates.title;
    if ("titleEn" in updates) data.titleEn = updates.titleEn ?? null;
    if ("company" in updates) data.company = updates.company ?? null;
    if ("companyEn" in updates) data.companyEn = updates.companyEn ?? null;
    if ("position" in updates) data.position = updates.position ?? null;
    if ("positionEn" in updates) data.positionEn = updates.positionEn ?? null;
    if (updates.photo !== undefined) data.image = updates.photo;
    if (updates.bio !== undefined) data.biography = updates.bio;
    if ("biographyEn" in updates) data.biographyEn = updates.biographyEn ?? null;
    if (updates.year !== undefined) data.year = updates.year;
    if (updates.order !== undefined) data.order = updates.order;
    if (updates.pinnedYears !== undefined) data.pinnedYears = updates.pinnedYears;
    if (updates.wpPostId !== undefined) data.wpPostId = updates.wpPostId;

    const updatedSpeaker = await prisma.speakers.update({
      where: { id },
      data: data as Parameters<typeof prisma.speakers.update>[0]["data"],
    });

    return mapSpeakerWithLocale(updatedSpeaker);
  } catch (error) {
    console.error("Error updating speaker:", error);
    return null;
  }
}

// Delete speaker
export async function deleteSpeaker(id: number): Promise<boolean> {
  try {
    await prisma.speakers.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("Error deleting speaker:", error);
    return false;
  }
}

// Import speakers
export async function importSpeakers(
  newSpeakers: Omit<Speaker, "id" | "createdAt" | "updatedAt">[]
): Promise<number> {
  try {
    let imported = 0;
    for (const speaker of newSpeakers) {
      try {
        const ext = speaker as Speaker & { titleEn?: string; biographyEn?: string; company?: string; companyEn?: string; position?: string; positionEn?: string };
        await prisma.speakers.create({
          data: {
            name: speaker.name,
            slug: speaker.slug,
            title: speaker.title ?? null,
            titleEn: ext.titleEn ?? null,
            company: ext.company ?? null,
            companyEn: ext.companyEn ?? null,
            position: ext.position ?? null,
            positionEn: ext.positionEn ?? null,
            image: speaker.photo,
            biography: speaker.bio,
            biographyEn: ext.biographyEn ?? null,
            year: speaker.year,
            order: speaker.order,
            pinnedYears: speaker.pinnedYears || [],
            wpPostId: speaker.wpPostId,
            updatedAt: new Date(),
          },
        });
        imported++;
      } catch (error) {
        console.error(`Error importing speaker ${speaker.name}:`, error);
      }
    }
    return imported;
  } catch (error) {
    console.error("Error importing speakers:", error);
    throw error;
  }
}

// Toggle pin status for a specific year
export async function toggleSpeakerPinForYear(speakerId: number, year: string): Promise<Speaker | null> {
  try {
    const currentSpeaker = await prisma.speakers.findUnique({
      where: { id: speakerId },
    });

    if (!currentSpeaker) return null;

    const raw = currentSpeaker.pinnedYears;
    const currentPinnedYears: string[] = Array.isArray(raw)
      ? (raw as string[])
      : typeof raw === "string"
        ? (() => {
            try {
              const parsed = JSON.parse(raw) as unknown;
              return Array.isArray(parsed) ? parsed.map(String) : [];
            } catch {
              return [];
            }
          })()
        : [];

    const updatedPinnedYears = currentPinnedYears.includes(year)
      ? currentPinnedYears.filter((y) => y !== year)
      : [...currentPinnedYears, year];

    const updatedSpeaker = await prisma.speakers.update({
      where: { id: speakerId },
      data: {
        pinnedYears: updatedPinnedYears as unknown as object,
        updatedAt: new Date(),
      },
    });

    return mapSpeakerWithLocale(updatedSpeaker);
  } catch (error) {
    console.error("Error toggling speaker pin for year:", error);
    return null;
  }
}

// Clear speakers
export async function clearSpeakers(): Promise<void> {
  try {
    await prisma.speakers.deleteMany({});
  } catch (error) {
    console.error("Error clearing speakers:", error);
    throw error;
  }
}

