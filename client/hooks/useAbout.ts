import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

async function fetchAbout(locale?: string): Promise<AboutData> {
  const url = locale === "en" || locale === "tr" ? `/api/about?locale=${locale}` : "/api/about";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch about data");
  return res.json();
}

async function updateAbout(data: Partial<AboutData>): Promise<AboutData> {
  const res = await fetch("/api/about", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

async function updateHero(data: Partial<HeroData>): Promise<AboutData> {
  const res = await fetch("/api/about/hero", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update hero");
  return res.json();
}

async function addSection(section: Omit<Section, "id" | "order">): Promise<Section> {
  const res = await fetch("/api/about/sections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(section),
  });
  if (!res.ok) throw new Error("Failed to add section");
  return res.json();
}

async function updateSectionApi(id: number, updates: Partial<Section>): Promise<Section> {
  const res = await fetch(`/api/about/sections/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update section");
  return res.json();
}

async function deleteSectionApi(id: number): Promise<void> {
  const res = await fetch(`/api/about/sections/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete section");
}

async function reorderSectionsApi(sectionIds: number[]): Promise<Section[]> {
  const res = await fetch("/api/about/sections/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sectionIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder sections");
  return res.json();
}

/** @param locale - "tr" | "en" ile site diline göre veri; verilmezse admin için ham veri (TR + _en) döner */
export function useAbout(locale?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["about", locale ?? "raw"],
    queryFn: () => fetchAbout(locale),
    staleTime: 1000 * 60 * 5,
  });

  const updateMutation = useMutation({
    mutationFn: updateAbout,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["about"] }),
  });

  const heroMutation = useMutation({
    mutationFn: updateHero,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["about"] }),
  });

  const addSectionMutation = useMutation({
    mutationFn: addSection,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["about"] }),
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Section> }) =>
      updateSectionApi(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["about"] }),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: deleteSectionApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["about"] }),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderSectionsApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["about"] }),
  });

  return {
    data,
    hero: data?.hero,
    sections: data?.sections?.sort((a, b) => a.order - b.order) || [],
    isLoading,
    error,
    updateData: updateMutation.mutate,
    updateHero: heroMutation.mutate,
    addSection: addSectionMutation.mutate,
    updateSection: updateSectionMutation.mutate,
    deleteSection: deleteSectionMutation.mutate,
    reorderSections: reorderMutation.mutate,
    isUpdating:
      updateMutation.isPending ||
      heroMutation.isPending ||
      addSectionMutation.isPending ||
      updateSectionMutation.isPending ||
      deleteSectionMutation.isPending ||
      reorderMutation.isPending,
  };
}






