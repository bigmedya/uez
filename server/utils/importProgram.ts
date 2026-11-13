import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../db/prisma";

interface ScheduleItemJson {
  id: number;
  time: string;
  title: string;
  note?: string;
  speakerId?: number;
  speakerIds?: number[];
  wpSpeakerId?: string;
  wpSpeakerIds?: string[];
  isMultiSpeaker: boolean;
  order: number;
}

interface ScheduleDayJson {
  id: number;
  title: string;
  slug: string;
  categoryId: number;
  scheduleItems: ScheduleItemJson[];
  order: number;
  wpPostId?: number;
}

interface ScheduleCategoryJson {
  id: number;
  name: string;
  slug: string;
  order: number;
}

interface ProgramDataJson {
  categories: ScheduleCategoryJson[];
  days: ScheduleDayJson[];
  updatedAt: string;
}

export async function importProgramFromJson() {
  const DATA_FILE = path.join(process.cwd(), "data", "program.json");
  
  if (!fs.existsSync(DATA_FILE)) {
    console.log("program.json dosyası bulunamadı");
    return;
  }

  try {
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    const data: ProgramDataJson = JSON.parse(content);

    console.log(`${data.categories.length} kategori import ediliyor...`);

    // Import categories
    for (const category of data.categories) {
      try {
        await prisma.program_categories.upsert({
          where: { id: category.id },
          update: {
            name: category.name,
            slug: category.slug,
            order: category.order,
          },
          create: {
            id: category.id,
            name: category.name,
            slug: category.slug,
            order: category.order,
          },
        });
        console.log(`✓ Kategori: ${category.name}`);
      } catch (error) {
        console.error(`✗ Kategori ${category.name} import edilemedi:`, error);
      }
    }

    console.log(`\n${data.days.length} gün import ediliyor...`);

    // Import days and items
    let importedDays = 0;
    let importedItems = 0;

    for (const day of data.days) {
      try {
        // First, delete existing day and its items if exists
        await prisma.program_items.deleteMany({
          where: { dayId: day.id },
        });
        await prisma.program_days.delete({
          where: { id: day.id },
        }).catch(() => {}); // Ignore if doesn't exist

        // Create day with items
        await prisma.program_days.create({
          data: {
            id: day.id,
            title: day.title,
            slug: day.slug,
            categoryId: day.categoryId,
            label: day.title,
            date: new Date(), // Default date
            active: true,
            order: day.order,
            wpPostId: day.wpPostId,
            updatedAt: new Date(),
            program_items: {
              create: day.scheduleItems.map((item) => ({
                time: item.time,
                title: item.title,
                note: item.note || null,
                isMultiSpeaker: item.isMultiSpeaker,
                wpSpeakerId: item.wpSpeakerId || null,
                wpSpeakerIds: item.wpSpeakerIds || null,
                speakers: item.speakerIds || [],
                order: item.order,
                updatedAt: new Date(),
              })),
            },
          },
        });

        importedDays++;
        importedItems += day.scheduleItems.length;

        if (importedDays % 10 === 0) {
          console.log(`  ${importedDays}/${data.days.length} gün import edildi...`);
        }
      } catch (error) {
        console.error(`✗ Gün ${day.title} import edilemedi:`, error);
      }
    }

    console.log(`\n✓ Import tamamlandı! ${importedDays} gün ve ${importedItems} item import edildi.`);
  } catch (error) {
    console.error("Import hatası:", error);
    throw error;
  }
}

// Script olarak çalıştırılırsa
if (import.meta.url === `file://${process.argv[1]}`) {
  importProgramFromJson()
    .then(() => {
      console.log("İşlem tamamlandı.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Hata:", error);
      process.exit(1);
    });
}

