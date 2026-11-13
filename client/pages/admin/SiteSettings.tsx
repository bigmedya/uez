import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Save, Loader2, RefreshCw, CheckCircle } from "lucide-react";
import { ADMIN_SAVE_SUCCESS, ADMIN_SAVE_ERROR } from "@/lib/adminMessages";

interface SiteSettingsRecord {
  siteTitle: string;
  siteTitle_en?: string;
  metaDescription: string;
  metaDescription_en?: string;
  metaKeywords: string;
  metaKeywords_en?: string;
  email: string;
  phone: string;
  address: string;
  address_en?: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  instagram: string;
  facebook: string;
  copyrightText: string;
  copyrightText_en?: string;
  logoUrl: string;
  faviconUrl: string;
  liveButtonActive: boolean;
  liveButtonUrl: string;
  liveButtonUrl_en: string;
  updatedAt: string;
}

export default function SiteSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SiteSettingsRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings?forAdmin=1");
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (settings) {
      setSettings({
        ...settings,
        [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      });
      setSaved(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        toast.success(ADMIN_SAVE_SUCCESS);
        const refetch = await fetch("/api/settings?forAdmin=1");
        const next = await refetch.json();
        setSettings(next);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(ADMIN_SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Site Ayarları</h1>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-primary" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Site Ayarları</h1>
        <div className="text-center py-12 text-gray-500">
          <p>Ayarlar yüklenemedi.</p>
          <button onClick={fetchSettings} className="mt-4 text-purple-primary hover:underline">
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Site Ayarları</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SEO Ayarları */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">SEO Ayarları</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Başlığı (TR)
              </label>
              <input
                type="text"
                name="siteTitle"
                value={settings.siteTitle}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Başlığı (EN)
              </label>
              <input
                type="text"
                name="siteTitle_en"
                value={settings.siteTitle_en ?? ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description (TR)
              </label>
              <textarea
                name="metaDescription"
                value={settings.metaDescription}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description (EN)
              </label>
              <textarea
                name="metaDescription_en"
                value={settings.metaDescription_en ?? ""}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Keywords (TR)
              </label>
              <input
                type="text"
                name="metaKeywords"
                value={settings.metaKeywords}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Keywords (EN)
              </label>
              <input
                type="text"
                name="metaKeywords_en"
                value={settings.metaKeywords_en ?? ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* İletişim Bilgileri */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">İletişim Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-posta
              </label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                type="text"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adres (TR)
              </label>
              <input
                type="text"
                name="address"
                value={settings.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adres (EN)
              </label>
              <input
                type="text"
                name="address_en"
                value={settings.address_en ?? ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Sosyal Medya */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Sosyal Medya</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twitter
              </label>
              <input
                type="url"
                name="twitter"
                value={settings.twitter}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn
              </label>
              <input
                type="url"
                name="linkedin"
                value={settings.linkedin}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                YouTube
              </label>
              <input
                type="url"
                name="youtube"
                value={settings.youtube}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram
              </label>
              <input
                type="url"
                name="instagram"
                value={settings.instagram}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facebook
              </label>
              <input
                type="url"
                name="facebook"
                value={settings.facebook}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Genel Ayarlar</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Logo URL (Header'da kullanılır)
              </label>
              <input
                type="text"
                name="logoUrl"
                value={settings.logoUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Header'daki logo için URL. Tüm sayfalarda görüntülenir.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Favicon URL
              </label>
              <input
                type="text"
                name="faviconUrl"
                value={settings.faviconUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Canlı Buton Ayarları */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {t("admin.siteSettings.liveSectionTitle")}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="liveButtonActive"
                id="liveButtonActive"
                checked={settings.liveButtonActive || false}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-purple-primary focus:ring-purple-primary"
              />
              <label htmlFor="liveButtonActive" className="text-sm font-medium text-gray-700">
                {t("admin.siteSettings.liveEnable")}
              </label>
            </div>
            {settings.liveButtonActive && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("admin.siteSettings.liveTurkishUrl")}
                  </label>
                  <input
                    type="url"
                    name="liveButtonUrl"
                    value={settings.liveButtonUrl || ""}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t("admin.siteSettings.liveTurkishUrlHelp")}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("admin.siteSettings.liveEnglishUrl")}
                  </label>
                  <input
                    type="url"
                    name="liveButtonUrl_en"
                    value={settings.liveButtonUrl_en ?? ""}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t("admin.siteSettings.liveEnglishUrlHelp")}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Footer</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Copyright Metni (TR)
              </label>
              <input
                type="text"
                name="copyrightText"
                value={settings.copyrightText}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Copyright Metni (EN)
              </label>
              <input
                type="text"
                name="copyrightText_en"
                value={settings.copyrightText_en ?? ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Son güncelleme: {new Date(settings.updatedAt).toLocaleString("tr-TR")}
          </div>
          <div className="flex items-center gap-4">
            {saved && (
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                Kaydedildi
              </span>
            )}
            <button
              type="button"
              onClick={fetchSettings}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Yenile
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-purple-primary text-white rounded-lg hover:bg-purple-dark transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Kaydet
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
