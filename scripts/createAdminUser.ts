import "dotenv/config";
import { prisma } from "../server/db/prisma";
import bcrypt from "bcrypt";

async function createAdminUser() {
  try {
    // Mevcut admin kullanıcısını kontrol et
    const existingUser = await prisma.users.findFirst({
      where: { email: "admin@uez.com" }
    });

    if (existingUser) {
      console.log("Admin kullanıcısı zaten mevcut:", existingUser);
      return;
    }

    // Yeni admin kullanıcısı oluştur
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const user = await prisma.users.create({
      data: {
        email: "admin@uez.com",
        password: hashedPassword,
        name: "Admin User",
        role: "admin",
        updatedAt: new Date(),
      },
    });

    console.log("Admin kullanıcısı oluşturuldu:", {
      id: user.id,
      email: user.email,
      name: user.name,
    });

  } catch (error) {
    console.error("Hata:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();