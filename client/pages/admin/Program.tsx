import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Calendar, Upload, Save, X, GripVertical, Loader2, Users, ChevronDown, ChevronRight, Check, ChevronsUpDown } from "lucide-react";
import { useProgram, ScheduleDay, ScheduleItem, ScheduleCategory } from "@/hooks/useProgram";
import { toast } from "sonner";
import { ADMIN_SAVE_SUCCESS } from "@/lib/adminMessages";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useAdminLogger, LOG_ACTIONS, LOG_ENTITIES } from "@/hooks/useAdminLogger";
import { PROGRAM_SESSION_LOCATIONS } from "@shared/programLocations";

interface Speaker {
  id: number;
  name: string;
  title?: string;
  titleEn?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
}

function getSpeakerSubtitle(speaker: Speaker): string {
  if (speaker.company && speaker.position) return `${speaker.company}, ${speaker.position}`;
  return speaker.title ?? "";
}

function stripTagsForPreview(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export default function Program() {
  const queryClient = useQueryClient();
  const { data, categories, days, isLoading, importXML, updateData, addDay, updateDay, deleteDay, addItem, updateItem, deleteItem, reorderItems, addCategory, updateCategory, deleteCategory, isUpdating } = useProgram({ forAdmin: true });
  const { logAction } = useAdminLogger();
  
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<ScheduleDay | null>(null);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [showAddDay, setShowAddDay] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddYear, setShowAddYear] = useState(false);
  const [showDeleteCategory, setShowDeleteCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ScheduleCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<ScheduleCategory | null>(null);
  const [editingDay, setEditingDay] = useState<ScheduleDay | null>(null);
  const [newDayTitle, setNewDayTitle] = useState("");
  const [newDayTitleEn, setNewDayTitleEn] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newYearEn, setNewYearEn] = useState("");
  const [newItem, setNewItem] = useState<Partial<ScheduleItem>>({ time: "", title: "", location: "", isMultiSpeaker: false, moderatorIds: [] });
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<number | null>(null);
  const [uploadingNoteImage, setUploadingNoteImage] = useState<"new" | "edit" | null>(null);

  const uploadNoteImageFile = async (file: File): Promise<string | null> => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Sadece JPG, PNG, GIF veya WEBP yükleyin.");
      return null;
    }
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/images/upload", { method: "POST", body: fd });
    if (!res.ok) {
      toast.error("Görsel yüklenemedi.");
      return null;
    }
    const data = await res.json();
    return data.imageUrl ?? null;
  };

  // Load speakers
  useEffect(() => {
    fetch("/api/speakers")
      .then(res => res.json())
      .then(data => setSpeakers(data || []))
      .catch(console.error);
  }, []);

  // Auto-select first category
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const categoryDays = days.filter(d => d.categoryId === selectedCategory);

  const normalizeTimeForTimeInput = (value?: string) => {
    if (!value) return "";
    const v = String(value).trim();
    // Accept "09.30" / "9.30"
    const dot = v.match(/^(\d{1,2})[.:](\d{2})$/);
    if (dot) return `${dot[1].padStart(2, "0")}:${dot[2]}`;
    // Accept "09:30" / "9:30" / with seconds
    const colon = v.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (colon) return `${colon[1].padStart(2, "0")}:${colon[2]}`;
    // Anything else (e.g. ranges) can't be shown in <input type="time">
    return "";
  };

  const handleImportXML = async (fileName: string) => {
    if (!confirm(`${fileName} dosyasından program verilerini içeri aktarmak istiyor musunuz?`)) return;
    
    try {
      importXML({ xmlPath: `public/${fileName}`, clearExisting: false }, {
        onSuccess: (result) => {
          toast.success(`İçeri aktarıldı: ${result.imported.days} gün, ${result.imported.items} öğe`);
        },
        onError: () => toast.error("İçeri aktarma hatası!")
      });
    } catch (e) {
      toast.error("Hata: " + String(e));
    }
  };

  const handleAddDay = () => {
    if (!newDayTitle.trim() || !selectedCategory) {
      toast.error("Lütfen gün başlığı girin ve bir kategori seçin!");
      return;
    }
    
    // Türkçe karakterleri düzgün şekilde slug'a çevir
    const slug = newDayTitle
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/İ/g, "i")
      .replace(/Ğ/g, "g")
      .replace(/Ü/g, "u")
      .replace(/Ş/g, "s")
      .replace(/Ö/g, "o")
      .replace(/Ç/g, "c")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || `gun-${Date.now()}`;
    
    addDay({
      title: newDayTitle.trim(),
      title_en: newDayTitleEn.trim() || undefined,
      slug: slug,
      categoryId: selectedCategory
    }, {
      onSuccess: async (newDay: any) => {
        toast.success("Gün başarıyla eklendi!");
        setNewDayTitle("");
        setNewDayTitleEn("");
        setShowAddDay(false);
        
        // Program günü ekleme işlemini logla
        await logAction({
          action: LOG_ACTIONS.CREATE,
          entity: LOG_ENTITIES.PROGRAM_DAY,
          entityId: newDay?.id?.toString() || "new",
          details: { 
            title: newDayTitle.trim(),
            title_en: newDayTitleEn.trim() || undefined,
            categoryId: selectedCategory
          }
        });
      },
      onError: (error: any) => {
        console.error("Gün ekleme hatası:", error);
        toast.error(error?.message || "Gün eklenirken bir hata oluştu!");
      }
    });
  };

  const handleDeleteDay = (dayId: number) => {
    if (!confirm("Bu günü ve tüm program öğelerini silmek istediğinize emin misiniz?")) return;
    
    const dayToDelete = days.find(d => d.id === dayId);
    deleteDay(dayId, {
      onSuccess: async () => {
        toast.success("Gün silindi!");
        
        // Program günü silme işlemini logla
        await logAction({
          action: LOG_ACTIONS.DELETE,
          entity: LOG_ENTITIES.PROGRAM_DAY,
          entityId: dayId.toString(),
          details: { 
            title: dayToDelete?.title,
            categoryId: dayToDelete?.categoryId
          }
        });
      },
      onError: () => toast.error("Silme hatası!")
    });
  };

  const handleAddItem = (dayId: number) => {
    if (!newItem.time) return;
    
    // Prepare item object, ensuring correct speaker fields based on isMultiSpeaker
    const item: Omit<ScheduleItem, "id" | "order"> = {
      time: newItem.time,
      title: newItem.title,
      location: newItem.location?.trim() ? newItem.location.trim() : undefined,
      title_en: newItem.title_en,
      note: newItem.note,
      note_en: newItem.note_en,
      note_image: newItem.note_image,
      moderatorIds: newItem.moderatorIds || [],
      isMultiSpeaker: newItem.isMultiSpeaker || false,
    };
    
    // Set speaker fields based on mode
    if (newItem.isMultiSpeaker) {
      item.speakerIds = newItem.speakerIds || [];
      item.speakerId = undefined;
    } else {
      item.speakerId = newItem.speakerId;
      item.speakerIds = undefined;
    }
    
    addItem({ dayId, item }, {
      onSuccess: async () => {
        toast.success("Program öğesi eklendi!");
        setNewItem({
          time: "",
          title: "",
          location: "",
          title_en: "",
          note: "",
          note_en: "",
          note_image: "",
          moderatorIds: [],
          isMultiSpeaker: false,
          speakerId: undefined,
          speakerIds: undefined,
        });
        setShowAddItem(false);
        
        // Program öğesi ekleme işlemini logla
        await logAction({
          action: LOG_ACTIONS.CREATE,
          entity: LOG_ENTITIES.PROGRAM,
          details: { 
            dayId,
            title: item.title,
            time: item.time,
            isMultiSpeaker: item.isMultiSpeaker
          }
        });
      },
      onError: () => toast.error("Ekleme hatası!")
    });
  };

  const handleUpdateItem = () => {
    if (!editingItem || !selectedDay) return;
    const dayId = selectedDay.id;

    // Prepare updates object, ensuring correct speaker fields based on isMultiSpeaker
    const updates: Partial<ScheduleItem> = {
      time: editingItem.time,
      title: editingItem.title,
      location: editingItem.location?.trim() ? editingItem.location.trim() : null,
      title_en: editingItem.title_en,
      note: editingItem.note,
      note_en: editingItem.note_en,
      note_image: editingItem.note_image,
      moderatorIds: editingItem.moderatorIds || [],
      isMultiSpeaker: editingItem.isMultiSpeaker,
    };

    // Set speaker fields based on mode
    if (editingItem.isMultiSpeaker) {
      updates.speakerIds = editingItem.speakerIds || [];
      updates.speakerId = undefined;
    } else {
      updates.speakerId = editingItem.speakerId;
      updates.speakerIds = undefined;
    }

    updateItem({ dayId, itemId: editingItem.id, updates }, {
      onSuccess: async () => {
        toast.success(ADMIN_SAVE_SUCCESS);
        setEditingItem(null);
        
        // Program öğesi güncelleme işlemini logla
        await logAction({
          action: LOG_ACTIONS.UPDATE,
          entity: LOG_ENTITIES.PROGRAM,
          entityId: editingItem.id.toString(),
          details: { 
            dayId,
            title: updates.title,
            time: updates.time,
            isMultiSpeaker: updates.isMultiSpeaker
          }
        });
      },
      onError: (err: Error) => {
        toast.error(err.message || "Güncelleme hatası!");
        setEditingItem(null);
      },
    });
  };

  const handleDeleteItem = (dayId: number, itemId: number) => {
    if (!confirm("Bu öğeyi silmek istediğinize emin misiniz?")) return;
    
    deleteItem({ dayId, itemId }, {
      onSuccess: async () => {
        toast.success("Silindi!");
        
        // Program öğesi silme işlemini logla
        await logAction({
          action: LOG_ACTIONS.DELETE,
          entity: LOG_ENTITIES.PROGRAM,
          entityId: itemId.toString(),
          details: { 
            dayId
          }
        });
      },
      onError: () => toast.error("Silme hatası!")
    });
  };

  const handleAddYear = () => {
    if (!newYear.trim()) {
      toast.error("Lütfen bir yıl girin!");
      return;
    }

    const yearNum = parseInt(newYear.trim(), 10);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      toast.error("Geçerli bir yıl girin (2000-2100 arası)!");
      return;
    }

    const yearSlug = newYear.trim();
    const yearName = newYear.trim();

    // Check if year already exists
    if (categories.some(cat => cat.name === yearName || cat.slug === yearSlug)) {
      toast.error("Bu yıl zaten mevcut!");
      return;
    }

    addCategory({
      name: yearName,
      name_en: newYearEn.trim() || undefined,
      slug: yearSlug
    }, {
      onSuccess: async (newCategory: any) => {
        toast.success(`${yearName} yılı eklendi!`);
        setNewYear("");
        setNewYearEn("");
        setShowAddYear(false);
        
        // Program kategorisi ekleme işlemini logla
        await logAction({
          action: LOG_ACTIONS.CREATE,
          entity: LOG_ENTITIES.PROGRAM_CATEGORY,
          entityId: newCategory?.id?.toString() || "new",
          details: { 
            name: yearName,
            name_en: newYearEn.trim() || undefined,
            slug: yearSlug
          }
        });
      },
      onError: () => toast.error("Yıl ekleme hatası!")
    });
  };

  const handleDeleteCategoryClick = (category: ScheduleCategory) => {
    setCategoryToDelete(category);
    setShowDeleteCategory(true);
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    
    const categoryDays = days.filter(d => d.categoryId === categoryToDelete.id);
    const dayCount = categoryDays.length;
    const itemCount = categoryDays.reduce((acc, d) => acc + d.scheduleItems.length, 0);
    
    deleteCategory(categoryToDelete.id, {
      onSuccess: async () => {
        toast.success("Kategori silindi!");
        if (selectedCategory === categoryToDelete.id) {
          setSelectedCategory(null);
        }
        setShowDeleteCategory(false);
        
        // Program kategorisi silme işlemini logla
        await logAction({
          action: LOG_ACTIONS.DELETE,
          entity: LOG_ENTITIES.PROGRAM_CATEGORY,
          entityId: categoryToDelete.id.toString(),
          details: { 
            name: categoryToDelete.name,
            slug: categoryToDelete.slug
          }
        });
        
        setCategoryToDelete(null);
      },
      onError: () => {
        toast.error("Kategori silme hatası!");
        setShowDeleteCategory(false);
        setCategoryToDelete(null);
      }
    });
  };

  const handleItemDragStart = (_dayId: number, itemId: number) => {
    setDraggedItemId(itemId);
  };

  const handleItemDragOver = (e: React.DragEvent, itemId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedItemId !== itemId) setDragOverItemId(itemId);
  };

  const handleItemDragLeave = () => {
    setDragOverItemId(null);
  };

  const handleItemDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const handleItemDrop = (e: React.DragEvent, dayId: number, dropTargetItemId: number) => {
    e.preventDefault();
    setDragOverItemId(null);
    const draggedIdStr = e.dataTransfer.getData("text/plain");
    if (!draggedIdStr) return;
    const draggedId = parseInt(draggedIdStr, 10);
    if (draggedId === dropTargetItemId) return;

    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const sorted = [...day.scheduleItems].sort((a, b) => a.order - b.order);
    const fromIndex = sorted.findIndex((i) => i.id === draggedId);
    const toIndex = sorted.findIndex((i) => i.id === dropTargetItemId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = sorted.filter((i) => i.id !== draggedId);
    reordered.splice(toIndex, 0, sorted[fromIndex]);
    const newItemIds = reordered.map((i) => i.id);

    reorderItems(
      { dayId, itemIds: newItemIds },
      {
        onSuccess: () => toast.success("Sıralama güncellendi"),
        onError: () => toast.error("Sıralama güncellenemedi"),
      }
    );
  };

  const toggleDayExpand = (dayId: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayId)) {
      newExpanded.delete(dayId);
    } else {
      newExpanded.add(dayId);
    }
    setExpandedDays(newExpanded);
  };

  const handleSaveCategoryEdit = () => {
    if (!editingCategory) return;
    const name = (document.getElementById("edit-category-name") as HTMLInputElement)?.value?.trim();
    const nameEn = (document.getElementById("edit-category-name-en") as HTMLInputElement)?.value?.trim();
    if (!name) {
      toast.error("Yıl / kategori adı gerekli!");
      return;
    }
    updateCategory({ id: editingCategory.id, updates: { name, name_en: nameEn || undefined } }, {
      onSuccess: () => {
        toast.success(ADMIN_SAVE_SUCCESS);
        setEditingCategory(null);
      },
      onError: () => toast.error("Güncelleme hatası!")
    });
  };

  const handleSaveDayTitleEdit = () => {
    if (!editingDay) return;
    const titleTr = (document.getElementById("edit-day-title-tr") as HTMLInputElement)?.value?.trim();
    const titleEn = (document.getElementById("edit-day-title-en") as HTMLInputElement)?.value?.trim();
    if (!titleTr) {
      toast.error("Gün başlığı (TR) gerekli!");
      return;
    }
    updateDay({ id: editingDay.id, updates: { title: titleTr, label: titleTr, title_en: titleEn || undefined, label_en: titleEn || undefined } }, {
      onSuccess: async () => {
        toast.success(ADMIN_SAVE_SUCCESS);
        setEditingDay(null);
        
        // Program günü güncelleme işlemini logla
        await logAction({
          action: LOG_ACTIONS.UPDATE,
          entity: LOG_ENTITIES.PROGRAM_DAY,
          entityId: editingDay.id.toString(),
          details: { 
            title: titleTr,
            title_en: titleEn,
            previousTitle: editingDay.title
          }
        });
      },
      onError: () => toast.error("Güncelleme hatası!")
    });
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Program Yönetimi</h1>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Program Yönetimi</h1>
      {/* Import Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">XML'den İçeri Aktar</h2>
          <button
            onClick={() => setShowAddYear(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yıl Ekle
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleImportXML("uluslararasekonomizirvesi.WordPress.2026-01-06 (1).xml")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Uluslararası Ekonomi Zirvesi XML
          </button>
          <button
            onClick={() => handleImportXML("uludaekonomizirvesi.WordPress.2026-01-06 (1).xml")}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Uludağ Ekonomi Zirvesi XML
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Toplam: {categories.length} kategori, {days.length} gün, {days.reduce((acc, d) => acc + d.scheduleItems.length, 0)} program öğesi
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        {categories.map((cat) => (
          <div
            key={cat.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedCategory(cat.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedCategory(cat.id);
              }
            }}
            className={`relative px-4 py-2 rounded-lg font-medium transition-colors group cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-purple-primary text-white"
                : "bg-white text-gray-600 hover:bg-purple-50"
            }`}
          >
            {cat.name}
            <span className="ml-2 text-xs opacity-70">
              ({days.filter(d => d.categoryId === cat.id).length})
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingCategory(cat);
              }}
              className={`absolute -top-1 -right-8 p-1 rounded-full transition-opacity opacity-0 group-hover:opacity-100 ${
                selectedCategory === cat.id ? "bg-white/80 text-purple-primary hover:bg-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
              title="Yıl / kategori adını düzenle (TR / EN)"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCategoryClick(cat);
              }}
              className={`absolute -top-1 -right-1 p-1 rounded-full transition-opacity opacity-0 group-hover:opacity-100 ${
                selectedCategory === cat.id
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
              title={`${cat.name} kategorisini sil`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Days List */}
      <div className="space-y-4">
        {categoryDays.map((day) => (
          <div key={day.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Day Header */}
            <div 
              className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between cursor-pointer"
              onClick={() => toggleDayExpand(day.id)}
            >
              <div className="flex items-center gap-3">
                {expandedDays.has(day.id) ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <Calendar className="w-5 h-5 text-purple-primary" />
                <h3 className="font-semibold text-gray-800">{day.title}</h3>
                <span className="text-sm text-gray-500">({day.scheduleItems.length} öğe)</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingDay(day); }}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  title="Gün başlığını düzenle (TR / EN)"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedDay(day); setShowAddItem(true); }}
                  className="p-2 text-purple-primary hover:bg-purple-100 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteDay(day.id); }}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Schedule Items */}
            {expandedDays.has(day.id) && (
              <div className="divide-y divide-gray-100">
                {day.scheduleItems.sort((a, b) => a.order - b.order).map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", String(item.id));
                      e.dataTransfer.effectAllowed = "move";
                      handleItemDragStart(day.id, item.id);
                    }}
                    onDragOver={(e) => handleItemDragOver(e, item.id)}
                    onDragLeave={handleItemDragLeave}
                    onDragEnd={handleItemDragEnd}
                    onDrop={(e) => handleItemDrop(e, day.id, item.id)}
                    className={cn(
                      "p-4 flex items-center justify-between hover:bg-gray-50 transition-colors",
                      draggedItemId === item.id && "opacity-50",
                      dragOverItemId === item.id && "bg-purple-50 ring-1 ring-purple-200 ring-inset"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" aria-hidden />
                      <span className="text-lg font-bold text-purple-primary w-16">{item.time}</span>
                      <div>
                        <p className="font-medium text-gray-800">{item.title}</p>
                        {item.location && (
                          <p className="text-xs text-purple-700 mt-0.5">{item.location}</p>
                        )}
                        {(item.note || item.note_image) && (
                          <p className="text-sm text-gray-500 max-w-md truncate">
                            {[
                              item.note ? stripTagsForPreview(item.note) : "",
                              item.note_image ? "Görsel" : "",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                        {item.isMultiSpeaker && item.speakerIds && item.speakerIds.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {item.speakerIds.map(id => speakers.find(s => s.id === id)?.name).filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { 
                          setSelectedDay(day); 
                          // Normalize speaker data for editing
                          const normalizedItem = { ...item };
                          normalizedItem.time = normalizeTimeForTimeInput(normalizedItem.time) || normalizedItem.time;
                          if (!normalizedItem.isMultiSpeaker && normalizedItem.speakerIds && normalizedItem.speakerIds.length > 0) {
                            // If single speaker mode but has speakerIds array, use first one as speakerId
                            normalizedItem.speakerId = normalizedItem.speakerIds[0];
                            normalizedItem.speakerIds = undefined;
                          } else if (normalizedItem.isMultiSpeaker && normalizedItem.speakerId) {
                            // If multi speaker mode but has speakerId, convert to array
                            normalizedItem.speakerIds = [normalizedItem.speakerId];
                            normalizedItem.speakerId = undefined;
                          }
                          setEditingItem(normalizedItem);
                        }}
                        className="p-2 text-purple-primary hover:bg-purple-100 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(day.id, item.id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {day.scheduleItems.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    Henüz program öğesi yok. <button onClick={() => { setSelectedDay(day); setShowAddItem(true); }} className="text-purple-primary hover:underline">Ekleyin</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {categoryDays.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            Bu kategoride henüz program günü yok.
          </div>
        )}

        {/* Add Day Button */}
        {selectedCategory && (
          <div className="mt-4">
            {showAddDay ? (
              <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                <div className="flex gap-3 flex-wrap items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Gün başlığı (TR)</label>
                    <input
                      type="text"
                      value={newDayTitle}
                      onChange={(e) => setNewDayTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddDay();
                        else if (e.key === "Escape") { setShowAddDay(false); setNewDayTitle(""); setNewDayTitleEn(""); }
                      }}
                      placeholder="örn: 18 NİSAN CUMA 2026"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-primary"
                      autoFocus
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Gün başlığı (EN)</label>
                    <input
                      type="text"
                      value={newDayTitleEn}
                      onChange={(e) => setNewDayTitleEn(e.target.value)}
                      placeholder="e.g. April 18, Friday 2026"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleAddDay} 
                      disabled={isUpdating || !newDayTitle.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Ekle
                    </button>
                    <button 
                      onClick={() => { setShowAddDay(false); setNewDayTitle(""); setNewDayTitleEn(""); }} 
                      className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddDay(true)}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-primary hover:text-purple-primary transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Yeni Gün Ekle
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddItem && selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <h3 className="text-lg font-semibold">Program Öğesi Ekle - {selectedDay.title}</h3>
              <button onClick={() => setShowAddItem(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
                <div className="grid grid-cols-2 gap-4 lg:col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
                    <input
                      type="time"
                      value={normalizeTimeForTimeInput(newItem.time) || ""}
                      onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newItem.isMultiSpeaker || false}
                        onChange={(e) => {
                          const isMulti = e.target.checked;
                          setNewItem({
                            ...newItem,
                            isMultiSpeaker: isMulti,
                            speakerId: isMulti ? undefined : newItem.speakerId,
                            speakerIds: isMulti ? newItem.speakerIds : undefined,
                          });
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Çoklu Konuşmacı</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlık (TR)</label>
                  <input
                    type="text"
                    value={newItem.title || ""}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="Program başlığı"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlık (EN)</label>
                  <input
                    type="text"
                    value={newItem.title_en || ""}
                    onChange={(e) => setNewItem({ ...newItem, title_en: e.target.value })}
                    placeholder="Title (English)"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
                  <select
                    value={newItem.location || ""}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value || undefined })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="">Seçiniz</option>
                    {PROGRAM_SESSION_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Push anımsatıcı metninde kullanılır.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Not (TR)</label>
                  <textarea
                    value={newItem.note || ""}
                    onChange={(e) => setNewItem({ ...newItem, note: e.target.value })}
                    rows={3}
                    placeholder="Enter veya &lt;br&gt; = alt satır. Kalın: &lt;b&gt;…&lt;/b&gt;"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Not görseli</label>
                  <p className="text-xs text-gray-500 mb-1">İsteğe bağlı; boş bırakılabilir.</p>
                  <input
                    type="url"
                    value={newItem.note_image || ""}
                    onChange={(e) => setNewItem({ ...newItem, note_image: e.target.value })}
                    placeholder="/uploads/images/..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-2"
                  />
                  <label className="inline-flex items-center gap-2 text-sm text-purple-primary cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingNoteImage === "new" ? "Yükleniyor…" : "Resim yükle"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      className="hidden"
                      disabled={uploadingNoteImage === "new"}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        setUploadingNoteImage("new");
                        const url = await uploadNoteImageFile(file);
                        setUploadingNoteImage(null);
                        if (url) setNewItem((prev) => ({ ...prev, note_image: url }));
                      }}
                    />
                  </label>
                  {newItem.note_image ? (
                    <img
                      src={newItem.note_image}
                      alt=""
                      className="mt-2 h-20 w-auto max-w-full rounded border object-contain"
                    />
                  ) : null}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Not (EN)</label>
                  <textarea
                    value={newItem.note_en || ""}
                    onChange={(e) => setNewItem({ ...newItem, note_en: e.target.value })}
                    rows={3}
                    placeholder="Enter or &lt;br&gt; = line break. Bold: &lt;b&gt;…&lt;/b&gt;"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Moderatör</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between max-w-md">
                        {(newItem.moderatorIds || []).length > 0
                          ? `${(newItem.moderatorIds || []).length} moderatör seçildi`
                          : "Konuşmacıdan moderatör seçin"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Moderatör ara..." />
                        <CommandList>
                          <CommandEmpty>Konuşmacı bulunamadı.</CommandEmpty>
                          <CommandGroup>
                            {speakers.map((s) => {
                              const isSelected = (newItem.moderatorIds || []).includes(s.id);
                              return (
                                <CommandItem
                                  key={s.id}
                                  value={s.name}
                                  onSelect={() => {
                                    const current = newItem.moderatorIds || [];
                                    if (isSelected) {
                                      setNewItem({ ...newItem, moderatorIds: current.filter((id) => id !== s.id) });
                                    } else {
                                      setNewItem({ ...newItem, moderatorIds: [...current, s.id] });
                                    }
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                  {s.name}
                                  {getSpeakerSubtitle(s) && (
                                    <span className="ml-2 text-xs text-gray-500">— {getSpeakerSubtitle(s)}</span>
                                  )}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {(newItem.moderatorIds || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(newItem.moderatorIds || []).map((id) => {
                        const s = speakers.find((x) => x.id === id);
                        return s ? (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm"
                          >
                            {s.name}
                            <button
                              onClick={() => {
                                setNewItem({
                                  ...newItem,
                                  moderatorIds: (newItem.moderatorIds || []).filter((mid) => mid !== id),
                                });
                              }}
                              className="hover:text-purple-900"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                {!newItem.isMultiSpeaker ? (
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konuşmacı</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between max-w-md",
                            !newItem.speakerId && "text-muted-foreground"
                          )}
                        >
                          {newItem.speakerId
                            ? speakers.find((s) => s.id === newItem.speakerId)?.name || "Konuşmacı seçin"
                            : "Konuşmacı seçin"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Konuşmacı ara..." />
                          <CommandList>
                            <CommandEmpty>Konuşmacı bulunamadı.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value=""
                                onSelect={() => setNewItem({ ...newItem, speakerId: undefined })}
                              >
                                <Check className={cn("mr-2 h-4 w-4", !newItem.speakerId ? "opacity-100" : "opacity-0")} />
                                Break / Ara
                              </CommandItem>
                              {speakers.map((speaker) => (
                                <CommandItem
                                  key={speaker.id}
                                  value={speaker.name}
                                  onSelect={() => setNewItem({ ...newItem, speakerId: speaker.id })}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newItem.speakerId === speaker.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {speaker.name}
                                  {getSpeakerSubtitle(speaker) && (
                                    <span className="ml-2 text-xs text-gray-500">- {getSpeakerSubtitle(speaker)}</span>
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konuşmacılar</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between max-w-md">
                          {(newItem.speakerIds || []).length > 0
                            ? `${(newItem.speakerIds || []).length} konuşmacı seçildi`
                            : "Konuşmacı seçin"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Konuşmacı ara..." />
                          <CommandList>
                            <CommandEmpty>Konuşmacı bulunamadı.</CommandEmpty>
                            <CommandGroup>
                              {speakers.map((speaker) => {
                                const isSelected = (newItem.speakerIds || []).includes(speaker.id);
                                return (
                                  <CommandItem
                                    key={speaker.id}
                                    value={speaker.name}
                                    onSelect={() => {
                                      const currentIds = newItem.speakerIds || [];
                                      if (isSelected) {
                                        setNewItem({
                                          ...newItem,
                                          speakerIds: currentIds.filter((id) => id !== speaker.id),
                                        });
                                      } else {
                                        setNewItem({
                                          ...newItem,
                                          speakerIds: [...currentIds, speaker.id],
                                        });
                                      }
                                    }}
                                  >
                                    <Check
                                      className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}
                                    />
                                    {speaker.name}
                                    {speaker.title && (
                                      <span className="ml-2 text-xs text-gray-500">- {speaker.title}</span>
                                    )}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {(newItem.speakerIds || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(newItem.speakerIds || []).map((id) => {
                          const speaker = speakers.find((s) => s.id === id);
                          return speaker ? (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm"
                            >
                              {speaker.name}
                              <button
                                onClick={() => {
                                  setNewItem({
                                    ...newItem,
                                    speakerIds: (newItem.speakerIds || []).filter((sid) => sid !== id),
                                  });
                                }}
                                className="hover:text-purple-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl shrink-0">
              <button onClick={() => setShowAddItem(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                İptal
              </button>
              <button
                onClick={() => handleAddItem(selectedDay.id)}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <h3 className="text-lg font-semibold">Program Öğesini Düzenle</h3>
              <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
                <div className="grid grid-cols-2 gap-4 lg:col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
                    <input
                      type="time"
                    value={normalizeTimeForTimeInput(editingItem.time) || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingItem.isMultiSpeaker || false}
                        onChange={(e) => {
                          const isMulti = e.target.checked;
                          setEditingItem({
                            ...editingItem,
                            isMultiSpeaker: isMulti,
                            speakerId: isMulti ? undefined : editingItem.speakerId,
                            speakerIds: isMulti ? editingItem.speakerIds : undefined,
                          });
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Çoklu Konuşmacı</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlık (TR)</label>
                  <input
                    type="text"
                    value={editingItem.title || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlık (EN)</label>
                  <input
                    type="text"
                    value={editingItem.title_en || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, title_en: e.target.value })}
                    placeholder="Title (English)"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
                  <select
                    value={editingItem.location || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value || undefined })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="">Seçiniz</option>
                    {PROGRAM_SESSION_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Push anımsatıcı metninde kullanılır.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Not (TR)</label>
                  <textarea
                    value={editingItem.note || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })}
                    rows={3}
                    placeholder="Enter veya &lt;br&gt; = alt satır. Kalın: &lt;b&gt;…&lt;/b&gt;"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Not görseli</label>
                  <p className="text-xs text-gray-500 mb-1">İsteğe bağlı; boş bırakılabilir.</p>
                  <input
                    type="url"
                    value={editingItem.note_image || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, note_image: e.target.value })}
                    placeholder="/uploads/images/..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-2"
                  />
                  <label className="inline-flex items-center gap-2 text-sm text-purple-primary cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingNoteImage === "edit" ? "Yükleniyor…" : "Resim yükle"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      className="hidden"
                      disabled={uploadingNoteImage === "edit"}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        setUploadingNoteImage("edit");
                        const url = await uploadNoteImageFile(file);
                        setUploadingNoteImage(null);
                        if (url) setEditingItem((prev) => (prev ? { ...prev, note_image: url } : prev));
                      }}
                    />
                  </label>
                  {editingItem.note_image ? (
                    <img
                      src={editingItem.note_image}
                      alt=""
                      className="mt-2 h-20 w-auto max-w-full rounded border object-contain"
                    />
                  ) : null}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Not (EN)</label>
                  <textarea
                    value={editingItem.note_en || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, note_en: e.target.value })}
                    rows={3}
                    placeholder="Enter or &lt;br&gt; = line break. Bold: &lt;b&gt;…&lt;/b&gt;"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Moderatör</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between max-w-md">
                        {(editingItem.moderatorIds || []).length > 0
                          ? `${(editingItem.moderatorIds || []).length} moderatör seçildi`
                          : "Konuşmacıdan moderatör seçin"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Moderatör ara..." />
                        <CommandList>
                          <CommandEmpty>Konuşmacı bulunamadı.</CommandEmpty>
                          <CommandGroup>
                            {speakers.map((s) => {
                              const isSelected = (editingItem.moderatorIds || []).includes(s.id);
                              return (
                                <CommandItem
                                  key={s.id}
                                  value={s.name}
                                  onSelect={() => {
                                    const current = editingItem.moderatorIds || [];
                                    if (isSelected) {
                                      setEditingItem({
                                        ...editingItem,
                                        moderatorIds: current.filter((id) => id !== s.id),
                                      });
                                    } else {
                                      setEditingItem({
                                        ...editingItem,
                                        moderatorIds: [...current, s.id],
                                      });
                                    }
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                  {s.name}
                                  {getSpeakerSubtitle(s) && (
                                    <span className="ml-2 text-xs text-gray-500">— {getSpeakerSubtitle(s)}</span>
                                  )}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {(editingItem.moderatorIds || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(editingItem.moderatorIds || []).map((id) => {
                        const s = speakers.find((x) => x.id === id);
                        return s ? (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm"
                          >
                            {s.name}
                            <button
                              onClick={() => {
                                setEditingItem({
                                  ...editingItem,
                                  moderatorIds: (editingItem.moderatorIds || []).filter((mid) => mid !== id),
                                });
                              }}
                              className="hover:text-purple-900"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                {!editingItem.isMultiSpeaker ? (
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konuşmacı</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between max-w-md",
                            !editingItem.speakerId && "text-muted-foreground"
                          )}
                        >
                          {editingItem.speakerId
                            ? speakers.find((s) => s.id === editingItem.speakerId)?.name || "Konuşmacı seçin"
                            : "Konuşmacı seçin"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Konuşmacı ara..." />
                          <CommandList>
                            <CommandEmpty>Konuşmacı bulunamadı.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value=""
                                onSelect={() => setEditingItem({ ...editingItem, speakerId: undefined })}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    !editingItem.speakerId ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                Break / Ara
                              </CommandItem>
                              {speakers.map((speaker) => (
                                <CommandItem
                                  key={speaker.id}
                                  value={speaker.name}
                                  onSelect={() => setEditingItem({ ...editingItem, speakerId: speaker.id })}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      editingItem.speakerId === speaker.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {speaker.name}
                                  {getSpeakerSubtitle(speaker) && (
                                    <span className="ml-2 text-xs text-gray-500">- {getSpeakerSubtitle(speaker)}</span>
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konuşmacılar</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between max-w-md">
                          {(editingItem.speakerIds || []).length > 0
                            ? `${(editingItem.speakerIds || []).length} konuşmacı seçildi`
                            : "Konuşmacı seçin"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Konuşmacı ara..." />
                          <CommandList>
                            <CommandEmpty>Konuşmacı bulunamadı.</CommandEmpty>
                            <CommandGroup>
                              {speakers.map((speaker) => {
                                const isSelected = (editingItem.speakerIds || []).includes(speaker.id);
                                return (
                                  <CommandItem
                                    key={speaker.id}
                                    value={speaker.name}
                                    onSelect={() => {
                                      const currentIds = editingItem.speakerIds || [];
                                      if (isSelected) {
                                        setEditingItem({
                                          ...editingItem,
                                          speakerIds: currentIds.filter((id) => id !== speaker.id),
                                        });
                                      } else {
                                        setEditingItem({
                                          ...editingItem,
                                          speakerIds: [...currentIds, speaker.id],
                                        });
                                      }
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {speaker.name}
                                    {speaker.title && (
                                      <span className="ml-2 text-xs text-gray-500">- {speaker.title}</span>
                                    )}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {(editingItem.speakerIds || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(editingItem.speakerIds || []).map((id) => {
                          const speaker = speakers.find((s) => s.id === id);
                          return speaker ? (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm"
                            >
                              {speaker.name}
                              <button
                                onClick={() => {
                                  setEditingItem({
                                    ...editingItem,
                                    speakerIds: (editingItem.speakerIds || []).filter((sid) => sid !== id),
                                  });
                                }}
                                className="hover:text-purple-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl shrink-0">
              <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                İptal
              </button>
              <button
                onClick={handleUpdateItem}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Year Modal */}
      {showAddYear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Yeni Yıl Ekle</h3>
              <button onClick={() => { setShowAddYear(false); setNewYear(""); setNewYearEn(""); }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yıl (Türkçe ad)</label>
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  placeholder="Örn: 2026"
                  min="2000"
                  max="2100"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddYear();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">2000-2100 arası bir yıl girin</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İngilizce ad (isteğe bağlı)</label>
                <input
                  type="text"
                  value={newYearEn}
                  onChange={(e) => setNewYearEn(e.target.value)}
                  placeholder="Örn: 2026"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Sitede İngilizce seçildiğinde bu ad gösterilir</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => { setShowAddYear(false); setNewYear(""); setNewYearEn(""); }} 
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                İptal
              </button>
              <button 
                onClick={handleAddYear}
                disabled={isUpdating || !newYear.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category (Year) Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Yıl / Kategori adını düzenle</h3>
              <button onClick={() => setEditingCategory(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Türkçe ad</label>
                <input
                  id="edit-category-name"
                  type="text"
                  defaultValue={editingCategory.name}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İngilizce ad (isteğe bağlı)</label>
                <input
                  id="edit-category-name-en"
                  type="text"
                  defaultValue={editingCategory.name_en ?? ""}
                  placeholder="Site EN dilinde gösterilecek ad"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingCategory(null)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                İptal
              </button>
              <button
                onClick={handleSaveCategoryEdit}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Day Title Modal */}
      {editingDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Gün başlığını düzenle</h3>
              <button onClick={() => setEditingDay(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Türkçe başlık</label>
                <input
                  id="edit-day-title-tr"
                  type="text"
                  defaultValue={editingDay.title}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İngilizce başlık (isteğe bağlı)</label>
                <input
                  id="edit-day-title-en"
                  type="text"
                  defaultValue={editingDay.title_en ?? editingDay.label_en ?? ""}
                  placeholder="Site EN dilinde gösterilecek gün adı"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingDay(null)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                İptal
              </button>
              <button
                onClick={handleSaveDayTitleEdit}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {showDeleteCategory && categoryToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Kategori Sil</h3>
              <button 
                onClick={() => { setShowDeleteCategory(false); setCategoryToDelete(null); }} 
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700">
                <strong>{categoryToDelete.name}</strong> kategorisini silmek istediğinize emin misiniz?
              </p>
              {(() => {
                const categoryDays = days.filter(d => d.categoryId === categoryToDelete.id);
                const dayCount = categoryDays.length;
                const itemCount = categoryDays.reduce((acc, d) => acc + d.scheduleItems.length, 0);
                
                if (dayCount > 0 || itemCount > 0) {
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800 font-medium">⚠️ Uyarı:</p>
                      <p className="text-sm text-red-700 mt-1">
                        Bu kategori <strong>{dayCount} gün</strong> ve <strong>{itemCount} program öğesi</strong> içeriyor. 
                        Kategori silindiğinde tümü kalıcı olarak silinecektir!
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => { setShowDeleteCategory(false); setCategoryToDelete(null); }} 
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                İptal
              </button>
              <button 
                onClick={handleConfirmDeleteCategory}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
