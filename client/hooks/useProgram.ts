import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export interface ScheduleItemModerator {
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
  isMultiSpeaker: boolean;
  order: number;
}

export interface ScheduleDay {
  id: number;
  title: string;
  title_en?: string;
  label?: string;
  label_en?: string;
  slug: string;
  categoryId: number;
  scheduleItems: ScheduleItem[];
  order: number;
  wpPostId?: number;
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

async function fetchProgram(forAdmin?: boolean): Promise<ProgramData> {
  const url = forAdmin ? "/api/program?forAdmin=1" : "/api/program";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch program");
  return res.json();
}

async function fetchProgramForHomepage(locale?: string): Promise<ProgramData> {
  const url = locale === "en" ? "/api/program/homepage?locale=en" : "/api/program/homepage";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch program for homepage");
  const data = await res.json();
  // Endpoint returns only days, add empty categories for compatibility
  return {
    categories: [],
    days: data.days || [],
    updatedAt: new Date().toISOString()
  };
}

async function updateProgram(data: Partial<ProgramData>): Promise<ProgramData> {
  const res = await fetch("/api/program", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

async function importXML(params: { xmlPath: string; clearExisting?: boolean }): Promise<{ success: boolean; imported: { categories: number; days: number; items: number } }> {
  const res = await fetch("/api/program/import-xml", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to import");
  return res.json();
}

async function addDay(day: Omit<ScheduleDay, "id" | "order" | "scheduleItems">): Promise<ScheduleDay> {
  const res = await fetch("/api/program/days", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(day),
  });
  if (!res.ok) throw new Error("Failed to add day");
  return res.json();
}

async function updateDayApi(id: number, updates: Partial<ScheduleDay>): Promise<ScheduleDay> {
  const res = await fetch(`/api/program/days/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update day");
  return res.json();
}

async function deleteDayApi(id: number): Promise<void> {
  const res = await fetch(`/api/program/days/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete day");
}

async function addItem(dayId: number, item: Omit<ScheduleItem, "id" | "order">): Promise<ScheduleItem> {
  const res = await fetch(`/api/program/days/${dayId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Failed to add item");
  return res.json();
}

async function updateItemApi(dayId: number, itemId: number, updates: Partial<ScheduleItem>): Promise<ScheduleItem> {
  const res = await fetch(`/api/program/days/${dayId}/items/${itemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = typeof body?.error === "string" ? body.error : "Güncelleme başarısız.";
    throw new Error(message);
  }
  return res.json();
}

async function deleteItemApi(dayId: number, itemId: number): Promise<void> {
  const res = await fetch(`/api/program/days/${dayId}/items/${itemId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete item");
}

async function reorderItemsApi(dayId: number, itemIds: number[]): Promise<ScheduleItem[]> {
  const res = await fetch(`/api/program/days/${dayId}/items/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemIds }),
  });
  if (!res.ok) throw new Error("Sıralama güncellenemedi");
  return res.json();
}

async function addCategory(category: Omit<ScheduleCategory, "id" | "order">): Promise<ScheduleCategory> {
  const res = await fetch("/api/program/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(category),
  });
  if (!res.ok) throw new Error("Failed to add category");
  return res.json();
}

async function updateCategoryApi(id: number, updates: Partial<Pick<ScheduleCategory, "name" | "name_en" | "slug">>): Promise<ScheduleCategory> {
  const res = await fetch(`/api/program/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update category");
  return res.json();
}

async function deleteCategoryApi(id: number): Promise<void> {
  const res = await fetch(`/api/program/categories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete category");
}

export function useProgram(options?: { forAdmin?: boolean }) {
  const queryClient = useQueryClient();
  const forAdmin = options?.forAdmin ?? false;

  const { data, isLoading, error } = useQuery({
    queryKey: ["program", forAdmin ? "admin" : "public"],
    queryFn: () => fetchProgram(forAdmin),
    staleTime: 1000 * 60 * 5,
  });

  const updateMutation = useMutation({
    mutationFn: updateProgram,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["program"] }),
  });

  const importMutation = useMutation({
    mutationFn: importXML,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["program"] }),
  });

  const addDayMutation = useMutation({
    mutationFn: addDay,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["program"] }),
  });

  const updateDayMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<ScheduleDay> }) => updateDayApi(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["program"] }),
  });

  const deleteDayMutation = useMutation({
    mutationFn: deleteDayApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["program"] }),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ dayId, item }: { dayId: number; item: Omit<ScheduleItem, "id" | "order"> }) => addItem(dayId, item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["program"] }),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ dayId, itemId, updates }: { dayId: number; itemId: number; updates: Partial<ScheduleItem> }) => 
      updateItemApi(dayId, itemId, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["program"] }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ dayId, itemId }: { dayId: number; itemId: number }) => deleteItemApi(dayId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["program"] }),
  });

  const reorderItemsMutation = useMutation({
    mutationFn: ({ dayId, itemIds }: { dayId: number; itemIds: number[] }) => reorderItemsApi(dayId, itemIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["program"] }),
  });

  const addCategoryMutation = useMutation({
    mutationFn: addCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["program"] }),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Pick<ScheduleCategory, "name" | "name_en" | "slug">> }) =>
      updateCategoryApi(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["program"] }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategoryApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["program"] }),
  });

  return {
    data,
    categories: data?.categories?.sort((a, b) => a.order - b.order) || [],
    days: data?.days?.sort((a, b) => a.order - b.order) || [],
    isLoading,
    error,
    updateData: updateMutation.mutate,
    importXML: importMutation.mutate,
    addDay: addDayMutation.mutate,
    updateDay: updateDayMutation.mutate,
    deleteDay: deleteDayMutation.mutate,
    addItem: addItemMutation.mutate,
    updateItem: updateItemMutation.mutate,
    deleteItem: deleteItemMutation.mutate,
    reorderItems: reorderItemsMutation.mutate,
    addCategory: addCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    isUpdating:
      updateMutation.isPending ||
      importMutation.isPending ||
      addDayMutation.isPending ||
      updateDayMutation.isPending ||
      deleteDayMutation.isPending ||
      addItemMutation.isPending ||
      updateItemMutation.isPending ||
      deleteItemMutation.isPending ||
      reorderItemsMutation.isPending ||
      addCategoryMutation.isPending ||
      updateCategoryMutation.isPending ||
      deleteCategoryMutation.isPending,
  };
}

export function useProgramForHomepage() {
  const { i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en" : undefined;

  const { data, isLoading, error } = useQuery({
    queryKey: ["program", "homepage", locale],
    queryFn: () => fetchProgramForHomepage(locale),
    staleTime: 1000 * 60 * 5,
  });

  return {
    data,
    categories: data?.categories?.sort((a, b) => a.order - b.order) || [],
    days: data?.days?.sort((a, b) => a.order - b.order) || [],
    isLoading,
    error,
  };
}






