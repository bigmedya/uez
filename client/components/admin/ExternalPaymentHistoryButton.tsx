import { useState, useEffect, useCallback } from "react";
import { List, Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAdminBearerToken } from "@/lib/adminSession";

function formatCurrency(num: number): string {
  if (num === 0) return "₺0";
  return "₺" + new Intl.NumberFormat("tr-TR").format(Math.round(num));
}

type HistoryItem = {
  id: number;
  createdAt: string;
  amount: number;
  user: { id: number; name: string | null; email: string };
};

export function ExternalPaymentHistoryButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteHint, setDeleteHint] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const fetchItems = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) {
      setError("Oturum bulunamadı. Yeniden giriş yapın.");
      return;
    }
    const res = await fetch(`/api/admin/registration-external-payment/history?limit=100&t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      setError("Liste yüklenemedi.");
      return;
    }
    const data = (await res.json()) as { items?: HistoryItem[] };
    setItems(Array.isArray(data.items) ? data.items : []);
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchItems();
      } catch {
        if (!cancelled) setError("Bir hata oluştu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, fetchItems]);

  const handleDelete = async (id: number) => {
    if (!confirm("Bu kaydı silmek manuel gelir toplamından düşer. Devam edilsin mi?")) return;
    const token = getAdminBearerToken();
    if (!token) {
      setDeleteHint({ kind: "err", text: "Oturum bulunamadı." });
      return;
    }
    setDeleteHint(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/registration-external-payment/entries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("external-payments-changed"));
        setDeleteHint({ kind: "ok", text: "Kayıt silindi. Toplam güncellendi." });
        window.setTimeout(() => setDeleteHint(null), 4000);
        await fetchItems();
      } else {
        let msg = "Silinemedi.";
        try {
          const body = (await res.json()) as { error?: string };
          if (body?.error) msg = body.error;
        } catch {
          void 0;
        }
        setDeleteHint({ kind: "err", text: msg });
      }
    } catch {
      setDeleteHint({ kind: "err", text: "Bağlantı hatası." });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1 rounded border border-teal-600/80 bg-white px-2.5 py-1.5 text-xs font-semibold text-teal-700 shadow-sm hover:bg-teal-50 sm:gap-1.5 sm:px-3 sm:text-sm"
        >
          <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
          Liste
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-gray-100 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <DialogTitle className="text-base sm:text-lg">Manuel gelir kayıtları</DialogTitle>
        </DialogHeader>
        {deleteHint ? (
          <div
            className={`border-b px-4 py-2 text-sm sm:px-6 ${
              deleteHint.kind === "ok"
                ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                : "border-red-100 bg-red-50 text-red-700"
            }`}
            role="status"
          >
            {deleteHint.text}
          </div>
        ) : null}
        <div className="max-h-[min(60vh,520px)] overflow-auto px-2 py-2 sm:px-4 sm:py-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Yükleniyor…</span>
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-600">{error}</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">Henüz kayıt yok.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full min-w-[400px] border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/90">
                    <th className="whitespace-nowrap px-2 py-2 font-semibold text-gray-700 sm:px-3">Tarih</th>
                    <th className="whitespace-nowrap px-2 py-2 font-semibold text-gray-700 sm:px-3">Ekleyen</th>
                    <th className="whitespace-nowrap px-2 py-2 font-semibold text-gray-700 sm:px-3">Eklenen</th>
                    <th className="w-12 px-2 py-2 sm:px-3" aria-label="Sil" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 last:border-0">
                      <td className="whitespace-nowrap px-2 py-2 tabular-nums text-gray-800 sm:px-3">
                        {new Date(row.createdAt).toLocaleString("tr-TR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="max-w-[200px] px-2 py-2 text-gray-800 sm:px-3">
                        <div className="line-clamp-2 font-medium">{row.user.name || row.user.email}</div>
                        {row.user.name ? (
                          <div className="mt-0.5 truncate text-[11px] text-gray-500 sm:text-xs">{row.user.email}</div>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 font-semibold tabular-nums text-teal-700 sm:px-3">
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="px-1 py-2 sm:px-2">
                        <button
                          type="button"
                          disabled={deletingId === row.id}
                          onClick={() => void handleDelete(row.id)}
                          className="inline-flex rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
