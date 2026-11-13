/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// OneSignal Notification API Types
export interface OneSignalSubscribeRequest {
  userId: string;
  email?: string;
  tags?: Record<string, string>;
}

export interface OneSignalSubscribeResponse {
  success: boolean;
  message: string;
  playerId?: string;
}

export interface OneSignalSendNotificationRequest {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, any>;
  userIds?: string[]; // OneSignal player IDs
  segments?: string[]; // OneSignal segments like ["All"]
  filters?: Array<{
    field: string;
    key?: string;
    relation: string;
    value: string;
  }>;
  schedule?: {
    send_after: string; // ISO date string
  };
}

export interface OneSignalSendNotificationResponse {
  success: boolean;
  message: string;
  notificationId?: string;
  recipients?: number;
  errors?: string[];
}

export interface OneSignalStatsResponse {
  success: boolean;
  stats: {
    totalSubscribers: number;
    activeSubscribers: number;
    clickRate: number;
    deliveryRate: number;
  };
}

export interface UTMStatsResponse {
  success: boolean;
  stats: UTMStat[];
}

export interface UTMStat {
  utm_source: string;
  utm_medium?: string;
  utm_campaign?: string;
  total_registrations: number;
  paid_registrations: number;
  pending_registrations: number;
  failed_registrations: number;
  conversion_rate: number;
  total_revenue?: number;
}

export interface UTMRegistration {
  id: number;
  adSoyad: string;
  kurumAdi: string;
  eposta: string;
  packageTitle: string;
  packagePrice: string;
  paymentStatus: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_captured_at?: string;
  submittedAt: string;
}

export interface UTMRegistrationsResponse {
  success: boolean;
  registrations: UTMRegistration[];
}

export interface UTMSummaryResponse {
  success: boolean;
  summary: {
    total_utm_campaigns: number;
    total_utm_registrations: number;
    total_utm_paid: number;
    total_utm_revenue: number;
    avg_conversion_rate: number;
    top_sources: Array<{
      utm_source: string;
      utm_campaign?: string;
      total_registrations: number;
      conversion_rate: number;
    }>;
  };
}

/** Admin menü sayfalarına karşılık yetki anahtarları */
export const ADMIN_PERMISSION_KEYS = [
  "dashboard",
  "site-ayarlari",
  "ana-sayfa",
  "mobil-sayfa",
  "konusmacilar",
  "program",
  "sponsorlar",
  "arsiv-aciklamalari",
  "sss",
  "uez-2026",
  "hakkimizda",
  "bize-ulasin",
  "sozlesmeler",
  "paketler",
  "kayitlar",
  "utm-analytics",
  "stars-of-regions",
  "iletisim-mesajlari",
  "odemeler",
  "rol-yonetimi",
  "kullanici-yonetimi",
  "admin-loglari",
] as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSION_KEYS)[number];

export interface AdminRole {
  id: number;
  name: string;
  permissions: string[];
}

const BASE = "/uezyonetim";

/** Path'ten yetki anahtarını çıkarır. /uezyonetim/site-ayarlari -> site-ayarlari */
export function pathToPermissionKey(pathname: string): string | null {
  if (pathname === BASE || pathname === BASE + "/") return "dashboard";
  if (!pathname.startsWith(BASE + "/")) return null;
  const rest = pathname.slice(BASE.length + 1);
  const segment = rest.split("/")[0];
  if (!segment) return null;
  if (segment === "form-yanitlari") return "kayitlar";
  return segment;
}