import { useState, useMemo, useRef } from "react";
import { authFetch } from "@/utils/authFetch";
import { Plus, Edit, Trash2, Save, X, Download, Loader2, GripVertical, ExternalLink, Image, Upload } from "lucide-react";
import { useSponsors, Sponsor, SponsorCategory } from "@/hooks/useSponsors";
import { toast } from "sonner";
import { useAdminLogger, LOG_ACTIONS, LOG_ENTITIES } from "@/hooks/useAdminLogger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Sponsors() {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const { logAction } = useAdminLogger();

  const {
    categories,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    addSponsor,
    updateSponsor,
    deleteSponsor,
    downloadImages,
    reorderCategories,
    reorderSponsors,
    isUpdating,
    isDownloading,
  } = useSponsors(selectedYear !== "all" ? selectedYear : undefined);

  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [newCategoryTitleEn, setNewCategoryTitleEn] = useState("");
  const [editingCategoryTitle, setEditingCategoryTitle] = useState("");
  const [editingCategoryTitleEn, setEditingCategoryTitleEn] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  
  const [editingSponsor, setEditingSponsor] = useState<number | null>(null);
  const [sponsorForm, setSponsorForm] = useState<Partial<Sponsor>>({});
  const [addingSponsorTo, setAddingSponsorTo] = useState<number | null>(null);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [draggedCategoryId, setDraggedCategoryId] = useState<number | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<number | null>(null);
  const [draggedSponsorId, setDraggedSponsorId] = useState<number | null>(null);
  const [draggedSponsorCategoryId, setDraggedSponsorCategoryId] = useState<number | null>(null);
  const [dragOverSponsorId, setDragOverSponsorId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive unique years from categories (stable dependency: only recompute when year data changes)
  const yearsDependency =
    categories?.flatMap((c) => c.sponsors.map((s) => s.year).filter(Boolean)).sort().join(",") ?? "";
  const years = useMemo(() => {
    if (!categories?.length) return [];
    const uniqueYears = new Set<string>();
    categories.forEach((cat) => {
      cat.sponsors.forEach((sponsor) => {
        if (sponsor.year) {
          sponsor.year
            .split(",")
            .map((y) => y.trim())
            .forEach((y) => uniqueYears.add(y));
        }
      });
    });
    return Array.from(uniqueYears).sort().reverse();
  }, [yearsDependency]);

  const handleAddCategory = () => {
    if (!newCategoryTitle.trim()) return;
    addCategory(
      { title: newCategoryTitle.trim(), title_en: newCategoryTitleEn.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Kategori eklendi");
          setNewCategoryTitle("");
          setNewCategoryTitleEn("");
          setShowNewCategory(false);
        },
        onError: () => toast.error("Kategori eklenemedi"),
      }
    );
  };

  const handleUpdateCategory = (id: number, title: string, title_en?: string) => {
    updateCategory(
      { id, title, title_en: title_en?.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Kategori güncellendi");
          setEditingCategory(null);
        },
        onError: () => toast.error("Kategori güncellenemedi"),
      }
    );
  };

  const handleDeleteCategory = (id: number, title: string) => {
    if (!confirm(`"${title}" kategorisini ve içindeki tüm sponsorları silmek istediğinizden emin misiniz?`)) return;
    deleteCategory(id, {
      onSuccess: () => toast.success("Kategori silindi"),
      onError: () => toast.error("Kategori silinemedi"),
    });
  };

  const handleAddSponsor = () => {
    if (!sponsorForm.name?.trim()) {
      toast.error("Sponsor adı gerekli");
      return;
    }
    if (!addingSponsorTo) return;
    
    addSponsor(
      {
        categoryId: addingSponsorTo,
        sponsor: {
          name: sponsorForm.name || "",
          name_en: sponsorForm.name_en || undefined,
          image: sponsorForm.image || "",
          localImage: "",
          url: sponsorForm.url || "",
          active: true,
          year: sponsorForm.year || undefined,
          width: sponsorForm.width,
        },
      },
      {
        onSuccess: () => {
          toast.success("Sponsor eklendi");
          setSponsorForm({});
          setAddingSponsorTo(null);
          setShowSponsorModal(false);
        },
        onError: () => toast.error("Sponsor eklenemedi"),
      }
    );
  };

  const handleUpdateSponsor = () => {
    if (!editingSponsor) return;
    updateSponsor({ id: editingSponsor, updates: sponsorForm }, {
      onSuccess: () => {
        toast.success("Sponsor güncellendi");
        setSponsorForm({});
        setEditingSponsor(null);
        setShowSponsorModal(false);
      },
      onError: () => toast.error("Sponsor güncellenemedi"),
    });
  };

  const handleDeleteSponsor = (id: number, name: string) => {
    if (!confirm(`"${name}" sponsorunu silmek istediğinizden emin misiniz?`)) return;
    deleteSponsor(id, {
      onSuccess: () => toast.success("Sponsor silindi"),
      onError: () => toast.error("Sponsor silinemedi"),
    });
  };

  const handleDownloadImages = () => {
    downloadImages(undefined, {
      onSuccess: (result) => {
        toast.success(`${result.success} görsel indirildi, ${result.skipped} atlandı, ${result.failed} hata`);
      },
      onError: () => toast.error("Görseller indirilemedi"),
    });
  };

  const startEditSponsor = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor.id);
    setSponsorForm({
      name: sponsor.name,
      name_en: sponsor.name_en,
      image: sponsor.image,
      url: sponsor.url,
      active: sponsor.active,
      year: sponsor.year,
      width: sponsor.width,
    });
    setShowSponsorModal(true);
  };

  const openAddSponsorModal = (categoryId: number) => {
    setAddingSponsorTo(categoryId);
    setEditingSponsor(null);
    setSponsorForm({});
    setShowSponsorModal(true);
  };

  const closeSponsorModal = () => {
    setShowSponsorModal(false);
    setAddingSponsorTo(null);
    setEditingSponsor(null);
    setSponsorForm({});
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Dosya boyutu kontrolü (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Dosya boyutu 10MB'dan büyük olamaz");
      return;
    }

    // Dosya tipi kontrolü
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Sadece JPG, PNG, GIF ve WEBP formatları desteklenir");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setSponsorForm({ ...sponsorForm, image: result.imageUrl });
        toast.success("Resim başarıyla yüklendi");
      } else {
        toast.error(result.error || "Resim yüklenemedi");
      }
    } catch (error) {
      toast.error("Resim yüklenirken hata oluştu");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, categoryId: number) => {
    setDraggedCategoryId(categoryId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", String(categoryId));
  };

  const handleDragOver = (e: React.DragEvent, targetCategoryId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedCategoryId && draggedCategoryId !== targetCategoryId) {
      setDragOverCategoryId(targetCategoryId);
    }
  };

  const handleDragLeave = () => {
    setDragOverCategoryId(null);
  };

  const handleDrop = (e: React.DragEvent, targetCategoryId: number) => {
    e.preventDefault();
    setDragOverCategoryId(null);
    if (!draggedCategoryId || draggedCategoryId === targetCategoryId) {
      setDraggedCategoryId(null);
      return;
    }

    const currentOrder = categories.map((cat) => cat.id);
    const draggedIndex = currentOrder.indexOf(draggedCategoryId);
    const targetIndex = currentOrder.indexOf(targetCategoryId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedCategoryId(null);
      return;
    }

    // Reorder array
    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedCategoryId);

    // Update order in database
    reorderCategories(newOrder, {
      onSuccess: () => {
        toast.success("Kategori sıralaması güncellendi");
        setDraggedCategoryId(null);
      },
      onError: () => {
        toast.error("Kategori sıralaması güncellenemedi");
        setDraggedCategoryId(null);
      },
    });
  };

  const handleDragEnd = () => {
    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
    setDraggedSponsorId(null);
    setDraggedSponsorCategoryId(null);
    setDragOverSponsorId(null);
  };

  // Sponsor sıralama (kategori içinde)
  const handleSponsorDragStart = (e: React.DragEvent, sponsorId: number, categoryId: number) => {
    setDraggedSponsorId(sponsorId);
    setDraggedSponsorCategoryId(categoryId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${categoryId}:${sponsorId}`);
  };

  const handleSponsorDragOver = (e: React.DragEvent, sponsorId: number, categoryId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedSponsorId !== sponsorId && draggedSponsorCategoryId === categoryId) {
      setDragOverSponsorId(sponsorId);
    }
  };

  const handleSponsorDragLeave = () => {
    setDragOverSponsorId(null);
  };

  const handleSponsorDrop = (e: React.DragEvent, targetSponsorId: number, categoryId: number) => {
    e.preventDefault();
    setDragOverSponsorId(null);
    if (!draggedSponsorId || draggedSponsorCategoryId !== categoryId || draggedSponsorId === targetSponsorId) {
      setDraggedSponsorId(null);
      setDraggedSponsorCategoryId(null);
      return;
    }
    const category = categories.find((c) => c.id === categoryId);
    if (!category) {
      setDraggedSponsorId(null);
      setDraggedSponsorCategoryId(null);
      return;
    }
    const sponsorIds = category.sponsors.map((s) => s.id);
    const fromIndex = sponsorIds.indexOf(draggedSponsorId);
    const toIndex = sponsorIds.indexOf(targetSponsorId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedSponsorId(null);
      setDraggedSponsorCategoryId(null);
      return;
    }
    const newOrder = [...sponsorIds];
    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, draggedSponsorId);
    reorderSponsors(
      { categoryId, sponsorIds: newOrder },
      {
        onSuccess: () => {
          toast.success("Sponsor sıralaması güncellendi");
          setDraggedSponsorId(null);
          setDraggedSponsorCategoryId(null);
        },
        onError: () => {
          toast.error("Sponsor sıralaması güncellenemedi");
          setDraggedSponsorId(null);
          setDraggedSponsorCategoryId(null);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Sponsorlar</h1>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sponsorlar</h1>
      
      {/* Year filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Yıl Filtrele
        </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
        >
          <option value="all">Tüm Yıllar</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewCategory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Kategori
          </button>
        </div>
        <button
          onClick={handleDownloadImages}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Görselleri İndir
        </button>
      </div>

      {/* New category form */}
      {showNewCategory && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h3 className="font-medium text-gray-800 mb-3">Yeni Kategori</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Kategori adı (TR)</label>
              <input
                type="text"
                value={newCategoryTitle}
                onChange={(e) => setNewCategoryTitle(e.target.value)}
                placeholder="Kategori adı"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Kategori adı (EN)</label>
              <input
                type="text"
                value={newCategoryTitleEn}
                onChange={(e) => setNewCategoryTitleEn(e.target.value)}
                placeholder="Category name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCategory}
                disabled={isUpdating}
                className="px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setShowNewCategory(false); setNewCategoryTitle(""); setNewCategoryTitleEn(""); }}
                className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((category, index) => (
          <div
            key={category.id}
            className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${
              draggedCategoryId === category.id
                ? "opacity-50 scale-95"
                : dragOverCategoryId === category.id
                  ? "ring-2 ring-purple-primary ring-offset-2"
                  : "hover:shadow-md"
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, category.id)}
            onDragOver={(e) => handleDragOver(e, category.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, category.id)}
            onDragEnd={handleDragEnd}
          >
          {/* Category header */}
          <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between cursor-move">
            {editingCategory === category.id ? (
              <div className="flex flex-col gap-2 flex-1 mr-4">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={editingCategoryTitle}
                    onChange={(e) => setEditingCategoryTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateCategory(category.id, editingCategoryTitle, editingCategoryTitleEn);
                      if (e.key === "Escape") setEditingCategory(null);
                    }}
                    placeholder="Kategori adı (TR)"
                    className="flex-1 px-3 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-purple-primary"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editingCategoryTitleEn}
                    onChange={(e) => setEditingCategoryTitleEn(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateCategory(category.id, editingCategoryTitle, editingCategoryTitleEn);
                      if (e.key === "Escape") setEditingCategory(null);
                    }}
                    placeholder="Category name (EN)"
                    className="flex-1 px-3 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-purple-primary"
                  />
                  <button
                    onClick={() => handleUpdateCategory(category.id, editingCategoryTitle, editingCategoryTitleEn)}
                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingCategory(null)} className="p-1 text-gray-500 hover:bg-gray-200 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing" />
                <h2 className="text-lg font-semibold text-gray-800">{category.title}</h2>
                <span className="text-sm text-gray-500">({category.sponsors.length} sponsor)</span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => openAddSponsorModal(category.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-primary text-white rounded-lg hover:bg-purple-dark"
              >
                <Plus className="w-3 h-3" />
                Sponsor Ekle
              </button>
              <button
                onClick={() => {
                  setEditingCategory(category.id);
                  setEditingCategoryTitle(category.title);
                  setEditingCategoryTitleEn(category.title_en ?? "");
                }}
                className="p-2 text-purple-primary hover:bg-purple-100 rounded-lg"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteCategory(category.id, category.title)}
                className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>


          {/* Sponsors list */}
          <div className="p-4">
            {category.sponsors.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Bu kategoride henüz sponsor yok</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.sponsors.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      handleSponsorDragStart(e, sponsor.id, category.id);
                    }}
                    onDragOver={(e) => handleSponsorDragOver(e, sponsor.id, category.id)}
                    onDragLeave={handleSponsorDragLeave}
                    onDrop={(e) => handleSponsorDrop(e, sponsor.id, category.id)}
                    onDragEnd={handleDragEnd}
                    className={`border rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all ${
                      sponsor.active ? "border-gray-200" : "border-red-200 bg-red-50"
                    } ${
                      draggedSponsorId === sponsor.id ? "opacity-50 scale-95" : ""
                    } ${
                      dragOverSponsorId === sponsor.id ? "ring-2 ring-purple-primary ring-offset-1" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      {(sponsor.localImage || sponsor.image) ? (
                        <img
                          src={sponsor.localImage || sponsor.image}
                          alt={sponsor.name}
                          className="h-12 w-auto max-w-[100px] object-contain"
                          style={{
                            width: sponsor.width ? `${sponsor.width}%` : undefined,
                            height: 'auto',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                          <Image className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{sponsor.name}</p>
                        {sponsor.localImage && (
                          <span className="text-xs text-green-600">✓ Lokal</span>
                        )}
                        {sponsor.width && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({sponsor.width}% genişlik)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {sponsor.url && (
                        <a
                          href={sponsor.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Website
                        </a>
                      )}
                      <div className="flex gap-1 ml-auto">
                        <button
                          onClick={() => startEditSponsor(sponsor)}
                          className="p-1.5 text-purple-primary hover:bg-purple-100 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSponsor(sponsor.id, sponsor.name)}
                          className="p-1.5 text-red-500 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      </div>

      {categories.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500 mb-4">Henüz sponsor kategorisi yok</p>
          <button
            onClick={() => setShowNewCategory(true)}
            className="px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark"
          >
            İlk Kategoriyi Ekle
          </button>
        </div>
      )}

      {/* Sponsor Modal */}
      <Dialog open={showSponsorModal} onOpenChange={closeSponsorModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSponsor ? "Sponsor Düzenle" : "Yeni Sponsor Ekle"}
            </DialogTitle>
            <DialogDescription>
              Sponsor bilgilerini girin ve logo boyutlarını belirleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Sponsor Adı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sponsor Adı (TR) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sponsorForm.name || ""}
                onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })}
                placeholder="Sponsor adı"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sponsor Adı (EN)
              </label>
              <input
                type="text"
                value={sponsorForm.name_en ?? ""}
                onChange={(e) => setSponsorForm({ ...sponsorForm, name_en: e.target.value })}
                placeholder="Sponsor name"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>

            {/* Logo URL ve Dosya Yükleme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo
              </label>
              
              {/* URL girişi */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Logo URL'si
                  </label>
                  <input
                    type="text"
                    value={sponsorForm.image || ""}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, image: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                  />
                </div>

                {/* Dosya yükleme */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">veya</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Dosya Seç
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Maksimum 10MB. JPG, PNG, GIF, WEBP formatları desteklenir.
                </p>
              </div>
            </div>

            {/* Width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genişlik (%)
              </label>
              <input
                type="number"
                value={sponsorForm.width ?? ""}
                onChange={(e) => {
                  const numValue = e.target.value ? parseFloat(e.target.value) : undefined;
                  const value = numValue !== undefined && !isNaN(numValue) && numValue >= 0 && numValue <= 100 ? numValue : undefined;
                  setSponsorForm({ ...sponsorForm, width: value });
                }}
                placeholder="Örn: 80"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                min="0"
                max="100"
                step="0.1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Yükseklik otomatik olarak görselin oranına göre ayarlanacaktır.
              </p>
            </div>

            {/* Logo Önizleme */}
            {sponsorForm.image && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Logo Önizleme:</p>
                <div className="w-full h-32 border border-gray-200 rounded flex items-center justify-center bg-white">
                  <img
                    src={sponsorForm.image}
                    alt="Logo önizleme"
                    className="object-contain"
                    style={{
                      width: sponsorForm.width ? `${sponsorForm.width}%` : "auto",
                      height: "auto",
                      maxWidth: "100%",
                      maxHeight: "100%",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}

            {/* Website URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                type="text"
                value={sponsorForm.url || ""}
                onChange={(e) => setSponsorForm({ ...sponsorForm, url: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>

            {/* Yıl Seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yıl (Birden fazla seçebilirsiniz)
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                {Array.from({ length: 2026 - 2015 + 1 }, (_, i) => 2026 - i).map((year) => {
                  const yearStr = year.toString();
                  const selectedYears = sponsorForm.year ? sponsorForm.year.split(',').map(y => y.trim()) : [];
                  const isSelected = selectedYears.includes(yearStr);
                  
                  return (
                    <label key={year} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          let newYears: string[];
                          if (e.target.checked) {
                            newYears = [...selectedYears, yearStr];
                          } else {
                            newYears = selectedYears.filter(y => y !== yearStr);
                          }
                          setSponsorForm({ ...sponsorForm, year: newYears.join(',') });
                        }}
                        className="w-4 h-4 text-purple-primary border-gray-300 rounded focus:ring-purple-primary"
                      />
                      <span className="text-sm text-gray-700">{year}</span>
                    </label>
                  );
                })}
              </div>
              {sponsorForm.year && (
                <p className="text-xs text-gray-500 mt-2">
                  Seçili yıllar: {sponsorForm.year.split(',').map(y => y.trim()).join(', ')}
                </p>
              )}
            </div>

            {/* Aktif Durumu (sadece düzenleme modunda) */}
            {editingSponsor && (
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sponsorForm.active !== false}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, active: e.target.checked })}
                    className="w-4 h-4 text-purple-primary border-gray-300 rounded focus:ring-purple-primary"
                  />
                  <span className="text-sm text-gray-700">Aktif</span>
                </label>
              </div>
            )}
          </div>
          <DialogFooter>
            <button
              onClick={closeSponsorModal}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
            >
              İptal
            </button>
            <button
              onClick={editingSponsor ? handleUpdateSponsor : handleAddSponsor}
              disabled={isUpdating || !sponsorForm.name?.trim()}
              className="px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 inline-block animate-spin mr-2" />
                  {editingSponsor ? "Güncelleniyor..." : "Ekleniyor..."}
                </>
              ) : (
                editingSponsor ? "Güncelle" : "Ekle"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
