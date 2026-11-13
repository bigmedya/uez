import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Uez2026Locale = "tr" | "en";

// ---- Resolved (public, single locale) ----
export interface HeroData {
  title: string;
  subtitle: string;
  location: string;
}

export interface IntroData {
  paragraphs: string[];
}

export interface TopicsSectionData {
  titleLine1: string;
  titleLine2: string;
}

export interface Topic {
  id: number;
  title: string;
  description: string;
  image: string;
  order: number;
  active: boolean;
}

export interface UEZ2026Data {
  hero: HeroData;
  intro: IntroData;
  topicsSection: TopicsSectionData;
  topics: Topic[];
  updatedAt: string;
}

// ---- Raw (admin, TR + EN) ----
export interface HeroDataRaw {
  title_tr: string;
  title_en: string;
  subtitle_tr: string;
  subtitle_en: string;
  location_tr: string;
  location_en: string;
}

export interface IntroDataRaw {
  paragraphs: Array<{ tr: string; en: string }>;
}

export interface TopicsSectionDataRaw {
  titleLine1_tr: string;
  titleLine1_en: string;
  titleLine2_tr: string;
  titleLine2_en: string;
}

export interface TopicRaw {
  id: number;
  title_tr: string;
  title_en: string;
  description_tr: string;
  description_en: string;
  image: string;
  order: number;
  active: boolean;
}

export interface UEZ2026DataRaw {
  hero: HeroDataRaw;
  intro: IntroDataRaw;
  topicsSection: TopicsSectionDataRaw;
  topics: TopicRaw[];
  updatedAt: string;
}

async function fetchUEZ2026(): Promise<UEZ2026DataRaw> {
  const res = await fetch("/api/uez2026");
  if (!res.ok) throw new Error("Failed to fetch UEZ 2026 data");
  return res.json();
}

async function fetchPublicUEZ2026(locale: Uez2026Locale = "tr"): Promise<UEZ2026Data> {
  const res = await fetch(`/api/uez2026/public?locale=${locale}`);
  if (!res.ok) throw new Error("Failed to fetch UEZ 2026 data");
  return res.json();
}

async function updateUEZ2026(data: Partial<UEZ2026DataRaw>): Promise<UEZ2026DataRaw> {
  const res = await fetch("/api/uez2026", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

async function updateHero(data: Partial<HeroDataRaw>): Promise<UEZ2026DataRaw> {
  const res = await fetch("/api/uez2026/hero", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update hero");
  return res.json();
}

async function updateIntro(data: IntroDataRaw): Promise<UEZ2026DataRaw> {
  const res = await fetch("/api/uez2026/intro", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update intro");
  return res.json();
}

async function updateTopicsSection(
  data: Partial<TopicsSectionDataRaw>
): Promise<UEZ2026DataRaw> {
  const res = await fetch("/api/uez2026/topics-section", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update topics section");
  return res.json();
}

async function addTopicApi(
  topic: Omit<TopicRaw, "id" | "order">
): Promise<TopicRaw> {
  const res = await fetch("/api/uez2026/topics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(topic),
  });
  if (!res.ok) throw new Error("Failed to add topic");
  return res.json();
}

async function updateTopicApi(
  id: number,
  updates: Partial<TopicRaw>
): Promise<TopicRaw> {
  const res = await fetch(`/api/uez2026/topics/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update topic");
  return res.json();
}

async function deleteTopicApi(id: number): Promise<void> {
  const res = await fetch(`/api/uez2026/topics/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete topic");
}

async function reorderTopicsApi(topicIds: number[]): Promise<TopicRaw[]> {
  const res = await fetch("/api/uez2026/topics/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topicIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder topics");
  return res.json();
}

/** Admin: useUez2026() — full raw TR/EN. Public: useUez2026(true, locale) — resolved for locale. */
export function useUez2026(publicOnly = false, locale: Uez2026Locale = "tr") {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["uez2026", publicOnly, publicOnly ? locale : undefined],
    queryFn: () =>
      publicOnly ? fetchPublicUEZ2026(locale) : fetchUEZ2026(),
    staleTime: 1000 * 60 * 5,
  });

  const updateMutation = useMutation({
    mutationFn: updateUEZ2026,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["uez2026"] }),
  });

  const heroMutation = useMutation({
    mutationFn: updateHero,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["uez2026"] }),
  });

  const introMutation = useMutation({
    mutationFn: updateIntro,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["uez2026"] }),
  });

  const topicsSectionMutation = useMutation({
    mutationFn: updateTopicsSection,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["uez2026"] }),
  });

  const addTopicMutation = useMutation({
    mutationFn: addTopicApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["uez2026"] }),
  });

  const updateTopicMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<TopicRaw> }) =>
      updateTopicApi(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["uez2026"] }),
  });

  const deleteTopicMutation = useMutation({
    mutationFn: deleteTopicApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["uez2026"] }),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderTopicsApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["uez2026"] }),
  });

  const rawData = data as UEZ2026DataRaw | undefined;
  const resolvedData = data as UEZ2026Data | undefined;

  const hero = publicOnly
    ? resolvedData?.hero
    : rawData?.hero;
  const intro = publicOnly
    ? resolvedData?.intro
    : rawData?.intro;
  const topicsSection = publicOnly
    ? resolvedData?.topicsSection
    : rawData?.topicsSection;
  const topics = publicOnly
    ? (resolvedData?.topics ?? []).sort((a, b) => a.order - b.order)
    : (rawData?.topics ?? []).sort((a, b) => a.order - b.order);

  return {
    data,
    hero,
    intro,
    topicsSection,
    topics,
    isLoading,
    error,
    updateData: updateMutation.mutate,
    updateHero: heroMutation.mutate,
    updateIntro: introMutation.mutate,
    updateTopicsSection: topicsSectionMutation.mutate,
    addTopic: addTopicMutation.mutate,
    updateTopic: updateTopicMutation.mutate,
    deleteTopic: deleteTopicMutation.mutate,
    reorderTopics: reorderMutation.mutate,
    isUpdating:
      updateMutation.isPending ||
      heroMutation.isPending ||
      introMutation.isPending ||
      topicsSectionMutation.isPending ||
      addTopicMutation.isPending ||
      updateTopicMutation.isPending ||
      deleteTopicMutation.isPending ||
      reorderMutation.isPending,
  };
}
