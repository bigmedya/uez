import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { UserCog, Loader2, Plus } from "lucide-react";
import { useAdminLogger, LOG_ACTIONS, LOG_ENTITIES } from "@/hooks/useAdminLogger";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  roleId: number | null;
  roleName: string | null;
}

interface AdminRole {
  id: number;
  name: string;
  permissions: string[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const { logAction } = useAdminLogger();
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRoleId, setAddRoleId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/roles"),
      ]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch {
      setUsers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!addEmail.trim()) {
      setAddError("E-posta gerekli");
      return;
    }
    if (addPassword.length < 6) {
      setAddError("Şifre en az 6 karakter olmalı");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: addEmail.trim(),
          name: addName.trim() || undefined,
          password: addPassword,
          roleId: addRoleId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Oluşturulamadı");
      setUsers((prev) => [
        ...prev,
        {
          id: data.id,
          email: data.email,
          name: data.name ?? "",
          roleId: data.roleId ?? null,
          roleName: roles.find((r) => r.id === data.roleId)?.name ?? null,
        },
      ]);
      setShowAddForm(false);
      
      // Kullanıcı ekleme işlemini logla
      await logAction({
        action: LOG_ACTIONS.CREATE,
        entity: LOG_ENTITIES.USER,
        entityId: data.id.toString(),
        details: { 
          email: data.email,
          name: data.name,
          roleId: data.roleId
        }
      });
      setAddEmail("");
      setAddName("");
      setAddPassword("");
      setAddRoleId(null);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Kullanıcı oluşturulamadı");
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (userId: number, roleId: number | null) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncellenemedi");
      const updatedUser = users.find(u => u.id === userId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                roleId,
                roleName:
                  roleId == null
                    ? null
                    : roles.find((r) => r.id === roleId)?.name ?? null,
              }
            : u
        )
      );
      
      // Kullanıcı rol güncelleme işlemini logla
      await logAction({
        action: LOG_ACTIONS.UPDATE,
        entity: LOG_ENTITIES.USER,
        entityId: userId.toString(),
        details: { 
          email: updatedUser?.email,
          previousRoleId: updatedUser?.roleId,
          newRoleId: roleId,
          roleName: roles.find((r) => r.id === roleId)?.name
        }
      });
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Rol atanamadı");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <UserCog className="w-8 h-8 text-purple-600" />
        Kullanıcı Yönetimi
      </h1>
      <p className="text-sm text-gray-600">
        Yeni kullanıcı ekleyebilir ve her kullanıcıya rol atayabilirsiniz. <strong>Tüm yetkiler</strong> = rol yok (süper admin).
      </p>

      {showAddForm ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Yeni Kullanıcı</h2>
          <form onSubmit={handleAddUser} className="space-y-4 max-w-md">
            {addError && (
              <p className="text-sm text-red-600">{addError}</p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="ornek@uez.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="İsteğe bağlı"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şifre * (en az 6 karakter)</label>
              <input
                type="password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select
                value={addRoleId ?? ""}
                onChange={(e) => setAddRoleId(e.target.value === "" ? null : Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Tüm yetkiler</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={adding}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Ekle
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setAddError("");
                  setAddEmail("");
                  setAddName("");
                  setAddPassword("");
                  setAddRoleId(null);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
        >
          <Plus className="w-5 h-5" />
          Yeni Kullanıcı
        </button>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-posta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    Kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.name || "—"}</td>
                    <td className="px-6 py-4">
                      <select
                        value={user.roleId ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          handleRoleChange(user.id, v === "" ? null : Number(v));
                        }}
                        disabled={updatingId === user.id}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                      >
                        <option value="">Tüm yetkiler</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      {updatingId === user.id && (
                        <span className="ml-2 inline-block">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
