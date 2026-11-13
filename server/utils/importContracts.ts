import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../db/prisma";

interface ContractData {
  id: number;
  slug: string;
  title: string;
  content: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface ContractsJson {
  contracts: ContractData[];
}

export async function importContractsFromJson() {
  const DATA_FILE = path.join(process.cwd(), "data", "contracts.json");
  
  if (!fs.existsSync(DATA_FILE)) {
    console.log("contracts.json dosyası bulunamadı");
    return;
  }

  try {
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    const data: ContractsJson = JSON.parse(content);

    console.log(`${data.contracts.length} sözleşme import ediliyor...`);

    for (const contract of data.contracts) {
      try {
        await prisma.contract.upsert({
          where: { slug: contract.slug },
          update: {
            title: contract.title,
            content: contract.content,
            isActive: contract.isActive,
            order: contract.order,
          },
          create: {
            slug: contract.slug,
            title: contract.title,
            content: contract.content,
            isActive: contract.isActive,
            order: contract.order,
          },
        });
        console.log(`✓ ${contract.title} import edildi`);
      } catch (error) {
        console.error(`✗ ${contract.title} import edilemedi:`, error);
      }
    }

    console.log("Import tamamlandı!");
  } catch (error) {
    console.error("Import hatası:", error);
    throw error;
  }
}

// Script olarak çalıştırılırsa
if (import.meta.url === `file://${process.argv[1]}`) {
  importContractsFromJson()
    .then(() => {
      console.log("Başarıyla tamamlandı");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Hata:", error);
      process.exit(1);
    });
}

