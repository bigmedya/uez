import { useQuery } from "@tanstack/react-query";

export interface Package {
  id: number;
  packageId: string;
  title: string;
  subtitle: string;
  price: string;
  features: string[];
  active: boolean;
  order: number;
}

async function fetchPackages(activeOnly: boolean, locale?: string): Promise<Package[]> {
  const params = new URLSearchParams();
  if (activeOnly) params.set("active", "true");
  if (locale === "en") params.set("locale", "en");
  const url = `/api/packages${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch packages");
  return res.json();
}

/**
 * Aktif paketleri getirir. locale verilirse (en) API title/subtitle/features EN alanlarını döner.
 * @param activeOnly - Sadece active=true paketler (kayıt sayfası için true)
 * @param locale - "en" | "tr" | undefined (dil seçimine göre; undefined = TR)
 */
export function usePackages(options: { activeOnly?: boolean; locale?: string } = {}) {
  const { activeOnly = false, locale } = options;

  const { data: packages = [], isLoading, error } = useQuery({
    queryKey: ["packages", activeOnly, locale ?? "tr"],
    queryFn: () => fetchPackages(!!activeOnly, locale),
    staleTime: 1000 * 60 * 5,
  });

  return {
    packages,
    isLoading,
    error,
  };
}
