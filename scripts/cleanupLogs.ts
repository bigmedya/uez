import "dotenv/config";
import { prisma } from "../server/db/prisma";

async function cleanupLogs() {
  try {
    // VIEW loglarını sil (çok fazla spam oluşturuyor)
    const deletedCount = await prisma.admin_logs.deleteMany({
      where: {
        action: "VIEW"
      }
    });

    console.log(`${deletedCount.count} adet VIEW log silindi`);

    // Kalan logları göster
    const remainingLogs = await prisma.admin_logs.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    console.log(`Kalan log sayısı: ${remainingLogs.length}`);
    remainingLogs.forEach(log => {
      console.log(`- ${log.action} ${log.entity} by ${log.user.name || log.user.email} at ${log.createdAt}`);
    });

  } catch (error) {
    console.error("Hata:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupLogs();