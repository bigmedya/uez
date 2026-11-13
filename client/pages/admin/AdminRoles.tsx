import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { Link } from "react-router-dom";
import { Shield, Plus, Pencil, Loader2 } from "lucide-react";

const PERMISSION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  "site-ayarlari": "Site Ayarları",
  "ana-sayfa": "Ana Sayfa",
  "mobil-sayfa": "Mobil Sayfa",
  konusmacilar: "Konuşmacılar",
  program: "Program",
  sponsorlar: "Sponsorlar",
  "arsiv-aciklamalari": "Arşiv Açıklamaları",
  sss: "SSS",
  "uez-2026": "UEZ 2026",
  hakkimizda: "Hakkımızda",
  "bize-ulasin": "Bize Ulaşın",
  sozlesmeler: "Sözleşmeler",
  paketler: "Paketler",
  kayitlar: "Kayıtlar",
  "utm-analytics": "UTM Analytics",
  "stars-of-regions": "Stars of Region",
  "iletisim-mesajlari": "İletişim Mesajları",
  odemeler: "Ödemeler",
  "rol-yonetimi": "Rol Yönetimi",
  "kullanici-yonetimi": "Kullanıcı Yönetimi",
  "admin-loglari": "Admin Logları",
};

interface AdminRole {
  id: number;
  name: string;
  permissions: string[];
}

export default function AdminRoles() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/roles")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setRoles(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setRoles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-8 h-8 text-purple-600" />
          Rol Yönetimi
        </h1>
        <Link
          to="/uezyonetim/rol-yonetimi/yeni"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Rol
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {roles.length === 0 ? (
              <li className="px-6 py-12 text-center text-gray-500">
                Henüz rol tanımlanmamış. Yeni rol ekleyebilirsiniz.
              </li>
            ) : (
              roles.map((role) => (
                <li key={role.id ?? role.name} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{role.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {role.permissions.length === 0
                        ? "Yetki atanmamış"
                        : `${role.permissions.length} yetki: ${role.permissions
                            .slice(0, 5)
                            .map((p) => PERMISSION_LABELS[p] ?? p)
                            .join(", ")}${role.permissions.length > 5 ? "…" : ""}`}
                    </p>
                  </div>
                  {Number.isInteger(role.id) && role.id > 0 ? (
                    <Link
                      to={`/uezyonetim/rol-yonetimi/${role.id}`}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Düzenle
                    </Link>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      <p className="text-sm text-gray-500">
        Kullanıcılara rol atamak için veritabanında <code className="bg-gray-100 px-1 rounded">users.roleId</code> alanını kullanın. <code className="bg-gray-100 px-1 rounded">roleId</code> null olan kullanıcılar tüm sayfalara erişebilir.
      </p>
    </div>
  );
}
