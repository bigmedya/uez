import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../db/prisma";

interface SpeakerJson {
  id: number;
  name: string;
  slug: string;
  title: string;
  photo: string;
  bio: string;
  year: string;
  order: number;
  wpPostId?: number;
  createdAt: string;
  updatedAt: string;
}

export async function importSpeakersFromJson() {
  const DATA_FILE = path.join(process.cwd(), "data", "speakers.json");
  
  if (!fs.existsSync(DATA_FILE)) {
    console.log("speakers.json dosyası bulunamadı");
    return;
  }

  try {
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    const speakers: SpeakerJson[] = JSON.parse(content);

    console.log(`${speakers.length} konuşmacı import ediliyor...`);

    let imported = 0;
    let skipped = 0;

    for (const speaker of speakers) {
      try {
        await prisma.speakers.upsert({
          where: { id: speaker.id },
          update: {
            name: speaker.name,
            slug: speaker.slug,
            title: speaker.title,
            image: speaker.photo,
            biography: speaker.bio,
            year: speaker.year,
            order: speaker.order,
            wpPostId: speaker.wpPostId,
            updatedAt: new Date(),
          },
          create: {
            id: speaker.id,
            name: speaker.name,
            slug: speaker.slug,
            title: speaker.title,
            image: speaker.photo,
            biography: speaker.bio,
            year: speaker.year,
            order: speaker.order,
            wpPostId: speaker.wpPostId,
            updatedAt: new Date(),
          },
        });
        imported++;
        if (imported % 10 === 0) {
          console.log(`  ${imported}/${speakers.length} konuşmacı import edildi...`);
        }
      } catch (error) {
        console.error(`✗ ${speaker.name} import edilemedi:`, error);
        skipped++;
      }
    }

    console.log(`\n✓ Import tamamlandı! ${imported} konuşmacı import edildi, ${skipped} atlandı.`);
  } catch (error) {
    console.error("Import hatası:", error);
    throw error;
  }
}

// Script olarak çalıştırılırsa
if (import.meta.url === `file://${process.argv[1]}`) {
  importSpeakersFromJson()
    .then(() => {
      console.log("İşlem tamamlandı.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Hata:", error);
      process.exit(1);
    });
}

