/**
 * UTM tracking utilities
 * Used for campaign attribution and source tracking
 */

export interface UTMData {
  utm_source?: string;      // Email, social, etc.
  utm_medium?: string;      // Email, CPC, organic, etc.
  utm_campaign?: string;    // Campaign name (e.g., uez2026)
  utm_term?: string;        // Keyword for paid search
  utm_content?: string;     // A/B test content (e.g., hero_button)
  utm_id?: string;          // Campaign ID
  
  // Meta bilgiler
  utm_captured_at?: string; // UTM verilerinin yakalandığı zaman (ISO string)
  utm_page_url?: string;    // UTM'in yakalandığı sayfa URL'si
  utm_referrer?: string;    // Referrer URL
}

/**
 * URL'den UTM parametrelerini parse eder
 */
export function parseUTMFromURL(url: string): UTMData {
  try {
    const urlObj = new URL(url);
    const utmData: UTMData = {};
    
    // UTM parametrelerini oku
    const utmParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 
      'utm_term', 'utm_content', 'utm_id'
    ] as const;
    
    for (const param of utmParams) {
      const value = urlObj.searchParams.get(param);
      if (value) {
        utmData[param] = value.trim();
      }
    }
    
    // Meta bilgileri ekle
    if (Object.keys(utmData).length > 0) {
      utmData.utm_captured_at = new Date().toISOString();
      utmData.utm_page_url = url;
      
      // Browser environment'da referrer alabiliyorsa
      if (typeof document !== 'undefined' && document.referrer) {
        utmData.utm_referrer = document.referrer;
      }
    }
    
    return utmData;
  } catch (error) {
    console.warn('UTM parse error:', error);
    return {};
  }
}

/**
 * URLSearchParams'dan UTM parametrelerini parse eder (React Router için)
 */
export function parseUTMFromSearchParams(searchParams: URLSearchParams): UTMData {
  const utmData: UTMData = {};
  
  const utmParams = [
    'utm_source', 'utm_medium', 'utm_campaign', 
    'utm_term', 'utm_content', 'utm_id'
  ] as const;
  
  for (const param of utmParams) {
    const value = searchParams.get(param);
    if (value) {
      utmData[param] = value.trim();
    }
  }
  
  // Meta bilgileri ekle
  if (Object.keys(utmData).length > 0) {
    utmData.utm_captured_at = new Date().toISOString();
    
    // Browser environment'da bilgi alabiliyorsa
    if (typeof window !== 'undefined') {
      utmData.utm_page_url = window.location.href;
      if (document.referrer) {
        utmData.utm_referrer = document.referrer;
      }
    }
  }
  
  return utmData;
}

/**
 * UTM verilerini localStorage'a kaydeder
 */
export function saveUTMToStorage(utmData: UTMData): void {
  try {
    if (typeof window === 'undefined' || Object.keys(utmData).length === 0) {
      return;
    }
    
    localStorage.setItem('utm_data', JSON.stringify(utmData));
  } catch (error) {
    console.warn('UTM save to storage error:', error);
  }
}

/**
 * localStorage'dan UTM verilerini okur
 */
export function getUTMFromStorage(): UTMData {
  try {
    if (typeof window === 'undefined') {
      return {};
    }
    
    const stored = localStorage.getItem('utm_data');
    if (!stored) {
      return {};
    }
    
    return JSON.parse(stored) as UTMData;
  } catch (error) {
    console.warn('UTM get from storage error:', error);
    return {};
  }
}

/**
 * localStorage'daki UTM verilerini temizler
 */
export function clearUTMFromStorage(): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    
    localStorage.removeItem('utm_data');
  } catch (error) {
    console.warn('UTM clear from storage error:', error);
  }
}

/**
 * UTM verilerinin geçerli olup olmadığını kontrol eder
 */
export function isValidUTMData(utmData: UTMData): boolean {
  if (!utmData || typeof utmData !== 'object') {
    return false;
  }
  
  // En az utm_source veya utm_campaign bulunmalı
  return Boolean(utmData.utm_source || utmData.utm_campaign);
}

/**
 * UTM verilerini form data'sına ekler
 */
export function addUTMToFormData(formData: Record<string, unknown>, utmData: UTMData): Record<string, unknown> {
  if (!isValidUTMData(utmData)) {
    return formData;
  }
  
  return {
    ...formData,
    // UTM verilerini utm_ prefix'i ile ekle
    ...utmData
  };
}

/**
 * UTM verilerini human-readable formata çevirir (admin paneli için)
 */
export function formatUTMDisplay(utmData: UTMData): string {
  if (!isValidUTMData(utmData)) {
    return 'UTM verisi yok';
  }
  
  const parts: string[] = [];
  
  if (utmData.utm_source) parts.push(`Kaynak: ${utmData.utm_source}`);
  if (utmData.utm_medium) parts.push(`Medya: ${utmData.utm_medium}`);
  if (utmData.utm_campaign) parts.push(`Kampanya: ${utmData.utm_campaign}`);
  if (utmData.utm_content) parts.push(`İçerik: ${utmData.utm_content}`);
  
  return parts.join(' • ');
}

/**
 * UTM verilerini query string formatına çevir
 */
export function utmToQueryString(utmData: UTMData): string {
  if (!isValidUTMData(utmData)) {
    return '';
  }
  
  const params = new URLSearchParams();
  
  const utmParams = [
    'utm_source', 'utm_medium', 'utm_campaign', 
    'utm_term', 'utm_content', 'utm_id'
  ] as const;
  
  for (const param of utmParams) {
    if (utmData[param]) {
      params.append(param, utmData[param]!);
    }
  }
  
  return params.toString();
}