import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Eye, Loader2, CheckCircle } from "lucide-react";
import { formatPriceWithCurrency } from "@/utils/registrationFormatters";
import { PaymentStatusBadge } from "@/utils/paymentStatusDisplay";

interface FormResponse {
  id: number;
  formType: string;
  formName: string;
  data: Record<string, string>;
  submittedAt: string;
  createdAt: string;
}

/** "76.000 TL" veya "1.500" gibi metinden sayı çıkarır */
function parsePriceToNumber(priceStr: string | undefined): number {
  if (!priceStr || typeof priceStr !== "string") return 0;
  const cleaned = priceStr.replace(/\s*TL\s*/gi, "").trim().replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatCurrency(num: number): string {
  if (num === 0) return "₺0";
  return "₺" + new Intl.NumberFormat("tr-TR").format(Math.round(num));
}

function detectPaymentMethod(data: Record<string, string>): "havale" | "iyzico" | "mailorder" | "unknown" {
  const paymentMethod = data.paymentMethod as string | undefined;
  if (paymentMethod === "havale") return "havale";
  if (paymentMethod === "mailorder") return "mailorder";
  if (data.iyzicoPaymentId || data.iyzicoResult || paymentMethod === "iyzico" || paymentMethod === "credit_card") {
    return "iyzico";
  }
  if (data.kartNumarasi || data.cvc || data.sonKullanma) return "mailorder";
  if (paymentMethod === "kredi") return "mailorder";
  return "unknown";
}

function methodDisplayLabel(data: Record<string, string>): string {
  const m = detectPaymentMethod(data);
  if (m === "havale") return "Banka Havalesi";
  if (m === "iyzico") return "İyzico";
  if (m === "mailorder") return "Mail Order";
  return "-";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate().toString();
  const month = (date.getMonth() + 1).toString();
  const year = date.getFullYear();
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");
  return `${day}.${month}.${year} ${hour}:${minute}`;
}

export default function Payments() {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/forms/responses?formType=kayit");
        if (!cancelled && res.ok) {
          const data = await res.json();
          setResponses(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) setResponses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const successResponses = responses.filter((r) => r.data?.paymentStatus === "success");

  const paymentRows = successResponses.map((r) => {
    const d = r.data ?? {};
    const ceptel = d.ceptel && String(d.ceptel).trim();
    const sabit = d.telefon && String(d.telefon).trim();
    const kurum = d.kurumAdi && String(d.kurumAdi).trim();
    return {
      id: r.id,
      registrationId: r.id,
      name: d.adSoyad ?? "-",
      company: kurum || "-",
      mobile: ceptel || sabit || "-",
      amount: formatPriceWithCurrency(d.packagePrice) || "-",
      method: methodDisplayLabel(d),
      date: formatDate(r.submittedAt),
      data: d,
    };
  });

  const q = searchTerm.trim().toLowerCase();
  const filteredPayments = paymentRows.filter((row) => {
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.company.toLowerCase().includes(q) ||
      row.mobile.toLowerCase().includes(q) ||
      row.amount.toLowerCase().includes(q) ||
      row.method.toLowerCase().includes(q) ||
      row.date.toLowerCase().includes(q)
    );
  });

  const totalCount = successResponses.length;
  const totalRevenue = successResponses.reduce((sum, r) => sum + parsePriceToNumber(r.data?.packagePrice), 0);

  const byMethod = (m: "havale" | "iyzico" | "mailorder") =>
    successResponses.filter((r) => detectPaymentMethod(r.data ?? {}) === m);
  const havaleList = byMethod("havale");
  const iyzicoList = byMethod("iyzico");
  const mailOrderList = byMethod("mailorder");
  const sumAmount = (list: FormResponse[]) =>
    list.reduce((sum, r) => sum + parsePriceToNumber(r.data?.packagePrice), 0);
  const havaleRevenue = sumAmount(havaleList);
  const iyzicoRevenue = sumAmount(iyzicoList);
  const mailOrderRevenue = sumAmount(mailOrderList);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-10 h-10 animate-spin text-purple-primary" />
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <h1 className="text-xl font-bold text-gray-800 mb-4 sm:text-2xl sm:mb-6">Ödeme Yönetimi</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 min-w-0 sm:p-6">
          <p className="text-gray-500 text-xs sm:text-sm">Başarılı ödeme</p>
          <p className="text-lg font-bold text-gray-800 mt-0.5 break-words sm:text-2xl sm:mt-1 tabular-nums">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 min-w-0 sm:p-6">
          <p className="text-gray-500 text-xs sm:text-sm">Toplam gelir</p>
          <p className="text-lg font-bold text-purple-primary mt-0.5 break-words sm:text-2xl sm:mt-1 tabular-nums">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="flex min-w-0 overflow-hidden rounded-xl border border-gray-100/80 bg-white shadow-sm">
          <div className="flex w-12 shrink-0 items-center justify-center self-stretch bg-blue-500 sm:w-14">
            <CheckCircle className="h-5 w-5 text-white" aria-hidden />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-3 sm:px-4 sm:py-4">
            <p className="text-xs font-medium text-gray-600 sm:text-sm">Havale</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900 sm:text-base">{havaleList.length} kişi</p>
            <p className="mt-1 text-base font-bold tabular-nums text-blue-600 sm:text-lg">{formatCurrency(havaleRevenue)}</p>
          </div>
        </div>
        <div className="flex min-w-0 overflow-hidden rounded-xl border border-gray-100/80 bg-white shadow-sm">
          <div className="flex w-12 shrink-0 items-center justify-center self-stretch bg-green-500 sm:w-14">
            <CheckCircle className="h-5 w-5 text-white" aria-hidden />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-3 sm:px-4 sm:py-4">
            <p className="text-xs font-medium text-gray-600 sm:text-sm">İyzico</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900 sm:text-base">{iyzicoList.length} kişi</p>
            <p className="mt-1 text-base font-bold tabular-nums text-emerald-700 sm:text-lg">{formatCurrency(iyzicoRevenue)}</p>
          </div>
        </div>
        <div className="flex min-w-0 overflow-hidden rounded-xl border border-gray-100/80 bg-white shadow-sm">
          <div className="flex w-12 shrink-0 items-center justify-center self-stretch bg-orange-500 sm:w-14">
            <CheckCircle className="h-5 w-5 text-white" aria-hidden />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-3 sm:px-4 sm:py-4">
            <p className="text-xs font-medium text-gray-600 sm:text-sm">Mail Order</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900 sm:text-base">{mailOrderList.length} kişi</p>
            <p className="mt-1 text-base font-bold tabular-nums text-orange-600 sm:text-lg">{formatCurrency(mailOrderRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Arama */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Ad, şirket, cep, tutar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table - yatay scroll mobilde */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] [&_th]:break-normal [&_td]:break-normal">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sm:px-6">
                  #
                </th>
                <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Durum
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sm:px-6">
                  Katılımcı
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sm:px-6">
                  Şirket
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sm:px-6">
                  Cep telefonu
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sm:px-6">
                  Tutar
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sm:px-6">
                  Yöntem
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sm:px-6">
                  Tarih
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sm:px-6">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((payment, index) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm tabular-nums text-gray-500 whitespace-nowrap">
                    {index + 1}
                  </td>
                  <td className="px-2 py-2 align-middle whitespace-nowrap sm:py-4">
                    <PaymentStatusBadge data={payment.data} />
                  </td>
                  <td
                    className="px-4 py-3 sm:px-6 sm:py-4 text-sm font-medium text-gray-800 max-w-[220px] min-w-[10rem] truncate"
                    title={payment.name}
                  >
                    {payment.name}
                  </td>
                  <td
                    className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-gray-700 max-w-[200px] min-w-[8rem] truncate"
                    title={payment.company}
                  >
                    {payment.company}
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-gray-700 whitespace-nowrap">
                    {payment.mobile}
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm font-semibold text-gray-800 whitespace-nowrap">
                    {payment.amount}
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-gray-600 whitespace-nowrap">
                    {payment.method}
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{payment.date}</td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-right whitespace-nowrap">
                    <Link
                      to={`/uezyonetim/form-yanitlari/kayit/${payment.registrationId}`}
                      className="inline-flex p-2 text-purple-primary hover:bg-purple-50 rounded-lg transition-colors"
                      title="Kayıt detayı"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPayments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Ödeme kaydı bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}
