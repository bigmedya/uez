import { useState, useEffect } from "react";
import { Save, Plus, Trash2, GripVertical, MapPin, Phone, Mail, Clock, Megaphone, Loader2 } from "lucide-react";
import { useContact, ContactCard, Subject } from "@/hooks/useContact";
import { toast } from "sonner";
import { ADMIN_SAVE_SUCCESS, ADMIN_SAVE_ERROR } from "@/lib/adminMessages";

const iconOptions = [
  { value: "location", label: "Konum", icon: MapPin },
  { value: "phone", label: "Telefon", icon: Phone },
  { value: "email", label: "E-posta", icon: Mail },
  { value: "clock", label: "Saat", icon: Clock },
  { value: "press", label: "Basın İletişim", icon: Megaphone },
];

export default function AdminContact() {
  const { data, isLoading, updateData, isUpdating } = useContact();
  
  // Hero
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroTitleEn, setHeroTitleEn] = useState("");
  const [heroSubtitleEn, setHeroSubtitleEn] = useState("");
  
  // Info Section
  const [infoTitle, setInfoTitle] = useState("");
  const [infoDescription, setInfoDescription] = useState("");
  const [infoTitleEn, setInfoTitleEn] = useState("");
  const [infoDescriptionEn, setInfoDescriptionEn] = useState("");
  
  // Contact Cards
  const [cards, setCards] = useState<ContactCard[]>([]);
  const [draggedCard, setDraggedCard] = useState<number | null>(null);
  
  // Form Section
  const [formTitle, setFormTitle] = useState("");
  const [formButtonText, setFormButtonText] = useState("");
  const [formSuccessMessage, setFormSuccessMessage] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formButtonTextEn, setFormButtonTextEn] = useState("");
  const [formSuccessMessageEn, setFormSuccessMessageEn] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Map Section
  const [mapTitle, setMapTitle] = useState("");
  const [mapImage, setMapImage] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueDetails, setVenueDetails] = useState("");
  const [mapTitleEn, setMapTitleEn] = useState("");
  const [venueNameEn, setVenueNameEn] = useState("");
  const [venueDetailsEn, setVenueDetailsEn] = useState("");
  const [mapEmbedUrl, setMapEmbedUrl] = useState("");

  useEffect(() => {
    if (data) {
      setHeroTitle(data.hero?.title || "");
      setHeroSubtitle(data.hero?.subtitle || "");
      setHeroTitleEn((data.hero as any)?.title_en || "");
      setHeroSubtitleEn((data.hero as any)?.subtitle_en || "");
      setInfoTitle(data.infoSection?.title || "");
      setInfoDescription(data.infoSection?.description || "");
      setInfoTitleEn((data.infoSection as any)?.title_en || "");
      setInfoDescriptionEn((data.infoSection as any)?.description_en || "");
      setCards([...(data.contactCards || [])].sort((a, b) => a.order - b.order));
      setFormTitle(data.formSection?.title || "");
      setFormButtonText(data.formSection?.buttonText || "");
      setFormSuccessMessage(data.formSection?.successMessage || "");
      setFormTitleEn((data.formSection as any)?.title_en || "");
      setFormButtonTextEn((data.formSection as any)?.buttonText_en || "");
      setFormSuccessMessageEn((data.formSection as any)?.successMessage_en || "");
      setSubjects(data.formSection?.subjects || []);
      setMapTitle(data.mapSection?.title || "");
      setMapImage(data.mapSection?.image || "");
      setVenueName(data.mapSection?.venueName || "");
      setVenueDetails(data.mapSection?.venueDetails || "");
      setMapTitleEn((data.mapSection as any)?.title_en || "");
      setVenueNameEn((data.mapSection as any)?.venueName_en || "");
      setVenueDetailsEn((data.mapSection as any)?.venueDetails_en || "");
      setMapEmbedUrl(data.mapSection?.embedUrl || "");
    }
  }, [data]);

  const handleSave = () => {
    updateData({
      hero: { title: heroTitle, subtitle: heroSubtitle, title_en: heroTitleEn || undefined, subtitle_en: heroSubtitleEn || undefined },
      infoSection: { title: infoTitle, description: infoDescription, title_en: infoTitleEn || undefined, description_en: infoDescriptionEn || undefined },
      contactCards: cards.map((c, idx) => ({ ...c, order: idx + 1 })),
      formSection: {
        title: formTitle,
        buttonText: formButtonText,
        successMessage: formSuccessMessage,
        title_en: formTitleEn || undefined,
        buttonText_en: formButtonTextEn || undefined,
        successMessage_en: formSuccessMessageEn || undefined,
        subjects,
      },
      mapSection: {
        title: mapTitle,
        image: mapImage,
        venueName,
        venueDetails,
        title_en: mapTitleEn || undefined,
        venueName_en: venueNameEn || undefined,
        venueDetails_en: venueDetailsEn || undefined,
        embedUrl: mapEmbedUrl,
      },
      updatedAt: new Date().toISOString()
    }, {
      onSuccess: () => toast.success(ADMIN_SAVE_SUCCESS),
      onError: () => toast.error(ADMIN_SAVE_ERROR)
    });
  };

  // Card management
  const addCard = () => {
    const maxId = Math.max(0, ...cards.map(c => c.id));
    const newCard: ContactCard = {
      id: maxId + 1,
      icon: "location",
      title: "Yeni Kart",
      lines: ["Satır 1"],
      color: "purple",
      order: cards.length + 1
    };
    setCards([...cards, newCard]);
  };

  const deleteCard = (id: number) => {
    if (confirm("Bu kartı silmek istediğinize emin misiniz?")) {
      setCards(cards.filter(c => c.id !== id));
    }
  };

  const updateCard = (id: number, field: keyof ContactCard, value: unknown) => {
    setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const updateCardLine = (cardId: number, lineIndex: number, value: string) => {
    setCards(cards.map(c => {
      if (c.id === cardId) {
        const newLines = [...c.lines];
        newLines[lineIndex] = value;
        return { ...c, lines: newLines };
      }
      return c;
    }));
  };

  const updateCardLineEn = (cardId: number, lineIndex: number, value: string) => {
    setCards(cards.map(c => {
      if (c.id === cardId) {
        const linesEn = c.lines_en || [];
        const newLinesEn = [...linesEn];
        while (newLinesEn.length <= lineIndex) newLinesEn.push("");
        newLinesEn[lineIndex] = value;
        return { ...c, lines_en: newLinesEn };
      }
      return c;
    }));
  };

  const addCardLineEn = (cardId: number) => {
    setCards(cards.map(c => {
      if (c.id === cardId) {
        const linesEn = c.lines_en || [];
        return { ...c, lines_en: [...linesEn, ""] };
      }
      return c;
    }));
  };

  const removeCardLineEn = (cardId: number, lineIndex: number) => {
    setCards(cards.map(c => {
      if (c.id === cardId && (c.lines_en || []).length > 0) {
        return { ...c, lines_en: (c.lines_en || []).filter((_, i) => i !== lineIndex) };
      }
      return c;
    }));
  };

  const addCardLine = (cardId: number) => {
    setCards(cards.map(c => {
      if (c.id === cardId) {
        return { ...c, lines: [...c.lines, "Yeni satır"] };
      }
      return c;
    }));
  };

  const removeCardLine = (cardId: number, lineIndex: number) => {
    setCards(cards.map(c => {
      if (c.id === cardId && c.lines.length > 1) {
        return { ...c, lines: c.lines.filter((_, i) => i !== lineIndex) };
      }
      return c;
    }));
  };

  // Drag and drop for cards
  const handleDragStart = (index: number) => setDraggedCard(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCard === null || draggedCard === index) return;
    const newCards = [...cards];
    const [draggedItem] = newCards.splice(draggedCard, 1);
    newCards.splice(index, 0, draggedItem);
    setCards(newCards);
    setDraggedCard(index);
  };
  const handleDragEnd = () => setDraggedCard(null);

  // Subject management
  const addSubject = () => {
    setSubjects([...subjects, { value: `konu_${Date.now()}`, label: "Yeni Konu" }]);
  };

  const updateSubject = (index: number, field: keyof Subject, value: string) => {
    const newSubjects = [...subjects];
    newSubjects[index] = { ...newSubjects[index], [field]: value };
    setSubjects(newSubjects);
  };
  const updateSubjectEn = (index: number, field: "label_en", value: string) => {
    const newSubjects = [...subjects];
    newSubjects[index] = { ...newSubjects[index], [field]: value };
    setSubjects(newSubjects);
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Bize Ulaşın Sayfası</h1>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Bize Ulaşın Sayfası</h1>
      {/* Hero Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Hero Alanı</h2>
        <div className="grid gap-4">
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
              placeholder="Title (English)"
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

      {/* Info Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">İletişim Bilgileri Bölümü</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bölüm Başlığı (TR)</label>
            <input
              type="text"
              value={infoTitle}
              onChange={(e) => setInfoTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bölüm Başlığı (EN)</label>
            <input
              type="text"
              value={infoTitleEn}
              onChange={(e) => setInfoTitleEn(e.target.value)}
              placeholder="Section title (English)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama (TR)</label>
            <textarea
              value={infoDescription}
              onChange={(e) => setInfoDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama (EN)</label>
            <textarea
              value={infoDescriptionEn}
              onChange={(e) => setInfoDescriptionEn(e.target.value)}
              rows={3}
              placeholder="Description (English)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Contact Cards */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">İletişim Kartları</h2>
          <button
            onClick={addCard}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-primary text-white rounded-lg hover:bg-purple-dark"
          >
            <Plus className="w-4 h-4" /> Kart Ekle
          </button>
        </div>

        <div className="space-y-4">
          {cards.map((card, index) => {
            const IconComponent = iconOptions.find(i => i.value === card.icon)?.icon || MapPin;
            return (
              <div
                key={card.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`border rounded-lg p-4 ${draggedCard === index ? 'border-purple-primary bg-purple-50' : 'border-gray-200'}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                  <IconComponent className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{card.title}</span>
                  <button
                    onClick={() => deleteCard(card.id)}
                    className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">İkon</label>
                    <select
                      value={card.icon}
                      onChange={(e) => updateCard(card.id, "icon", e.target.value as ContactCard["icon"])}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      {iconOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Başlık (TR)</label>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => updateCard(card.id, "title", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Başlık (EN)</label>
                    <input
                      type="text"
                      value={card.title_en || ""}
                      onChange={(e) => updateCard(card.id, "title_en", e.target.value)}
                      placeholder="Title (EN)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Renk</label>
                    <select
                      value={card.color}
                      onChange={(e) => updateCard(card.id, "color", e.target.value as ContactCard["color"])}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="purple">Mor</option>
                      <option value="orange">Turuncu</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs text-gray-500">Satırlar (TR)</label>
                  {card.lines.map((line, lineIdx) => (
                    <div key={lineIdx} className="flex gap-2">
                      <input
                        type="text"
                        value={line}
                        onChange={(e) => updateCardLine(card.id, lineIdx, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                      {card.lines.length > 1 && (
                        <button
                          onClick={() => removeCardLine(card.id, lineIdx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addCardLine(card.id)}
                    className="text-sm text-purple-primary hover:underline"
                  >
                    + Satır Ekle
                  </button>
                </div>
                <div className="space-y-2 mt-3">
                  <label className="block text-xs text-gray-500">Satırlar (EN)</label>
                  {Array.from({ length: Math.max(1, card.lines.length, (card.lines_en || []).length) }, (_, lineIdx) => (
                    <div key={lineIdx} className="flex gap-2">
                      <input
                        type="text"
                        value={(card.lines_en || [])[lineIdx] ?? ""}
                        onChange={(e) => updateCardLineEn(card.id, lineIdx, e.target.value)}
                        placeholder={`Satır ${lineIdx + 1} (EN)`}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                      {Math.max(1, card.lines.length, (card.lines_en || []).length) > 1 && (
                        <button
                          onClick={() => removeCardLineEn(card.id, lineIdx)}
                          type="button"
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addCardLineEn(card.id)}
                    type="button"
                    className="text-sm text-purple-primary hover:underline"
                  >
                    + Satır (EN) Ekle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">İletişim Formu Ayarları</h2>
        <div className="grid gap-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Form Başlığı (TR)</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Form Başlığı (EN)</label>
              <input
                type="text"
                value={formTitleEn}
                onChange={(e) => setFormTitleEn(e.target.value)}
                placeholder="Form title (English)"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gönder Butonu Metni (TR)</label>
              <input
                type="text"
                value={formButtonText}
                onChange={(e) => setFormButtonText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gönder Butonu Metni (EN)</label>
              <input
                type="text"
                value={formButtonTextEn}
                onChange={(e) => setFormButtonTextEn(e.target.value)}
                placeholder="Button text (English)"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başarı Mesajı (TR)</label>
            <textarea
              value={formSuccessMessage}
              onChange={(e) => setFormSuccessMessage(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başarı Mesajı (EN)</label>
            <textarea
              value={formSuccessMessageEn}
              onChange={(e) => setFormSuccessMessageEn(e.target.value)}
              rows={2}
              placeholder="Success message (English)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Subjects */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Konu Seçenekleri</label>
            <button
              onClick={addSubject}
              className="text-sm text-purple-primary hover:underline"
            >
              + Konu Ekle
            </button>
          </div>
          <div className="space-y-2">
            {subjects.map((subject, idx) => (
              <div key={idx} className="flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  value={subject.value}
                  onChange={(e) => updateSubject(idx, "value", e.target.value)}
                  placeholder="Değer"
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={subject.label}
                  onChange={(e) => updateSubject(idx, "label", e.target.value)}
                  placeholder="Etiket (TR)"
                  className="flex-1 min-w-[120px] px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={subject.label_en || ""}
                  onChange={(e) => updateSubjectEn(idx, "label_en", e.target.value)}
                  placeholder="Etiket (EN)"
                  className="flex-1 min-w-[120px] px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <button
                  onClick={() => removeSubject(idx)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Harita Bölümü</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bölüm Başlığı (TR)</label>
            <input
              type="text"
              value={mapTitle}
              onChange={(e) => setMapTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bölüm Başlığı (EN)</label>
            <input
              type="text"
              value={mapTitleEn}
              onChange={(e) => setMapTitleEn(e.target.value)}
              placeholder="Section title (English)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Görsel URL</label>
            <input
              type="text"
              value={mapImage}
              onChange={(e) => setMapImage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              placeholder="https://..."
            />
          </div>
          {mapImage && (
            <img src={mapImage} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harita Embed URL (Google Maps iframe src)</label>
            <input
              type="text"
              value={mapEmbedUrl}
              onChange={(e) => setMapEmbedUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            <p className="text-xs text-gray-500 mt-1">Google Maps'ten "Haritayı paylaş" → "Haritayı yerleştir" ile iframe URL'ini alın</p>
          </div>
          {mapEmbedUrl && (
            <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200">
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mekan Adı (TR)</label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mekan Adı (EN)</label>
              <input
                type="text"
                value={venueNameEn}
                onChange={(e) => setVenueNameEn(e.target.value)}
                placeholder="Venue name (English)"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mekan Detayları (TR)</label>
              <input
                type="text"
                value={venueDetails}
                onChange={(e) => setVenueDetails(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mekan Detayları (EN)</label>
              <input
                type="text"
                value={venueDetailsEn}
                onChange={(e) => setVenueDetailsEn(e.target.value)}
                placeholder="Venue details (English)"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
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
