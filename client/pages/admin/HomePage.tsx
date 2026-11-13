import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { Save, Loader2, Calendar, Video, Type, Link as LinkIcon, Image } from "lucide-react";
import { useHomepage, HeroData, CounterItem, InfoBannerData } from "@/hooks/useHomepage";
import { toast } from "sonner";
import { ADMIN_SAVE_SUCCESS, ADMIN_SAVE_ERROR } from "@/lib/adminMessages";

export default function HomePage() {
  const { homepage, isLoading, updateHomepage, isUpdating } = useHomepage();

  // Local state for form (TR + _en)
  const [hero, setHero] = useState<HeroData>({
    dateText: "",
    title: "",
    subtitle: "",
    buttonText: "",
    buttonLink: "",
    videoImage: "",
    videoUrl: "",
    eventDate: "",
    dateText_en: "",
    title_en: "",
    subtitle_en: "",
    buttonText_en: "",
  });

  const [counters, setCounters] = useState<CounterItem[]>([]);
  const [infoBanner, setInfoBanner] = useState<InfoBannerData>({
    text: "",
    buttonText: "",
    buttonLink: "",
  });

  // Sync state when data loads
  useEffect(() => {
    if (homepage) {
      setHero(homepage.hero);
      setCounters(homepage.counters);
      setInfoBanner(homepage.infoBanner);
    }
  }, [homepage]);

  const handleSave = () => {
    updateHomepage(
      { hero, counters, infoBanner },
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

  // Format date for datetime-local input
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toISOString().slice(0, 16);
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Ana Sayfa Yönetimi</h1>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Ana Sayfa Yönetimi</h1>
      {/* Hero Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Type className="w-5 h-5" />
          Hero Bölümü
        </h2>
        <div className="space-y-4">
          {/* Date Text TR / EN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarih Başlığı (TR)</label>
              <input
                type="text"
                value={hero.dateText}
                onChange={(e) => setHero({ ...hero, dateText: e.target.value })}
                placeholder="9 - 12 Nisan da"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarih Başlığı (EN)</label>
              <input
                type="text"
                value={hero.dateText_en ?? ""}
                onChange={(e) => setHero({ ...hero, dateText_en: e.target.value })}
                placeholder="Apr 9-12"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">Ana başlıktan önce görünecek tarih metni</p>

          {/* Title TR / EN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ana Başlık (TR)</label>
              <input
                type="text"
                value={hero.title}
                onChange={(e) => setHero({ ...hero, title: e.target.value })}
                placeholder="BÜYÜK DÖNÜŞÜM:"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ana Başlık (EN)</label>
              <input
                type="text"
                value={hero.title_en ?? ""}
                onChange={(e) => setHero({ ...hero, title_en: e.target.value })}
                placeholder="THE GREAT TRANSFORMATION:"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Subtitle TR / EN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Başlık (TR)</label>
              <textarea
                value={hero.subtitle}
                onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                placeholder="Dayanıklı ve sürdürülebilir..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Başlık (EN)</label>
              <textarea
                value={hero.subtitle_en ?? ""}
                onChange={(e) => setHero({ ...hero, subtitle_en: e.target.value })}
                placeholder="Compass for a resilient and sustainable..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Button TR / EN + Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buton Metni (TR)</label>
              <input
                type="text"
                value={hero.buttonText}
                onChange={(e) => setHero({ ...hero, buttonText: e.target.value })}
                placeholder="Keşfet"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buton Metni (EN)</label>
              <input
                type="text"
                value={hero.buttonText_en ?? ""}
                onChange={(e) => setHero({ ...hero, buttonText_en: e.target.value })}
                placeholder="Discover"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buton Linki</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={hero.buttonLink}
                onChange={(e) => setHero({ ...hero, buttonLink: e.target.value })}
                placeholder="/uez-2026"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Video Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Video className="w-5 h-5" />
          Video Alanı
        </h2>
        <div className="space-y-4">
          {/* Video Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video Kapak Görseli URL
            </label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={hero.videoImage}
                onChange={(e) => setHero({ ...hero, videoImage: e.target.value })}
                placeholder="https://example.com/video-cover.jpg"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Video Preview */}
          {hero.videoImage && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-2">Önizleme:</p>
              <img
                src={hero.videoImage}
                alt="Video kapak"
                className="w-64 h-36 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video URL (YouTube/Vimeo)
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={hero.videoUrl}
                onChange={(e) => setHero({ ...hero, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Geri Sayım
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Etkinlik Tarihi ve Saati
          </label>
          <input
            type="datetime-local"
            value={formatDateForInput(hero.eventDate)}
            onChange={(e) => setHero({ ...hero, eventDate: new Date(e.target.value).toISOString() })}
            className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-2">
            Ana sayfadaki geri sayım bu tarihe göre hesaplanır.
          </p>
        </div>
      </div>

      {/* Counter Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Sayaçlar (Rakamlar)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {counters.map((counter, index) => (
            <div key={counter.id} className="p-4 border border-gray-200 rounded-lg space-y-2">
              <input
                type="text"
                value={counter.value}
                onChange={(e) => {
                  const newCounters = [...counters];
                  newCounters[index] = { ...counter, value: e.target.value };
                  setCounters(newCounters);
                }}
                className="w-full text-2xl font-bold text-purple-primary text-center border-b border-gray-200 focus:border-purple-primary focus:ring-0 bg-transparent"
              />
              <label className="block text-xs text-gray-500">Etiket (TR)</label>
              <input
                type="text"
                value={counter.label}
                onChange={(e) => {
                  const newCounters = [...counters];
                  newCounters[index] = { ...counter, label: e.target.value };
                  setCounters(newCounters);
                }}
                className="w-full text-sm text-gray-600 text-center border border-gray-200 rounded px-2 py-1"
              />
              <label className="block text-xs text-gray-500">Etiket (EN)</label>
              <input
                type="text"
                value={counter.label_en ?? ""}
                onChange={(e) => {
                  const newCounters = [...counters];
                  newCounters[index] = { ...counter, label_en: e.target.value };
                  setCounters(newCounters);
                }}
                placeholder="e.g. Speakers"
                className="w-full text-sm text-gray-600 text-center border border-gray-200 rounded px-2 py-1"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Info Banner</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner Metni (TR)</label>
              <textarea
                value={infoBanner.text}
                onChange={(e) => setInfoBanner({ ...infoBanner, text: e.target.value })}
                rows={3}
                placeholder="Uluslararası Ekonomi Zirvesi 2026'ya hoş geldiniz..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner Metni (EN)</label>
              <textarea
                value={infoBanner.text_en ?? ""}
                onChange={(e) => setInfoBanner({ ...infoBanner, text_en: e.target.value })}
                rows={3}
                placeholder="Welcome to International Economics Summit 2026..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buton Metni (TR)</label>
              <input
                type="text"
                value={infoBanner.buttonText}
                onChange={(e) => setInfoBanner({ ...infoBanner, buttonText: e.target.value })}
                placeholder="Kayıt Ol"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buton Metni (EN)</label>
              <input
                type="text"
                value={infoBanner.buttonText_en ?? ""}
                onChange={(e) => setInfoBanner({ ...infoBanner, buttonText_en: e.target.value })}
                placeholder="Register"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buton Linki</label>
            <input
              type="text"
              value={infoBanner.buttonLink}
              onChange={(e) => setInfoBanner({ ...infoBanner, buttonLink: e.target.value })}
              placeholder="/paketler/"
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
