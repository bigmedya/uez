import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { 
  User, 
  Activity, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Download,
  Search
} from "lucide-react";
import { useAdminAuth } from "../../contexts/AdminAuthContext";

interface AdminLogEntry {
  id: number;
  userId: number;
  action: string;
  entity: string;
  entityId: string | null;
  details: any;
  ipAddress: string;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface LogStats {
  totalLogs: number;
  todayLogs: number;
  weekLogs: number;
  topActions: Array<{ action: string; count: number }>;
  topEntities: Array<{ entity: string; count: number }>;
}

interface AdminUser {
  id: number;
  email: string;
  name: string | null;
}

export default function AdminLogs() {
  const { userId } = useAdminAuth();
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AdminLogEntry | null>(null);
  const [filters, setFilters] = useState({
    userId: "",
    action: "",
    startDate: "",
    endDate: "",
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        ),
      });

      const response = await fetch(`/api/admin/logs?${params}`);

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Loglar yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/logs/stats");

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("İstatistikler yüklenirken hata:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Filtre değiştiğinde ilk sayfaya dön
  };

  const clearFilters = () => {
    setFilters({
      userId: "",
      action: "",
      startDate: "",
      endDate: "",
    });
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR");
  };

  const getEntityLabel = (entity: string) => {
    const labels: Record<string, string> = {
      "users": "Kullanıcı",
      "admin_roles": "Rol",
      "program_items": "Program Öğesi",
      "program_days": "Program Günü",
      "program_categories": "Program Kategorisi",
      "speakers": "Konuşmacı",
      "sponsors": "Sponsor",
      "sponsor_categories": "Sponsor Kategorisi",
      "registrations": "Kayıt",
      "packages": "Paket",
      "faqs": "SSS",
      "contracts": "Sözleşme",
      "site_settings": "Site Ayarları",
      "homepage_content": "Ana Sayfa",
      "about_content": "Hakkımızda",
      "uez2026_content": "UEZ 2026",
      "contact_settings": "İletişim",
      "archive_descriptions": "Arşiv Açıklaması",
      "form_responses": "Form Yanıtı",
    };
    return labels[entity] || entity;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      "CREATE": "Ekleme",
      "UPDATE": "Güncelleme",
      "DELETE": "Silme",
      "VIEW": "Görüntüleme",
      "LOGIN": "Giriş",
      "LOGOUT": "Çıkış",
      "UPLOAD": "Yükleme",
      "DOWNLOAD": "İndirme",
      "EXPORT": "Dışa Aktarma",
      "IMPORT": "İçe Aktarma",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-green-100 text-green-800";
      case "UPDATE": return "bg-blue-100 text-blue-800";
      case "DELETE": return "bg-red-100 text-red-800";
      case "VIEW": return "bg-gray-100 text-gray-800";
      case "LOGIN": return "bg-purple-100 text-purple-800";
      case "LOGOUT": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Logları</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Dışa Aktar
          </Button>
        </div>
      </div>

      {/* İstatistikler */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Toplam Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Bugün
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayLogs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Bu Hafta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.weekLogs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                En Çok Kullanılan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {stats.topActions[0]?.action || "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Select value={filters.userId} onValueChange={(value) => handleFilterChange("userId", value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Kullanıcı" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.action} onValueChange={(value) => handleFilterChange("action", value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Aksiyon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Aksiyonlar</SelectItem>
                <SelectItem value="CREATE">Ekleme</SelectItem>
                <SelectItem value="UPDATE">Güncelleme</SelectItem>
                <SelectItem value="DELETE">Silme</SelectItem>
                <SelectItem value="LOGIN">Giriş</SelectItem>
                <SelectItem value="LOGOUT">Çıkış</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Başlangıç"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="cursor-pointer"
            />
            <Input
              type="date"
              placeholder="Bitiş"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="cursor-pointer"
            />
            <Button variant="outline" onClick={clearFilters}>
              Temizle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Log Kayıtları
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Kayıt bulunamadı
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Aksiyon</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Entity</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Kullanıcı</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tarih</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Detay</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr 
                      key={log.id} 
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Badge className={getActionColor(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{getEntityLabel(log.entity)}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {log.entityId ? `#${log.entityId}` : "-"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {log.user.name || log.user.email}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {log.details ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sayfalama */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Sayfa {page} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Önceki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Sonraki
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detay Modal */}
      <Dialog open={selectedLog !== null} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge className={getActionColor(selectedLog?.action || "")}>
                {getActionLabel(selectedLog?.action || "")}
              </Badge>
              <span>{getEntityLabel(selectedLog?.entity || "")}</span>
              {selectedLog?.entityId && (
                <span className="text-gray-500">#{selectedLog.entityId}</span>
              )}
            </DialogTitle>
            <DialogDescription>
              Log detayları
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-600">Kullanıcı</div>
                  <div className="text-sm mt-1">
                    {selectedLog.user.name || selectedLog.user.email}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Tarih</div>
                  <div className="text-sm mt-1">{formatDate(selectedLog.createdAt)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Aksiyon</div>
                  <div className="text-sm mt-1">{getActionLabel(selectedLog.action)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Entity</div>
                  <div className="text-sm mt-1">{getEntityLabel(selectedLog.entity)}</div>
                </div>
                {selectedLog.entityId && (
                  <div>
                    <div className="text-sm font-medium text-gray-600">Entity ID</div>
                    <div className="text-sm mt-1">#{selectedLog.entityId}</div>
                  </div>
                )}
              </div>

              {selectedLog.details && (
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-2">Detaylar</div>
                  <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Token'ı localStorage'dan almak için yardımcı fonksiyon
function getStoredToken(): string | null {
  try {
    const stored = localStorage.getItem("adminSession");
    if (!stored) return null;
    const session = JSON.parse(stored);
    return session.token;
  } catch {
    return null;
  }
}