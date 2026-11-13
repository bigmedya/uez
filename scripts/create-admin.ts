import "dotenv/config";
import { createUser } from "../server/db/users";
import { prisma } from "../server/db/prisma";

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.users.findFirst({
      where: { email: "admin@uez.com" }
    });

    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Create admin user
    const admin = await createUser(
      "admin@uez.com", 
      "admin123", 
      "Admin", 
      "admin"
    );

    console.log("Admin user created:", {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    });
  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();