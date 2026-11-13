import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { useParams, Link } from "react-router-dom";
import { useAdminLogger, LOG_ACTIONS, LOG_ENTITIES } from "@/hooks/useAdminLogger";
import { formatPriceWithCurrency } from "@/utils/registrationFormatters";
import { isValidUTMData, type UTMData } from "@shared/utm";
import { 
  ArrowLeft, 
  Trash2, 
  Loader2, 
  Package, 
  CreditCard, 
  User, 
  Building2, 
  FileText, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Globe,
  Shield,
  Users,
  UserCheck,
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
} from "lucide-react";

interface FormResponse {
  id: number;
  formType: string;
  formName: string;
  data: Record<string, any>;
  ipAddress: string;
  submittedAt: string;
  createdAt: string;
}

export default function RegistrationDetail() {
  const { id } = useParams<{ id: string }>();
  const [response, setResponse] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatusUpdating, setPaymentStatusUpdating] = useState(false);
  const { logAction } = useAdminLogger();

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
        throw new Error("Kayıt bulunamadı");
      }
      const data = await response.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bu kaydı silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const res = await fetch(`/api/forms/responses/${id}`, { method: "DELETE" });
      if (res.ok) {
        await logAction({
          action: LOG_ACTIONS.DELETE,
          entity: LOG_ENTITIES.REGISTRATION,
          entityId: id,
          details: { 
            participantName: response?.data?.adSoyad
          }
        });
        
        window.location.href = "/uezyonetim/kayitlar";
      } else {
        alert("Kayıt silinirken bir hata oluştu");
      }
    } catch {
      alert("Kayıt silinirken bir hata oluştu");
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

  const handlePaymentStatusChange = async (newStatus: string) => {
    if (!id || !response || newStatus === (response.data?.paymentStatus ?? "")) return;
    try {
      setPaymentStatusUpdating(true);
      const res = await fetch(`/api/forms/responses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Güncelleme başarısız");
      }
      const updated = await res.json();
      setResponse(updated);
      await logAction({
        action: LOG_ACTIONS.UPDATE,
        entity: LOG_ENTITIES.REGISTRATION,
        entityId: id,
        details: { 
          paymentStatus: newStatus,
          previousStatus: response.data?.paymentStatus,
          participantName: response.data?.adSoyad
        }
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ödeme durumu güncellenemedi");
    } finally {
      setPaymentStatusUpdating(false);
    }
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
        <p className="text-red-700">{error || "Kayıt bulunamadı"}</p>
        <Link
          to="/uezyonetim/kayitlar"
          className="mt-2 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Geri Dön
        </Link>
      </div>
    );
  }

  const data = response.data;

  const pmRaw = data.paymentMethod;
  const pm = String(pmRaw ?? "").toLowerCase();
  /** Kayıtta seçilen yöntem önceliklidir; admin siparişte havale seçildiyse hep havale kalır. */
  const isHavale = pm === "havale";
  const isMailOrder = pm === "mailorder";

  const iyzicoId = data.iyzicoPaymentId != null && String(data.iyzicoPaymentId).trim() !== "";
  const iyzicoRes = data.iyzicoResult;
  const hasIyzicoResult =
    iyzicoRes != null &&
    (typeof iyzicoRes !== "object" || Array.isArray(iyzicoRes)
      ? String(iyzicoRes).trim() !== ""
      : Object.keys(iyzicoRes as object).length > 0);

  const isIyzico =
    !isHavale &&
    !isMailOrder &&
    (iyzicoId || hasIyzicoResult || pm === "iyzico" || pm === "credit_card");

  /** Kredi / İyzico akışı — havale ve mail order dışı */
  const isKrediFlow = !isHavale && !isMailOrder && (pm === "kredi" || isIyzico);

  const paymentMethodLabel = isHavale
    ? "Banka Havalesi"
    : isMailOrder
      ? "Mail order"
      : isIyzico
        ? "İyzico (kredi kartı)"
        : pm === "kredi"
          ? "Kredi kartı"
          : pmRaw
            ? String(pmRaw)
            : "—";

  const paymentBadgeClass = isHavale
    ? "bg-green-100 text-green-700"
    : isMailOrder
      ? "bg-amber-100 text-amber-900"
      : "bg-blue-100 text-blue-700";

  const hasStoredCardFields = Boolean(data.kartNumarasi || data.cvc || data.sonKullanma);

  const consentTarih = (v: unknown) => (v != null && String(v).trim() !== "" ? String(v) : "");
  const hasConsentAudit =
    consentTarih(data.mesafeliSatisVeIadeOnayTarihi) ||
    consentTarih(data.acikRizaOnayTarihi) ||
    consentTarih(data.aydinlatmaMetniOnayTarihi) ||
    data.mesafeliSatisVeIadeOnay === "evet" ||
    data.acikRizaOnay === "evet" ||
    data.aydinlatmaMetniOnay === "evet";

  const utmData = {
    utm_source: data.utm_source,
    utm_medium: data.utm_medium,
    utm_campaign: data.utm_campaign,
    utm_term: data.utm_term,
    utm_content: data.utm_content,
    utm_id: data.utm_id,
    utm_captured_at: data.utm_captured_at,
    utm_page_url: data.utm_page_url,
    utm_referrer: data.utm_referrer,
    utm_paid_at: data.utm_paid_at,
  } as UTMData & { utm_paid_at?: string };
  
  const hasUTMData = isValidUTMData(utmData);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/uezyonetim/kayitlar"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Kayıt Detayı</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-500">ID: #{response.id}</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-500">
                  {formatDate(response.submittedAt)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Sil
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="flex flex-col gap-6 self-start min-w-0">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-primary rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Paket Bilgileri</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Paket</p>
                <p className="text-lg font-bold text-purple-dark">
                  {data.packageTitle || "-"} {data.packageSubtitle && (
                    <span className="text-orange-primary">{data.packageSubtitle}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Fiyat</p>
                <p className="text-2xl font-bold text-purple-dark">{formatPriceWithCurrency(data.packagePrice) || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Ödeme Yöntemi</p>
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${paymentBadgeClass}`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  {paymentMethodLabel}
                </span>
                {isMailOrder ? (
                  <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                    Bu kayıt <span className="font-semibold">mail order</span> olarak işaretlendi (yönetim panelinden
                    manuel sipariş).
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {hasUTMData && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">UTM Tracking</h2>
                  <p className="text-xs text-blue-600">Kampanya takip bilgileri</p>
                </div>
              </div>
              <div className="space-y-3">
                {utmData.utm_source && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Kaynak</p>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                      <p className="text-sm font-medium text-gray-800 break-all">{utmData.utm_source}</p>
                    </div>
                  </div>
                )}
                {utmData.utm_campaign && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Kampanya</p>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-400 shrink-0" />
                      <p className="text-sm font-medium text-gray-800 break-all">{utmData.utm_campaign}</p>
                    </div>
                  </div>
                )}
                {utmData.utm_medium && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Medya</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                      <p className="text-sm font-medium text-gray-800 break-all">{utmData.utm_medium}</p>
                    </div>
                  </div>
                )}
                {utmData.utm_content && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">İçerik</p>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      <p className="text-sm font-medium text-gray-800 break-all">{utmData.utm_content}</p>
                    </div>
                  </div>
                )}
                {utmData.utm_term && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Terim</p>
                    <p className="text-sm font-medium text-gray-800 break-all">{utmData.utm_term}</p>
                  </div>
                )}
                {utmData.utm_id && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Kampanya ID</p>
                    <p className="text-sm font-mono font-medium text-gray-800 break-all">{utmData.utm_id}</p>
                  </div>
                )}
                {utmData.utm_captured_at && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Yakalandığı Zaman</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                      <p className="text-sm font-mono text-gray-800">{formatDate(utmData.utm_captured_at)}</p>
                    </div>
                  </div>
                )}
                {utmData.utm_paid_at && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-green-600 mb-1 font-medium">Ödeme Tamamlandı</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <p className="text-sm font-mono text-green-800">{formatDate(utmData.utm_paid_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Ödeme Bilgileri */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Ödeme Detayları</h2>
          </div>
          <div className="space-y-3">
            {/* Onay durumu — İyzico / kredi kartı */}
            {isKrediFlow && (
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Onay Durumu</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    data.paymentStatus === "success"
                      ? "bg-green-100 text-green-700"
                      : data.paymentStatus === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {data.paymentStatus === "success" && <CheckCircle2 className="w-4 h-4" />}
                    {data.paymentStatus === "failed" && <XCircle className="w-4 h-4" />}
                    {data.paymentStatus === "pending" && <Clock className="w-4 h-4" />}
                    {data.paymentStatus === "success"
                      ? "Onaylandı"
                      : data.paymentStatus === "failed"
                      ? "Başarısız"
                      : "Beklemede"}
                  </span>
                  {data.paymentStatus === "failed" && data.iyzicoError && (
                    <p className="text-xs text-red-600 mt-1">{data.iyzicoError}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ödeme durumunu değiştir</p>
                  <select
                    value={data.paymentStatus ?? "pending"}
                    onChange={(e) => handlePaymentStatusChange(e.target.value)}
                    disabled={paymentStatusUpdating}
                    className="w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-60"
                  >
                    <option value="pending">Beklemede</option>
                    <option value="success">Onaylandı</option>
                    <option value="failed">Başarısız</option>
                  </select>
                  {paymentStatusUpdating && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Güncelleniyor...
                    </span>
                  )}
                </div>
                {(data.iyzicoPaymentId || data.iyzicoPaidPrice != null) && (
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-3 space-y-2 text-sm">
                    <p className="text-xs font-semibold text-gray-600">İyzico bilgileri</p>
                    {data.iyzicoPaymentId ? (
                      <p>
                        <span className="text-gray-500">Ödeme ID: </span>
                        <span className="font-mono text-gray-900">{String(data.iyzicoPaymentId)}</span>
                      </p>
                    ) : null}
                    {data.iyzicoPaidPrice != null && data.iyzicoPaidPrice !== "" ? (
                      <p>
                        <span className="text-gray-500">Tutar: </span>
                        <span className="font-medium text-gray-900">{String(data.iyzicoPaidPrice)}</span>
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            )}
            {isHavale && (
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Onay Durumu</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    data.paymentStatus === "success"
                      ? "bg-green-100 text-green-700"
                      : data.paymentStatus === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {data.paymentStatus === "success" && <CheckCircle2 className="w-4 h-4" />}
                    {data.paymentStatus === "failed" && <XCircle className="w-4 h-4" />}
                    {(data.paymentStatus === "pending" || !data.paymentStatus) && <Clock className="w-4 h-4" />}
                    {data.paymentStatus === "success"
                      ? "Onaylandı"
                      : data.paymentStatus === "failed"
                      ? "Başarısız"
                      : "Havale bekleniyor"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ödeme durumunu değiştir</p>
                  <select
                    value={data.paymentStatus ?? "pending"}
                    onChange={(e) => handlePaymentStatusChange(e.target.value)}
                    disabled={paymentStatusUpdating}
                    className="w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-60"
                  >
                    <option value="pending">Havale bekleniyor</option>
                    <option value="success">Onaylandı</option>
                    <option value="failed">Başarısız</option>
                  </select>
                  {paymentStatusUpdating && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Güncelleniyor...
                    </span>
                  )}
                </div>
              </div>
            )}
            {isMailOrder && (
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Onay Durumu</p>
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                      data.paymentStatus === "success"
                        ? "bg-green-100 text-green-700"
                        : data.paymentStatus === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {data.paymentStatus === "success" && <CheckCircle2 className="w-4 h-4" />}
                    {data.paymentStatus === "failed" && <XCircle className="w-4 h-4" />}
                    {(data.paymentStatus === "pending" || !data.paymentStatus) && <Clock className="w-4 h-4" />}
                    {data.paymentStatus === "success"
                      ? "Onaylandı"
                      : data.paymentStatus === "failed"
                        ? "Başarısız"
                        : "Beklemede"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ödeme durumunu değiştir</p>
                  <select
                    value={data.paymentStatus ?? "pending"}
                    onChange={(e) => handlePaymentStatusChange(e.target.value)}
                    disabled={paymentStatusUpdating}
                    className="w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-60"
                  >
                    <option value="pending">Beklemede</option>
                    <option value="success">Onaylandı</option>
                    <option value="failed">Başarısız</option>
                  </select>
                  {paymentStatusUpdating && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Güncelleniyor...
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Mail order kayıtlarında ödeme kurum içi / telefon ile takip edilir; havale veya İyzico talimatları
                  bu kayıt için otomatik uygulanmaz.
                </p>
              </div>
            )}
            {isKrediFlow ? (
              null
            ) : isHavale ? (
              <>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Hesap Adı</p>
                  <p className="text-sm font-medium text-gray-800">
                    BİG MEDYA TEKNOLOJİ A.Ş.
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Banka</p>
                  <p className="text-sm font-medium text-gray-800">
                    GARANTİ BANKASI
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Şube</p>
                  <p className="text-sm font-medium text-gray-800">
                    ALTUNİZADE TİCARİ-341
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Hesap No</p>
                  <p className="text-sm font-medium text-gray-800">
                    6293874
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">IBAN</p>
                  <p className="text-sm font-mono font-medium text-gray-800 bg-gray-50 p-2 rounded">
                    TR03 0006 2000 3410 0006 2938 74
                  </p>
                </div>
                <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 space-y-2">
                  <p className="font-semibold">İletişim için;</p>
                  <p className="font-medium text-purple-dark">EPS EVENT</p>
                  <p>Tel: 0530 583 62 92</p>
                  <p>e-mail: uez2026@epsevent.com</p>
                  <p className="break-words">Adres: MERKEZ MAH. KAGITHANE CAD. I OFIS NO: 3 IÇ KAPI NO: 51 KAGITHANE/ ISTANBUL</p>
                  <p className="font-semibold pt-2">İPTAL VE İADE ŞARTLARI:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>25 Mart 2026 (dahil) tarihinden önce yapılan iptallerde toplam ödemelerin sadece %50'si iade edilir.</li>
                    <li>26 Mart 2026 (dahil) tarihinden itibaren yapılan iptallerde ödemeler iade edilmez. İsim değişikliği yapılabilir.</li>
                    <li>Tüm iptaller yazılı olarak tarafımıza iletilmelidir.</li>
                  </ul>
                </div>
              </>
            ) : isMailOrder ? (
              <div className="rounded-lg border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-950">
                <p className="font-medium text-amber-900">Mail order</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
                  Bu kayıt için banka havalesi veya kart ile ödeme talimatı doğrudan yönetim veya müşteri ile
                  paylaşılmış olabilir; yöntem <strong>mail order</strong> olarak kayıtlıdır.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Sistem Bilgileri */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Shield className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Sistem Bilgileri</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Gönderim Tarihi</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-medium text-gray-800">
                  {formatDate(response.submittedAt)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Oluşturulma Tarihi</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-medium text-gray-800">
                  {formatDate(response.createdAt)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">IP Adresi</p>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-mono text-gray-800">{response.ipAddress}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kart bilgileri (eski form / mail order ile saklanan, şifre çözülmüş) */}
      {hasStoredCardFields && (data.paymentMethod === "kredi" || isMailOrder) && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-amber-200 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {isMailOrder ? "Mail order — kart bilgileri" : "Kart Bilgileri"}
              </h2>
              <p className="text-xs text-gray-500">
                {isMailOrder
                  ? "Mail order kaydında saklanan kart bilgileri (şifre çözülmüş)"
                  : "Kayıtta saklanan bilgiler (şifre çözülmüş)"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.kartNumarasi && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1 font-medium">Kart Numarası</p>
                <p className="text-base font-mono text-gray-800 tracking-wide">
                  {String(data.kartNumarasi).replace(/(\d{4})/g, "$1 ").trim()}
                </p>
              </div>
            )}
            {data.sonKullanma && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1 font-medium">Son Kullanma Tarihi</p>
                <p className="text-base font-mono text-gray-800">{data.sonKullanma}</p>
              </div>
            )}
            {data.cvc && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1 font-medium">CVC</p>
                <p className="text-base font-mono text-gray-800">{data.cvc}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ana Bilgiler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Katılımcı Bilgileri */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Katılımcı Bilgileri</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Ad Soyad</p>
                  <p className="text-base font-medium text-gray-800">{data.adSoyad || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">E-posta</p>
                  <p className="text-base font-medium text-gray-800 break-all">{data.eposta || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Telefon</p>
                  <p className="text-base font-medium text-gray-800">{data.telefon || "-"}</p>
                </div>
              </div>
              {data.ceptel && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Cep Telefonu</p>
                    <p className="text-base font-medium text-gray-800">{data.ceptel}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Kurum</p>
                  <p className="text-base font-medium text-gray-800">{data.kurumAdi || "-"}</p>
                </div>
              </div>
              {data.unvan && (
                <div className="flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Ünvan</p>
                    <p className="text-base font-medium text-gray-800">{data.unvan}</p>
                  </div>
                </div>
              )}
              {data.kurumAdresi && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Kurum Adresi</p>
                    <p className="text-base font-medium text-gray-800">{data.kurumAdresi}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Asistan Bilgileri (varsa) */}
        {(data.asistanAdSoyad || data.asistanEposta || data.asistanTelefon) && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Asistan Bilgileri</h2>
            </div>
            <div className="space-y-4">
              {data.asistanAdSoyad && (
                <div className="flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Ad Soyad</p>
                    <p className="text-base font-medium text-gray-800">{data.asistanAdSoyad}</p>
                  </div>
                </div>
              )}
              {data.asistanEposta && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">E-posta</p>
                    <p className="text-base font-medium text-gray-800 break-all">{data.asistanEposta}</p>
                  </div>
                </div>
              )}
              {data.asistanTelefon && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Telefon</p>
                    <p className="text-base font-medium text-gray-800">{data.asistanTelefon}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* İkinci Katılımcı (varsa) */}
        {data.adSoyad2 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">İkinci Katılımcı Bilgileri</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Ad Soyad</p>
                  <p className="text-base font-medium text-gray-800">{data.adSoyad2}</p>
                </div>
              </div>
              {data.eposta2 && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">E-posta</p>
                    <p className="text-base font-medium text-gray-800 break-all">{data.eposta2}</p>
                  </div>
                </div>
              )}
              {data.telefon2 && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Telefon</p>
                    <p className="text-base font-medium text-gray-800">{data.telefon2}</p>
                  </div>
                </div>
              )}
              {data.kurumAdi2 && (
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Kurum</p>
                    <p className="text-base font-medium text-gray-800">{data.kurumAdi2}</p>
                  </div>
                </div>
              )}
              {data.kurumAdresi2 && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Kurum Adresi</p>
                    <p className="text-base font-medium text-gray-800">{data.kurumAdresi2}</p>
                  </div>
                </div>
              )}
              {data.unvan2 && (
                <div className="flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Ünvan</p>
                    <p className="text-base font-medium text-gray-800">{data.unvan2}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fatura Bilgileri */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="p-2 bg-green-100 rounded-lg">
              <Receipt className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Fatura Bilgileri</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Fatura Tipi</p>
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                data.invoiceType === "firma" 
                  ? "bg-blue-100 text-blue-700" 
                  : "bg-purple-100 text-purple-700"
              }`}>
                {data.invoiceType === "firma" ? "Firma" : 
                 data.invoiceType === "sahis" ? "Şahıs" : "-"}
              </span>
            </div>
            {data.invoiceType === "firma" ? (
              <>
                {data.firmaUnvani && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Firma Ünvanı</p>
                      <p className="text-base font-medium text-gray-800">{data.firmaUnvani}</p>
                    </div>
                  </div>
                )}
                {data.vergiDairesi && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Vergi Dairesi</p>
                      <p className="text-base font-medium text-gray-800">{data.vergiDairesi}</p>
                    </div>
                  </div>
                )}
                {data.vergiNo && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Vergi No</p>
                      <p className="text-base font-mono font-medium text-gray-800">{data.vergiNo}</p>
                    </div>
                  </div>
                )}
                {(data.faturaSehir || data.faturaIlce || data.faturaAdres || data.faturaPostaKodu) && (
                  <>
                    {data.faturaSehir && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Şehir</p>
                          <p className="text-base font-medium text-gray-800">{data.faturaSehir}</p>
                        </div>
                      </div>
                    )}
                    {data.faturaIlce && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">İlçe</p>
                          <p className="text-base font-medium text-gray-800">{data.faturaIlce}</p>
                        </div>
                      </div>
                    )}
                    {data.faturaAdres && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Açık Adres</p>
                          <p className="text-base font-medium text-gray-800">{data.faturaAdres}</p>
                        </div>
                      </div>
                    )}
                    {data.faturaPostaKodu && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Posta Kodu</p>
                          <p className="text-base font-medium text-gray-800">{data.faturaPostaKodu}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {data.faturaAdresi && !data.faturaAdres && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Fatura Adresi</p>
                      <p className="text-base font-medium text-gray-800">{data.faturaAdresi}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1">e-Fatura</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    data.isEFatura 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {data.isEFatura ? "Evet" : "Hayır"}
                  </span>
                </div>
                {data.eArsivEmail && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">e-Arşiv E-posta</p>
                      <p className="text-base font-medium text-gray-800 break-all">{data.eArsivEmail}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {data.tcKimlik && (
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">TC Kimlik No</p>
                      <p className="text-base font-mono font-medium text-gray-800">{data.tcKimlik}</p>
                    </div>
                  </div>
                )}
                {data.ilgiliKisi && (
                  <div className="flex items-start gap-3">
                    <UserCheck className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">İlgili Kişi</p>
                      <p className="text-base font-medium text-gray-800">{data.ilgiliKisi}</p>
                    </div>
                  </div>
                )}
                {(data.sahisFaturaSehir || data.sahisFaturaIlce || data.sahisFaturaAdres || data.sahisFaturaPostaKodu) && (
                  <>
                    {data.sahisFaturaSehir && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Şehir</p>
                          <p className="text-base font-medium text-gray-800">{data.sahisFaturaSehir}</p>
                        </div>
                      </div>
                    )}
                    {data.sahisFaturaIlce && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">İlçe</p>
                          <p className="text-base font-medium text-gray-800">{data.sahisFaturaIlce}</p>
                        </div>
                      </div>
                    )}
                    {data.sahisFaturaAdres && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Açık Adres</p>
                          <p className="text-base font-medium text-gray-800">{data.sahisFaturaAdres}</p>
                        </div>
                      </div>
                    )}
                    {data.sahisFaturaPostaKodu && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Posta Kodu</p>
                          <p className="text-base font-medium text-gray-800">{data.sahisFaturaPostaKodu}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {data.sahisFaturaAdresi && !data.sahisFaturaAdres && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Fatura Adresi</p>
                      <p className="text-base font-medium text-gray-800">{data.sahisFaturaAdresi}</p>
                    </div>
                  </div>
                )}
                {data.sahisEposta && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">E-posta</p>
                      <p className="text-base font-medium text-gray-800 break-all">{data.sahisEposta}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {hasConsentAudit ? (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-100 rounded-lg">
              <FileText className="w-5 h-5 text-slate-700" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Metin onayı — kayıt zamanı</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium">Mesafeli satış ve iptal politikası</p>
              <p className="font-medium text-gray-900 tabular-nums">
                {consentTarih(data.mesafeliSatisVeIadeOnayTarihi)
                  ? formatDate(data.mesafeliSatisVeIadeOnayTarihi as string)
                  : "—"}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium">Açık rıza metni</p>
              <p className="font-medium text-gray-900 tabular-nums">
                {consentTarih(data.acikRizaOnayTarihi)
                  ? formatDate(data.acikRizaOnayTarihi as string)
                  : "—"}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 mb-1 font-medium">Aydınlatma metni</p>
              <p className="font-medium text-gray-900 tabular-nums">
                {consentTarih(data.aydinlatmaMetniOnayTarihi)
                  ? formatDate(data.aydinlatmaMetniOnayTarihi as string)
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
