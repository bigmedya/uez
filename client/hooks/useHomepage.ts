import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface HeroData {
  dateText: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  videoImage: string;
  videoUrl: string;
  eventDate: string;
  dateText_en?: string;
  title_en?: string;
  subtitle_en?: string;
  buttonText_en?: string;
}

export interface CounterItem {
  id: number;
  label: string;
  value: string;
  label_en?: string;
}

export interface InfoBannerData {
  text: string;
  buttonText: string;
  buttonLink: string;
  text_en?: string;
  buttonText_en?: string;
}

export interface HomepageData {
  hero: HeroData;
  counters: CounterItem[];
  infoBanner: InfoBannerData;
  updatedAt: string;
}

async function fetchHomepage(locale?: string): Promise<HomepageData> {
  const url = locale === "en" || locale === "tr" ? `/api/homepage?locale=${locale}` : "/api/homepage";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch homepage data");
  return res.json();
}

async function updateHomepage(data: Partial<HomepageData>): Promise<HomepageData> {
  const res = await fetch("/api/homepage", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update homepage data");
  return res.json();
}

async function updateHero(data: Partial<HeroData>): Promise<HomepageData> {
  const res = await fetch("/api/homepage/hero", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update hero");
  return res.json();
}

async function updateCounters(counters: CounterItem[]): Promise<HomepageData> {
  const res = await fetch("/api/homepage/counters", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ counters }),
  });
  if (!res.ok) throw new Error("Failed to update counters");
  return res.json();
}

async function updateInfoBanner(data: Partial<InfoBannerData>): Promise<HomepageData> {
  const res = await fetch("/api/homepage/info-banner", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update info banner");
  return res.json();
}

/** @param locale - "tr" | "en" ile site diline göre veri; verilmezse admin için ham veri (TR + _en) döner */
export function useHomepage(locale?: string) {
  const queryClient = useQueryClient();

  const { data: homepage, isLoading, error } = useQuery({
    queryKey: ["homepage", locale ?? "raw"],
    queryFn: () => fetchHomepage(locale),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: updateHomepage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage"] });
    },
  });

  const heroMutation = useMutation({
    mutationFn: updateHero,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage"] });
    },
  });

  const countersMutation = useMutation({
    mutationFn: updateCounters,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage"] });
    },
  });

  const bannerMutation = useMutation({
    mutationFn: updateInfoBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage"] });
    },
  });

  return {
    homepage,
    isLoading,
    error,
    updateHomepage: updateMutation.mutate,
    updateHero: heroMutation.mutate,
    updateCounters: countersMutation.mutate,
    updateInfoBanner: bannerMutation.mutate,
    isUpdating:
      updateMutation.isPending ||
      heroMutation.isPending ||
      countersMutation.isPending ||
      bannerMutation.isPending,
  };
}






