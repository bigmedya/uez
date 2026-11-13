import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { FileText, Users, MessageSquare, ArrowRight, Loader2, RefreshCw, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface FormStats {
  formType: string;
  formName: string;
  totalResponses: number;
  lastSubmission: string | null;
}

const formIcons: Record<string, React.ReactNode> = {
  kayit: <Users className="w-8 h-8" />,
  stars: <FileText className="w-8 h-8" />,
  "stars-of-regions": <Star className="w-8 h-8" />,
  iletisim: <MessageSquare className="w-8 h-8" />,
};

const formColors: Record<string, string> = {
  kayit: "bg-purple-500",
  stars: "bg-orange-500",
  "stars-of-regions": "bg-orange-500",
  iletisim: "bg-blue-500",
};

export default function FormResponses() {
  const [stats, setStats] = useState<FormStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/forms/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalResponses = stats.reduce((sum, s) => sum + s.totalResponses, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Form Yanıtları</h1>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-600">Tüm form yanıtlarını görüntüleyin ve yönetin</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </button>
      </div>

      {/* Total Stats */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-200 text-sm">Toplam Form Yanıtı</p>
            <p className="text-4xl font-bold mt-1">{totalResponses}</p>
          </div>
          <div className="bg-white/20 rounded-full p-4">
            <FileText className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-primary" />
        </div>
      ) : (
        /* Form Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((form) => (
            <Link
              key={form.formType}
              to={`/uezyonetim/form-yanitlari/${form.formType}`}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all group"
            >
              <div className={`${formColors[form.formType] || "bg-gray-500"} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="bg-white/20 rounded-lg p-2">
                    {formIcons[form.formType] || <FileText className="w-8 h-8" />}
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-xl font-semibold mt-4">{form.formName}</h3>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Toplam Yanıt</span>
                  <span className="font-semibold text-gray-800 text-lg">{form.totalResponses}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-500">Son Yanıt</span>
                  <span className="text-gray-600">{formatDate(form.lastSubmission)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && stats.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Henüz form yanıtı bulunmuyor.</p>
        </div>
      )}
    </div>
  );
}


