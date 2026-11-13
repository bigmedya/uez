import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, Loader2, Filter, RefreshCw, X, Save, Upload, Pin, PinOff, ChevronUp, ChevronDown } from "lucide-react";
import { ADMIN_SAVE_SUCCESS } from "@/lib/adminMessages";
import { useAdminLogger, LOG_ACTIONS, LOG_ENTITIES } from "@/hooks/useAdminLogger";

interface Speaker {
  id: number;
  name: string;
  slug: string;
  title: string;
  titleEn?: string;
  company?: string;
  companyEn?: string;
  position?: string;
  positionEn?: string;
  photo: string;
  bio: string;
  biographyEn?: string;
  year: string;
  order: number;
  pinnedYears: string[];
  createdAt: string;
  updatedAt: string;
}

interface SpeakerFormData {
  name: string;
  slug: string;
  title: string;
  titleEn: string;
  company: string;
  companyEn: string;
  position: string;
  positionEn: string;
  photo: string;
  bio: string;
  biographyEn: string;
  year: string;
  order: number;
  pinnedYears: string[];
}

const emptyFormData: SpeakerFormData = {
  name: "",
  slug: "",
  title: "",
  titleEn: "",
  company: "",
  companyEn: "",
  position: "",
  positionEn: "",
  photo: "",
  bio: "",
  biographyEn: "",
  year: new Date().getFullYear().toString(),
  order: 0,
  pinnedYears: [],
};

function getSpeakerSubtitle(speaker: Speaker): { line1: string; line2?: string } {
  if (speaker.company && speaker.position) {
    return { line1: speaker.company, line2: speaker.position };
  }
  return { line1: speaker.title || "" };
}

