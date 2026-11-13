import { useAdminAuth } from "../contexts/AdminAuthContext";
import { useRef } from "react";

export interface LogAction {
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
}

// Çift loglama önleme için cache
const logCache = new Set<string>();

export function useAdminLogger() {
  const { userId } = useAdminAuth();

  const logAction = async (logData: LogAction) => {
    if (!userId) {
      console.warn("Admin logger: User ID not available");
      return;
    }

    // VIEW aksiyonlarını loglamayı atla (çok fazla spam oluşturuyor)
    if (logData.action === LOG_ACTIONS.VIEW) {
      return;
    }

    // Çift loglama önleme - aynı işlem için cache kontrolü
    const cacheKey = `${userId}-${logData.action}-${logData.entity}-${logData.entityId}-${JSON.stringify(logData.details)}`;
    if (logCache.has(cacheKey)) {
      console.log("Admin logger: Duplicate log prevented");
      return;
    }

    // Cache'e ekle ve 5 saniye sonra temizle
    logCache.add(cacheKey);
    setTimeout(() => {
      logCache.delete(cacheKey);
    }, 5000);

    try {
      const response = await fetch("/api/admin/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logData),
      });

      if (!response.ok) {
        console.error("Admin logger: Failed to log action", await response.text());
      }
    } catch (error) {
      console.error("Admin logger: Error logging action", error);
    }
  };

  return { logAction };
}

// Token'ı localStorage'dan almak için yardımcı fonksiyon
function getStoredToken(): string | null {
  try {
    const stored = localStorage.getItem("adminSession");
    if (!stored) return null;
    const session = JSON.parse(stored);
    return session.token;
  } catch {
    return null;
  }
}

// Yaygın log aksiyonları için sabitler
export const LOG_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE", 
  DELETE: "DELETE",
  VIEW: "VIEW",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  UPLOAD: "UPLOAD",
  DOWNLOAD: "DOWNLOAD",
  EXPORT: "EXPORT",
  IMPORT: "IMPORT",
} as const;

// Yaygın entity türleri için sabitler
export const LOG_ENTITIES = {
  USER: "users",
  ROLE: "admin_roles",
  PROGRAM: "program_items",
  PROGRAM_DAY: "program_days",
  PROGRAM_CATEGORY: "program_categories",
  SPEAKER: "speakers",
  SPONSOR: "sponsors",
  SPONSOR_CATEGORY: "sponsor_categories",
  REGISTRATION: "registrations",
  PACKAGES: "packages",
  FAQ: "faqs",
  CONTRACT: "contracts",
  SITE_SETTINGS: "site_settings",
  HOMEPAGE_CONTENT: "homepage_content",
  ABOUT_CONTENT: "about_content",
  UEZ2026_CONTENT: "uez2026_content",
  CONTACT_SETTINGS: "contact_settings",
  ARCHIVE_DESCRIPTION: "archive_descriptions",
  FORM_RESPONSE: "form_responses",
  REGISTRATION_EXTERNAL_PAYMENT: "registration_external_payment",
} as const;