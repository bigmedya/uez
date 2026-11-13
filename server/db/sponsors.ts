import { prisma } from "./prisma";

export interface Sponsor {
  id: number;
  name: string;
  name_en?: string;
  image: string;
  localImage: string;
  url: string;
  active: boolean;
  year?: string;
  width?: number;
  height?: number;
}

export interface SponsorCategory {
  id: number;
  title: string;
  title_en?: string;
  order: number;
  sponsors: Sponsor[];
}

export interface SponsorsData {
  categories: SponsorCategory[];
  updatedAt: string;
}

// Category operations (locale?: "en" for title_en)
export async function getCategories(locale?: string): Promise<SponsorCategory[]> {
  try {
    const categories = await prisma.sponsor_categories.findMany({
      include: {
        sponsors: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });
    const useEn = locale === "en";
    return categories.map((cat) => ({
      id: cat.id,
      title: useEn && cat.title_en ? cat.title_en : cat.title,
      title_en: cat.title_en ?? undefined,
      order: cat.order,
      sponsors: cat.sponsors.map((s) => ({
        id: s.id,
        name: useEn && s.name_en ? s.name_en : s.name,
        name_en: s.name_en ?? undefined,
        image: s.logo || "",
        localImage: s.localImage || "",
        url: s.link || "",
        active: s.active,
        year: s.year || undefined,
        width: s.width !== null && s.width !== undefined ? s.width : undefined,
      })),
    }));
  } catch (error) {
    console.error("Error getting categories:", error);
    throw error;
  }
}

export async function getSponsorsData(locale?: string): Promise<SponsorsData> {
  try {
    const categories = await getCategories(locale);
    return {
      categories,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting sponsors data:", error);
    throw error;
  }
}

export async function addCategory(title: string, title_en?: string): Promise<SponsorCategory> {
  try {
    const categories = await prisma.sponsor_categories.findMany({
      orderBy: { order: "desc" },
      take: 1,
    });
    const maxOrder = categories.length > 0 ? categories[0].order : 0;

    const newCategory = await prisma.sponsor_categories.create({
      data: {
        title,
        title_en: title_en ?? null,
        order: maxOrder + 1,
        updatedAt: new Date(),
      },
      include: {
        sponsors: true,
      },
    });

    return {
      id: newCategory.id,
      title: newCategory.title,
      title_en: newCategory.title_en ?? undefined,
      order: newCategory.order,
      sponsors: [],
    };
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
}

export async function updateCategory(id: number, title: string, title_en?: string): Promise<SponsorCategory | null> {
  try {
    const data: Record<string, unknown> = { title, updatedAt: new Date() };
    if (title_en !== undefined) data.title_en = title_en ?? null;
    const category = await prisma.sponsor_categories.update({
      where: { id },
      data: data as Parameters<typeof prisma.sponsor_categories.update>[0]["data"],
      include: {
        sponsors: {
          where: { active: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return {
      id: category.id,
      title: category.title,
      title_en: category.title_en ?? undefined,
      order: category.order,
      sponsors: category.sponsors.map((s) => ({
        id: s.id,
        name: s.name,
        name_en: s.name_en ?? undefined,
        image: s.logo || "",
        localImage: s.localImage || "",
        url: s.link || "",
        active: s.active,
        year: s.year || undefined,
        width: s.width !== null && s.width !== undefined ? s.width : undefined,
      })),
    };
  } catch (error) {
    console.error("Error updating category:", error);
    return null;
  }
}

export async function deleteCategory(id: number): Promise<boolean> {
  try {
    await prisma.sponsor_categories.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("Error deleting category:", error);
    return false;
  }
}

export async function reorderCategories(categoryIds: number[]): Promise<SponsorCategory[]> {
  try {
    for (let i = 0; i < categoryIds.length; i++) {
      await prisma.sponsor_categories.update({
        where: { id: categoryIds[i] },
        data: {
          order: i + 1,
          updatedAt: new Date(),
        },
      });
    }
    return getCategories();
  } catch (error) {
    console.error("Error reordering categories:", error);
    throw error;
  }
}

// Sponsor operations
export async function addSponsor(categoryId: number, sponsor: Omit<Sponsor, "id">): Promise<Sponsor | null> {
  try {
    const sponsors = await prisma.sponsors.findMany({
      where: { categoryId },
      orderBy: { order: "desc" },
      take: 1,
    });
    const maxOrder = sponsors.length > 0 ? sponsors[0].order : 0;

    const createData: Record<string, unknown> = {
      name: sponsor.name,
      name_en: sponsor.name_en !== undefined ? sponsor.name_en || null : null,
      logo: sponsor.image,
      localImage: sponsor.localImage,
      link: sponsor.url,
      active: sponsor.active !== false,
      order: maxOrder + 1,
      year: normalizeYearForStorage(sponsor.year),
      categoryId,
      updatedAt: new Date(),
      width: sponsor.width !== undefined ? sponsor.width : null,
    };

    const newSponsor = await prisma.sponsors.create({
      data: createData as Parameters<typeof prisma.sponsors.create>[0]["data"],
    });

    return {
      id: newSponsor.id,
      name: newSponsor.name,
      name_en: newSponsor.name_en ?? undefined,
      image: newSponsor.logo || "",
      localImage: newSponsor.localImage || "",
      url: newSponsor.link || "",
      active: newSponsor.active,
      year: newSponsor.year || undefined,
      width: newSponsor.width !== null && newSponsor.width !== undefined ? newSponsor.width : undefined,
    };
  } catch (error) {
    console.error("Error adding sponsor:", error);
    return null;
  }
}

function normalizeWidthForStorage(width: unknown): number | null {
  if (width === null || width === undefined || width === "") return null;
  const n = Number(width);
  return Number.isFinite(n) ? n : null;
}

export async function updateSponsor(sponsorId: number, updates: Partial<Sponsor>): Promise<Sponsor | null> {
  try {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updates.name !== undefined) updateData.name = String(updates.name);
    if (updates.name_en !== undefined) updateData.name_en = updates.name_en == null || updates.name_en === "" ? null : String(updates.name_en);
    if (updates.image !== undefined) updateData.logo = updates.image == null ? null : String(updates.image);
    if (updates.localImage !== undefined) updateData.localImage = updates.localImage == null ? null : String(updates.localImage);
    if (updates.url !== undefined) updateData.link = updates.url == null ? null : String(updates.url);
    if (updates.active !== undefined) updateData.active = Boolean(updates.active);
    if (updates.year !== undefined) {
      updateData.year = normalizeYearForStorage(updates.year);
    }
    if (updates.width !== undefined) {
      updateData.width = normalizeWidthForStorage(updates.width);
    }

    const updatedSponsor = await prisma.sponsors.update({
      where: { id: sponsorId },
      data: updateData as Parameters<typeof prisma.sponsors.update>[0]["data"],
    });

    return {
      id: updatedSponsor.id,
      name: updatedSponsor.name,
      name_en: updatedSponsor.name_en ?? undefined,
      image: updatedSponsor.logo || "",
      localImage: updatedSponsor.localImage || "",
      url: updatedSponsor.link || "",
      active: updatedSponsor.active,
      year: updatedSponsor.year || undefined,
      width: updatedSponsor.width !== null && updatedSponsor.width !== undefined ? updatedSponsor.width : undefined,
    };
  } catch (error) {
    console.error("Error updating sponsor:", error);
    return null;
  }
}

export async function deleteSponsor(sponsorId: number): Promise<boolean> {
  try {
    await prisma.sponsors.delete({
      where: { id: sponsorId },
    });
    return true;
  } catch (error) {
    console.error("Error deleting sponsor:", error);
    return false;
  }
}

export async function moveSponsor(sponsorId: number, toCategoryId: number): Promise<boolean> {
  try {
    await prisma.sponsors.update({
      where: { id: sponsorId },
      data: {
        categoryId: toCategoryId,
        updatedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error("Error moving sponsor:", error);
    return false;
  }
}

/** Kategori içindeki sponsorları verilen sıraya göre günceller (sponsorIds sırası = görüntüleme sırası). */
export async function reorderSponsors(categoryId: number, sponsorIds: number[]): Promise<boolean> {
  try {
    for (let i = 0; i < sponsorIds.length; i++) {
      await prisma.sponsors.updateMany({
        where: { id: sponsorIds[i], categoryId },
        data: { order: i + 1, updatedAt: new Date() },
      });
    }
    return true;
  } catch (error) {
    console.error("Error reordering sponsors:", error);
    return false;
  }
}

// Normalize year for storage: string or array -> "2024" or "2023,2024", empty -> null
function normalizeYearForStorage(year: unknown): string | null {
  if (year === null || year === undefined) return null;
  if (Array.isArray(year)) {
    const joined = year.map((y) => String(y).trim()).filter(Boolean).join(",");
    return joined || null;
  }
  const str = String(year).trim();
  return str || null;
}

// Normalize requested year for filtering (exact match)
function normalizeRequestYear(year: unknown): string | null {
  if (year === null || year === undefined) return null;
  const str = String(year).trim();
  return str || null;
}

// Get sponsors by year (locale?: "en" for title_en)
export async function getSponsorsByYear(year: string, locale?: string): Promise<SponsorCategory[]> {
  try {
    const requestYear = normalizeRequestYear(year);
    if (!requestYear) {
      return [];
    }

    const allCategories = await prisma.sponsor_categories.findMany({
      include: {
        sponsors: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    const useEn = locale === "en";

    const filteredCategories = allCategories.map((cat) => {
      const filteredSponsors = cat.sponsors.filter((s) => {
        if (!s.active) return false;
        const storedYear = s.year;
        if (storedYear === null || storedYear === undefined || String(storedYear).trim() === "")
          return false;
        const years = String(storedYear)
          .split(",")
          .map((y) => y.trim())
          .filter(Boolean);
        return years.includes(requestYear);
      });

      return {
        id: cat.id,
        title: useEn && cat.title_en ? cat.title_en : cat.title,
        order: cat.order,
        sponsors: filteredSponsors.map((s) => ({
          id: s.id,
          name: useEn && s.name_en ? s.name_en : s.name,
          name_en: s.name_en ?? undefined,
          image: s.logo || "",
          localImage: s.localImage || "",
          url: s.link || "",
          active: s.active,
          year: s.year || undefined,
          width: s.width !== null && s.width !== undefined ? s.width : undefined,
        })),
      };
    }).filter((cat) => cat.sponsors.length > 0);

    return filteredCategories;
  } catch (error) {
    console.error("Error getting sponsors by year:", error);
    throw error;
  }
}

// Get sponsors data by year (locale?: "en")
export async function getSponsorsDataByYear(year: string, locale?: string): Promise<SponsorsData> {
  try {
    const categories = await getSponsorsByYear(year, locale);
    return {
      categories,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting sponsors data by year:", error);
    throw error;
  }
}
