import { useState, useEffect, useRef } from "react";
import { authFetch } from "@/utils/authFetch";
import { Save, Plus, Trash2, GripVertical, ImageIcon, Type, AlignLeft, Loader2, Upload } from "lucide-react";
import { useAbout, Section } from "@/hooks/useAbout";
import { toast } from "sonner";
import { ADMIN_SAVE_SUCCESS, ADMIN_SAVE_ERROR } from "@/lib/adminMessages";

export default function AdminAbout() {
  const { data, isLoading, updateData, isUpdating } = useAbout();
  
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroTitleEn, setHeroTitleEn] = useState("");
  const [heroSubtitleEn, setHeroSubtitleEn] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [draggedSection, setDraggedSection] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState<{ sectionId: number; type: 'image' | 'image-text' } | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (data) {
      setHeroTitle(data.hero.title);
      setHeroSubtitle(data.hero.subtitle);
      setHeroTitleEn(data.hero.title_en ?? "");
      setHeroSubtitleEn(data.hero.subtitle_en ?? "");
      setSections([...data.sections].sort((a, b) => a.order - b.order));
    }
  }, [data]);

  const handleSave = () => {
    updateData({
      hero: {
        title: heroTitle,
        subtitle: heroSubtitle,
        title_en: heroTitleEn || undefined,
        subtitle_en: heroSubtitleEn || undefined,
      },
      sections: sections.map((s, idx) => ({ ...s, order: idx + 1 })),
      updatedAt: new Date().toISOString()
    }, {
      onSuccess: () => toast.success(ADMIN_SAVE_SUCCESS),
      onError: () => toast.error(ADMIN_SAVE_ERROR)
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedSection(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSection === null || draggedSection === index) return;
    
    const newSections = [...sections];
    const [draggedItem] = newSections.splice(draggedSection, 1);
    newSections.splice(index, 0, draggedItem);
    setSections(newSections);
    setDraggedSection(index);
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
  };

  const addSection = (type: Section["type"]) => {
    const maxId = Math.max(0, ...sections.map(s => s.id));
    const newSection: Section = {
      id: maxId + 1,
      type,
      order: sections.length + 1,
      ...(type === "text" && { content: "Yeni paragraf metni..." }),
      ...(type === "image" && { image: "", imageAlt: "Görsel" }),
      ...(type === "text-block" && { paragraphs: ["Yeni paragraf..."] }),
      ...(type === "image-text" && { 
        image: "", 
        imageAlt: "Görsel", 
        paragraphs: ["Yeni paragraf..."] 
      }),
    };
    setSections([...sections, newSection]);
    setEditingSection(newSection);
  };

  const deleteSection = (id: number) => {
    if (confirm("Bu bölümü silmek istediğinize emin misiniz?")) {
      setSections(sections.filter(s => s.id !== id));
      if (editingSection?.id === id) {
        setEditingSection(null);
      }
    }
  };

  const updateSectionField = (id: number, field: string, value: unknown) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
    if (editingSection?.id === id) {
      setEditingSection({ ...editingSection, [field]: value });
    }
  };

  const updateParagraph = (sectionId: number, index: number, value: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId && s.paragraphs) {
        const newParagraphs = [...s.paragraphs];
        newParagraphs[index] = value;
        return { ...s, paragraphs: newParagraphs };
      }
      return s;
    }));
  };

  const addParagraph = (sectionId: number) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, paragraphs: [...(s.paragraphs || []), "Yeni paragraf..."] };
      }
      return s;
    }));
  };

  const removeParagraph = (sectionId: number, index: number) => {
    setSections(sections.map(s => {
      if (s.id === sectionId && s.paragraphs && s.paragraphs.length > 1) {
        return { ...s, paragraphs: s.paragraphs.filter((_, i) => i !== index) };
      }
      return s;
    }));
  };

  const updateParagraphEn = (sectionId: number, index: number, value: string) => {
    setSections(sections.map(s => {
      if (s.id !== sectionId) return s;
      const paragraphsEn = s.paragraphs_en || [];
      const newEn = [...paragraphsEn];
      while (newEn.length <= index) newEn.push("");
      newEn[index] = value;
      return { ...s, paragraphs_en: newEn };
    }));
  };

  const addParagraphEn = (sectionId: number) => {
    setSections(sections.map(s => {
      if (s.id !== sectionId) return s;
      return { ...s, paragraphs_en: [...(s.paragraphs_en || []), ""] };
    }));
  };

  const removeParagraphEn = (sectionId: number, index: number) => {
    setSections(sections.map(s => {
      if (s.id !== sectionId || !s.paragraphs_en?.length) return s;
      return { ...s, paragraphs_en: s.paragraphs_en.filter((_, i) => i !== index) };
    }));
  };

  const handleImageUpload = async (sectionId: number, file: File) => {
    setUploadingImage({ sectionId, type: sections.find(s => s.id === sectionId)?.type === 'image' ? 'image' : 'image-text' });
    
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Resim yüklenirken bir hata oluştu.");
      }

      // Yüklenen resmin URL'ini ilgili bölüme ekle
      updateSectionField(sectionId, "image", data.imageUrl);
      toast.success("Resim başarıyla yüklendi!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Resim yüklenirken bir hata oluştu.");
    } finally {
      setUploadingImage(null);
    }
  };

  const handleFileSelect = (sectionId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(sectionId, file);
    }
    // Input'u temizle ki aynı dosya tekrar seçilebilsin
    if (fileInputRefs.current[sectionId]) {
      fileInputRefs.current[sectionId]!.value = "";
    }
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Hakkımızda Sayfası</h1>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-primary" />
        </div>
      </div>
    );
  }

  const getSectionTypeLabel = (type: Section["type"]) => {
    switch (type) {
      case "text": return "Metin";
      case "image": return "Görsel";
      case "text-block": return "Metin Bloğu";
      case "image-text": return "Görsel + Metin";
    }
  };

  const getSectionIcon = (type: Section["type"]) => {
    switch (type) {
      case "text": return <Type className="w-4 h-4" />;
      case "image": return <ImageIcon className="w-4 h-4" />;
      case "text-block": return <AlignLeft className="w-4 h-4" />;
      case "image-text": return <><ImageIcon className="w-4 h-4" /><Type className="w-4 h-4" /></>;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Hakkımızda Sayfası</h1>
      {/* Hero Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Hero Alanı</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlık (TR)</label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlık (EN)</label>
            <input
              type="text"
              value={heroTitleEn}
              onChange={(e) => setHeroTitleEn(e.target.value)}
              placeholder="About Us"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alt Başlık (TR)</label>
            <input
              type="text"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alt Başlık (EN)</label>
            <input
              type="text"
              value={heroSubtitleEn}
              onChange={(e) => setHeroSubtitleEn(e.target.value)}
              placeholder="Subtitle (English)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">İçerik Bölümleri</h2>
          <div className="flex gap-2">
            <button
              onClick={() => addSection("text")}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Type className="w-4 h-4" /> Metin
            </button>
            <button
              onClick={() => addSection("image")}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ImageIcon className="w-4 h-4" /> Görsel
            </button>
            <button
              onClick={() => addSection("text-block")}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <AlignLeft className="w-4 h-4" /> Blok
            </button>
            <button
              onClick={() => addSection("image-text")}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ImageIcon className="w-4 h-4" /><Type className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {sections.map((section, index) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`border rounded-lg p-4 ${draggedSection === index ? 'border-purple-primary bg-purple-50' : 'border-gray-200'}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                <div className="flex items-center gap-1 text-gray-500">
                  {getSectionIcon(section.type)}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {getSectionTypeLabel(section.type)}
                </span>
                <span className="text-xs text-gray-400">#{section.id}</span>
                <button
                  onClick={() => deleteSection(section.id)}
                  className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Text Section */}
              {section.type === "text" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Metin (TR)</label>
                    <textarea
                      value={section.content || ""}
                      onChange={(e) => updateSectionField(section.id, "content", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Metin (EN)</label>
                    <textarea
                      value={section.content_en ?? ""}
                      onChange={(e) => updateSectionField(section.id, "content_en", e.target.value)}
                      rows={3}
                      placeholder="Content (English)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Image Section */}
              {section.type === "image" && (
                <div className="grid gap-3">
                  <div className="flex items-center gap-4">
                    {section.image && (
                      <img
                        src={section.image}
                        alt={section.imageAlt || ""}
                        className="w-32 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Görsel URL</label>
                      <input
                        type="text"
                        value={section.image || ""}
                        onChange={(e) => updateSectionField(section.id, "image", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={(el) => (fileInputRefs.current[section.id] = el)}
                      onChange={(e) => handleFileSelect(section.id, e)}
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[section.id]?.click()}
                      disabled={uploadingImage?.sectionId === section.id}
                      className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingImage?.sectionId === section.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Yükleniyor...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Resim Yükle
                        </>
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Alt Metin (TR)</label>
                      <input
                        type="text"
                        value={section.imageAlt || ""}
                        onChange={(e) => updateSectionField(section.id, "imageAlt", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Alt Metin (EN)</label>
                      <input
                        type="text"
                        value={section.imageAlt_en ?? ""}
                        onChange={(e) => updateSectionField(section.id, "imageAlt_en", e.target.value)}
                        placeholder="Alt (EN)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Text Block Section */}
              {section.type === "text-block" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Paragraflar (TR)</label>
                    {section.paragraphs?.map((p, pIdx) => (
                      <div key={pIdx} className="flex gap-2 mb-2">
                        <textarea
                          value={p}
                          onChange={(e) => updateParagraph(section.id, pIdx, e.target.value)}
                          rows={2}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                        />
                        {(section.paragraphs?.length || 0) > 1 && (
                          <button
                            onClick={() => removeParagraph(section.id, pIdx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addParagraph(section.id)}
                      className="flex items-center gap-1 text-sm text-purple-primary hover:underline"
                    >
                      <Plus className="w-4 h-4" /> Paragraf Ekle
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Paragraflar (EN)</label>
                    {Array.from({ length: Math.max(1, section.paragraphs?.length ?? 0, (section.paragraphs_en ?? []).length) }, (_, pIdx) => (
                      <div key={pIdx} className="flex gap-2 mb-2">
                        <textarea
                          value={(section.paragraphs_en ?? [])[pIdx] ?? ""}
                          onChange={(e) => updateParagraphEn(section.id, pIdx, e.target.value)}
                          rows={2}
                          placeholder={`Paragraf ${pIdx + 1} (EN)`}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                        />
                        {Math.max(1, section.paragraphs?.length ?? 0, (section.paragraphs_en ?? []).length) > 1 && (
                          <button
                            onClick={() => removeParagraphEn(section.id, pIdx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addParagraphEn(section.id)}
                      className="flex items-center gap-1 text-sm text-purple-primary hover:underline"
                    >
                      <Plus className="w-4 h-4" /> Paragraf (EN) Ekle
                    </button>
                  </div>
                </div>
              )}

              {/* Image + Text Section */}
              {section.type === "image-text" && (
                <div className="grid gap-4">
                  <div className="flex items-start gap-4">
                    {section.image && (
                      <img
                        src={section.image}
                        alt={section.imageAlt || ""}
                        className="w-32 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Görsel URL</label>
                        <input
                          type="text"
                          value={section.image || ""}
                          onChange={(e) => updateSectionField(section.id, "image", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <input
                          type="file"
                          ref={(el) => (fileInputRefs.current[section.id] = el)}
                          onChange={(e) => handleFileSelect(section.id, e)}
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[section.id]?.click()}
                          disabled={uploadingImage?.sectionId === section.id}
                          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingImage?.sectionId === section.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Yükleniyor...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Resim Yükle
                            </>
                          )}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Alt Metin (TR)</label>
                          <input
                            type="text"
                            value={section.imageAlt || ""}
                            onChange={(e) => updateSectionField(section.id, "imageAlt", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Alt Metin (EN)</label>
                          <input
                            type="text"
                            value={section.imageAlt_en ?? ""}
                            onChange={(e) => updateSectionField(section.id, "imageAlt_en", e.target.value)}
                            placeholder="Alt (EN)"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Paragraflar (TR)</label>
                      {section.paragraphs?.map((p, pIdx) => (
                        <div key={pIdx} className="flex gap-2 mb-2">
                          <textarea
                            value={p}
                            onChange={(e) => updateParagraph(section.id, pIdx, e.target.value)}
                            rows={2}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                          />
                          {(section.paragraphs?.length || 0) > 1 && (
                            <button
                              onClick={() => removeParagraph(section.id, pIdx)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addParagraph(section.id)}
                        className="flex items-center gap-1 text-sm text-purple-primary hover:underline"
                      >
                        <Plus className="w-4 h-4" /> Paragraf Ekle
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Paragraflar (EN)</label>
                      {Array.from({ length: Math.max(1, section.paragraphs?.length ?? 0, (section.paragraphs_en ?? []).length) }, (_, pIdx) => (
                        <div key={pIdx} className="flex gap-2 mb-2">
                          <textarea
                            value={(section.paragraphs_en ?? [])[pIdx] ?? ""}
                            onChange={(e) => updateParagraphEn(section.id, pIdx, e.target.value)}
                            rows={2}
                            placeholder={`Paragraf ${pIdx + 1} (EN)`}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                          />
                          {Math.max(1, section.paragraphs?.length ?? 0, (section.paragraphs_en ?? []).length) > 1 && (
                            <button
                              onClick={() => removeParagraphEn(section.id, pIdx)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addParagraphEn(section.id)}
                        className="flex items-center gap-1 text-sm text-purple-primary hover:underline"
                      >
                        <Plus className="w-4 h-4" /> Paragraf (EN) Ekle
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {sections.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Henüz içerik bölümü yok.</p>
            <p className="text-sm">Yukarıdaki butonlardan ekleyebilirsiniz.</p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isUpdating}
          className="flex items-center gap-2 px-6 py-3 bg-purple-primary text-white rounded-lg hover:bg-purple-dark transition-colors disabled:opacity-50"
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
