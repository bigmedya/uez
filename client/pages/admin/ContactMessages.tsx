import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { Link } from "react-router-dom";
import { Search, Trash2, Eye, Loader2, RefreshCw, Download, Mail, Phone, User, MessageSquare, Calendar } from "lucide-react";

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

export default function ContactMessages() {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/forms/responses?formType=iletisim`);
      const data = await response.json();
      setResponses(data);
    } catch (error) {
      console.error("Error fetching responses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm("Bu mesajı silmek istediğinizden emin misiniz?")) {
      try {
        const response = await fetch(`/api/forms/responses/${id}`, { method: "DELETE" });
        if (response.ok) {
          setResponses(responses.filter((r) => r.id !== id));
        }
      } catch (error) {
        console.error("Error deleting response:", error);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    // Baştaki sıfırları kaldır
    const day = date.getDate().toString();
    const month = (date.getMonth() + 1).toString();
    const year = date.getFullYear();
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");
    return `${day}.${month}.${year} ${hour}:${minute}`;
  };

  // Filter responses based on search term
  const filteredResponses = responses.filter((response) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      response.data.name?.toLowerCase().includes(searchLower) ||
      response.data.email?.toLowerCase().includes(searchLower) ||
      response.data.phone?.toLowerCase().includes(searchLower) ||
      response.data.subject?.toLowerCase().includes(searchLower) ||
      response.data.message?.toLowerCase().includes(searchLower)
    );
  });

  const exportCSV = () => {
    if (responses.length === 0) return;
    
    // Değeri CSV için formatla
    const formatCellValue = (value: any): string => {
      if (value === null || value === undefined) return "";
      if (typeof value === "object") {
        return JSON.stringify(value);
      }
      return String(value);
    };
    
    // CSV için değeri escape et
    const escapeCSV = (value: string): string => {
      const cleaned = value.replace(/\r\n/g, " ").replace(/\n/g, " ").replace(/\r/g, " ");
      return `"${cleaned.replace(/"/g, '""')}"`;
    };
    
    const headers = ["Ad Soyad", "E-posta", "Telefon", "Konu", "Mesaj"];
    const rows = responses.map((r) => [
      formatCellValue(r.data.name),
      formatCellValue(r.data.email),
      formatCellValue(r.data.phone),
      formatCellValue(r.data.subject),
      formatCellValue(r.data.message),
    ]);
    
    // Excel için noktalı virgül delimiter kullan (Türkçe Excel için)
    const delimiter = ";";
    
    const csv = [
      headers.map(h => escapeCSV(h)).join(delimiter),
      ...rows.map((row) => row.map((cell) => escapeCSV(formatCellValue(cell))).join(delimiter)),
    ].join("\r\n"); // Windows line ending kullan
    
    // BOM ekle (Excel'de Türkçe karakterler için)
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `iletisim-mesajlari-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-8 h-8 text-purple-primary" />
        <h1 className="text-2xl font-bold text-gray-800">İletişim Formu Mesajları</h1>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Ad, e-posta, konu veya mesajda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchResponses}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV İndir
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 flex gap-4 text-sm text-gray-600">
        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
          Toplam: {responses.length} mesaj
        </span>
        {searchTerm && (
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
            Filtrelenen: {filteredResponses.length} mesaj
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-primary" />
        </div>
      ) : (
        /* Messages List */
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ad Soyad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-posta
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Konu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mesaj
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredResponses.map((response, index) => (
                  <tr key={response.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {response.data.name || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a 
                          href={`mailto:${response.data.email}`}
                          className="text-purple-primary hover:underline"
                        >
                          {response.data.email || "-"}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {response.data.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <a 
                            href={`tel:${response.data.phone}`}
                            className="text-purple-primary hover:underline"
                          >
                            {response.data.phone}
                          </a>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {response.data.subject || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 max-w-xs">
                      <div className="truncate" title={response.data.message || ""}>
                        {response.data.message ? (
                          response.data.message.length > 50 
                            ? `${response.data.message.substring(0, 50)}...` 
                            : response.data.message
                        ) : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(response.submittedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/uezyonetim/iletisim-mesajlari/${response.id}`}
                          className="p-2 text-purple-primary hover:bg-purple-100 rounded-lg transition-colors"
                          title="Detay"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(response.id)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredResponses.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Mesaj bulunamadı</p>
              <p className="text-sm mt-2">
                {searchTerm ? "Arama kriterlerinize uygun mesaj bulunamadı." : "Henüz iletişim formundan mesaj gelmemiş."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

