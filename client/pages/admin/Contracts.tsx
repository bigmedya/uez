import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { toast } from "sonner";
import { FileText, Plus, Edit, Trash2, Save, X, GripVertical, Eye, EyeOff } from "lucide-react";
import { ADMIN_SAVE_SUCCESS } from "@/lib/adminMessages";

interface Contract {
  id: number;
  slug: string;
  title: string;
  title_en?: string;
  content: string;
  content_en?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    title_en: "",
    content: "",
    content_en: "",
    isActive: true,
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const res = await fetch("/api/contracts");
      const data = await res.json();
      setContracts(data);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingContract(null);
    setFormData({
      slug: "",
      title: "",
      title_en: "",
      content: "",
      content_en: "",
      isActive: true,
    });
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setIsCreating(false);
    setFormData({
      slug: contract.slug,
      title: contract.title,
      title_en: contract.title_en ?? "",
      content: contract.content,
      content_en: contract.content_en ?? "",
      isActive: contract.isActive,
    });
  };

  const handleCancel = () => {
    setEditingContract(null);
    setIsCreating(false);
    setFormData({
      slug: "",
      title: "",
      title_en: "",
      content: "",
      content_en: "",
      isActive: true,
    });
  };

  const handleSave = async () => {
    if (!formData.slug || !formData.title || !formData.content) {
      alert("Tüm alanları doldurunuz");
      return;
    }

    setSaving(true);
    try {
      if (isCreating) {
        const res = await fetch("/api/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            order: contracts.length + 1,
          }),
        });
        if (res.ok) {
          await fetchContracts();
          handleCancel();
          toast.success(ADMIN_SAVE_SUCCESS);
        }
      } else if (editingContract) {
        const res = await fetch(`/api/contracts/${editingContract.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          await fetchContracts();
          handleCancel();
          toast.success(ADMIN_SAVE_SUCCESS);
        }
      }
    } catch (error) {
      console.error("Error saving contract:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu sözleşmeyi silmek istediğinizden emin misiniz?")) return;

    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchContracts();
      }
    } catch (error) {
      console.error("Error deleting contract:", error);
    }
  };

  const toggleActive = async (contract: Contract) => {
    try {
      await fetch(`/api/contracts/${contract.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !contract.isActive }),
      });
      await fetchContracts();
    } catch (error) {
      console.error("Error toggling contract:", error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Sözleşmeler</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sözleşmeler</h1>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Sözleşmeler</h2>
              <p className="text-sm text-gray-500">KVKK ve yasal metinleri yönetin</p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Sözleşme
          </button>
        </div>

        {/* Edit/Create Form */}
        {(editingContract || isCreating) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {isCreating ? "Yeni Sözleşme Oluştur" : "Sözleşme Düzenle"}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlık (TR)</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        title: e.target.value,
                        slug: isCreating ? generateSlug(e.target.value) : formData.slug,
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Çerez Politikası"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlık (EN)</label>
                  <input
                    type="text"
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Cookie Policy"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="cerez-politikasi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İçerik (TR, HTML)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                  placeholder="<h2>Başlık</h2><p>İçerik...</p>"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İçerik (EN, HTML)</label>
                <textarea
                  value={formData.content_en}
                  onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                  placeholder="<h2>Title</h2><p>Content...</p>"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Aktif (sitede görünsün)
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contracts List */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Mevcut Sözleşmeler</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {contracts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Henüz sözleşme eklenmemiş
              </div>
            ) : (
              contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="p-4 flex items-center gap-4 hover:bg-gray-50"
                >
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{contract.title}</h4>
                      {contract.isActive ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Pasif
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">/{contract.slug}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/${contract.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Sayfayı Görüntüle"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => toggleActive(contract)}
                      className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title={contract.isActive ? "Pasife Al" : "Aktif Et"}
                    >
                      {contract.isActive ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(contract)}
                      className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(contract.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


