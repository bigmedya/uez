/**
 * iyzico .env bilgilerini ve API bağlantısını kontrol eder.
 * Çalıştırma: npx tsx scripts/check-iyzico.ts
 */
import "dotenv/config";
import { createRequire } from "module";

const requireModule = createRequire(import.meta.url);
const Iyzipay = requireModule("iyzipay");

const apiKey = process.env.IYZICO_API_KEY;
const secretKey = process.env.IYZICO_SECRET_KEY;
const baseUrl = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

console.log("--- iyzico ortam değişkenleri ---");
console.log("IYZICO_API_KEY:", apiKey ? `${apiKey.slice(0, 8)}...` : "(yok)");
console.log("IYZICO_SECRET_KEY:", secretKey ? "***tanımlı***" : "(yok)");
console.log("IYZICO_BASE_URL:", baseUrl);
console.log("");

if (!apiKey || !secretKey) {
  console.error("Hata: IYZICO_API_KEY ve IYZICO_SECRET_KEY .env içinde tanımlı olmalı.");
  process.exit(1);
}

const iyzipay = new Iyzipay({
  apiKey,
  secretKey,
  uri: baseUrl,
});

iyzipay.apiTest.retrieve({}, (err: Error | null, result: { status?: string; locale?: string }) => {
  if (err) {
    console.error("iyzico API test hatası:", err.message);
    process.exit(1);
  }
  if (result?.status === "success") {
    console.log("iyzico API test: BAŞARILI (status:", result.status + ")");
    process.exit(0);
  }
  console.error("iyzico API yanıtı beklenmedik:", result);
  process.exit(1);
});
