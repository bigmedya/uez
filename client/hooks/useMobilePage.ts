import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MobilePageData, QuickAction, SocialMedia } from "./useMobilePage.types";

/** @param locale - "tr" | "en" ile site dilinde veri; verilmezse admin için ham veri (_en alanlarıyla) */
async function fetchMobilePage(locale?: "tr" | "en"): Promise<MobilePageData> {
  const url = locale ? `/api/mobile-page?locale=${locale}` : "/api/mobile-page";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch mobile page data");
  return res.json();
}

async function updateMobilePage(data: Partial<MobilePageData>): Promise<MobilePageData> {
  const res = await fetch("/api/mobile-page", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update mobile page data");
  return res.json();
}

/** @param locale - Site dilinde veri için "tr" | "en"; admin için undefined (ham veri) */
export function useMobilePage(locale?: "tr" | "en") {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["mobilePage", locale ?? "raw"],
    queryFn: () => fetchMobilePage(locale),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: updateMobilePage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobilePage"] });
    },
  });

  return {
    data,
    isLoading,
    error,
    updateData: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}

export type { MobilePageData, QuickAction, SocialMedia };
