import { prisma } from "./prisma";

export interface Package {
  id: number;
  packageId: string;
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  price: string;
  features: string[];
  features_en?: string[];
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

function pickPackageLocale(
  pkg: { title: string; title_en?: string | null; subtitle: string; subtitle_en?: string | null; features: unknown; features_en?: unknown },
  locale?: string
): { title: string; subtitle: string; features: string[] } {
  const useEn = locale === "en";
  return {
    title: useEn && pkg.title_en ? pkg.title_en : pkg.title,
    subtitle: useEn && pkg.subtitle_en ? pkg.subtitle_en : (pkg.subtitle || ""),
    features: useEn && Array.isArray(pkg.features_en) ? pkg.features_en : (Array.isArray(pkg.features) ? pkg.features : []),
  };
}

export async function getPackages(activeOnly: boolean = false, locale?: string): Promise<Package[]> {
  try {
    const where = activeOnly ? { active: true } : {};
    const packages = await prisma.packages.findMany({
      where,
      orderBy: { order: "asc" },
    });
    return packages.map((pkg) => {
      const { title, subtitle, features } = pickPackageLocale(pkg, locale);
      return {
        id: pkg.id,
        packageId: pkg.packageId,
        title,
        title_en: pkg.title_en ?? undefined,
        subtitle,
        subtitle_en: pkg.subtitle_en ?? undefined,
        price: pkg.price,
        features,
        features_en: Array.isArray(pkg.features_en) ? pkg.features_en : undefined,
        active: pkg.active,
        order: pkg.order,
        createdAt: pkg.createdAt.toISOString(),
        updatedAt: pkg.updatedAt.toISOString(),
      };
    });
  } catch (error) {
    throw error;
  }
}

export async function getPackageById(id: number, locale?: string): Promise<Package | null> {
  try {
    const pkg = await prisma.packages.findUnique({
      where: { id },
    });
    if (!pkg) return null;
    const { title, subtitle, features } = pickPackageLocale(pkg, locale);
    return {
      id: pkg.id,
      packageId: pkg.packageId,
      title,
      title_en: pkg.title_en ?? undefined,
      subtitle,
      subtitle_en: pkg.subtitle_en ?? undefined,
      price: pkg.price,
      features,
      features_en: Array.isArray(pkg.features_en) ? pkg.features_en : undefined,
      active: pkg.active,
      order: pkg.order,
      createdAt: pkg.createdAt.toISOString(),
      updatedAt: pkg.updatedAt.toISOString(),
    };
  } catch (error) {
    throw error;
  }
}

export async function getPackageByPackageId(packageId: string, locale?: string): Promise<Package | null> {
  try {
    const pkg = await prisma.packages.findUnique({
      where: { packageId },
    });
    if (!pkg) return null;
    const { title, subtitle, features } = pickPackageLocale(pkg, locale);
    return {
      id: pkg.id,
      packageId: pkg.packageId,
      title,
      subtitle,
      price: pkg.price,
      features,
      active: pkg.active,
      order: pkg.order,
      createdAt: pkg.createdAt.toISOString(),
      updatedAt: pkg.updatedAt.toISOString(),
    };
  } catch (error) {
    throw error;
  }
}

export async function createPackage(
  data: Omit<Package, "id" | "createdAt" | "updatedAt"> & { title_en?: string; subtitle_en?: string; features_en?: string[] }
): Promise<Package> {
  try {
    const now = new Date();
    const pkg = await prisma.packages.create({
      data: {
        packageId: data.packageId,
        title: data.title,
        title_en: data.title_en ?? null,
        subtitle: data.subtitle,
        subtitle_en: data.subtitle_en ?? null,
        price: data.price,
        features: data.features,
        features_en: data.features_en ?? null,
        active: data.active,
        order: data.order,
        updatedAt: now,
      },
    });
    return {
      id: pkg.id,
      packageId: pkg.packageId,
      title: pkg.title,
      title_en: pkg.title_en ?? undefined,
      subtitle: pkg.subtitle,
      subtitle_en: pkg.subtitle_en ?? undefined,
      price: pkg.price,
      features: pkg.features as string[],
      features_en: Array.isArray(pkg.features_en) ? pkg.features_en : undefined,
      active: pkg.active,
      order: pkg.order,
      createdAt: pkg.createdAt.toISOString(),
      updatedAt: pkg.updatedAt.toISOString(),
    };
  } catch (error) {
    throw error;
  }
}

export async function updatePackage(
  id: number,
  data: Partial<Omit<Package, "id" | "createdAt" | "updatedAt">> & { title_en?: string; subtitle_en?: string; features_en?: string[] }
): Promise<Package> {
  try {
    const now = new Date();
    const updateData: Record<string, unknown> = {
      ...(data.packageId && { packageId: data.packageId }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
      ...(data.price && { price: data.price }),
      ...(data.features && { features: data.features }),
      ...(data.active !== undefined && { active: data.active }),
      ...(data.order !== undefined && { order: data.order }),
      updatedAt: now,
    };
    if ("title_en" in data) updateData.title_en = data.title_en ?? null;
    if ("subtitle_en" in data) updateData.subtitle_en = data.subtitle_en ?? null;
    if ("features_en" in data) updateData.features_en = data.features_en ?? null;
    const pkg = await prisma.packages.update({
      where: { id },
      data: updateData as Parameters<typeof prisma.packages.update>[0]["data"],
    });
    return {
      id: pkg.id,
      packageId: pkg.packageId,
      title: pkg.title,
      title_en: pkg.title_en ?? undefined,
      subtitle: pkg.subtitle,
      subtitle_en: pkg.subtitle_en ?? undefined,
      price: pkg.price,
      features: pkg.features as string[],
      features_en: Array.isArray(pkg.features_en) ? pkg.features_en : undefined,
      active: pkg.active,
      order: pkg.order,
      createdAt: pkg.createdAt.toISOString(),
      updatedAt: pkg.updatedAt.toISOString(),
    };
  } catch (error) {
    throw error;
  }
}

export async function deletePackage(id: number): Promise<boolean> {
  try {
    await prisma.packages.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    return false;
  }
}

