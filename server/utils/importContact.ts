import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../db/prisma";

interface ContactDataJson {
  hero: {
    title: string;
    subtitle: string;
  };
  infoSection: {
    title: string;
    description: string;
  };
  contactCards: Array<{
    id: number;
    icon: string;
    title: string;
    lines: string[];
    color: string;
    order: number;
  }>;
  formSection: {
    title: string;
    buttonText: string;
    successMessage: string;
    subjects: Array<{
      value: string;
      label: string;
    }>;
  };
  mapSection: {
    title: string;
    image: string;
    venueName: string;
    venueDetails: string;
    embedUrl?: string;
  };
  updatedAt: string;
}

export async function importContactFromJson() {
  const DATA_FILE = path.join(process.cwd(), "data", "contact.json");
  
  if (!fs.existsSync(DATA_FILE)) {
    console.log("contact.json dosyası bulunamadı");
    return;
  }

  try {
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    const data: ContactDataJson = JSON.parse(content);

    console.log("Contact verileri import ediliyor...");

    // Tüm contact verilerini "main" key'i ile kaydet
    await prisma.contact_settings.upsert({
      where: { key: "main" },
      update: {
        value: data as any,
        updatedAt: new Date(),
      },
      create: {
        key: "main",
        value: data as any,
        updatedAt: new Date(),
      },
    });

    console.log("✓ Contact verileri başarıyla import edildi!");
    console.log(`  - Hero: ${data.hero.title}`);
    console.log(`  - Contact Cards: ${data.contactCards.length} adet`);
    console.log(`  - Form Subjects: ${data.formSection.subjects.length} adet`);
  } catch (error) {
    console.error("Import hatası:", error);
    throw error;
  }
}

// Script olarak çalıştırılırsa
if (import.meta.url === `file://${process.argv[1]}`) {
  importContactFromJson()
    .then(() => {
      console.log("İşlem tamamlandı.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Hata:", error);
      process.exit(1);
    });
}
