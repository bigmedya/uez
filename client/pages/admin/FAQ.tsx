import { useState } from "react";
import { authFetch } from "@/utils/authFetch";
import { Plus, Edit, Trash2, GripVertical, Save, X, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { useFaq, FAQItem } from "@/hooks/useFaq";
import { toast } from "sonner";

export default function FAQ() {
  const { items, isLoading, addItem, updateItem, deleteItem, reorderItems, isUpdating } = useFaq();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ question: "", question_en: "", answer: "", answer_en: "", active: true });

  const handleAdd = () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Soru ve cevap gerekli");
      return;
    }
    addItem({ ...formData, question_en: formData.question_en || undefined, answer_en: formData.answer_en || undefined }, {
      onSuccess: () => {
        toast.success("Soru eklendi");
        setFormData({ question: "", question_en: "", answer: "", answer_en: "", active: true });
        setShowAddForm(false);
      },
      onError: () => toast.error("Soru eklenemedi"),
    });
  };

  const handleUpdate = (id: number) => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Soru ve cevap gerekli");
      return;
    }
    updateItem({ id, updates: { ...formData, question_en: formData.question_en || undefined, answer_en: formData.answer_en || undefined } }, {
      onSuccess: () => {
        toast.success("Soru güncellendi");
        setFormData({ question: "", question_en: "", answer: "", answer_en: "", active: true });
        setEditingId(null);
      },
      onError: () => toast.error("Soru güncellenemedi"),
    });
  };

  const handleDelete = (id: number, question: string) => {
    if (!confirm(`"${question}" sorusunu silmek istediğinizden emin misiniz?`)) return;
    deleteItem(id, {
      onSuccess: () => toast.success("Soru silindi"),
      onError: () => toast.error("Soru silinemedi"),
    });
  };

  const startEdit = (item: FAQItem) => {
    setEditingId(item.id);
    setFormData({
      question: item.question,
      question_en: (item as { question_en?: string }).question_en ?? "",
      answer: item.answer,
      answer_en: (item as { answer_en?: string }).answer_en ?? "",
      active: item.active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ question: "", question_en: "", answer: "", answer_en: "", active: true });
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === items.length - 1) return;

    const newItems = [...items];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    
    const newOrder = newItems.map(item => item.id);
    reorderItems(newOrder, {
      onSuccess: () => toast.success("Sıralama güncellendi"),
      onError: () => toast.error("Sıralama güncellenemedi"),
    });
  };

  const toggleActive = (item: FAQItem) => {
    updateItem({ id: item.id, updates: { active: !item.active } }, {
      onSuccess: () => toast.success(item.active ? "Soru pasif yapıldı" : "Soru aktif yapıldı"),
      onError: () => toast.error("Durum güncellenemedi"),
    });
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Sıkça Sorulan Sorular</h1>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sıkça Sorulan Sorular</h1>
      {/* Add button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => { setShowAddForm(true); setEditingId(null); setFormData({ question: "", question_en: "", answer: "", answer_en: "", active: true }); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Soru
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Yeni Soru Ekle</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soru (TR)</label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Soru metni..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soru (EN)</label>
              <input
                type="text"
                value={formData.question_en}
                onChange={(e) => setFormData({ ...formData, question_en: e.target.value })}
                placeholder="Question (EN)..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cevap (TR)</label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Cevap metni..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cevap (EN)</label>
              <textarea
                value={formData.answer_en}
                onChange={(e) => setFormData({ ...formData, answer_en: e.target.value })}
                placeholder="Answer (EN)..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-purple-primary rounded"
              />
              <span className="text-sm text-gray-600">Aktif (sitede göster)</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Ekle
              </button>
              <button
                onClick={() => { setShowAddForm(false); setFormData({ question: "", question_en: "", answer: "", answer_en: "", active: true }); }}
                className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ list */}
      <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
        {items.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Henüz soru eklenmemiş
          </div>
        ) : (
          items.map((faq, index) => (
            <div
              key={faq.id}
              className={`p-4 ${!faq.active ? "bg-gray-50" : ""}`}
            >
              {editingId === faq.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Soru (TR)</label>
                    <input
                      type="text"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Soru (EN)</label>
                    <input
                      type="text"
                      value={formData.question_en}
                      onChange={(e) => setFormData({ ...formData, question_en: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                      placeholder="Question (EN)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cevap (TR)</label>
                    <textarea
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cevap (EN)</label>
                    <textarea
                      value={formData.answer_en}
                      onChange={(e) => setFormData({ ...formData, answer_en: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
                      placeholder="Answer (EN)"
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 text-purple-primary rounded"
                    />
                    <span className="text-sm text-gray-600">Aktif</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(faq.id)}
                      disabled={isUpdating}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Kaydet
                    </button>
                    <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveItem(index, "up")}
                      disabled={index === 0 || isUpdating}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <GripVertical className="w-4 h-4 text-gray-300" />
                    <button
                      onClick={() => moveItem(index, "down")}
                      disabled={index === items.length - 1 || isUpdating}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`font-medium ${faq.active ? "text-gray-800" : "text-gray-400"}`}>
                        {faq.question}
                      </h3>
                      {!faq.active && (
                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-500 rounded">Pasif</span>
                      )}
                    </div>
                    <p className={`text-sm ${faq.active ? "text-gray-600" : "text-gray-400"}`}>
                      {faq.answer}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(faq)}
                      className={`px-3 py-1 text-xs rounded-lg ${
                        faq.active
                          ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {faq.active ? "Pasif Yap" : "Aktif Yap"}
                    </button>
                    <button
                      onClick={() => startEdit(faq)}
                      className="p-2 text-purple-primary hover:bg-purple-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id, faq.question)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
