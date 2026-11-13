import { prisma } from "./prisma";
import { encryptCardFields, decryptCardFields } from "../utils/cardEncryption";
import type { UTMData } from "@shared/utm";

export interface FormResponse {
  id: number;
  formType: string; // "kayit", "stars", "iletisim"
  formName: string;
  data: Record<string, any>;
  ipAddress: string;
  submittedAt: string;
  createdAt: string;
}

export interface FormStats {
  formType: string;
  formName: string;
  totalResponses: number;
  lastSubmission: string | null;
}

export async function getFormResponses(formType?: string): Promise<FormResponse[]> {
  try {
    const where = formType ? { formType } : {};
    const responses = await prisma.form_responses.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return responses.map((r) => ({
      id: r.id,
      formType: r.formType,
      formName: r.formName,
      data: decryptCardFields((r.data as Record<string, unknown>) || {}),
      ipAddress: r.ipAddress,
      submittedAt: r.submittedAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (error) {
    throw error;
  }
}

export async function getFormResponseById(id: number): Promise<FormResponse | undefined> {
  try {
    const response = await prisma.form_responses.findUnique({
      where: { id },
    });

    if (!response) return undefined;

    return {
      id: response.id,
      formType: response.formType,
      formName: response.formName,
      data: decryptCardFields((response.data as Record<string, unknown>) || {}),
      ipAddress: response.ipAddress,
      submittedAt: response.submittedAt.toISOString(),
      createdAt: response.createdAt.toISOString(),
    };
  } catch (error) {
    throw error;
  }
}

export async function getFormStats(): Promise<FormStats[]> {
  try {
    const responses = await prisma.form_responses.findMany({
      select: {
        formType: true,
        formName: true,
        submittedAt: true,
      },
    });

    const statsMap = new Map<string, FormStats>();

    for (const response of responses) {
      const existing = statsMap.get(response.formType);
      const submittedAtStr = response.submittedAt.toISOString();
      
      if (existing) {
        existing.totalResponses++;
        if (!existing.lastSubmission || submittedAtStr > existing.lastSubmission) {
          existing.lastSubmission = submittedAtStr;
        }
      } else {
        statsMap.set(response.formType, {
          formType: response.formType,
          formName: response.formName,
          totalResponses: 1,
          lastSubmission: submittedAtStr,
        });
      }
    }

    return Array.from(statsMap.values());
  } catch (error) {
    throw error;
  }
}

export async function addFormResponse(
  response: Omit<FormResponse, "id" | "createdAt">
): Promise<FormResponse> {
  try {
    // İstemciden gelen data içindeki "id" Prisma satır id'si ile karışmasın diye çıkarılıyor
    let payload = response.data && typeof response.data === "object" && !Array.isArray(response.data)
      ? (() => {
          const { id: _omit, ...rest } = response.data as Record<string, unknown>;
          return rest;
        })()
      : response.data;
    // Kart bilgileri (kartNumarasi, cvc, sonKullanma) AES-256 ile şifrelenir
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      payload = encryptCardFields(payload as Record<string, unknown>) as object;
    }

    const newResponse = await prisma.form_responses.create({
      data: {
        formType: response.formType,
        formName: response.formName,
        data: payload,
        ipAddress: response.ipAddress,
        submittedAt: new Date(response.submittedAt),
      },
    });

    return {
      id: newResponse.id,
      formType: newResponse.formType,
      formName: newResponse.formName,
      data: newResponse.data as Record<string, any>,
      ipAddress: newResponse.ipAddress,
      submittedAt: newResponse.submittedAt.toISOString(),
      createdAt: newResponse.createdAt.toISOString(),
    };
  } catch (error) {
    throw error;
  }
}

export async function deleteFormResponse(id: number): Promise<boolean> {
  try {
    const result = await prisma.form_responses.delete({
      where: { id },
    });
    return !!result;
  } catch (error) {
    // Prisma throws if not found, return false in that case
    return false;
  }
}

export async function importFormResponses(
  newResponses: Omit<FormResponse, "id" | "createdAt">[],
  clearExisting: boolean = false
): Promise<number> {
  try {
    if (clearExisting) {
      await prisma.form_responses.deleteMany({});
    }

    const data = newResponses.map((r) => ({
      formType: r.formType,
      formName: r.formName,
      data: encryptCardFields((r.data && typeof r.data === "object" && !Array.isArray(r.data) ? r.data : {}) as Record<string, unknown>) as object,
      ipAddress: r.ipAddress,
      submittedAt: new Date(r.submittedAt),
    }));

    const result = await prisma.form_responses.createMany({
      data,
    });

    return result.count;
  } catch (error) {
    throw error;
  }
}

export async function clearFormResponses(formType?: string): Promise<number> {
  try {
    const where = formType ? { formType } : {};
    const result = await prisma.form_responses.deleteMany({
      where,
    });
    return result.count;
  } catch (error) {
    throw error;
  }
}

/** Form response data alanını günceller (örn. ödeme sonucu) */
export async function updateFormResponseData(
  id: number,
  dataUpdate: Record<string, unknown>
): Promise<FormResponse | undefined> {
  try {
    const existing = await prisma.form_responses.findUnique({
      where: { id },
    });
    if (!existing) return undefined;

    const currentData = (existing.data as Record<string, unknown>) || {};
    // Güncellemede gelen kart alanları varsa şifrelenir
    const encryptedUpdate = encryptCardFields(dataUpdate);
    const newData = { ...currentData, ...encryptedUpdate } as Record<string, unknown>;

    const updated = await prisma.form_responses.update({
      where: { id },
      data: { data: newData as object },
    });

    // GET ile aynı formatta dön: kart alanları çözülmüş olsun (admin panelde F5 gerekmesin)
    const decryptedData = decryptCardFields((updated.data as Record<string, unknown>) || {});

    return {
      id: updated.id,
      formType: updated.formType,
      formName: updated.formName,
      data: decryptedData as Record<string, any>,
      ipAddress: updated.ipAddress,
      submittedAt: updated.submittedAt.toISOString(),
      createdAt: updated.createdAt.toISOString(),
    };
  } catch (error) {
    throw error;
  }
}

/** UTM Analytics */

export interface UTMStats {
  utm_source: string;
  utm_medium?: string;
  utm_campaign?: string;
  total_registrations: number;
  paid_registrations: number;
  pending_registrations: number;
  failed_registrations: number;
  conversion_rate: number; // paid / total
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

/**
 * UTM kampanya istatistiklerini getirir
 */
export async function getUTMStats(): Promise<UTMStats[]> {
  try {
    const responses = await prisma.form_responses.findMany({
      where: {
        formType: "kayit",
      },
      select: {
        data: true,
        submittedAt: true,
      },
    });

    const utmStatsMap = new Map<string, UTMStats>();

    for (const response of responses) {
      const data = response.data as Record<string, unknown>;
      
      // UTM verisi var mı kontrol et
      if (!data.utm_source && !data.utm_campaign) {
        continue;
      }

      const utmSource = (data.utm_source as string) || 'unknown';
      const utmMedium = data.utm_medium as string;
      const utmCampaign = data.utm_campaign as string;
      const paymentStatus = (data.paymentStatus as string) || 'pending';
      
      // UTM key oluştur (source + campaign kombinasyonu)
      const utmKey = `${utmSource}|${utmCampaign || ''}|${utmMedium || ''}`;
      
      let stats = utmStatsMap.get(utmKey);
      if (!stats) {
        stats = {
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          total_registrations: 0,
          paid_registrations: 0,
          pending_registrations: 0,
          failed_registrations: 0,
          conversion_rate: 0,
          total_revenue: 0,
        };
        utmStatsMap.set(utmKey, stats);
      }

      stats.total_registrations++;
      
      if (paymentStatus === 'success') {
        stats.paid_registrations++;
        // Revenue hesaplama
        const packagePrice = data.packagePrice as string;
        if (packagePrice) {
          const price = parseFloat(packagePrice.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
          stats.total_revenue = (stats.total_revenue || 0) + price;
        }
      } else if (paymentStatus === 'failed') {
        stats.failed_registrations++;
      } else {
        stats.pending_registrations++;
      }

      // Conversion rate hesapla
      stats.conversion_rate = stats.total_registrations > 0 
        ? (stats.paid_registrations / stats.total_registrations) * 100
        : 0;
    }

    return Array.from(utmStatsMap.values()).sort((a, b) => b.total_registrations - a.total_registrations);
  } catch (error) {
    throw error;
  }
}

/**
 * Belirli bir UTM kampanyasının kayıtlarını getirir
 */
export async function getUTMRegistrations(utmSource: string, utmCampaign?: string): Promise<UTMRegistration[]> {
  try {
    const responses = await prisma.form_responses.findMany({
      where: {
        formType: "kayit",
      },
      orderBy: { submittedAt: 'desc' },
    });

    const registrations: UTMRegistration[] = [];

    for (const response of responses) {
      const data = decryptCardFields((response.data as Record<string, unknown>) || {});
      
      // UTM filtresi
      const responseUtmSource = data.utm_source as string;
      const responseUtmCampaign = data.utm_campaign as string;
      
      if (responseUtmSource !== utmSource) {
        continue;
      }
      
      if (utmCampaign && responseUtmCampaign !== utmCampaign) {
        continue;
      }

      registrations.push({
        id: response.id,
        adSoyad: (data.adSoyad as string) || '',
        kurumAdi: (data.kurumAdi as string) || '',
        eposta: (data.eposta as string) || '',
        packageTitle: (data.packageTitle as string) || '',
        packagePrice: (data.packagePrice as string) || '',
        paymentStatus: (data.paymentStatus as string) || 'pending',
        utm_source: data.utm_source as string,
        utm_medium: data.utm_medium as string,
        utm_campaign: data.utm_campaign as string,
        utm_content: data.utm_content as string,
        utm_captured_at: data.utm_captured_at as string,
        submittedAt: response.submittedAt.toISOString(),
      });
    }

    return registrations;
  } catch (error) {
    throw error;
  }
}

/**
 * Ödeme başarısı sonrası UTM tracking güncelleme
 * (Bu fonksiyon zaten mevcut updateFormResponseData ile yapılıyor,
 * ancak özel UTM tracking için kullanılabilir)
 */
export async function markUTMRegistrationAsPaid(formResponseId: number): Promise<void> {
  try {
    const existing = await prisma.form_responses.findUnique({
      where: { id: formResponseId },
      select: { data: true },
    });
    
    if (!existing) return;
    
    const data = (existing.data as Record<string, unknown>) || {};
    
    // UTM verisi varsa paid timestamp ekle
    if (data.utm_source || data.utm_campaign) {
      data.utm_paid_at = new Date().toISOString();
      
      await prisma.form_responses.update({
        where: { id: formResponseId },
        data: { data: data as object },
      });
    }
  } catch (error) {
    console.error('UTM paid tracking error:', error);
    // Hata olsa bile ana süreç etkilenmesin
  }
}
