import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Search, Trash2, Eye, Loader2, RefreshCw, Download } from "lucide-react";

interface FormResponse {
  id: number;
  formType: string;
  formName: string;
  data: Record<string, string>;
  ipAddress: string;
  submittedAt: string;
  createdAt: string;
}

const formNames: Record<string, string> = {
  kayit: "Kayıt Formu",
  stars: "Stars of Region",
  iletisim: "İletişim Formu",
};

export default function FormResponseDetail() {
  const { formType } = useParams<{ formType: string }>();
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/forms/responses?formType=${formType}`);
      const data = await response.json();
      setResponses(data);
    } catch (error) {
      console.error("Error fetching responses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formType) {
      fetchResponses();
    }
  }, [formType]);

  const handleDelete = async (id: number) => {
    if (confirm("Bu yanıtı silmek istediğinizden emin misiniz?")) {
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

  // Get primary display fields for the table
  const getPrimaryFields = (data: Record<string, string>): string[] => {
    const keys = Object.keys(data);
    // Return first 3-4 important fields
    return keys.slice(0, 4);
  };

  // Filter responses based on search term
  const filteredResponses = responses.filter((response) => {
    const searchLower = searchTerm.toLowerCase();
    return Object.values(response.data).some((value) =>
      value.toLowerCase().includes(searchLower)
    );
  });

  // Get all unique field names
  const allFields = responses.length > 0 
    ? [...new Set(responses.flatMap((r) => Object.keys(r.data)))]
    : [];

  const primaryFields = allFields.slice(0, 4);

  const exportCSV = () => {
    if (responses.length === 0) return;
    
    // Field label'larını al (form tipine göre)
    const getFieldLabel = (key: string): string => {
      // Varsayılan olarak camelCase'den okunabilir metne çevir
      return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).trim();
    };
    
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
    
    const headers = [...allFields.map(f => getFieldLabel(f))];
    const rows = responses.map((r) => [
      ...allFields.map((f) => formatCellValue(r.data[f])),
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
    link.download = `${formType}-yanitlar.csv`;
    link.click();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{formNames[formType || ""] || "Form Yanıtları"}</h1>
      {/* Back Link */}
      <Link
        to="/uezyonetim/form-yanitlari"
        className="inline-flex items-center gap-2 text-purple-primary hover:text-purple-dark mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Tüm Formlar
      </Link>

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Yanıtlarda ara..."
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
          Toplam: {responses.length} yanıt
        </span>
        {searchTerm && (
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
            Filtrelenen: {filteredResponses.length} yanıt
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-primary" />
        </div>
      ) : (
        /* Responses Table */
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  {primaryFields.map((field) => (
                    <th
                      key={field}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider truncate max-w-[200px]"
                    >
                      {field}
                    </th>
                  ))}
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
                    {primaryFields.map((field) => (
                      <td
                        key={field}
                        className="px-4 py-3 text-sm text-gray-800 truncate max-w-[200px]"
                        title={response.data[field] || "-"}
                      >
                        {response.data[field] || "-"}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(response.submittedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={formType === "kayit" 
                            ? `/uezyonetim/form-yanitlari/kayit/${response.id}`
                            : `/uezyonetim/form-yanitlari/${formType}/${response.id}`}
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
              <p>Yanıt bulunamadı.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}


