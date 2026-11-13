import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

const CARD_FIELDS = ["kartNumarasi", "cvc", "sonKullanma"] as const;

function getKey(): Buffer {
  const secret = process.env.CARD_ENCRYPTION_SECRET;
  if (!secret) throw new Error("CARD_ENCRYPTION_SECRET must be configured");
  return crypto.createHash("sha256").update(secret, "utf8").digest();
}

function encrypt(value: string, key: Buffer): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, encrypted]).toString("base64");
}

function decrypt(encrypted: string, key: Buffer): string | null {
  try {
    const buf = Buffer.from(encrypted, "base64");
    if (buf.length <= IV_LENGTH) return null;
    const iv = buf.subarray(0, IV_LENGTH);
    const data = buf.subarray(IV_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    return decipher.update(data).toString("utf8") + decipher.final("utf8");
  } catch {
    return null;
  }
}

/** form_responses.data içindeki kart bilgilerini AES-256 ile şifreler (kayıt öncesi) */
export function encryptCardFields(data: Record<string, unknown>): Record<string, unknown> {
  const key = getKey();
  const out = { ...data };
  for (const keyName of CARD_FIELDS) {
    const val = out[keyName];
    if (val != null && typeof val === "string" && val.length > 0) {
      out[keyName] = encrypt(val, key);
    }
  }
  return out;
}

/** form_responses.data içindeki şifreli kart alanlarını çözer (okuma sonrası) */
export function decryptCardFields(data: Record<string, unknown>): Record<string, unknown> {
  const key = getKey();
  const out = { ...data };
  for (const keyName of CARD_FIELDS) {
    const val = out[keyName];
    if (val != null && typeof val === "string") {
      const decrypted = decrypt(val, key);
      if (decrypted !== null) out[keyName] = decrypted;
    }
  }
  return out;
}
