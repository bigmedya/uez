import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getApiBase } from "@shared/getApiBase";

export interface SiteSettings {
  siteTitle: string;
  metaDescription: string;
  metaKeywords: string;
  email: string;
  phone: string;
  address: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  instagram: string;
  facebook: string;
  copyrightText: string;
  logoUrl: string;
  faviconUrl: string;
  liveButtonActive: boolean;
  liveButtonUrl: string;
  liveButtonUrl_en: string;
  updatedAt: string;
}

const defaultSettings: SiteSettings = {
  siteTitle: "UEZ 2026 - Uluslararası Ekonomi Zirvesi",
  metaDescription: "",
  metaKeywords: "",
  email: "info@uez.org.tr",
  phone: "+90 212 123 4567",
  address: "",
  twitter: "",
  linkedin: "",
  youtube: "",
  instagram: "",
  facebook: "",
  copyrightText: "© 2026 Uluslararası Ekonomi Zirvesi. Tüm hakları saklıdır.",
  logoUrl: "",
  faviconUrl: "",
  liveButtonActive: false,
  liveButtonUrl: "",
  liveButtonUrl_en: "",
  updatedAt: "",
};

async function fetchSettings(locale?: string): Promise<SiteSettings> {
  const path = locale ? `/api/settings?locale=${encodeURIComponent(locale)}` : "/api/settings";
  const res = await fetch(`${getApiBase()}${path}`);
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export function useSiteSettings() {
  const { i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? "en" : "tr";

  const { data, isLoading, error } = useQuery({
    queryKey: ["settings", locale],
    queryFn: () => fetchSettings(locale),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: defaultSettings,
  });

  return {
    settings: data || defaultSettings,
    loading: isLoading,
    error: error ? String(error) : null,
  };
}
