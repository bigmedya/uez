import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { Save, Plus, Trash2, GripVertical, Loader2, Link as LinkIcon } from "lucide-react";
import { useMobilePage, QuickAction, SocialMedia } from "@/hooks/useMobilePage";
import { toast } from "sonner";
import { ADMIN_SAVE_SUCCESS, ADMIN_SAVE_ERROR } from "@/lib/adminMessages";
import * as Icons from "lucide-react";

const iconOptions = [
  { value: "Mic", label: "Mikrofon (Konuşmacılar)" },
  { value: "CalendarDays", label: "Takvim (Program)" },
  { value: "GraduationCap", label: "Mezuniyet Şapkası (Akademi)" },
  { value: "MapPin", label: "Konum İşareti" },
  { value: "LayoutGrid", label: "Grid (Kroki)" },
  { value: "Handshake", label: "El Sıkışma (Sponsorlar)" },
  { value: "HelpCircle", label: "Yardım (S.S.S.)" },
  { value: "Ticket", label: "Bilet" },
  { value: "Mail", label: "Mail" },
  { value: "Navigation", label: "Navigasyon" },
];

export default function AdminMobilePage() {
  const { data, isLoading, updateData, isUpdating } = useMobilePage();

  const [formData, setFormData] = useState({
    eventDate: "",
    eventDate_en: "",
    eventTime: "",
    eventTime_en: "",
    venueName: "",
    venueName_en: "",
    venueDetails: "",
    venueDetails_en: "",
    locationLink: "",
    logoUrl: "",
    ticketButtonText: "",
    ticketButtonText_en: "",
    ticketButtonLink: "",
    aboutText: "",
    aboutText_en: "",
    aboutLink: "",
    hostName: "",
    hostName_en: "",
    hostLogo: "",
  });

  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([]);
  const [editingAction, setEditingAction] = useState<QuickAction | null>(null);
  const [actionForm, setActionForm] = useState({
    title: "",
    title_en: "",
    icon: "Mic",
    href: "",
    active: true,
    description: "",
    description_en: "",
  });

  useEffect(() => {
    if (data) {
      setFormData({
        eventDate: data.eventDate || "",
        eventDate_en: data.eventDate_en || "",
        eventTime: data.eventTime || "",
        eventTime_en: data.eventTime_en || "",
        venueName: data.venueName || "",
        venueName_en: data.venueName_en || "",
        venueDetails: data.venueDetails || "",
        venueDetails_en: data.venueDetails_en || "",
        locationLink: data.locationLink || "",
        logoUrl: data.logoUrl || "",
        ticketButtonText: data.ticketButtonText || "",
        ticketButtonText_en: data.ticketButtonText_en || "",
        ticketButtonLink: data.ticketButtonLink || "",
        aboutText: data.aboutText || "",
        aboutText_en: data.aboutText_en || "",
        aboutLink: data.aboutLink || "",
        hostName: data.hostName || "",
        hostName_en: data.hostName_en || "",
        hostLogo: data.hostLogo || "",
      });
      setQuickActions([...data.quickActions].sort((a, b) => a.order - b.order));
      setSocialMedia([...data.socialMedia]);
    }
  }, [data]);

  const handleSave = () => {
    updateData(
      {
        ...formData,
        quickActions,
        socialMedia,
      },
      {
        onSuccess: () => {
          toast.success(ADMIN_SAVE_SUCCESS);
        },
        onError: () => {
          toast.error(ADMIN_SAVE_ERROR);
        },
      }
    );
  };

  const handleAddAction = () => {
    if (!actionForm.title.trim() || !actionForm.href.trim()) {
      toast.error("Başlık ve link zorunludur");
      return;
    }
    const newId = Math.max(0, ...quickActions.map((a) => a.id)) + 1;
    const newAction: QuickAction = {
      id: newId,
      key: actionForm.title.toLowerCase().replace(/\s+/g, "-"),
      title: actionForm.title,
      title_en: actionForm.title_en || undefined,
      icon: actionForm.icon,
      href: actionForm.href,
      order: quickActions.length + 1,
      active: actionForm.active,
      description: actionForm.description || "",
      description_en: actionForm.description_en || undefined,
    };
    setQuickActions([...quickActions, newAction]);
    setActionForm({ title: "", title_en: "", icon: "Mic", href: "", active: true, description: "", description_en: "" });
    toast.success("Kısayol eklendi");
  };

  const handleDeleteAction = (id: number) => {
    if (!confirm("Bu kısayolu silmek istediğinizden emin misiniz?")) return;
    setQuickActions(quickActions.filter((a) => a.id !== id));
    toast.success("Kısayol silindi");
  };

  const handleToggleAction = (id: number) => {
    setQuickActions(
      quickActions.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const handleUpdateAction = (id: number, updates: Partial<QuickAction>) => {
    setQuickActions(quickActions.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const handleReorderActions = (fromIndex: number, toIndex: number) => {
    const newActions = [...quickActions];
    const [moved] = newActions.splice(fromIndex, 1);
    newActions.splice(toIndex, 0, moved);
    setQuickActions(newActions.map((a, idx) => ({ ...a, order: idx + 1 })));
  };

  const handleSocialMediaChange = (platform: SocialMedia["platform"], url: string, active: boolean) => {
    setSocialMedia(
      socialMedia.map((sm) =>
        sm.platform === platform ? { ...sm, url, active } : sm
      )
    );
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Mobil Sayfa Yönetimi</h1>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mobil Sayfa Yönetimi</h1>

      {/* Event Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Etkinlik Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik Tarihi (TR)</label>
            <input
              type="text"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              placeholder="12 Kasım - 14 Kasım"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik Tarihi (EN)</label>
            <input
              type="text"
              value={formData.eventDate_en}
              onChange={(e) => setFormData({ ...formData, eventDate_en: e.target.value })}
              placeholder="Nov 12 - 14"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik Saati (TR)</label>
            <input
              type="text"
              value={formData.eventTime}
              onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
              placeholder="08:00 - 23:55 (UTC+03:00)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik Saati (EN)</label>
            <input
              type="text"
              value={formData.eventTime_en}
              onChange={(e) => setFormData({ ...formData, eventTime_en: e.target.value })}
              placeholder="08:00 - 23:55 (UTC+03:00)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mekan Adı (TR)</label>
            <input
              type="text"
              value={formData.venueName}
              onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
              placeholder="Haliç Kongre Merkezi"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mekan Adı (EN)</label>
            <input
              type="text"
              value={formData.venueName_en}
              onChange={(e) => setFormData({ ...formData, venueName_en: e.target.value })}
              placeholder="Venue Name"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mekan Detayları (TR)</label>
            <input
              type="text"
              value={formData.venueDetails}
              onChange={(e) => setFormData({ ...formData, venueDetails: e.target.value })}
              placeholder="Sütlüce Mah., Karaağaç Cad..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mekan Detayları (EN)</label>
            <input
              type="text"
              value={formData.venueDetails_en}
              onChange={(e) => setFormData({ ...formData, venueDetails_en: e.target.value })}
              placeholder="Address, city, country"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lokasyon Linki (Yol Tarifi)
            </label>
            <input
              type="text"
              value={formData.locationLink}
              onChange={(e) => setFormData({ ...formData, locationLink: e.target.value })}
              placeholder="https://maps.google.com/?q=... veya https://maps.app.goo.gl/..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Konum kartındaki navigasyon butonuna tıklandığında açılacak link. Boş bırakılırsa otomatik Google Maps linki oluşturulur.
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo URL (Mobil Sayfa)
            </label>
            <input
              type="text"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="https://... (Boş bırakılırsa Site Ayarları'ndaki logo kullanılır)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mobil sayfadaki etkinlik kartında gösterilecek logo. Boş bırakılırsa Site Ayarları'ndaki ana logo kullanılır.
            </p>
          </div>
        </div>
      </div>

      {/* Ticket Button */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Bilet Butonu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buton Metni (TR)</label>
            <input
              type="text"
              value={formData.ticketButtonText}
              onChange={(e) => setFormData({ ...formData, ticketButtonText: e.target.value })}
              placeholder="Bilet Al"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buton Metni (EN)</label>
            <input
              type="text"
              value={formData.ticketButtonText_en}
              onChange={(e) => setFormData({ ...formData, ticketButtonText_en: e.target.value })}
              placeholder="Get Ticket"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buton Linki</label>
            <input
              type="text"
              value={formData.ticketButtonLink}
              onChange={(e) => setFormData({ ...formData, ticketButtonLink: e.target.value })}
              placeholder="/paketler/"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Kısayollar</h2>
        
        {/* Add New Action */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Yeni Kısayol Ekle</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              value={actionForm.title}
              onChange={(e) => setActionForm({ ...actionForm, title: e.target.value })}
              placeholder="Başlık (TR)"
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
            <input
              type="text"
              value={actionForm.title_en}
              onChange={(e) => setActionForm({ ...actionForm, title_en: e.target.value })}
              placeholder="Başlık (EN)"
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
            <select
              value={actionForm.icon}
              onChange={(e) => setActionForm({ ...actionForm, icon: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            >
              {iconOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={actionForm.href}
              onChange={(e) => setActionForm({ ...actionForm, href: e.target.value })}
              placeholder="Link (/paketler/)"
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
            <button
              onClick={handleAddAction}
              className="md:col-span-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ekle
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Açıklama TR (isteğe bağlı)</label>
              <textarea
                value={actionForm.description}
                onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
                rows={2}
                placeholder="Mobilde açılan panelde gösterilecek metin..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Açıklama EN (isteğe bağlı)</label>
              <textarea
                value={actionForm.description_en}
                onChange={(e) => setActionForm({ ...actionForm, description_en: e.target.value })}
                rows={2}
                placeholder="Description shown in mobile panel..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Actions List */}
        <div className="space-y-2">
          {quickActions.map((action, index) => (
            <div
              key={action.id}
              className="border border-gray-200 rounded-lg hover:bg-gray-50 overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3">
                <GripVertical className="w-5 h-5 text-gray-400 cursor-move shrink-0" />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={action.title}
                    onChange={(e) => handleUpdateAction(action.id, { title: e.target.value })}
                    className="px-3 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    placeholder="Başlık TR"
                  />
                  <input
                    type="text"
                    value={action.title_en ?? ""}
                    onChange={(e) => handleUpdateAction(action.id, { title_en: e.target.value || undefined })}
                    className="px-3 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    placeholder="Başlık EN"
                  />
                  <select
                    value={action.icon}
                    onChange={(e) => handleUpdateAction(action.id, { icon: e.target.value })}
                    className="px-3 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                  >
                    {iconOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={action.href}
                    onChange={(e) => handleUpdateAction(action.id, { href: e.target.value })}
                    className="px-3 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    placeholder="Link"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={action.active}
                        onChange={() => handleToggleAction(action.id)}
                        className="rounded"
                      />
                      Aktif
                    </label>
                    <button
                      onClick={() => handleDeleteAction(action.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 px-3 pb-3 pt-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Açıklama TR (mobilde açılan panelde gösterilir)</label>
                  <textarea
                    value={action.description ?? ""}
                    onChange={(e) => handleUpdateAction(action.id, { description: e.target.value })}
                    rows={2}
                    placeholder="Nasıl Gidilir?, Kroki, S.S.S. vb. için metin..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Açıklama EN</label>
                  <textarea
                    value={action.description_en ?? ""}
                    onChange={(e) => handleUpdateAction(action.id, { description_en: e.target.value || undefined })}
                    rows={2}
                    placeholder="Description for panel..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Hakkında Bölümü</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hakkında Metni (TR)</label>
            <textarea
              value={formData.aboutText}
              onChange={(e) => setFormData({ ...formData, aboutText: e.target.value })}
              rows={4}
              placeholder="Uluslararası Ekonomi Zirvesi..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hakkında Metni (EN)</label>
            <textarea
              value={formData.aboutText_en}
              onChange={(e) => setFormData({ ...formData, aboutText_en: e.target.value })}
              rows={4}
              placeholder="International Economy Summit..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Devamını Oku Linki</label>
            <input
              type="text"
              value={formData.aboutLink}
              onChange={(e) => setFormData({ ...formData, aboutLink: e.target.value })}
              placeholder="/hakkimizda"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Sosyal Medya</h2>
        <div className="space-y-3">
          {socialMedia.map((sm) => (
            <div key={sm.platform} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <div className="w-24 text-sm font-medium capitalize">{sm.platform}</div>
              <input
                type="text"
                value={sm.url}
                onChange={(e) => handleSocialMediaChange(sm.platform, e.target.value, sm.active)}
                placeholder="https://..."
                className="flex-1 px-3 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sm.active}
                  onChange={(e) => handleSocialMediaChange(sm.platform, sm.url, e.target.checked)}
                  className="rounded"
                />
                Aktif
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Host Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Ev Sahibi Bilgisi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ev Sahibi Adı (TR)</label>
            <input
              type="text"
              value={formData.hostName}
              onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
              placeholder="Kapital Media Group"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ev Sahibi Adı (EN)</label>
            <input
              type="text"
              value={formData.hostName_en}
              onChange={(e) => setFormData({ ...formData, hostName_en: e.target.value })}
              placeholder="Host Name"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ev Sahibi Logo URL</label>
            <input
              type="text"
              value={formData.hostLogo}
              onChange={(e) => setFormData({ ...formData, hostLogo: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isUpdating}
          className="flex items-center gap-2 px-6 py-3 bg-purple-primary text-white rounded-lg hover:bg-purple-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Değişiklikleri Kaydet
        </button>
      </div>
    </div>
  );
}
