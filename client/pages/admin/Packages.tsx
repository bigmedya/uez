import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { ADMIN_SAVE_SUCCESS } from "@/lib/adminMessages";
import { useAdminLogger, LOG_ACTIONS, LOG_ENTITIES } from "@/hooks/useAdminLogger";
import { formatPriceWithCurrency } from "@/utils/registrationFormatters";

interface Package {
  id: number;
  packageId: string;
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  price: string;
  features: string[];
  features_en?: string[];
  active: boolean;
  order: number;
}

export default function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const { logAction } = useAdminLogger();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/packages");
      if (response.ok) {
        const data = await response.json();
        setPackages(data || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Paketler alınırken bir hata oluştu" }));
        setError(errorData.error || "Paketler alınırken bir hata oluştu");
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      setError("Paketler alınırken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu paketi silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const packageToDelete = packages.find(p => p.id === id);
      const response = await fetch(`/api/packages/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchPackages();
        
        // Paket silme işlemini logla
        await logAction({
          action: LOG_ACTIONS.DELETE,
          entity: LOG_ENTITIES.PACKAGES,
          entityId: id.toString(),
          details: { 
            packageTitle: packageToDelete?.title,
            packageId: packageToDelete?.packageId
          }
        });
      }
    } catch (error) {
      console.error("Error deleting package:", error);
    }
  };

  const handleToggleActive = async (pkg: Package) => {
    try {
      const response = await fetch(`/api/packages/${pkg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pkg, active: !pkg.active }),
      });
      if (response.ok) {
        fetchPackages();
      }
    } catch (error) {
      console.error("Error updating package:", error);
    }
  };

  const handleSave = async (pkg: Package) => {
    try {
      const url = pkg.id ? `/api/packages/${pkg.id}` : "/api/packages";
      const method = pkg.id ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pkg),
      });

      if (response.ok) {
        fetchPackages();
        setIsModalOpen(false);
        setEditingPackage(null);
        toast.success(ADMIN_SAVE_SUCCESS);
      }
    } catch (error) {
      console.error("Error saving package:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Paket Yönetimi</h1>
        <button
          onClick={() => {
            setEditingPackage({
              id: 0,
              packageId: "",
              title: "",
              title_en: "",
              subtitle: "",
              subtitle_en: "",
              price: "",
              features: [],
              features_en: [],
              active: true,
              order: packages.length + 1,
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Paket
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button
            onClick={fetchPackages}
            className="ml-4 text-red-900 underline hover:text-red-700"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {packages.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg mb-2">Henüz paket bulunmuyor</p>
            <p className="text-sm">Yeni paket eklemek için yukarıdaki "Yeni Paket" butonuna tıklayın.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paket ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlık</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alt Başlık</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fiyat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Özellikler</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sıra</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-800">{pkg.packageId}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{pkg.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{pkg.subtitle || "-"}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{formatPriceWithCurrency(pkg.price) || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{pkg.features.length} özellik</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{pkg.order}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        pkg.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {pkg.active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleToggleActive(pkg)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={pkg.active ? "Pasif Yap" : "Aktif Yap"}
                      >
                        {pkg.active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingPackage(pkg);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-purple-primary hover:bg-purple-50 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingPackage && (
        <PackageModal
          pkg={editingPackage}
          onSave={handleSave}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPackage(null);
          }}
        />
      )}
    </div>
  );
}

function PackageModal({
  pkg,
  onSave,
  onClose,
}: {
  pkg: Package;
  onSave: (pkg: Package) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Package>({
    ...pkg,
    title_en: pkg.title_en ?? "",
    subtitle_en: pkg.subtitle_en ?? "",
    features_en: pkg.features_en ?? [],
  });

  // Özellikler: tek listede TR + EN (mevcut maddeyi çevir)
  const featureRows = formData.features.map((tr, i) => ({
    tr,
    en: (formData.features_en || [])[i] ?? "",
  }));

  const updateFeatureRow = (index: number, field: "tr" | "en", value: string) => {
    if (field === "tr") {
      const features = [...formData.features];
      features[index] = value;
      setFormData({ ...formData, features });
    } else {
      const features_en = [...(formData.features_en || [])];
      while (features_en.length <= index) features_en.push("");
      features_en[index] = value;
      setFormData({ ...formData, features_en });
    }
  };

  const handleAddFeatureRow = () => {
    setFormData({
      ...formData,
      features: [...formData.features, ""],
      features_en: [...(formData.features_en || []), ""],
    });
  };

  const handleRemoveFeatureRow = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
      features_en: (formData.features_en || []).filter((_, i) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {pkg.id ? "Paket Düzenle" : "Yeni Paket"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paket ID *
              </label>
              <input
                type="text"
                value={formData.packageId}
                onChange={(e) =>
                  setFormData({ ...formData, packageId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                placeholder="tek-kisi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlık (TR) *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlık (EN)</label>
              <input
                type="text"
                value={formData.title_en ?? ""}
                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                placeholder="Title in English"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Başlık (TR)</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Başlık (EN)</label>
              <input
                type="text"
                value={formData.subtitle_en ?? ""}
                onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                placeholder="Subtitle in English"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fiyat *
                </label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                  placeholder="52.000 TL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sıra
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Özellikler * (TR metni zorunlu; EN = İngilizce çeviri)</label>
              <div className="space-y-2 mb-2">
                {featureRows.map((row, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={row.tr}
                      onChange={(e) => updateFeatureRow(index, "tr", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent text-sm"
                      placeholder="TR"
                    />
                    <input
                      type="text"
                      value={row.en}
                      onChange={(e) => updateFeatureRow(index, "en", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent text-sm"
                      placeholder="EN (çeviri)"
                    />
                    <button type="button" onClick={() => handleRemoveFeatureRow(index)} className="p-2 text-red-500 hover:text-red-700 shrink-0" title="Kaldır">✕</button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddFeatureRow}
                className="px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark text-sm"
              >
                + Madde ekle
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300 text-purple-primary focus:ring-purple-primary"
              />
              <label htmlFor="active" className="text-sm text-gray-700">
                Aktif
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark transition-colors"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

