import { RequestHandler } from "express";
import { getAdminUsers, setUserRole, createAdminUser } from "../db/users";

export const getAdminUsersHandler: RequestHandler = async (_req, res) => {
  try {
    const users = await getAdminUsers();
    res.json(users);
  } catch (e) {
    console.error("getAdminUsers:", e);
    res.status(500).json({ error: "Kullanıcılar yüklenemedi" });
  }
};

export const createAdminUserHandler: RequestHandler = async (req, res) => {
  const { email, password, name, roleId } = req.body;
  if (!email || typeof email !== "string" || !email.trim())
    return res.status(400).json({ error: "E-posta gerekli" });
  if (!password || typeof password !== "string" || password.length < 6)
    return res.status(400).json({ error: "Şifre en az 6 karakter olmalı" });
  const roleIdNum =
    roleId === null || roleId === undefined ? null : Number(roleId);
  if (roleIdNum !== null && (!Number.isInteger(roleIdNum) || roleIdNum < 1))
    return res.status(400).json({ error: "Geçersiz rol" });
  try {
    const user = await createAdminUser(
      email.trim(),
      password,
      typeof name === "string" ? name.trim() : undefined,
      roleIdNum
    );
    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name ?? "",
      roleId: user.roleId ?? null,
      roleName: null,
    });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2002")
      return res.status(409).json({ error: "Bu e-posta zaten kayıtlı" });
    console.error("createAdminUser:", e);
    res.status(500).json({ error: "Kullanıcı oluşturulamadı" });
  }
};

export const setUserRoleHandler: RequestHandler = async (req, res) => {
  const userId = Number(req.params.id);
  if (!userId) return res.status(400).json({ error: "Geçersiz kullanıcı id" });
  const { roleId } = req.body;
  const newRoleId =
    roleId === null || roleId === undefined
      ? null
      : Number(roleId);
  if (newRoleId !== null && (!Number.isInteger(newRoleId) || newRoleId < 1))
    return res.status(400).json({ error: "Geçersiz rol id" });
  try {
    await setUserRole(userId, newRoleId);
    res.json({ success: true, roleId: newRoleId });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2025")
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    console.error("setUserRole:", e);
    res.status(500).json({ error: "Rol atanamadı" });
  }
};
