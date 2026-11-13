import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Trash2, Loader2, FileText, Download, Building2, Briefcase, Trophy, Users, Contact } from "lucide-react";

interface FormResponse {
  id: number;
  formType: string;
  formName: string;
  data: Record<string, any>;
  ipAddress: string;
  submittedAt: string;
  createdAt: string;
}

const getFieldLabel = (key: string, formType?: string): string => {
  // Stars of Region form label'ları (form sayfasındaki gerçek label'lar)
  if (formType === "stars-of-regions") {
    const labels: Record<string, string> = {
      sirketAdi: "Şirket adı",
      kurulusYili: "Kuruluş Yılı",
      kisaTanim: "Kısa tanıtım",
      webSitesi: "Web Sitesi",
      musteriIhtiyaci: "Müşteri ihtiyacı",
      cozum: "Şirketin varolan ihtiyaç için çözümü",
      hedefKitle: "Hedef kitle",
      isModeli: "İş modeli",
      rekabetAvantaji: "Rekabet avantajı",
      basarilar: "Başarılar (satış/yatırımlar/ürün geliştirme vb.)",
      rakipler: "Rakipler (yatırımlar veya çıkışlar)",
      sermayeTuketmeHizi: "Firmanın İlk Sermayesini Tüketme Hızı (aylık olarak)",
      kurucuOzgecmis: "Kurucu / Kurucuların Özgeçmişi Hakkında Özet Bilgi",
      yatirimciSunumu: "Lütfen Yatırımcı Sunumunuzu Yükleyiniz",
      adSoyad: "Adı - Soyadı",
      telefon: "Telefon",
      unvan: "Ünvan",
      eposta: "E-posta",
      firmaAdi: "Firma Adı",
      sirketAdresi: "Şirket Adresi",
    };
    return labels[key] || key;
  }

  // Kayıt formu label'ları
  if (formType === "kayit") {
    const labels: Record<string, string> = {
      packageTitle: "Paket Başlığı",
      packageSubtitle: "Paket Alt Başlığı",
      packagePrice: "Paket Fiyatı",
      paymentMethod: "Ödeme Yöntemi",
      invoiceType: "Fatura Tipi",
      isEFatura: "e-Fatura",
      adSoyad: "Ad - Soyad",
      kurumAdi: "Kurum adı",
      unvan: "Ünvan",
      kurumAdresi: "Kurum adresi",
      telefon: "Telefon",
      eposta: "E-posta",
      ceptel: "Cep Telefonu",
      asistanAdSoyad: "Asistan Ad Soyad",
      asistanEposta: "Asistan E-posta",
      asistanTelefon: "Asistan Telefon",
      adSoyad2: "2. Katılımcı Ad - Soyad",
      kurumAdi2: "2. Katılımcı Kurum adı",
      unvan2: "2. Katılımcı Ünvan",
      kurumAdresi2: "2. Katılımcı Kurum adresi",
      telefon2: "2. Katılımcı Telefon",
      eposta2: "2. Katılımcı E-posta",
      ceptel2: "2. Katılımcı Cep Telefonu",
      firmaUnvani: "Firma Ünvanı",
      faturaSehir: "Fatura Şehir",
      faturaIlce: "Fatura İlçe",
      faturaAdres: "Fatura Açık Adres",
      faturaPostaKodu: "Fatura Posta Kodu",
      faturaAdresi: "Fatura Adresi",
      vergiDairesi: "Vergi Dairesi",
      vergiNo: "Vergi No",
      eArsivEmail: "e-Arşiv E-posta",
      tcKimlik: "TC Kimlik No",
      ilgiliKisi: "İlgili Kişi",
      sahisFaturaSehir: "Şahıs Fatura Şehir",
      sahisFaturaIlce: "Şahıs Fatura İlçe",
      sahisFaturaAdres: "Şahıs Fatura Açık Adres",
      sahisFaturaPostaKodu: "Şahıs Fatura Posta Kodu",
      sahisFaturaAdresi: "Şahıs Fatura Adresi",
      sahisEposta: "Şahıs E-posta",
    };
    return labels[key] || key;
  }

  // İletişim formu label'ları
  if (formType === "iletisim") {
    const labels: Record<string, string> = {
      name: "Ad Soyad",
      email: "E-posta",
      phone: "Telefon",
      subject: "Konu",
      message: "Mesaj",
    };
    return labels[key] || key;
  }

  // Varsayılan olarak key'i camelCase'den okunabilir metne çevir
  return key
    .replace(/([A-Z])/g, " $1") // Büyük harflerin önüne boşluk ekle
    .replace(/^./, (str) => str.toUpperCase()) // İlk harfi büyük yap
    .trim();
};

