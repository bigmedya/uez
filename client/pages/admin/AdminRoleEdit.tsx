import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { ADMIN_PERMISSION_KEYS } from "@shared/api";

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

export default function AdminRoleEdit() {
  const { id } = useParams<"id">();
  const navigate = useNavigate();
  const isNew = id === "yeni" || id === undefined;
  const numId = id != null && id !== "yeni" ? Number(id) : NaN;
  const isValidId = !isNew && Number.isInteger(numId) && numId > 0;

  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew || !isValidId) {
      setLoading(false);
      return;
    }
    fetch(`/api/admin/roles/${numId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Rol bulunamadı");
        return res.json();
      })
      .then((data) => {
        setName(data.name ?? "");
        setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
      })
      .catch(() => setError("Rol yüklenemedi"))
      .finally(() => setLoading(false));
  }, [id, isNew, isValidId, numId]);

  const togglePermission = (key: string) => {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Rol adı gerekli");
      return;
    }
    setSaving(true);
    try {
      const body = JSON.stringify({ name: name.trim(), permissions });
      if (isNew) {
        const res = await fetch("/api/admin/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Oluşturulamadı");
        navigate("/uezyonetim/rol-yonetimi", { replace: true });
      } else {
        if (!isValidId) {
          setError("Geçersiz rol adresi. Listeye dönüp tekrar deneyin.");
          setSaving(false);
          return;
        }
        const res = await fetch(`/api/admin/roles/${numId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Güncellenemedi");
        navigate("/uezyonetim/rol-yonetimi", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!isNew && !isValidId) {
    return (
      <div className="space-y-6">
        <Link
          to="/uezyonetim/rol-yonetimi"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Rol listesine dön
        </Link>
        <p className="text-red-600">Geçersiz rol adresi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        to="/uezyonetim/rol-yonetimi"
        className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700"
      >
        <ArrowLeft className="w-5 h-5" />
        Rol listesine dön
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">
        {isNew ? "Yeni Rol" : "Rol Düzenle"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="role-name" className="block text-sm font-medium text-gray-700 mb-1">
            Rol adı
          </label>
          <input
            id="role-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Örn: Editör"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Sayfa yetkileri
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPermissions([...ADMIN_PERMISSION_KEYS])}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Tümünü seç
              </button>
              <span className="text-gray-400">|</span>
              <button
                type="button"
                onClick={() => setPermissions([])}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Temizle
              </button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-2 max-h-80 overflow-y-auto">
            {ADMIN_PERMISSION_KEYS.map((key) => (
              <label
                key={key}
                className="flex items-center gap-3 cursor-pointer hover:bg-white/60 rounded px-2 py-1.5"
              >
                <input
                  type="checkbox"
                  checked={permissions.includes(key)}
                  onChange={() => togglePermission(key)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-800">
                  {PERMISSION_LABELS[key] ?? key}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isNew ? "Oluştur" : "Kaydet"}
          </button>
          <Link
            to="/uezyonetim/rol-yonetimi"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            İptal
          </Link>
        </div>
      </form>
    </div>
  );
}
