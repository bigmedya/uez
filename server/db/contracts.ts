import { prisma } from "./prisma";

export interface Contract {
  id: number;
  slug: string;
  title: string;
  title_en?: string;
  content: string;
  content_en?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

function pickLocale<T extends { title?: string; title_en?: string | null; content?: string; content_en?: string | null }>(
  row: T,
  locale?: string
): { title: string; content: string } {
  const useEn = locale === "en";
  return {
    title: useEn && row.title_en ? row.title_en : (row.title || ""),
    content: useEn && row.content_en ? row.content_en : (row.content || ""),
  };
}

// Get all contracts (locale?: "en" for localized title/content; admin gets both)
export async function getContracts(locale?: string): Promise<Contract[]> {
  try {
    const contracts = await prisma.contracts.findMany({
      orderBy: { order: "asc" },
    });
    return contracts.map((c) => {
      const { title, content } = pickLocale(c, locale);
      return {
        id: c.id,
        slug: c.slug,
        title,
        title_en: c.title_en ?? undefined,
        content,
        content_en: c.content_en ?? undefined,
        isActive: c.isActive,
        order: c.order,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    });
  } catch (error) {
    throw error;
  }
}

// Get active contracts (for frontend, locale for EN)
export async function getActiveContracts(locale?: string): Promise<Contract[]> {
  try {
    const contracts = await prisma.contracts.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    return contracts.map((c) => {
      const { title, content } = pickLocale(c, locale);
      return {
        id: c.id,
        slug: c.slug,
        title,
        content,
        isActive: c.isActive,
        order: c.order,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    });
  } catch (error) {
    throw error;
  }
}

// Get contract by ID (admin: no locale to get both; or pass locale)
export async function getContractById(id: number, locale?: string): Promise<Contract | undefined> {
  try {
    const contract = await prisma.contracts.findUnique({
      where: { id },
    });
    if (!contract) return undefined;
    const { title, content } = pickLocale(contract, locale);
    return {
      id: contract.id,
      slug: contract.slug,
      title,
      title_en: contract.title_en ?? undefined,
      content,
      content_en: contract.content_en ?? undefined,
      isActive: contract.isActive,
      order: contract.order,
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
    };
  } catch (error) {
    throw error;
  }
}

// Get contract by slug (for frontend, locale for EN)
export async function getContractBySlug(slug: string, locale?: string): Promise<Contract | undefined> {
  try {
    const contract = await prisma.contracts.findFirst({
      where: { slug, isActive: true },
    });
    if (!contract) return undefined;
    const { title, content } = pickLocale(contract, locale);
    return {
      id: contract.id,
      slug: contract.slug,
      title,
      content,
      isActive: contract.isActive,
      order: contract.order,
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
    };
  } catch (error) {
    throw error;
  }
}

// Add contract (title_en, content_en optional)
export async function addContract(
  contract: Omit<Contract, "id" | "createdAt" | "updatedAt"> & { title_en?: string; content_en?: string }
): Promise<Contract> {
  try {
    const newContract = await prisma.contracts.create({
      data: {
        slug: contract.slug,
        title: contract.title,
        title_en: contract.title_en ?? null,
        content: contract.content,
        content_en: contract.content_en ?? null,
        isActive: contract.isActive,
        order: contract.order,
      },
    });
    return {
      id: newContract.id,
      slug: newContract.slug,
      title: newContract.title,
      title_en: newContract.title_en ?? undefined,
      content: newContract.content,
      content_en: newContract.content_en ?? undefined,
      isActive: newContract.isActive,
      order: newContract.order,
      createdAt: newContract.createdAt.toISOString(),
      updatedAt: newContract.updatedAt.toISOString(),
    };
  } catch (error) {
    throw error;
  }
}

// Update contract (title_en, content_en optional)
export async function updateContract(
  id: number,
  updates: Partial<Omit<Contract, "id" | "createdAt" | "updatedAt">> & { title_en?: string; content_en?: string }
): Promise<Contract | null> {
  try {
    const data: Record<string, unknown> = { ...updates };
    if ("title_en" in updates) data.title_en = updates.title_en ?? null;
    if ("content_en" in updates) data.content_en = updates.content_en ?? null;
    const updatedContract = await prisma.contracts.update({
      where: { id },
      data: data as Parameters<typeof prisma.contracts.update>[0]["data"],
    });
    return {
      id: updatedContract.id,
      slug: updatedContract.slug,
      title: updatedContract.title,
      title_en: updatedContract.title_en ?? undefined,
      content: updatedContract.content,
      content_en: updatedContract.content_en ?? undefined,
      isActive: updatedContract.isActive,
      order: updatedContract.order,
      createdAt: updatedContract.createdAt.toISOString(),
      updatedAt: updatedContract.updatedAt.toISOString(),
    };
  } catch (error) {
    return null;
  }
}

// Delete contract
export async function deleteContract(id: number): Promise<boolean> {
  try {
    await prisma.contracts.delete({
      where: { id },
    });
  return true;
  } catch (error) {
    return false;
  }
}

// Reorder contracts
export async function reorderContracts(contractIds: number[]): Promise<Contract[]> {
  try {
    // Update each contract's order
    await Promise.all(
      contractIds.map((id, index) =>
        prisma.contracts.update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    );

  return getContracts();
  } catch (error) {
    throw error;
  }
}
