import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { Save, Plus, Edit, Trash2, ChevronUp, ChevronDown, Loader2, Image } from "lucide-react";
import { useUez2026, type TopicRaw, type HeroDataRaw, type IntroDataRaw, type TopicsSectionDataRaw } from "@/hooks/useUez2026";
import { toast } from "sonner";
import { ADMIN_SAVE_SUCCESS } from "@/lib/adminMessages";

export default function Uez2026() {
  const {
    data,
    hero,
    intro,
    topicsSection,
    topics,
    isLoading,
    updateHero,
    updateIntro,
    updateTopicsSection,
    addTopic,
    updateTopic,
    deleteTopic,
    reorderTopics,
    isUpdating,
  } = useUez2026();

  const [heroForm, setHeroForm] = useState<HeroDataRaw>({
    title_tr: "",
    title_en: "",
    subtitle_tr: "",
    subtitle_en: "",
    location_tr: "",
    location_en: "",
  });
  const [introForm, setIntroForm] = useState<IntroDataRaw>({ paragraphs: [] });
  const [topicsSectionForm, setTopicsSectionForm] = useState<TopicsSectionDataRaw>({
    titleLine1_tr: "",
    titleLine1_en: "",
    titleLine2_tr: "",
    titleLine2_en: "",
  });
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [topicForm, setTopicForm] = useState<
    Omit<TopicRaw, "id" | "order"> & { id?: number; order?: number }
  >({
    title_tr: "",
    title_en: "",
    description_tr: "",
    description_en: "",
    image: "",
    active: true,
  });

  useEffect(() => {
    if (hero) setHeroForm(hero);
  }, [hero]);
  useEffect(() => {
    if (intro) setIntroForm(intro);
  }, [intro]);
  useEffect(() => {
    if (topicsSection) setTopicsSectionForm(topicsSection);
  }, [topicsSection]);

  const handleSaveHero = () => {
    updateHero(heroForm, {
      onSuccess: () => toast.success(ADMIN_SAVE_SUCCESS),
      onError: () => toast.error("Hata oluştu"),
    });
  };

  const handleSaveIntro = () => {
    updateIntro(introForm, {
      onSuccess: () => toast.success(ADMIN_SAVE_SUCCESS),
      onError: () => toast.error("Hata oluştu"),
    });
  };

  const handleSaveTopicsSection = () => {
    updateTopicsSection(topicsSectionForm, {
      onSuccess: () => toast.success(ADMIN_SAVE_SUCCESS),
      onError: () => toast.error("Hata oluştu"),
    });
  };

  const handleAddTopic = () => {
    if (!topicForm.title_tr?.trim() && !topicForm.title_en?.trim()) {
      toast.error("TR veya EN konu başlığı gerekli");
      return;
    }
    addTopic(topicForm, {
      onSuccess: () => {
        toast.success("Konu eklendi");
        setTopicForm({
          title_tr: "",
          title_en: "",
          description_tr: "",
          description_en: "",
          image: "",
          active: true,
        });
        setShowAddTopic(false);
      },
      onError: () => toast.error("Konu eklenemedi"),
    });
  };

  const handleUpdateTopic = (id: number) => {
    updateTopic(
      {
        id,
        updates: {
          title_tr: topicForm.title_tr,
          title_en: topicForm.title_en,
          description_tr: topicForm.description_tr,
          description_en: topicForm.description_en,
          image: topicForm.image,
          active: topicForm.active,
        },
      },
      {
        onSuccess: () => {
          toast.success("Konu güncellendi");
          setTopicForm({
            title_tr: "",
            title_en: "",
            description_tr: "",
            description_en: "",
            image: "",
            active: true,
          });
          setEditingTopicId(null);
        },
        onError: () => toast.error("Konu güncellenemedi"),
      }
    );
  };

  const handleDeleteTopic = (id: number, title: string) => {
    const label = title || `#${id}`;
    if (!confirm(`"${label}" konusunu silmek istediğinizden emin misiniz?`)) return;
    deleteTopic(id, {
      onSuccess: () => toast.success("Konu silindi"),
      onError: () => toast.error("Konu silinemedi"),
    });
  };

  const startEditTopic = (topic: TopicRaw) => {
    setEditingTopicId(topic.id);
    setTopicForm({
      title_tr: topic.title_tr,
      title_en: topic.title_en,
      description_tr: topic.description_tr,
      description_en: topic.description_en,
      image: topic.image,
      active: topic.active,
    });
  };

  const moveTopic = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === topics.length - 1) return;
    const newOrder = [...topics];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    reorderTopics(
      newOrder.map((t) => t.id),
      {
        onSuccess: () => toast.success("Sıralama güncellendi"),
        onError: () => toast.error("Sıralama güncellenemedi"),
      }
    );
  };

  const updateParagraph = (index: number, field: "tr" | "en", value: string) => {
    const next = introForm.paragraphs.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    setIntroForm({ paragraphs: next });
  };

  const addParagraph = () => {
    setIntroForm({ paragraphs: [...introForm.paragraphs, { tr: "", en: "" }] });
  };

  const removeParagraph = (index: number) => {
    setIntroForm({
      paragraphs: introForm.paragraphs.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">UEZ 2026 Sayfası (TR / EN)</h1>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">UEZ 2026 Sayfası (TR / EN)</h1>

      {/* Hero */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Hero Bölümü</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-red-50/30">
            <span className="text-sm font-medium text-red-700">Türkçe (TR)</span>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
              <input
                type="text"
                value={heroForm.title_tr}
                onChange={(e) => setHeroForm({ ...heroForm, title_tr: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Başlık</label>
              <input
                type="text"
                value={heroForm.subtitle_tr}
                onChange={(e) => setHeroForm({ ...heroForm, subtitle_tr: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasyon</label>
              <input
                type="text"
                value={heroForm.location_tr}
                onChange={(e) => setHeroForm({ ...heroForm, location_tr: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>
          <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-blue-50/30">
            <span className="text-sm font-medium text-blue-700">English (EN)</span>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={heroForm.title_en}
                onChange={(e) => setHeroForm({ ...heroForm, title_en: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={heroForm.subtitle_en}
                onChange={(e) => setHeroForm({ ...heroForm, subtitle_en: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={heroForm.location_en}
                onChange={(e) => setHeroForm({ ...heroForm, location_en: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
        <button
          onClick={handleSaveHero}
          disabled={isUpdating}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark disabled:opacity-50"
        >
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Kaydet
        </button>
      </div>

      {/* Intro */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Giriş Paragrafları (TR / EN)</h2>
          <button
            onClick={addParagraph}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
          >
            <Plus className="w-4 h-4" />
            Paragraf Ekle
          </button>
        </div>
        <div className="space-y-4">
          {introForm.paragraphs.map((p, index) => (
            <div key={index} className="flex gap-2 border border-gray-200 rounded-lg p-4">
              <div className="flex-1 grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-red-700 mb-1">TR</label>
                  <textarea
                    value={p.tr}
                    onChange={(e) => updateParagraph(index, "tr", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary"
                    placeholder="Paragraf (Türkçe)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">EN</label>
                  <textarea
                    value={p.en}
                    onChange={(e) => updateParagraph(index, "en", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary"
                    placeholder="Paragraph (English)"
                  />
                </div>
              </div>
              <button
                onClick={() => removeParagraph(index)}
                className="p-2 text-red-500 hover:bg-red-100 rounded-lg self-start"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={handleSaveIntro}
          disabled={isUpdating}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark disabled:opacity-50"
        >
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Kaydet
        </button>
      </div>

      {/* Topics Section Title */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Konular Bölüm Başlığı (TR / EN)</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-red-50/30">
            <span className="text-sm font-medium text-red-700">Türkçe</span>
            <input
              type="text"
              value={topicsSectionForm.titleLine1_tr}
              onChange={(e) =>
                setTopicsSectionForm({ ...topicsSectionForm, titleLine1_tr: e.target.value })
              }
              placeholder="Başlık satır 1"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            />
            <input
              type="text"
              value={topicsSectionForm.titleLine2_tr}
              onChange={(e) =>
                setTopicsSectionForm({ ...topicsSectionForm, titleLine2_tr: e.target.value })
              }
              placeholder="Başlık satır 2"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-blue-50/30">
            <span className="text-sm font-medium text-blue-700">English</span>
            <input
              type="text"
              value={topicsSectionForm.titleLine1_en}
              onChange={(e) =>
                setTopicsSectionForm({ ...topicsSectionForm, titleLine1_en: e.target.value })
              }
              placeholder="Title line 1"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            />
            <input
              type="text"
              value={topicsSectionForm.titleLine2_en}
              onChange={(e) =>
                setTopicsSectionForm({ ...topicsSectionForm, titleLine2_en: e.target.value })
              }
              placeholder="Title line 2"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>
        </div>
        <button
          onClick={handleSaveTopicsSection}
          disabled={isUpdating}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark disabled:opacity-50"
        >
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Kaydet
        </button>
      </div>

      {/* Topics */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Dönüşüm Konuları ({topics.length})</h2>
          <button
            onClick={() => {
              setShowAddTopic(true);
              setEditingTopicId(null);
              setTopicForm({
                title_tr: "",
                title_en: "",
                description_tr: "",
                description_en: "",
                image: "",
                active: true,
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark text-sm"
          >
            <Plus className="w-4 h-4" />
            Yeni Konu
          </button>
        </div>

        {showAddTopic && (
          <div className="p-4 bg-purple-50 rounded-lg mb-4">
            <h3 className="font-medium text-gray-800 mb-3">Yeni Konu Ekle (TR / EN)</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-red-700 mb-1">Başlık (TR)</label>
                <input
                  type="text"
                  value={topicForm.title_tr}
                  onChange={(e) => setTopicForm({ ...topicForm, title_tr: e.target.value })}
                  placeholder="Konu başlığı"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">Title (EN)</label>
                <input
                  type="text"
                  value={topicForm.title_en}
                  onChange={(e) => setTopicForm({ ...topicForm, title_en: e.target.value })}
                  placeholder="Topic title"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-red-700 mb-1">Açıklama (TR)</label>
                <textarea
                  value={topicForm.description_tr}
                  onChange={(e) => setTopicForm({ ...topicForm, description_tr: e.target.value })}
                  placeholder="Açıklama"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">Description (EN)</label>
                <textarea
                  value={topicForm.description_en}
                  onChange={(e) => setTopicForm({ ...topicForm, description_en: e.target.value })}
                  placeholder="Description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={topicForm.image}
                onChange={(e) => setTopicForm({ ...topicForm, image: e.target.value })}
                placeholder="Görsel URL (ortak)"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={topicForm.active}
                onChange={(e) => setTopicForm({ ...topicForm, active: e.target.checked })}
              />
              <span className="text-sm text-gray-600">Aktif</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleAddTopic}
                disabled={isUpdating}
                className="px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark disabled:opacity-50"
              >
                Ekle
              </button>
              <button
                onClick={() => setShowAddTopic(false)}
                className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {topics.map((topic, index) => (
            <div
              key={topic.id}
              className={`p-4 border rounded-lg ${
                topic.active ? "border-gray-200" : "border-red-200 bg-red-50"
              }`}
            >
              {editingTopicId === topic.id ? (
                <div className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-red-700 mb-1">Başlık (TR)</label>
                      <input
                        type="text"
                        value={topicForm.title_tr}
                        onChange={(e) => setTopicForm({ ...topicForm, title_tr: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-blue-700 mb-1">Title (EN)</label>
                      <input
                        type="text"
                        value={topicForm.title_en}
                        onChange={(e) => setTopicForm({ ...topicForm, title_en: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-red-700 mb-1">Açıklama (TR)</label>
                      <textarea
                        value={topicForm.description_tr}
                        onChange={(e) =>
                          setTopicForm({ ...topicForm, description_tr: e.target.value })
                        }
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-blue-700 mb-1">Description (EN)</label>
                      <textarea
                        value={topicForm.description_en}
                        onChange={(e) =>
                          setTopicForm({ ...topicForm, description_en: e.target.value })
                        }
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={topicForm.image}
                    onChange={(e) => setTopicForm({ ...topicForm, image: e.target.value })}
                    placeholder="Görsel URL"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={topicForm.active}
                      onChange={(e) => setTopicForm({ ...topicForm, active: e.target.checked })}
                    />
                    <span className="text-sm text-gray-600">Aktif</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateTopic(topic.id)}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-purple-primary text-white rounded-lg"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={() => setEditingTopicId(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveTopic(index, "up")}
                      disabled={index === 0 || isUpdating}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveTopic(index, "down")}
                      disabled={index === topics.length - 1 || isUpdating}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  {topic.image && (
                    <img
                      src={topic.image}
                      alt={topic.title_tr || topic.title_en}
                      className="w-20 h-14 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-medium ${topic.active ? "text-gray-800" : "text-gray-400"}`}
                      >
                        {topic.title_tr || topic.title_en || `#${topic.id}`}
                      </p>
                      {!topic.active && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">
                          Pasif
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm truncate ${topic.active ? "text-gray-500" : "text-gray-400"}`}
                    >
                      {topic.description_tr || topic.description_en || ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditTopic(topic)}
                      className="p-2 text-purple-primary hover:bg-purple-100 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteTopic(topic.id, topic.title_tr || topic.title_en)
                      }
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
