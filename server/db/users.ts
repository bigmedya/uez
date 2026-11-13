import { prisma } from "./prisma";
import bcrypt from "bcrypt";

export async function getUserByEmail(email: string) {
  return await prisma.users.findUnique({
    where: { email },
  });
}

/** Şifre kontrolü için: sadece gerekli alanları seçer (roleId kullanılmaz) */
async function getUserForLogin(identifier: string) {
  return await prisma.users.findFirst({
    where: {
      OR: [{ email: identifier }, { name: identifier }],
    },
    select: { id: true, email: true, password: true, name: true },
  });
}

/** Rol ve yetkilerle kullanıcı getirir (roleId ve admin_roles varsa) */
export async function getUserByEmailOrName(identifier: string) {
  const userByEmail = await prisma.users.findUnique({
    where: { email: identifier },
    include: { admin_role: true },
  });
  if (userByEmail) return userByEmail;
  const userByName = await prisma.users.findFirst({
    where: { name: identifier },
    include: { admin_role: true },
  });
  return userByName || null;
}

export async function verifyUserPassword(identifier: string, password: string): Promise<boolean> {
  const user = await getUserForLogin(identifier);
  if (!user) return false;
  return await bcrypt.compare(password, user.password);
}

export async function createUser(email: string, password: string, name?: string, role: "admin" | "editor" = "admin") {
  const hashedPassword = await bcrypt.hash(password, 10);

  return await prisma.users.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
      updatedAt: new Date(),
    },
  });
}

/** Admin panel: yeni kullanıcı oluştur (rol atanabilir) */
export async function createAdminUser(
  email: string,
  password: string,
  name?: string,
  roleId?: number | null
) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await prisma.users.create({
    data: {
      email,
      password: hashedPassword,
      name: name?.trim() || null,
      role: "admin",
      roleId: roleId ?? null,
      updatedAt: new Date(),
    },
  });
}

/** Admin panel: tüm kullanıcıları rol bilgisiyle listele (şifre yok) */
export async function getAdminUsers(): Promise<{ id: number; email: string; name: string; roleId: number | null; roleName: string | null }[]> {
  try {
    const users = await prisma.users.findMany({
      orderBy: { email: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        admin_role: { select: { name: true } },
      },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name ?? "",
      roleId: u.roleId ?? null,
      roleName: u.admin_role?.name ?? null,
    }));
  } catch {
    const users = await prisma.users.findMany({
      orderBy: { email: "asc" },
      select: { id: true, email: true, name: true, roleId: true },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name ?? "",
      roleId: u.roleId ?? null,
      roleName: null,
    }));
  }
}

/** Kullanıcının rolünü güncelle (roleId null = tüm yetkiler) */
export async function setUserRole(userId: number, roleId: number | null) {
  return await prisma.users.update({
    where: { id: userId },
    data: { roleId, updatedAt: new Date() },
  });
}
