import { RequestHandler } from "express";
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "../db/roles";
import { ADMIN_PERMISSION_KEYS } from "../../shared/api";

export const getRolesHandler: RequestHandler = async (_req, res) => {
  try {
    const roles = await getAllRoles();
    res.json(
      roles.map((r) => ({
        id: r.id,
        name: r.name,
        permissions: (r.permissions as string[]) ?? [],
      }))
    );
  } catch (e) {
    console.error("getRoles:", e);
    res.json([]);
  }
};

export const getRoleHandler: RequestHandler = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Geçersiz id" });
  try {
    const role = await getRoleById(id);
    if (!role) return res.status(404).json({ error: "Rol bulunamadı" });
    res.json({
      id: role.id,
      name: role.name,
      permissions: (role.permissions as string[]) ?? [],
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Rol yüklenemedi" });
  }
};

export const getPermissionKeysHandler: RequestHandler = (_req, res) => {
  res.json(ADMIN_PERMISSION_KEYS);
};

export const createRoleHandler: RequestHandler = async (req, res) => {
  const { name, permissions } = req.body;
  if (!name || typeof name !== "string" || !name.trim())
    return res.status(400).json({ error: "Rol adı gerekli" });
  const list = Array.isArray(permissions)
    ? permissions.filter((p: unknown) => typeof p === "string")
    : [];
  try {
    const role = await createRole(name.trim(), list);
    res.status(201).json({
      id: role.id,
      name: role.name,
      permissions: (role.permissions as string[]) ?? [],
    });
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err?.code === "P2002")
      return res.status(409).json({ error: "Bu isimde rol zaten var" });
    if (err?.code === "P2021" || err?.message?.includes("exist") || err?.message?.includes("admin_roles"))
      return res.status(503).json({
        error: "Rol tablosu bulunamadı. Önce veritabanında migration çalıştırın: pnpm prisma migrate deploy",
      });
    console.error(e);
    res.status(500).json({ error: "Rol oluşturulamadı" });
  }
};

export const updateRoleHandler: RequestHandler = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Geçersiz id" });
  const { name, permissions } = req.body;
  const data: { name?: string; permissions?: string[] } = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (Array.isArray(permissions))
    data.permissions = permissions.filter((p: unknown) => typeof p === "string");
  try {
    const role = await updateRole(id, data);
    res.json({
      id: role.id,
      name: role.name,
      permissions: (role.permissions as string[]) ?? [],
    });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "P2002")
      return res.status(409).json({ error: "Bu isimde rol zaten var" });
    if (err?.code === "P2025")
      return res.status(404).json({ error: "Rol bulunamadı" });
    console.error(e);
    res.status(500).json({ error: "Rol güncellenemedi" });
  }
};

export const deleteRoleHandler: RequestHandler = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Geçersiz id" });
  try {
    await deleteRole(id);
    res.status(204).send();
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2025")
      return res.status(404).json({ error: "Rol bulunamadı" });
    console.error(e);
    res.status(500).json({ error: "Rol silinemedi" });
  }
};
