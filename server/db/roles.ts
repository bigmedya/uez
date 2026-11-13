import { prisma } from "./prisma";

export async function getAllRoles() {
  return await prisma.admin_roles.findMany({ orderBy: { name: "asc" } });
}

export async function getRoleById(id: number) {
  return await prisma.admin_roles.findUnique({ where: { id } });
}

export async function createRole(name: string, permissions: string[] = []) {
  return await prisma.admin_roles.create({
    data: {
      name,
      permissions: permissions as unknown as object,
      updatedAt: new Date(),
    },
  });
}

export async function updateRole(
  id: number,
  data: { name?: string; permissions?: string[] }
) {
  const payload: { name?: string; permissions?: object; updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (data.name !== undefined) payload.name = data.name;
  if (data.permissions !== undefined)
    payload.permissions = data.permissions as unknown as object;
  return await prisma.admin_roles.update({ where: { id }, data: payload });
}

export async function deleteRole(id: number) {
  await prisma.admin_roles.delete({ where: { id } });
}
