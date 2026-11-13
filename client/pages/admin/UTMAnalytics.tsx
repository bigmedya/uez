import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Target,
  Users,
  DollarSign,
  BarChart3,
  Eye,
  Globe,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import type {
  UTMStatsResponse,
  UTMStat,
  UTMRegistrationsResponse,
  UTMRegistration,
  UTMSummaryResponse,
} from "@shared/api";
import { formatPriceWithCurrency } from "@/utils/registrationFormatters";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SummaryData = UTMSummaryResponse["summary"];

/** Sol renk şeridi + tonlu iç alan (panelde okunaklı renk) */
function AdminStatStrip({
  label,
  value,
  icon: Icon,
  stripClassName,
  tintClassName,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  stripClassName: string;
  tintClassName: string;
  /** İkincil satır (kişi / kampanya sayısı — ana tutardan küçük) */
  subtitle?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 overflow-hidden rounded-xl border shadow-sm",
        tintClassName
      )}
    >
      <div
        className={cn(
          "flex w-[3.25rem] shrink-0 items-center justify-center self-stretch sm:w-16",
          stripClassName
        )}
      >
        <Icon className="h-5 w-5 text-white" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2.5 sm:px-3.5 sm:py-3">
        <p className="text-xs font-medium leading-tight text-gray-600 sm:text-[13px]">{label}</p>
        <p className="mt-0.5 text-xl font-bold tabular-nums leading-tight text-gray-900 sm:text-2xl">
          {value}
        </p>
        {subtitle ? (
          <p className="mt-1 text-[11px] font-medium leading-snug text-gray-600 sm:text-xs">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function UTMAnalytics() {
  const [stats, setStats] = useState<UTMStat[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<UTMStat | null>(null);
  const [registrations, setRegistrations] = useState<UTMRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // UTM stats ve summary'yi paralel çek
      const [statsResponse, summaryResponse] = await Promise.all([
        fetch('/api/utm-analytics/stats'),
        fetch('/api/utm-analytics/summary')
      ]);

      if (!statsResponse.ok || !summaryResponse.ok) {
        throw new Error('UTM verilerine erişilemedi');
      }

      const statsData: UTMStatsResponse = await statsResponse.json();
      const summaryData: UTMSummaryResponse = await summaryResponse.json();

      if (!statsData.success || !summaryData.success) {
        throw new Error('UTM verilerine erişilemedi');
      }

      setStats(statsData.stats);
      setSummary(summaryData.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async (stat: UTMStat) => {
    setLoadingRegistrations(true);
    setSelectedCampaign(stat);
    setRegistrations([]);
    try {
      const params = new URLSearchParams({ utm_source: stat.utm_source });
      if (stat.utm_campaign) {
        params.append("utm_campaign", stat.utm_campaign);
      }

      const response = await fetch(`/api/utm-analytics/registrations?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Kayıtlar getirilemedi");
      }

      const data: UTMRegistrationsResponse = await response.json();
      if (!data.success) {
        throw new Error("Kayıtlar getirilemedi");
      }

      setRegistrations(data.registrations);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kayıtlar getirilemedi");
      setSelectedCampaign(null);
      setRegistrations([]);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const closeRegistrationsModal = () => {
    setSelectedCampaign(null);
    setRegistrations([]);
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200/70">
            <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
            Ödendi
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800 ring-1 ring-rose-200/70">
            <XCircle className="h-3 w-3 shrink-0" aria-hidden />
            Başarısız
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200/70">
            <Clock className="h-3 w-3 shrink-0" aria-hidden />
            Beklemede
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-w-0 w-full max-w-full overflow-x-hidden px-3 py-4 sm:px-0 sm:py-0">
        <h1 className="mb-1 text-xl font-bold text-gray-800 sm:text-2xl">UTM Analytics</h1>
        <p className="mb-6 text-sm text-gray-600">Kampanya ve kaynak performansı</p>
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-purple-primary" aria-hidden />
            <p className="text-sm text-gray-600">UTM verileri yükleniyor…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-w-0 w-full max-w-full overflow-x-hidden px-3 py-4 sm:px-0 sm:py-0">
        <h1 className="mb-1 text-xl font-bold text-gray-800 sm:text-2xl">UTM Analytics</h1>
        <p className="mb-6 text-sm text-gray-600">Kampanya ve kaynak performansı</p>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button
            type="button"
            onClick={fetchAnalytics}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Tekrar dene
          </button>
        </div>
      </div>
    );
  }

  const totalGelirFormatted =
    summary != null
      ? summary.total_utm_revenue
        ? formatPriceWithCurrency(summary.total_utm_revenue.toFixed(2))
        : "0 TL"
      : "0 TL";

  return (
    <div className="min-w-0 w-full max-w-full space-y-5 overflow-x-hidden px-3 py-4 sm:space-y-6 sm:px-0 sm:py-0">
      <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-primary to-purple-dark shadow-md shadow-purple-primary/25 sm:h-11 sm:w-11">
          <Target className="h-[1.15rem] w-[1.15rem] text-white sm:h-5 sm:w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold leading-tight text-gray-900 sm:text-2xl">UTM Analytics</h1>
          <p className="mt-0.5 text-xs text-gray-600 sm:text-sm">Kampanya ve kaynak performansı</p>
        </div>
      </div>

      {summary && (
        <>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatStrip
              label="Toplam kampanya"
              value={totalGelirFormatted}
              icon={BarChart3}
              stripClassName="bg-blue-500"
              tintClassName="border-blue-200/80 bg-gradient-to-r from-blue-50/90 to-white"
              subtitle={`${summary.total_utm_campaigns} kampanya`}
            />
            <AdminStatStrip
              label="Toplam kayıt"
              value={totalGelirFormatted}
              icon={Users}
              stripClassName="bg-emerald-500"
              tintClassName="border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-white"
              subtitle={`${summary.total_utm_registrations} kişi`}
            />
            <AdminStatStrip
              label="Ödenen kayıt"
              value={totalGelirFormatted}
              icon={CheckCircle2}
              stripClassName="bg-orange-500"
              tintClassName="border-orange-200/80 bg-gradient-to-r from-orange-50/90 to-white"
              subtitle={`${summary.total_utm_paid} kişi`}
            />
            <AdminStatStrip
              label="Toplam gelir"
              value={totalGelirFormatted}
              icon={DollarSign}
              stripClassName="bg-purple-dark"
              tintClassName="border-purple-200/80 bg-gradient-to-r from-purple-50/90 to-violet-50/50"
              subtitle={
                summary.total_utm_paid > 0
                  ? `${summary.total_utm_paid} kişi ödedi`
                  : "Ödeme tamamlayan kayıt yok"
              }
            />
          </div>
        </>
      )}

      {stats.length > 0 ? (
        <div className="min-w-0 overflow-hidden rounded-xl border border-purple-100/80 bg-white shadow-sm">
          <div className="border-b border-purple-100 bg-gradient-to-r from-purple-50/80 to-indigo-50/40 px-4 py-3.5 sm:px-5 sm:py-3">
            <h2 className="text-base font-semibold leading-snug text-gray-900 sm:text-base">
              Kampanya detayları
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-600 sm:mt-1 sm:text-xs">
              Kayıtlar için kampanya adına veya &quot;Kayıtlar&quot; butonuna tıklayın. Tabloyu yatay
              kaydırabilirsiniz.
            </p>
          </div>

          <div className="-mx-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0 sm:pb-0">
            <table className="w-full min-w-[56rem] border-separate border-spacing-0">
              <thead className="bg-gradient-to-r from-purple-50/90 to-violet-50/70">
                <tr>
                  <th className="min-w-[10rem] whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-purple-primary/90 sm:min-w-[11rem] sm:px-4">
                    Kampanya
                  </th>
                  <th className="min-w-[4.75rem] whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-purple-primary/90 sm:px-4">
                    Toplam
                  </th>
                  <th className="min-w-[4.75rem] whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-purple-primary/90 sm:px-4">
                    Ödenen
                  </th>
                  <th className="min-w-[6.25rem] whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-purple-primary/90 sm:px-4">
                    Beklemede
                  </th>
                  <th className="min-w-[12rem] whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-purple-primary/90 sm:min-w-[13rem] sm:px-4">
                    Dönüşüm
                  </th>
                  <th className="min-w-[5.5rem] whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-purple-primary/90 sm:px-4">
                    Gelir
                  </th>
                  <th className="min-w-[5.5rem] whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-purple-primary/90 sm:px-4">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {stats.map((stat, index) => (
                  <tr key={index} className="hover:bg-purple-50/40">
                    <td className="min-w-0 px-3 py-3 sm:px-4">
                      <div className="space-y-1">
                        <div className="flex items-start gap-2">
                          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-purple-primary" aria-hidden />
                          <button
                            type="button"
                            onClick={() => fetchRegistrations(stat)}
                            disabled={loadingRegistrations}
                            className="min-h-[44px] max-w-full text-left text-sm font-medium text-purple-primary underline decoration-2 decoration-purple-primary underline-offset-[5px] transition-colors hover:bg-purple-50/60 hover:text-purple-dark hover:decoration-purple-dark disabled:opacity-50 sm:min-h-0"
                          >
                            {stat.utm_source}
                          </button>
                        </div>
                        {stat.utm_medium ? (
                          <div className="flex items-center gap-2 pl-6">
                            <Mail className="h-3 w-3 shrink-0 text-sky-500" aria-hidden />
                            <span className="text-xs text-gray-500">{stat.utm_medium}</span>
                          </div>
                        ) : null}
                        {stat.utm_campaign ? (
                          <div className="flex items-center gap-2 pl-6">
                            <Target className="h-3 w-3 shrink-0 text-purple-primary" aria-hidden />
                            <span className="text-xs font-medium text-purple-primary">{stat.utm_campaign}</span>
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      <span className="text-sm font-semibold tabular-nums text-gray-900">
                        {stat.total_registrations}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      <span className="text-sm font-semibold tabular-nums text-green-600">
                        {stat.paid_registrations}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      <span className="text-sm tabular-nums text-amber-600">{stat.pending_registrations}</span>
                    </td>
                    <td className="min-w-[12rem] px-3 py-3 sm:min-w-[13rem] sm:px-4">
                      <div className="flex min-w-[10rem] max-w-[220px] items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200/90">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-purple-primary to-emerald-500 transition-all duration-500"
                            style={{ width: `${Math.min(stat.conversion_rate, 100)}%` }}
                          />
                        </div>
                        <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums text-gray-700">
                          {formatPercentage(stat.conversion_rate)}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      <span className="text-sm font-medium tabular-nums text-gray-900">
                        {stat.total_revenue ? formatPriceWithCurrency(stat.total_revenue.toFixed(2)) : "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                      <button
                        type="button"
                        onClick={() => fetchRegistrations(stat)}
                        disabled={loadingRegistrations}
                        className="inline-flex min-h-[40px] min-w-[5.5rem] items-center justify-center gap-1.5 rounded-md bg-purple-primary px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-dark active:bg-purple-dark disabled:opacity-50 sm:min-h-0 sm:min-w-0 sm:px-2.5 sm:py-1.5"
                      >
                        {loadingRegistrations ? (
                          <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden />
                        ) : (
                          <Eye className="h-4 w-4 text-white" aria-hidden />
                        )}
                        Kayıtlar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-purple-200 bg-purple-50/40 px-4 py-12 text-center">
          <Target className="mx-auto mb-3 h-10 w-10 text-purple-primary/40" aria-hidden />
          <p className="text-sm font-medium text-gray-700">Henüz UTM verisi yok</p>
          <p className="mt-1 text-xs text-gray-500">Parametreli kayıtlar gelince burada görünecek.</p>
        </div>
      )}

      <Dialog open={selectedCampaign !== null} onOpenChange={(open) => !open && closeRegistrationsModal()}>
        <DialogContent
          className={cn(
            "flex max-w-[1200px] flex-col gap-0 overflow-hidden p-0",
            "left-1/2 top-1/2 z-50 w-[calc(100vw-1rem)] max-h-[min(90dvh,calc(100dvh-2rem),880px)] -translate-x-1/2 -translate-y-1/2",
            "sm:w-[calc(100vw-2rem)]"
          )}
        >
          {selectedCampaign ? (
            <>
              <DialogHeader className="shrink-0 space-y-1 border-b border-purple-100 bg-gradient-to-r from-indigo-50/80 to-purple-50/50 px-4 pb-3 pl-4 pr-12 pt-6 text-left sm:px-6 sm:pr-14">
                <DialogTitle className="pr-1 text-base font-semibold leading-snug text-gray-900 sm:text-lg">
                  {selectedCampaign.utm_source}
                  {selectedCampaign.utm_campaign ? ` — ${selectedCampaign.utm_campaign}` : ""}
                </DialogTitle>
                <DialogDescription className="text-xs text-purple-primary/90 sm:text-sm">
                  {loadingRegistrations
                    ? "Kayıtlar yükleniyor…"
                    : `${registrations.length} kayıt`}
                </DialogDescription>
              </DialogHeader>

              <div
                className={cn(
                  "min-h-0 min-w-0 flex-1 touch-pan-y overscroll-y-contain",
                  "overflow-y-auto [-webkit-overflow-scrolling:touch]",
                  "px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 sm:px-6"
                )}
              >
                {loadingRegistrations ? (
                  <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-8">
                    <Loader2 className="h-10 w-10 animate-spin text-purple-primary" aria-hidden />
                    <p className="text-sm text-gray-600">Kayıtlar yükleniyor…</p>
                  </div>
                ) : registrations.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-600">Bu kampanya için kayıt bulunamadı.</p>
                ) : (
                  <div className="min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] touch-pan-x pb-0.5">
                    <table className="w-full min-w-[52rem] border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-gradient-to-r from-violet-50/95 to-purple-50/90 shadow-sm">
                      <tr>
                        <th className="min-w-[9rem] whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-purple-primary/90">
                          Katılımcı
                        </th>
                        <th className="min-w-[7rem] whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-purple-primary/90">
                          Kurum
                        </th>
                        <th className="min-w-[7rem] whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-purple-primary/90">
                          Paket
                        </th>
                        <th className="min-w-[5rem] whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-purple-primary/90">
                          Ödeme
                        </th>
                        <th className="min-w-[8rem] whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-purple-primary/90">
                          Tarih
                        </th>
                        <th className="min-w-[4.5rem] whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-purple-primary/90">
                          İşlem
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {registrations.map((registration) => (
                        <tr key={registration.id} className="hover:bg-purple-50/40">
                          <td className="px-3 py-2">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{registration.adSoyad}</p>
                              <p className="text-xs text-gray-500">{registration.eposta}</p>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <p className="text-sm text-gray-700">{registration.kurumAdi}</p>
                          </td>
                          <td className="px-3 py-2">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{registration.packageTitle}</p>
                              <p className="text-xs text-purple-primary">
                                {formatPriceWithCurrency(registration.packagePrice)}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-2">{getPaymentStatusBadge(registration.paymentStatus)}</td>
                          <td className="px-3 py-2">
                            <p className="text-xs tabular-nums text-gray-500">{formatDate(registration.submittedAt)}</p>
                          </td>
                          <td className="px-3 py-2">
                            <Link
                              to={`/uezyonetim/kayitlar/${registration.id}`}
                              className="text-sm font-medium text-purple-primary underline decoration-purple-primary/70 underline-offset-2 hover:text-purple-dark hover:decoration-purple-dark"
                              onClick={() => closeRegistrationsModal()}
                            >
                              Detay
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