export default function Speakers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [years, setYears] = useState<string[]>([]);
  const { logAction } = useAdminLogger();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [formData, setFormData] = useState<SpeakerFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchSpeakers = async () => {
    setLoading(true);
    try {
      const url = selectedYear !== "all" 
        ? `/api/speakers?year=${selectedYear}` 
        : "/api/speakers";
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        setSpeakers([]);
        const msg = data?.error || "Konuşmacılar yüklenemedi.";
        toast.error(msg);
        return;
      }

      const list = Array.isArray(data) ? data : [];
      setSpeakers(list);

      // Extract unique years
      const uniqueYears = [...new Set(list.map((s: Speaker) => s.year).filter(Boolean))].sort().reverse() as string[];
      setYears(uniqueYears);
    } catch (error) {
      console.error("Error fetching speakers:", error);
      setSpeakers([]);
      toast.error("Konuşmacılar yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpeakers();
  }, [selectedYear]);

  // Filter and sort speakers by year
  const getFilteredAndSortedSpeakers = (): Speaker[] => {
    const list = Array.isArray(speakers) ? speakers : [];
    // First filter by search term
    const searchLower = searchTerm.toLowerCase();
    let filtered = list.filter((speaker) => {
      const name = (speaker.name || "").toLowerCase();
      const title = (speaker.title || "").toLowerCase();
      const company = (speaker.company || "").toLowerCase();
      const position = (speaker.position || "").toLowerCase();
      return name.includes(searchLower) || title.includes(searchLower) || company.includes(searchLower) || position.includes(searchLower);
    });

    if (selectedYear === "all") {
      // Group by year and sort
      const speakersByYear: Record<string, Speaker[]> = {};
      
      filtered.forEach(speaker => {
        if (speaker.year) {
          const years = speaker.year.split(',').map(y => y.trim());
          years.forEach(year => {
            if (!speakersByYear[year]) {
              speakersByYear[year] = [];
            }
            speakersByYear[year].push(speaker);
          });
        }
      });

      // Sort years (newest first)
      const sortedYears = Object.keys(speakersByYear).sort((a, b) => {
        const yearA = parseInt(a) || 0;
        const yearB = parseInt(b) || 0;
        return yearB - yearA;
      });

      // Sort speakers within each year: pinned first, then alphabetically
      const sortedSpeakers: Speaker[] = [];
      sortedYears.forEach(year => {
        const yearSpeakers = speakersByYear[year];
        
        // Separate pinned and unpinned for this year
        const pinned = yearSpeakers.filter(s => s.pinnedYears?.includes(year));
        const unpinned = yearSpeakers.filter(s => !s.pinnedYears?.includes(year));
        
        pinned.sort((a, b) => {
          if (a.order !== b.order) {
            return a.order - b.order;
          }
          return a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' });
        });
        unpinned.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
        
        // Combine: pinned first, then unpinned
        sortedSpeakers.push(...pinned, ...unpinned);
      });

      return sortedSpeakers;
    } else {
      // Filter by selected year and sort
      const yearSpeakers = filtered.filter(speaker => {
        if (!speaker.year) return false;
        const years = speaker.year.split(',').map(y => y.trim());
        return years.includes(selectedYear);
      });

      // Separate pinned and unpinned
      const pinned = yearSpeakers.filter(s => s.pinnedYears?.includes(selectedYear));
      const unpinned = yearSpeakers.filter(s => !s.pinnedYears?.includes(selectedYear));
      
      // Sort pinned by order, then alphabetically; unpinned alphabetically
      pinned.sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        return a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' });
      });
      unpinned.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
      
      // Combine: pinned first, then unpinned
      return [...pinned, ...unpinned];
    }
  };

  const filteredSpeakers = getFilteredAndSortedSpeakers();

  // Helper function to check if speaker is pinned for current selected year
  const isSpeakerPinnedForYear = (speaker: Speaker): boolean => {
    if (selectedYear === "all") {
      // If "all" is selected, check if pinned for any year
      return speaker.pinnedYears && speaker.pinnedYears.length > 0;
    }
    return speaker.pinnedYears?.includes(selectedYear) || false;
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bu konuşmacıyı silmek istediğinizden emin misiniz?")) {
      try {
        const speakerToDelete = speakers.find(s => s.id === id);
        const response = await fetch(`/api/speakers/${id}`, { method: "DELETE" });
        if (response.ok) {
          setSpeakers(speakers.filter((s) => s.id !== id));
          
          // Konuşmacı silme işlemini logla
          await logAction({
            action: LOG_ACTIONS.DELETE,
            entity: LOG_ENTITIES.SPEAKER,
            entityId: id.toString(),
            details: { 
              speakerName: speakerToDelete?.name,
              year: speakerToDelete?.year
            }
          });
        }
      } catch (error) {
        console.error("Error deleting speaker:", error);
      }
    }
  };

  const togglePin = async (id: number, year?: string) => {
    try {
      // Use provided year, or current selected year, or speaker's year
      let currentYear: string;
      if (year) {
        currentYear = year;
      } else if (selectedYear === "all") {
        // Find the speaker to get their year
        const speaker = speakers.find(s => s.id === id);
        if (speaker && speaker.year) {
          // Get the first year from comma-separated years
          const years = speaker.year.split(',').map(y => y.trim());
          currentYear = years[0] || new Date().getFullYear().toString();
        } else {
          currentYear = new Date().getFullYear().toString();
        }
      } else {
        currentYear = selectedYear;
      }
      
      const response = await fetch(`/api/speakers/${id}/toggle-pin/${currentYear}`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      if (response.ok) {
        const updatedSpeaker = await response.json();
        setSpeakers(speakers.map((s) => s.id === id ? updatedSpeaker : s));
      } else {
        const error = await response.json();
        console.error('Pin toggle error:', error);
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  const changeSpeakerOrder = async (speakerId: number, direction: 'up' | 'down', year?: string) => {
    try {
      const currentYear = year || selectedYear;
      if (currentYear === "all") return;

      // Get current pinned speakers for this year
      const yearSpeakers = speakers.filter(speaker => {
        if (!speaker.year) return false;
        const years = speaker.year.split(',').map(y => y.trim());
        return years.includes(currentYear);
      });

      const pinnedSpeakers = yearSpeakers
        .filter(s => s.pinnedYears?.includes(currentYear))
        .sort((a, b) => a.order - b.order);

      const currentIndex = pinnedSpeakers.findIndex(s => s.id === speakerId);
      if (currentIndex === -1) return;

      let targetIndex: number;
      if (direction === 'up' && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      } else if (direction === 'down' && currentIndex < pinnedSpeakers.length - 1) {
        targetIndex = currentIndex + 1;
      } else {
        return; // Can't move further
      }

      const currentSpeaker = pinnedSpeakers[currentIndex];
      const targetSpeaker = pinnedSpeakers[targetIndex];

      // Swap orders
      const tempOrder = currentSpeaker.order;
      
      // Update both speakers
      const updates = [
        fetch(`/api/speakers/${currentSpeaker.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: targetSpeaker.order }),
        }),
        fetch(`/api/speakers/${targetSpeaker.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: tempOrder }),
        })
      ];

      const responses = await Promise.all(updates);
      
      if (responses.every(r => r.ok)) {
        const updatedSpeakers = await Promise.all(responses.map(r => r.json()));
        
        // Update local state
        setSpeakers(prevSpeakers => 
          prevSpeakers.map(s => {
            const updated = updatedSpeakers.find(us => us.id === s.id);
            return updated || s;
          })
        );
        
        toast.success("Sıralama güncellendi");
      }
    } catch (error) {
      console.error("Error changing speaker order:", error);
      toast.error("Sıralama güncellenirken hata oluştu");
    }
  };

  const openNewModal = () => {
    setEditingSpeaker(null);
    setFormData(emptyFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (speaker: Speaker) => {
    setEditingSpeaker(speaker);
    const hasNewFormat = speaker.company && speaker.position;
    const raw = speaker as Speaker & { title_en?: string; position_en?: string; company_en?: string; biography_en?: string };
    const titleEnVal = speaker.titleEn ?? raw.title_en ?? "";
    const positionEnVal = speaker.positionEn ?? raw.position_en ?? "";
    const companyEnVal = speaker.companyEn ?? raw.company_en ?? "";
    const biographyEnVal = speaker.biographyEn ?? raw.biography_en ?? "";
    const titleTr = speaker.title ?? "";
    const positionEnDisplay = hasNewFormat ? positionEnVal : (titleEnVal || titleTr);
    setFormData({
      name: speaker.name,
      slug: speaker.slug,
      title: titleTr,
      titleEn: titleEnVal,
      company: speaker.company ?? "",
      companyEn: companyEnVal,
      position: hasNewFormat ? (speaker.position ?? "") : titleTr,
      positionEn: positionEnDisplay,
      photo: speaker.photo,
      bio: speaker.bio,
      biographyEn: biographyEnVal,
      year: speaker.year,
      order: speaker.order,
      pinnedYears: speaker.pinnedYears || [],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSpeaker(null);
    setFormData(emptyFormData);
    setSelectedFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Preview için URL oluştur
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData({ ...formData, photo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });

      const raw = await response.text();
      let data: { imageUrl?: string; error?: string } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
      }

      if (!response.ok) {
        throw new Error(
          data.error || `Yükleme başarısız (${response.status})`,
        );
      }

      if (!data.imageUrl) {
        throw new Error(data.error || "Sunucu yanıtı geçersiz.");
      }
      return data.imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Resim yüklenirken bir hata oluştu.",
      );
      return null;
    } finally {
      setUploading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.year || formData.year.trim() === '') {
      alert('Lütfen en az bir yıl seçiniz.');
      return;
    }

    if (!editingSpeaker && (!formData.company?.trim() || !formData.position?.trim())) {
      alert('Yeni konuşmacı için Şirket ve Pozisyon alanları zorunludur.');
      return;
    }
    
    setSaving(true);

    try {
      // Eğer dosya seçildiyse önce upload et
      let photoUrl = formData.photo;
      if (selectedFile) {
        const uploadedUrl = await handleUpload();
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        } else {
          setSaving(false);
          return; // Upload başarısız olduysa işlemi durdur
        }
      }

      const submitData = {
        ...formData,
        photo: photoUrl,
        company: formData.company?.trim() || undefined,
        companyEn: formData.companyEn?.trim() || undefined,
        position: formData.position?.trim() || undefined,
        positionEn: formData.positionEn?.trim() || undefined,
      };

      if (editingSpeaker) {
        // Update existing speaker
        const response = await fetch(`/api/speakers/${editingSpeaker.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });
        
        if (response.ok) {
          const updated = await response.json();
          setSpeakers(speakers.map((s) => (s.id === editingSpeaker.id ? updated : s)));
          closeModal();
          toast.success(ADMIN_SAVE_SUCCESS);
          
          // Konuşmacı güncelleme işlemini logla
          await logAction({
            action: LOG_ACTIONS.UPDATE,
            entity: LOG_ENTITIES.SPEAKER,
            entityId: editingSpeaker.id.toString(),
            details: { 
              speakerName: submitData.name,
              year: submitData.year
            }
          });
        }
      } else {
        // Create new speaker
        const response = await fetch("/api/speakers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });
        
        if (response.ok) {
          const newSpeaker = await response.json();
          setSpeakers([...speakers, newSpeaker]);
          closeModal();
          toast.success(ADMIN_SAVE_SUCCESS);
          
          // Konuşmacı ekleme işlemini logla
          await logAction({
            action: LOG_ACTIONS.CREATE,
            entity: LOG_ENTITIES.SPEAKER,
            entityId: newSpeaker.id.toString(),
            details: { 
              speakerName: submitData.name,
              year: submitData.year
            }
          });
        }
      }
    } catch (error) {
      console.error("Error saving speaker:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Konuşmacılar</h1>
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Konuşmacı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            >
              <option value="all">Tüm Yıllar</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchSpeakers}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </button>
          <button 
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Konuşmacı
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 flex gap-4 text-sm text-gray-600">
        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
          Toplam: {speakers.length} konuşmacı
        </span>
        {selectedYear !== "all" && (
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
            {selectedYear}: {filteredSpeakers.length} konuşmacı
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-primary" />
        </div>
      ) : (
        /* Speakers Grid */
        selectedYear === "all" ? (
          // Group by year when "all" is selected
          (() => {
            const speakersByYear: Record<string, Speaker[]> = {};
            filteredSpeakers.forEach(speaker => {
              if (speaker.year) {
                const years = speaker.year.split(',').map(y => y.trim());
                years.forEach(year => {
                  if (!speakersByYear[year]) {
                    speakersByYear[year] = [];
                  }
                  if (!speakersByYear[year].find(s => s.id === speaker.id)) {
                    speakersByYear[year].push(speaker);
                  }
                });
              }
            });

            const sortedYears = Object.keys(speakersByYear).sort((a, b) => {
              const yearA = parseInt(a) || 0;
              const yearB = parseInt(b) || 0;
              return yearB - yearA;
            });

            return (
              <div className="space-y-8">
                {sortedYears.map(year => (
                  <div key={year}>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                      {year} Yılı
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({speakersByYear[year].length} konuşmacı)
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {speakersByYear[year].map((speaker) => {
                        const isPinnedForYear = speaker.pinnedYears?.includes(year) || false;
                        return (
                          <div key={speaker.id} className={`bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow relative ${isPinnedForYear ? 'ring-2 ring-purple-primary ring-opacity-50' : ''}`}>
              {/* Pin Indicator */}
              {isPinnedForYear && (
                <div className="absolute top-2 right-2 z-10">
                  <Pin className="w-4 h-4 text-purple-primary fill-purple-primary" />
                </div>
              )}
              
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <img
                    src={speaker.photo || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop"}
                    alt={speaker.name}
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 min-h-[2rem]">
                      <h3 className="font-semibold text-gray-800 truncate">{speaker.name}</h3>
                      {isPinnedForYear && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                          Sabitli
                        </span>
                      )}
                    </div>
                    {(() => {
                      const sub = getSpeakerSubtitle(speaker);
                      return (
                        <>
                          <p className="text-sm text-purple-primary truncate">{sub.line1}</p>
                          {sub.line2 && <p className="text-sm text-gray-600 truncate">{sub.line2}</p>}
                        </>
                      );
                    })()}
                    <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {speaker.year ? speaker.year.split(',').map(y => y.trim()).join(', ') : 'Yıl yok'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 bg-gray-50 flex justify-between gap-2">
                <div className="flex gap-1">
                  <button 
                    onClick={() => togglePin(speaker.id, year)}
                    className={`p-2 rounded-lg transition-colors ${isPinnedForYear 
                      ? 'text-purple-primary bg-purple-100 hover:bg-purple-200' 
                      : 'text-gray-500 hover:bg-gray-100 hover:text-purple-primary'
                    }`}
                    title={isPinnedForYear ? `${year} yılı için sabitlemeyi kaldır` : `${year} yılı için sabitle`}
                  >
                    {isPinnedForYear ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                  {isPinnedForYear && (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => changeSpeakerOrder(speaker.id, 'up', year)}
                        className="p-2 text-gray-600 hover:bg-gray-100 hover:text-purple-primary rounded-lg transition-colors"
                        title="Yukarı taşı"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => changeSpeakerOrder(speaker.id, 'down', year)}
                        className="p-2 text-gray-600 hover:bg-gray-100 hover:text-purple-primary rounded-lg transition-colors"
                        title="Aşağı taşı"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEditModal(speaker)}
                    className="p-2 text-purple-primary hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(speaker.id)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()
        ) : (
          // Single year view
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSpeakers.map((speaker) => {
              const isPinnedForYear = isSpeakerPinnedForYear(speaker);
              return (
              <div key={speaker.id} className={`bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow relative ${isPinnedForYear ? 'ring-2 ring-purple-primary ring-opacity-50' : ''}`}>
                {/* Pin Indicator */}
                {isPinnedForYear && (
                  <div className="absolute top-2 right-2 z-10">
                    <Pin className="w-4 h-4 text-purple-primary fill-purple-primary" />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={speaker.photo || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop"}
                      alt={speaker.name}
                      className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 min-h-[2rem]">
                        <h3 className="font-semibold text-gray-800 truncate">{speaker.name}</h3>
                        {isPinnedForYear && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                            Sabitli
                          </span>
                        )}
                      </div>
                      {(() => {
                        const sub = getSpeakerSubtitle(speaker);
                        return (
                          <>
                            <p className="text-sm text-purple-primary truncate">{sub.line1}</p>
                            {sub.line2 && <p className="text-sm text-gray-600 truncate">{sub.line2}</p>}
                          </>
                        );
                      })()}
                      <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {speaker.year ? speaker.year.split(',').map(y => y.trim()).join(', ') : 'Yıl yok'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 bg-gray-50 flex justify-between gap-2">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => togglePin(speaker.id, selectedYear)}
                      className={`p-2 rounded-lg transition-colors ${isPinnedForYear 
                        ? 'text-purple-primary bg-purple-100 hover:bg-purple-200' 
                        : 'text-gray-500 hover:bg-gray-100 hover:text-purple-primary'
                      }`}
                      title={isPinnedForYear ? `${selectedYear} yılı için sabitlemeyi kaldır` : `${selectedYear} yılı için sabitle`}
                    >
                      {isPinnedForYear ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>
                    {isPinnedForYear && (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => changeSpeakerOrder(speaker.id, 'up', selectedYear)}
                          className="p-2 text-gray-600 hover:bg-gray-100 hover:text-purple-primary rounded-lg transition-colors"
                          title="Yukarı taşı"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => changeSpeakerOrder(speaker.id, 'down', selectedYear)}
                          className="p-2 text-gray-600 hover:bg-gray-100 hover:text-purple-primary rounded-lg transition-colors"
                          title="Aşağı taşı"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEditModal(speaker)}
                      className="p-2 text-purple-primary hover:bg-purple-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(speaker.id)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )
      )}

      {/* Empty State */}
      {!loading && filteredSpeakers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Konuşmacı bulunamadı.</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingSpeaker ? "Konuşmacı Düzenle" : "Yeni Konuşmacı"}
              </h2>
              <button 
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    placeholder="Konuşmacı adı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent bg-gray-50"
                    placeholder="otomatik-olusturulur"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şirket (TR) *
                  </label>
                  <input
                    type="text"
                    required={!editingSpeaker}
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    placeholder="Şirket adı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şirket (EN)
                  </label>
                  <input
                    type="text"
                    value={formData.companyEn}
                    onChange={(e) => setFormData({ ...formData, companyEn: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    placeholder="Company name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pozisyon / Ünvan (TR) *
                  </label>
                  <input
                    type="text"
                    required={!editingSpeaker}
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    placeholder="CEO, Yönetim Kurulu Başkanı..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pozisyon / Ünvan (EN)
                  </label>
                  <input
                    type="text"
                    value={formData.positionEn}
                    onChange={(e) => setFormData({ ...formData, positionEn: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    placeholder="CEO, Chairman..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yıl (Birden fazla seçebilirsiniz)
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                    {Array.from({ length: 2026 - 2015 + 1 }, (_, i) => 2026 - i).map((year) => {
                      const yearStr = year.toString();
                      const selectedYears = formData.year ? formData.year.split(',').map(y => y.trim()) : [];
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
                              setFormData({ ...formData, year: newYears.join(',') });
                            }}
                            className="w-4 h-4 text-purple-primary border-gray-300 rounded focus:ring-purple-primary"
                          />
                          <span className="text-sm text-gray-700">{year}</span>
                        </label>
                      );
                    })}
                  </div>
                  {formData.year && (
                    <p className="text-xs text-gray-500 mt-2">
                      Seçili yıllar: {formData.year.split(',').map(y => y.trim()).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fotoğraf
                </label>
                <div className="space-y-3">
                  {/* Upload Input */}
                  <div>
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {selectedFile ? selectedFile.name : "Dosya Seç"}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                    {uploading && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Yükleniyor...
                      </p>
                    )}
                  </div>
                  
                  {/* URL Input */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">veya URL girin:</p>
                    <input
                      type="text"
                      value={selectedFile ? "" : formData.photo}
                      onChange={(e) => {
                        setFormData({ ...formData, photo: e.target.value });
                        setSelectedFile(null);
                      }}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                      placeholder="https://..."
                      disabled={!!selectedFile}
                    />
                  </div>
                  
                  {/* Preview */}
                  {formData.photo && (
                    <div className="mt-2">
                      <img 
                        src={formData.photo} 
                        alt="Preview" 
                        className="w-20 h-20 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biyografi (TR)
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                  placeholder="Konuşmacı hakkında bilgi..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biyografi (EN)
                </label>
                <textarea
                  value={formData.biographyEn}
                  onChange={(e) => setFormData({ ...formData, biographyEn: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                  placeholder="Speaker biography in English..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sıralama
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Pin className="w-4 h-4 text-purple-primary" />
                  Sabitlenmiş Yıllar (seçilen yıllarda en üstte gösterilir)
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {years.map((year) => (
                    <label key={year} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.pinnedYears.includes(year)}
                        onChange={(e) => {
                          let newPinnedYears: string[];
                          if (e.target.checked) {
                            newPinnedYears = [...formData.pinnedYears, year];
                          } else {
                            newPinnedYears = formData.pinnedYears.filter(y => y !== year);
                          }
                          setFormData({ ...formData, pinnedYears: newPinnedYears });
                        }}
                        className="w-4 h-4 text-purple-primary border-gray-300 rounded focus:ring-purple-primary"
                      />
                      <span className="text-sm text-gray-700">{year}</span>
                    </label>
                  ))}
                </div>
                {formData.pinnedYears.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Sabitlenmiş yıllar: {formData.pinnedYears.join(', ')}
                  </p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingSpeaker ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
