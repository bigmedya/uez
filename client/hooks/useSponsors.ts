import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiBase } from "@shared/getApiBase";

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

async function fetchSponsors(year?: string, locale?: string): Promise<SponsorsData> {
  const params = new URLSearchParams();
  if (year) params.set("year", year);
  if (locale) params.set("locale", locale);
  const qs = params.toString();
  const path = qs ? `/api/sponsors?${qs}` : "/api/sponsors";
  const res = await fetch(`${getApiBase()}${path}`);
  if (!res.ok) throw new Error("Failed to fetch sponsors");
  return res.json();
}

async function updateSponsorsData(data: SponsorsData): Promise<SponsorsData> {
  const res = await fetch("/api/sponsors", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update sponsors");
  return res.json();
}

async function addCategory(params: { title: string; title_en?: string }): Promise<SponsorCategory> {
  const res = await fetch("/api/sponsors/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to add category");
  return res.json();
}

async function updateCategory(params: { id: number; title: string; title_en?: string }): Promise<SponsorCategory> {
  const res = await fetch(`/api/sponsors/categories/${params.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: params.title, title_en: params.title_en }),
  });
  if (!res.ok) throw new Error("Failed to update category");
  return res.json();
}

async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`/api/sponsors/categories/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete category");
}

async function reorderCategories(categoryIds: number[]): Promise<SponsorCategory[]> {
  const res = await fetch("/api/sponsors/categories/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categoryIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder categories");
  return res.json();
}

async function reorderSponsors(categoryId: number, sponsorIds: number[]): Promise<void> {
  const res = await fetch(`/api/sponsors/categories/${categoryId}/sponsors/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sponsorIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder sponsors");
}

async function addSponsor(categoryId: number, sponsor: Omit<Sponsor, "id">): Promise<Sponsor> {
  const res = await fetch(`/api/sponsors/categories/${categoryId}/sponsors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sponsor),
  });
  if (!res.ok) throw new Error("Failed to add sponsor");
  return res.json();
}

async function updateSponsorApi(id: number, updates: Partial<Sponsor>): Promise<Sponsor> {
  const res = await fetch(`/api/sponsors/sponsor/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update sponsor");
  return res.json();
}

async function deleteSponsorApi(id: number): Promise<void> {
  const res = await fetch(`/api/sponsors/sponsor/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete sponsor");
}

async function downloadImages(): Promise<{ success: number; failed: number; skipped: number }> {
  const res = await fetch("/api/sponsors/download-images", {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to download images");
  return res.json();
}

export function useSponsors(year?: string, locale?: string) {
  const queryClient = useQueryClient();

  const { data: sponsorsData, isLoading, error } = useQuery({
    queryKey: ["sponsors", year, locale],
    queryFn: () => fetchSponsors(year, locale),
    staleTime: 1000 * 60 * 5,
  });

  const updateMutation = useMutation({
    mutationFn: updateSponsorsData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: (params: { title: string; title_en?: string }) => addCategory(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (params: { id: number; title: string; title_en?: string }) => updateCategory(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
    },
  });

  const addSponsorMutation = useMutation({
    mutationFn: ({ categoryId, sponsor }: { categoryId: number; sponsor: Omit<Sponsor, "id"> }) =>
      addSponsor(categoryId, sponsor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
    },
  });

  const updateSponsorMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Sponsor> }) =>
      updateSponsorApi(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
    },
  });

  const deleteSponsorMutation = useMutation({
    mutationFn: deleteSponsorApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
    },
  });

  const downloadImagesMutation = useMutation({
    mutationFn: downloadImages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
    },
  });

  const reorderCategoriesMutation = useMutation({
    mutationFn: reorderCategories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
    },
  });

  const reorderSponsorsMutation = useMutation({
    mutationFn: ({ categoryId, sponsorIds }: { categoryId: number; sponsorIds: number[] }) =>
      reorderSponsors(categoryId, sponsorIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
    },
  });

  return {
    sponsorsData,
    categories: sponsorsData?.categories || [],
    isLoading,
    error,
    updateSponsors: updateMutation.mutate,
    addCategory: addCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    addSponsor: addSponsorMutation.mutate,
    updateSponsor: updateSponsorMutation.mutate,
    deleteSponsor: deleteSponsorMutation.mutate,
    downloadImages: downloadImagesMutation.mutate,
    reorderCategories: reorderCategoriesMutation.mutate,
    reorderSponsors: reorderSponsorsMutation.mutate,
    isUpdating:
      updateMutation.isPending ||
      addCategoryMutation.isPending ||
      updateCategoryMutation.isPending ||
      deleteCategoryMutation.isPending ||
      addSponsorMutation.isPending ||
      updateSponsorMutation.isPending ||
      deleteSponsorMutation.isPending ||
      reorderCategoriesMutation.isPending ||
      reorderSponsorsMutation.isPending,
    isDownloading: downloadImagesMutation.isPending,
  };
}






