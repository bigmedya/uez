/**
 * Kayıt formu verileri için regex kuralları, formatlama ve validasyon.
 * Kart numarası, son kullanma, CVC, telefon, TC Kimlik, vergi no, posta kodu vb.
 */

/** Fiyat metninin yanında para birimini (TL) döndürür; zaten "TL" içeriyorsa olduğu gibi bırakır. */
export function formatPriceWithCurrency(price: string | undefined | null): string {
  if (price == null || String(price).trim() === "") return "";
  const p = String(price).trim();
  return /TL/i.test(p) ? p : `${p} TL`;
}

// --- Regex sabitleri ---
export const REGEX = {
  /** Sadece rakam */
  ONLY_DIGITS: /^\d*$/,
  /** Kart numarası: 13-19 rakam (boşluksuz) */
  CARD_NUMBER: /^\d{13,19}$/,
  /** Son kullanma: MM/YY, MM 01-12 */
  EXPIRY: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
  /** CVC: 3 veya 4 rakam */
  CVC: /^\d{3,4}$/,
  /** Türkiye telefon: 10 rakam (5xx xxx xx xx) veya 11 (0 ile) */
  PHONE_TR: /^(0)?[1-9]\d{9}$/,
  /** TC Kimlik: tam 11 rakam */
  TC_KIMLIK: /^\d{11}$/,
  /** Vergi numarası: 10 rakam */
  VERGI_NO: /^\d{10}$/,
  /** Türkiye posta kodu: 5 rakam */
  POSTA_KODU: /^\d{5}$/,
  /** E-posta */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// --- Kart numarası ---
/** Girdiyi sadece rakam yapıp en fazla 19 karaktere kısıtlar; 4’lü gruplar halinde boşluklu döndürür */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function validateCardNumber(raw: string): { valid: boolean; message?: string } {
  const digits = raw.replace(/\s/g, "");
  if (digits.length === 0) return { valid: false, message: "Kart numarası girin" };
  if (!REGEX.ONLY_DIGITS.test(digits)) return { valid: false, message: "Sadece rakam girin" };
  if (digits.length < 13) return { valid: false, message: "En az 13 rakam olmalı" };
  if (digits.length > 19) return { valid: false, message: "En fazla 19 rakam" };
  return { valid: true };
}

// --- Son kullanma (MM/YY) ---
/** Sadece rakam alır; 4 karakterde MM/YY formatına çevirir */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2, 4);
}

export function validateExpiry(value: string): { valid: boolean; message?: string } {
  const trimmed = value.trim();
  if (trimmed.length === 0) return { valid: false, message: "Son kullanma girin" };
  if (!REGEX.EXPIRY.test(trimmed)) {
    if (trimmed.length < 5) return { valid: false, message: "MM/YY formatında girin" };
    return { valid: false, message: "Geçerli ay (01-12) ve yıl girin" };
  }
  const [, month, year] = trimmed.match(REGEX.EXPIRY)!;
  const y = parseInt("20" + year, 10);
  const m = parseInt(month, 10);
  const now = new Date();
  const expiryDate = new Date(y, m, 0);
  if (expiryDate < now) return { valid: false, message: "Kartın süresi dolmuş" };
  return { valid: true };
}

// --- CVC / CVV ---
/** Sadece rakam, en fazla 4 karakter */
export function formatCvc(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

export function validateCvc(value: string): { valid: boolean; message?: string } {
  const trimmed = value.trim();
  if (trimmed.length === 0) return { valid: false, message: "CVC girin" };
  if (!REGEX.ONLY_DIGITS.test(trimmed)) return { valid: false, message: "Sadece rakam" };
  if (trimmed.length < 3) return { valid: false, message: "En az 3 rakam" };
  if (trimmed.length > 4) return { valid: false, message: "En fazla 4 rakam" };
  return { valid: true };
}

// --- Telefon (TR) ---
/** Sadece rakam ve + ; en fazla 11 rakam (0 ile başlayabilir) */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits;
}

export function validatePhone(value: string): { valid: boolean; message?: string } {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return { valid: false, message: "Telefon girin" };
  if (digits.length < 10) return { valid: false, message: "En az 10 rakam" };
  if (!REGEX.PHONE_TR.test(digits) && !REGEX.PHONE_TR.test("0" + digits)) {
    return { valid: false, message: "Geçerli bir Türkiye telefon numarası girin" };
  }
  return { valid: true };
}

// --- TC Kimlik ---
/** Sadece 11 rakam */
export function formatTCKimlik(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function validateTCKimlik(value: string, required: boolean = false): { valid: boolean; message?: string } {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return required ? { valid: false, message: "TC Kimlik No girin" } : { valid: true };
  if (digits.length !== 11) return { valid: false, message: "11 rakam olmalı" };
  if (!REGEX.TC_KIMLIK.test(digits)) return { valid: false, message: "Sadece rakam" };
  return { valid: true };
}

// --- Vergi numarası ---
/** Sadece 10 rakam */
export function formatVergiNo(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function validateVergiNo(value: string, required: boolean = false): { valid: boolean; message?: string } {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return required ? { valid: false, message: "Vergi numarası girin" } : { valid: true };
  if (digits.length !== 10) return { valid: false, message: "10 rakam olmalı" };
  return { valid: true };
}

// --- Posta kodu (TR: 5 rakam) ---
/** Sadece 5 rakam */
export function formatPostaKodu(value: string): string {
  return value.replace(/\D/g, "").slice(0, 5);
}

export function validatePostaKodu(value: string): { valid: boolean; message?: string } {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return { valid: false, message: "Posta kodu girin" };
  if (digits.length !== 5) return { valid: false, message: "5 rakam olmalı" };
  return { valid: true };
}

// --- E-posta (zaten component’te var, tutarlılık için) ---
export function validateEmail(value: string): { valid: boolean; message?: string } {
  if (!value.trim()) return { valid: false, message: "E-posta girin" };
  if (!REGEX.EMAIL.test(value.trim())) return { valid: false, message: "Geçerli bir e-posta girin" };
  return { valid: true };
}
