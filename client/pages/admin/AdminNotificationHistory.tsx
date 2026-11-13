import { useState, useEffect } from "react";
import { History, Loader2, Bell, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface NotificationHistoryItem {
  id: number;
  title: string;
  body: string;
  url: string | null;
  sentCount: number;
  isTest: boolean;
  createdAt: string;
}

export default function AdminNotificationHistory() {
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/onesignal/history?limit=100");
        if (!cancelled && res.ok) {
          const data = await res.json();
          const list = data.history ?? [];
          setHistory(list.map((n: { id: number; title: string; body: string; url: string | null; recipients?: number; createdAt: string }) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            url: n.url ?? null,
            sentCount: n.recipients ?? 0,
            isTest: false,
            createdAt: n.createdAt,
          })));
        }
      } catch {
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-10 h-10 animate-spin text-purple-primary" />
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-gray-800 sm:text-2xl flex items-center gap-2">
          <History className="w-6 h-6 text-purple-primary" />
          Bildirim Geçmişi
        </h1>
        <Link
          to="/uezyonetim"
          className="text-sm text-purple-primary hover:underline flex items-center gap-1"
        >
          <Bell className="w-4 h-4" />
          Bildirim gönder
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {history.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">Henüz gönderilmiş bildirim yok.</p>
            <p className="text-sm text-gray-400">
              Dashboard üzerinden &quot;Bildirim Gönder&quot; veya &quot;Test Bildirimi&quot; kullandığınızda burada listelenecektir.
            </p>
            <Link
              to="/uezyonetim"
              className="inline-block mt-4 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark transition-colors text-sm"
            >
              Dashboard&apos;a git
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-left text-gray-600">
                  <th className="py-3 px-4 font-semibold">Tarih</th>
                  <th className="py-3 px-4 font-semibold">Başlık</th>
                  <th className="py-3 px-4 font-semibold max-w-[220px]">Mesaj</th>
                  <th className="py-3 px-4 font-semibold">Link</th>
                  <th className="py-3 px-4 font-semibold text-center">Kişi</th>
                  <th className="py-3 px-4 font-semibold w-20">Tür</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800 max-w-[180px] truncate" title={item.title}>
                      {item.title}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-[220px] truncate" title={item.body}>
                      {item.body}
                    </td>
                    <td className="py-3 px-4 max-w-[140px]">
                      {item.url ? (
                        item.url.startsWith("http") ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-primary hover:underline flex items-center gap-1 truncate"
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Link</span>
                          </a>
                        ) : (
                          <span className="text-gray-500 truncate block" title={item.url}>
                            {item.url}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">{item.sentCount}</td>
                    <td className="py-3 px-4">
                      {item.isTest ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Test</span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
