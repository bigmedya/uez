import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { toast } from "sonner";
import { Save, Loader2, RefreshCw, Trash2, Plus } from "lucide-react";
import { ADMIN_SAVE_SUCCESS, ADMIN_SAVE_ERROR } from "@/lib/adminMessages";

interface ArchiveDescription {
  id: number;
  year: string;
  description: string;
  description_en?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ArchiveDescriptions() {
  const [archiveDescriptions, setArchiveDescriptions] = useState<ArchiveDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedArchiveYear, setSelectedArchiveYear] = useState<string>("");
  const [archiveDescription, setArchiveDescription] = useState<string>("");
  const [archiveDescriptionEn, setArchiveDescriptionEn] = useState<string>("");
  const [isNew, setIsNew] = useState(false);

  const fetchArchiveDescriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/archive");
      if (response.ok) {
        const data = await response.json();
        setArchiveDescriptions(data);
      }
    } catch (error) {
      console.error("Error fetching archive descriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchiveDescriptions();
  }, []);

  const handleYearSelect = (year: string) => {
    setSelectedArchiveYear(year);
    const existing = archiveDescriptions.find(a => a.year === year);
    if (existing) {
      setArchiveDescription(existing.description);
      setArchiveDescriptionEn(existing.description_en ?? "");
      setIsNew(false);
    } else {
      setArchiveDescription("");
      setArchiveDescriptionEn("");
      setIsNew(true);
    }
  };

  const handleSave = async () => {
    if (!selectedArchiveYear || !archiveDescription.trim()) {
      alert("Lütfen yıl ve açıklama metni giriniz.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: selectedArchiveYear,
          description: archiveDescription.trim(),
          description_en: archiveDescriptionEn.trim() || undefined,
        }),
      });

      if (response.ok) {
        const saved = await response.json();
        setArchiveDescriptions(prev => {
          const existing = prev.find(a => a.year === selectedArchiveYear);
          if (existing) {
            return prev.map(a => a.year === selectedArchiveYear ? saved : a);
          }
          return [...prev, saved].sort((a, b) => parseInt(b.year) - parseInt(a.year));
        });
        toast.success(ADMIN_SAVE_SUCCESS);
        setIsNew(false);
      } else {
        const error = await response.json();
        toast.error(error.error || ADMIN_SAVE_ERROR);
      }
    } catch (error) {
      console.error("Error saving archive description:", error);
      toast.error(ADMIN_SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (year: string) => {
    if (!confirm(`${year} yılına ait açıklamayı silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/archive/${year}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setArchiveDescriptions(prev => prev.filter(a => a.year !== year));
        if (selectedArchiveYear === year) {
          setSelectedArchiveYear("");
          setArchiveDescription("");
          setArchiveDescriptionEn("");
        }
        alert("Açıklama silindi!");
      } else {
        alert("Silme işlemi başarısız!");
      }
    } catch (error) {
      console.error("Error deleting archive description:", error);
      alert("Hata oluştu!");
    }
  };

  const handleNew = () => {
    setSelectedArchiveYear("");
    setArchiveDescription("");
    setArchiveDescriptionEn("");
    setIsNew(true);
  };

  const availableYears = ["2024", "2023", "2022", "2021", "2019", "2018", "2017", "2016", "2015"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Arşiv Açıklamaları</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchArchiveDescriptions}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </button>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Açıklama
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: List of existing descriptions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Kayıtlı Açıklamalar</h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-primary" />
              </div>
            ) : archiveDescriptions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Henüz açıklama eklenmemiş</p>
            ) : (
              <div className="space-y-2">
                {archiveDescriptions.map((arch) => (
                  <div
                    key={arch.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedArchiveYear === arch.year
                        ? "bg-purple-100 border-2 border-purple-primary"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => handleYearSelect(arch.year)}
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-800">{arch.year}</span>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {arch.description.substring(0, 50)}...
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(arch.year);
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Edit form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {isNew ? "Yeni Açıklama Ekle" : "Açıklama Düzenle"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yıl *
                </label>
                <select
                  value={selectedArchiveYear}
                  onChange={(e) => handleYearSelect(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                >
                  <option value="">Yıl seçiniz...</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {selectedArchiveYear && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {selectedArchiveYear} Yılı Açıklama Metni (TR) *
                    </label>
                    <textarea
                      value={archiveDescription}
                      onChange={(e) => setArchiveDescription(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                      placeholder="Uluslararası Ekonomi Zirvesi 2022..."
                    />
                    <p className="text-xs text-gray-500 mt-1">{archiveDescription.length} karakter</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {selectedArchiveYear} Yılı Açıklama Metni (EN)
                    </label>
                    <textarea
                      value={archiveDescriptionEn}
                      onChange={(e) => setArchiveDescriptionEn(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                      placeholder="International Economics Summit 2022..."
                    />
                    <p className="text-xs text-gray-500 mt-1">{archiveDescriptionEn.length} karakter</p>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving || !archiveDescription.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-primary text-white rounded-lg hover:bg-purple-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isNew ? "Kaydet" : "Güncelle"}
                  </button>
                </>
              )}

              {!selectedArchiveYear && (
                <div className="text-center py-12 text-gray-500">
                  <p>Yıl seçiniz veya yeni açıklama ekleyin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