export default function FormResponseGenericDetail() {
  const { formType, id } = useParams<{ formType: string; id: string }>();
  const [response, setResponse] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchResponse();
    }
  }, [id]);

  const fetchResponse = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/forms/responses/${id}`);
      if (!response.ok) {
        throw new Error("Yanıt bulunamadı");
      }
      const data = await response.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      console.error("Error fetching response:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bu yanıtı silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const res = await fetch(`/api/forms/responses/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (formType === "stars-of-regions") {
          window.location.href = `/uezyonetim/stars-of-regions`;
        } else {
          window.location.href = `/uezyonetim/form-yanitlari/${formType}`;
        }
      } else {
        alert("Yanıt silinirken bir hata oluştu");
      }
    } catch (error) {
      console.error("Error deleting response:", error);
      alert("Yanıt silinirken bir hata oluştu");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-primary" />
      </div>
    );
  }

  if (error || !response) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error || "Yanıt bulunamadı"}</p>
        <Link
          to={formType === "stars-of-regions" ? `/uezyonetim/stars-of-regions` : `/uezyonetim/form-yanitlari/${formType}`}
          className="mt-2 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Geri Dön
        </Link>
      </div>
    );
  }

  const data = response.data;

  // Stars of Region için kategorilere ayır
  const isStarsOfRegions = formType === "stars-of-regions";
  
  const categories = isStarsOfRegions ? {
    sirketBilgileri: {
      title: "Şirket Bilgileri",
      icon: Building2,
      color: "purple",
      fields: ["sirketAdi", "kurulusYili", "kisaTanim", "webSitesi"],
    },
    isModeli: {
      title: "İş Modeli ve Çözüm",
      icon: Briefcase,
      color: "blue",
      fields: ["musteriIhtiyaci", "cozum", "hedefKitle", "isModeli"],
    },
    rekabet: {
      title: "Rekabet ve Başarılar",
      icon: Trophy,
      color: "orange",
      fields: ["rekabetAvantaji", "basarilar", "rakipler", "sermayeTuketmeHizi"],
    },
    kurucu: {
      title: "Kurucu Bilgileri",
      icon: Users,
      color: "green",
      fields: ["kurucuOzgecmis", "yatirimciSunumu"],
    },
    iletisim: {
      title: "İletişim Bilgileri",
      icon: Contact,
      color: "indigo",
      fields: ["adSoyad", "telefon", "unvan", "eposta", "firmaAdi", "sirketAdresi"],
    },
  } : null;

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      purple: { bg: "bg-purple-50/50", border: "border-purple-100", text: "text-purple-700" },
      blue: { bg: "bg-blue-50/50", border: "border-blue-100", text: "text-blue-700" },
      orange: { bg: "bg-orange-50/50", border: "border-orange-100", text: "text-orange-700" },
      green: { bg: "bg-green-50/50", border: "border-green-100", text: "text-green-700" },
      indigo: { bg: "bg-indigo-50/50", border: "border-indigo-100", text: "text-indigo-700" },
      gray: { bg: "bg-gray-50/50", border: "border-gray-100", text: "text-gray-700" },
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={formType === "stars-of-regions" ? `/uezyonetim/stars-of-regions` : `/uezyonetim/form-yanitlari/${formType}`}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Başvuru Detayı</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-gray-500">ID: #{response.id}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  Gönderim: {formatDate(response.submittedAt)}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  Oluşturulma: {formatDate(response.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Sil
          </button>
        </div>
      </div>

      {/* Stars of Region için kategorize edilmiş görünüm */}
      {isStarsOfRegions && categories ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(categories).map(([key, category]) => {
            const Icon = category.icon;
            const colors = getColorClasses(category.color);
            
            return (
              <div
                key={key}
                className={`bg-white rounded-lg shadow-sm p-4 border ${colors.border}`}
              >
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <div className={`p-1.5 ${colors.bg} rounded-md`}>
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                  </div>
                  <h2 className="text-base font-semibold text-gray-800">{category.title}</h2>
                </div>
                <div className="space-y-3">
                  {category.fields.map((fieldKey) => {
                    const value = data[fieldKey];
                    
                    // Yatırımcı sunumu dosyası için özel gösterim
                    if (fieldKey === "yatirimciSunumu" && value && typeof value === "string" && value.startsWith("/")) {
                      return (
                        <div key={fieldKey} className="space-y-1.5">
                          <p className="text-xs font-medium text-gray-500">
                            {getFieldLabel(fieldKey, formType)}
                          </p>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <a
                              href={value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors text-sm"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="font-medium">
                                {data.yatirimciSunumuDosyaAdi || "Dosyayı İndir"}
                              </span>
                            </a>
                          </div>
                        </div>
                      );
                    }
                    
                    // Web sitesi için link göster
                    if (fieldKey === "webSitesi" && value) {
                      return (
                        <div key={fieldKey} className="space-y-1.5">
                          <p className="text-xs font-medium text-gray-500">
                            {getFieldLabel(fieldKey, formType)}
                          </p>
                          <a
                            href={value.startsWith("http") ? value : `https://${value}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 break-words"
                          >
                            {value}
                          </a>
                        </div>
                      );
                    }
                    
                    // E-posta için mailto linki
                    if (fieldKey === "eposta" && value) {
                      return (
                        <div key={fieldKey} className="space-y-1.5">
                          <p className="text-xs font-medium text-gray-500">
                            {getFieldLabel(fieldKey, formType)}
                          </p>
                          <a
                            href={`mailto:${value}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 break-words"
                          >
                            {value}
                          </a>
                        </div>
                      );
                    }
                    
                    // Telefon için tel linki
                    if (fieldKey === "telefon" && value) {
                      return (
                        <div key={fieldKey} className="space-y-1.5">
                          <p className="text-xs font-medium text-gray-500">
                            {getFieldLabel(fieldKey, formType)}
                          </p>
                          <a
                            href={`tel:${value}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {value}
                          </a>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={fieldKey} className="space-y-1.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {getFieldLabel(fieldKey)}
                        </p>
                        <p className="text-sm font-medium text-gray-800 whitespace-pre-wrap break-words bg-gray-50/50 p-2.5 rounded-md border border-gray-100">
                          {value || "-"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Diğer formlar için genel görünüm */
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <div className="p-1.5 bg-purple-50/50 rounded-md">
              <FileText className="w-4 h-4 text-purple-700" />
            </div>
            <h2 className="text-base font-semibold text-gray-800">Form Verileri</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(data).map(([key, value]) => {
              if (key === "yatirimciSunumu" && value && typeof value === "string" && value.startsWith("/")) {
                return (
                  <div key={key} className="border-b border-gray-100 pb-3 last:border-0">
                    <p className="text-xs text-gray-500 mb-1.5">{getFieldLabel("yatirimciSunumu", formType)}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors text-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="font-medium">
                          {data.yatirimciSunumuDosyaAdi || "Dosyayı İndir"}
                        </span>
                      </a>
                    </div>
                  </div>
                );
              }
              
              return (
                <div key={key} className="border-b border-gray-100 pb-3 last:border-0">
                  <p className="text-xs text-gray-500 mb-1.5">{getFieldLabel(key, formType)}</p>
                  <p className="text-sm font-medium text-gray-800 whitespace-pre-wrap break-words">
                    {value || "-"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
