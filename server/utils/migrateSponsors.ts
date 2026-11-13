import fs from "fs";
import path from "path";
import { prisma } from "../db/prisma";

interface SponsorJson {
  id: number;
  name: string;
  image: string;
  localImage: string;
  url: string;
  active: boolean;
}

interface SponsorCategoryJson {
  id: number;
  title: string;
  order: number;
  sponsors: SponsorJson[];
}

interface SponsorsDataJson {
  categories: SponsorCategoryJson[];
  updatedAt: string;
}

export async function migrateSponsorsFromJson(): Promise<void> {
  try {
    const jsonPath = path.join(process.cwd(), "data", "sponsors.json");
    
    if (!fs.existsSync(jsonPath)) {
      return;
    }

    const jsonData: SponsorsDataJson = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    // Mevcut sponsorları sil
    await prisma.sponsors.deleteMany({});
    await prisma.sponsor_categories.deleteMany({});
    
    // Kategorileri ekle
    for (const categoryJson of jsonData.categories) {
      const category = await prisma.sponsor_categories.create({
        data: {
          title: categoryJson.title,
          order: categoryJson.order,
          updatedAt: new Date(),
        },
      });

      // Sponsorları ekle
      for (let i = 0; i < categoryJson.sponsors.length; i++) {
        const sponsorJson = categoryJson.sponsors[i];
        
        await prisma.sponsors.create({
          data: {
            name: sponsorJson.name,
            logo: sponsorJson.image || null,
            localImage: sponsorJson.localImage || null,
            link: sponsorJson.url || null,
            active: sponsorJson.active !== false,
            order: i + 1,
            categoryId: category.id,
            updatedAt: new Date(),
          },
        });
      }
    }
  } catch (error) {
    console.error("Sponsor migration hatası:", error);
    throw error;
  }
}

