/**
 * Bildirim geçmişi DB testi.
 * Çalıştır: npx tsx scripts/test-notification-history.ts
 */
import "dotenv/config";
import { saveNotificationToHistory, getNotificationHistory } from "../server/db/notification-history";

async function main() {
  console.log("=== Bildirim geçmişi testi ===\n");

  try {
    console.log("1. Kayıt ekleniyor...");
    const created = await saveNotificationToHistory({
      title: "Test Kayıt",
      body: "Script ile eklenen test bildirimi",
      url: "/m",
      sentCount: 5,
      isTest: true,
    });
    console.log("   OK - Kayıt eklendi, id:", created.id);

    console.log("\n2. Geçmiş listeleniyor...");
    const list = await getNotificationHistory(10);
    console.log("   Toplam kayıt:", list.length);
    list.forEach((row, i) => {
      console.log(`   ${i + 1}. id=${row.id} title="${row.title.slice(0, 30)}..." sentCount=${row.sentCount}`);
    });

    console.log("\n=== Test başarılı ===");
  } catch (err) {
    console.error("\n=== HATA ===");
    console.error(err);
    if (err instanceof Error) {
      console.error("Message:", err.message);
      console.error("Stack:", err.stack);
    }
    process.exit(1);
  }
  process.exit(0);
}

main();
