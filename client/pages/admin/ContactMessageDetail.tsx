import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Trash2, 
  Loader2, 
  Mail, 
  Phone, 
  User, 
  MessageSquare,
  Calendar,
  FileText
} from "lucide-react";

interface FormResponse {
  id: number;
  formType: string;
  formName: string;
  data: {
    name?: string;
    email?: string;
    phone?: string;
    subject?: string;
    message?: string;
  };
  ipAddress: string;
  submittedAt: string;
  createdAt: string;
}

export default function ContactMessageDetail() {
  const { id } = useParams<{ id: string }>();
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
        throw new Error("Mesaj bulunamadı");
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
    if (!confirm("Bu mesajı silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const res = await fetch(`/api/forms/responses/${id}`, { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/uezyonetim/iletisim-mesajlari";
      } else {
        alert("Mesaj silinirken bir hata oluştu");
      }
    } catch (error) {
      console.error("Error deleting response:", error);
      alert("Mesaj silinirken bir hata oluştu");
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
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || "Mesaj bulunamadı"}</p>
        <Link
          to="/uezyonetim/iletisim-mesajlari"
          className="inline-flex items-center gap-2 text-purple-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/uezyonetim/iletisim-mesajlari"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">İletişim Mesajı Detayı</h1>
            <p className="text-sm text-gray-500 mt-1">ID: #{response.id}</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Sil
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Message Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Message Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-purple-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Mesaj</h2>
                <p className="text-sm text-gray-500">{response.formName}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Konu</label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-800">{response.data.subject || "-"}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Mesaj İçeriği</label>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[200px]">
                  <p className="text-gray-800 whitespace-pre-wrap">{response.data.message || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Contact Info */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">İletişim Bilgileri</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg mt-1">
                  <User className="w-4 h-4 text-purple-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Ad Soyad</p>
                  <p className="text-gray-800 font-medium">{response.data.name || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg mt-1">
                  <Mail className="w-4 h-4 text-purple-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">E-posta</p>
                  {response.data.email ? (
                    <a 
                      href={`mailto:${response.data.email}`}
                      className="text-purple-primary hover:underline font-medium"
                    >
                      {response.data.email}
                    </a>
                  ) : (
                    <p className="text-gray-800">-</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg mt-1">
                  <Phone className="w-4 h-4 text-purple-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Telefon</p>
                  {response.data.phone ? (
                    <a 
                      href={`tel:${response.data.phone}`}
                      className="text-purple-primary hover:underline font-medium"
                    >
                      {response.data.phone}
                    </a>
                  ) : (
                    <p className="text-gray-800">-</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submission Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Gönderim Bilgileri</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <Calendar className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Gönderim Tarihi</p>
                  <p className="text-gray-800 font-medium">{formatDate(response.submittedAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <FileText className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Form Tipi</p>
                  <p className="text-gray-800 font-medium">{response.formType}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

