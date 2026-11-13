import { prisma } from "./prisma";

export interface ArchiveDescription {
  id: number;
  year: string;
  description: string;
  description_en?: string;
  createdAt: string;
  updatedAt: string;
}

// Get archive description by year (locale?: "en" for description_en)
export async function getArchiveDescriptionByYear(year: string, locale?: string): Promise<ArchiveDescription | null> {
  try {
    const archive = await prisma.archive_descriptions.findUnique({
      where: { year },
    });
    if (!archive) return null;
    const useEn = locale === "en" && archive.description_en;
    return {
      id: archive.id,
      year: archive.year,
      description: useEn ? archive.description_en! : archive.description,
      description_en: archive.description_en ?? undefined,
      createdAt: archive.createdAt.toISOString(),
      updatedAt: archive.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Error getting archive description:", error);
    return null;
  }
}

// Get all archive descriptions (admin: no locale to get both)
export async function getAllArchiveDescriptions(locale?: string): Promise<ArchiveDescription[]> {
  try {
    const archives = await prisma.archive_descriptions.findMany({
      orderBy: { year: "desc" },
    });
    return archives.map((archive) => {
      const useEn = locale === "en" && archive.description_en;
      return {
        id: archive.id,
        year: archive.year,
        description: useEn ? archive.description_en! : archive.description,
        description_en: archive.description_en ?? undefined,
        createdAt: archive.createdAt.toISOString(),
        updatedAt: archive.updatedAt.toISOString(),
      };
    });
  } catch (error) {
    console.error("Error getting archive descriptions:", error);
    throw error;
  }
}

// Create or update archive description (description_en optional)
export async function upsertArchiveDescription(
  year: string,
  description: string,
  description_en?: string
): Promise<ArchiveDescription> {
  try {
    const archive = await prisma.archive_descriptions.upsert({
      where: { year },
      update: {
        description,
        description_en: description_en ?? undefined,
        updatedAt: new Date(),
      },
      create: {
        year,
        description,
        description_en: description_en ?? null,
        updatedAt: new Date(),
      },
    });
    return {
      id: archive.id,
      year: archive.year,
      description: archive.description,
      description_en: archive.description_en ?? undefined,
      createdAt: archive.createdAt.toISOString(),
      updatedAt: archive.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Error upserting archive description:", error);
    throw error;
  }
}

// Delete archive description
export async function deleteArchiveDescription(year: string): Promise<boolean> {
  try {
    await prisma.archive_descriptions.delete({
      where: { year },
    });
    return true;
  } catch (error) {
    console.error("Error deleting archive description:", error);
    return false;
  }
}
