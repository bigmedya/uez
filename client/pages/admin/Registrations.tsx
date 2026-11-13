import { useState, useEffect, type ReactNode } from "react";
import * as XLSX from "xlsx-js-style";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Search,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
  Download,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Wallet,
} from "lucide-react";
import { useAdminLogger, LOG_ACTIONS, LOG_ENTITIES } from "@/hooks/useAdminLogger";
import { formatPriceWithCurrency } from "@/utils/registrationFormatters";
import { PaymentStatusBadge, getPaymentDisplayStatus } from "@/utils/paymentStatusDisplay";
import AdminCreateRegistration from "@/components/admin/AdminCreateRegistration";
import { useRegistrationExternalPayment } from "@/hooks/useRegistrationExternalPayment";
import { ExternalPaymentHistoryButton } from "@/components/admin/ExternalPaymentHistoryButton";
import { RevenueBreakdownCards } from "@/components/admin/RevenueBreakdownCards";

/** "76.000 TL" veya "1.500" gibi metinden sayı çıkarır (TR: nokta binlik ayracı) */
function parsePriceToNumber(priceStr: string | undefined): number {
  if (!priceStr || typeof priceStr !== "string") return 0;
  const cleaned = priceStr.replace(/\s*TL\s*/gi, "").trim().replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Sayıyı Türkçe para formatına çevirir */
function formatCurrency(num: number): string {
  if (num === 0) return "₺0";
  return "₺" + new Intl.NumberFormat("tr-TR").format(Math.round(num));
}

/** Ödeme yöntemini tespit eder */
function detectPaymentMethod(data: Record<string, string>): 'havale' | 'iyzico' | 'mailorder' | 'unknown' {
  const paymentMethod = data.paymentMethod as string | undefined;
  
  // Açık havale bildirimi
  if (paymentMethod === "havale") {
    return 'havale';
  }

  if (paymentMethod === "mailorder") {
    return 'mailorder';
  }
  
  if (data.iyzicoPaymentId || data.iyzicoResult || paymentMethod === "iyzico" || paymentMethod === "credit_card") {
    return 'iyzico';
  }
  
  if (data.kartNumarasi || data.cvc || data.sonKullanma) {
    return 'mailorder';
  }
  
  if (paymentMethod === "kredi") {
    return 'mailorder';
  }
  
  return 'unknown';
}

interface FormResponse {
  id: number;
  formType: string;
  formName: string;
  data: Record<string, string>;
  ipAddress: string;
  submittedAt: string;
  createdAt: string;
}

type OnayDurumuFilter = "all" | "success" | "pending" | "failed";
type PaymentMethodFilter = "all" | "havale" | "iyzico" | "mailorder";

type ExcelExportMode = "default" | "package";

const REGISTRATIONS_PAGE_SIZE = 20;

export default function Registrations() {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [onayDurumuFilter, setOnayDurumuFilter] = useState<OnayDurumuFilter>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethodFilter>("all");
  const [excelExportMode, setExcelExportMode] = useState<ExcelExportMode>("default");
  const [tablePage, setTablePage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const {
    savedAmount: externalPaymentSaved,
    entryCount: externalEntryCount,
    draft: externalDraft,
    setDraft: setExternalDraft,
    saving: externalSaving,
    commit: commitExternalPayment,
    commitError: externalCommitError,
    canCommit: externalCanCommit,
  } = useRegistrationExternalPayment();
  const { logAction } = useAdminLogger();

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/forms/responses?formType=kayit`);
      const data = await response.json();
      setResponses(data);
    } catch {
      void 0;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm("Bu kaydı silmek istediğinizden emin misiniz?")) {
      try {
        const response = await fetch(`/api/forms/responses/${id}`, { method: "DELETE" });
        if (response.ok) {
          const deletedResponse = responses.find(r => r.id === id);
          setResponses(responses.filter((r) => r.id !== id));
          await logAction({
            action: LOG_ACTIONS.DELETE,
            entity: LOG_ENTITIES.REGISTRATION,
            entityId: id.toString(),
            details: { 
              participantName: deletedResponse?.data?.adSoyad
            }
          });
        }
      } catch {
        void 0;
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

  // Tablo sütunları
  const tableColumns: {
    key: string;
    label: string;
    getValue?: (data: Record<string, string>) => string;
    renderCell?: (data: Record<string, string>) => ReactNode;
  }[] = [
    {
      key: "_odeme",
      label: "Ödeme",
      renderCell: (d) => <PaymentStatusBadge data={d} />,
    },
    { key: "adSoyad", label: "Ad Soyad" },
    { key: "kurumAdi", label: "Kurum" },
    {
      key: "telefon",
      label: "Telefon",
      getValue: (d) =>
        (d.ceptel && String(d.ceptel).trim()) ? d.ceptel : (d.telefon && String(d.telefon).trim() ? d.telefon : "-"),
    },
    { key: "eposta", label: "E-posta" },
    { key: "packagePrice", label: "Fiyat", getValue: (d) => formatPriceWithCurrency(d.packagePrice) || "-" },
  ];

  // Onay durumuna göre eşleşme (kredi: paymentStatus; havale: beklemede sayılır)
  const matchesOnayDurumu = (data: Record<string, string>): boolean => {
    const status = data.paymentStatus as string | undefined;
    const method = data.paymentMethod as string | undefined;
    if (onayDurumuFilter === "all") return true;
    if (onayDurumuFilter === "success") return status === "success";
    if (onayDurumuFilter === "failed") return status === "failed";
    if (onayDurumuFilter === "pending") return status !== "success" && status !== "failed";
    return true;
  };

  // Ödeme yöntemine göre eşleşme
  const matchesPaymentMethod = (data: Record<string, string>): boolean => {
    if (paymentMethodFilter === "all") return true;
    const detectedMethod = detectPaymentMethod(data);
    return detectedMethod === paymentMethodFilter;
  };

  const totalRegistrations = responses.length;
  const pendingCount = responses.filter(
    (r) => r.data?.paymentStatus !== "success" && r.data?.paymentStatus !== "failed"
  ).length;
  const successCount = responses.filter((r) => r.data?.paymentStatus === "success").length;
  const totalRevenue = responses
    .filter((r) => r.data?.paymentStatus === "success")
    .reduce((sum, r) => sum + parsePriceToNumber(r.data?.packagePrice), 0);

  const pendingTotalAmount = responses
    .filter((r) => r.data?.paymentStatus !== "success" && r.data?.paymentStatus !== "failed")
    .reduce((sum, r) => sum + parsePriceToNumber(r.data?.packagePrice), 0);

  // Ödeme yöntemlerine göre istatistikler
  const havalePayments = responses.filter(r => detectPaymentMethod(r.data) === 'havale');
  const iyzicoPayments = responses.filter(r => detectPaymentMethod(r.data) === 'iyzico');
  const mailOrderPayments = responses.filter(r => detectPaymentMethod(r.data) === 'mailorder');

  const havaleRevenue = havalePayments
    .filter(r => r.data?.paymentStatus === "success")
    .reduce((sum, r) => sum + parsePriceToNumber(r.data?.packagePrice), 0);
  
  const iyzicoRevenue = iyzicoPayments
    .filter(r => r.data?.paymentStatus === "success")
    .reduce((sum, r) => sum + parsePriceToNumber(r.data?.packagePrice), 0);
    
  const mailOrderRevenue = mailOrderPayments
    .filter(r => r.data?.paymentStatus === "success")
    .reduce((sum, r) => sum + parsePriceToNumber(r.data?.packagePrice), 0);

  const havaleSuccessCount = havalePayments.filter(r => r.data?.paymentStatus === "success").length;
  const iyzicoSuccessCount = iyzicoPayments.filter(r => r.data?.paymentStatus === "success").length;
  const mailOrderSuccessCount = mailOrderPayments.filter(r => r.data?.paymentStatus === "success").length;

  const stats: {
    label: string;
    value: string;
    icon: typeof Users;
    color: string;
    subLine?: string;
    subLineCaption?: string;
    subLineTone?: "amber" | "emerald" | "blue" | "neutral" | "red";
    valueTone?: "red";
    compactSubBlock?: boolean;
    valueBelowLabel?: boolean;
    valueSupplement?: string;
    valueSupplementLine2?: string;
    valueFootnote?: string;
    noLabelColon?: boolean;
    valueSupplementMuted?: boolean;
  }[] = [
    {
      label: "Havale Gerçekleşen Ödemeler",
      value: `${havaleSuccessCount} kişi`,
      icon: CheckCircle,
      color: "bg-blue-500",
      subLine: formatCurrency(havaleRevenue),
      subLineTone: "blue",
    },
    {
      label: "İyzico Gerçekleşen Ödemeler",
      value: `${iyzicoSuccessCount} kişi`,
      icon: CheckCircle,
      color: "bg-green-500",
      subLine: formatCurrency(iyzicoRevenue),
      subLineTone: "emerald",
    },
    {
      label: "Mail Order Gerçekleşen Ödemeler",
      value: `${mailOrderSuccessCount} kişi`,
      icon: CheckCircle,
      color: "bg-orange-500",
      subLine: formatCurrency(mailOrderRevenue),
      subLineTone: "amber",
    },
    {
      label: "Toplam Gelir",
      valueBelowLabel: true,
      noLabelColon: true,
      valueSupplement: `${successCount} kişi`,
      valueSupplementMuted: true,
      value: formatCurrency(totalRevenue),
      valueTone: "red",
      icon: TrendingUp,
      color: "bg-purple-dark",
    },
  ];

  // Arama + onay durumu + ödeme yöntemi filtresi
  const filteredResponses = responses.filter((response) => {
    const searchMatch = !searchTerm || Object.values(response.data).some((value) =>
      String(value ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    return searchMatch && matchesOnayDurumu(response.data) && matchesPaymentMethod(response.data);
  });

  const filteredCount = filteredResponses.length;
  const totalTablePages = Math.max(1, Math.ceil(filteredCount / REGISTRATIONS_PAGE_SIZE));

  useEffect(() => {
    setTablePage(1);
  }, [searchTerm, onayDurumuFilter, paymentMethodFilter]);

  useEffect(() => {
    setTablePage((p) => Math.min(Math.max(1, p), totalTablePages));
  }, [totalTablePages]);

  const safeTablePage = Math.min(Math.max(1, tablePage), totalTablePages);
  const pageStartIndex = (safeTablePage - 1) * REGISTRATIONS_PAGE_SIZE;
  const pagedResponses = filteredResponses.slice(
    pageStartIndex,
    pageStartIndex + REGISTRATIONS_PAGE_SIZE
  );
  const rangeEnd = filteredCount === 0 ? 0 : Math.min(pageStartIndex + REGISTRATIONS_PAGE_SIZE, filteredCount);

  // CSV ve arama için tüm alanlar (tabloda kullanılmıyor)
  const allFields = responses.length > 0 
    ? [...new Set(responses.flatMap((r) => Object.keys(r.data)))]
    : [];

  const exportExcel = () => {
    const exportData = filteredResponses;
    if (exportData.length === 0) return;

    const filterPart =
      onayDurumuFilter === "success"
        ? "onaylandi"
        : onayDurumuFilter === "pending"
          ? "beklemede"
          : onayDurumuFilter === "failed"
            ? "basarisiz"
            : "tumu";
    const modePart = excelExportMode === "package" ? "-paket" : "";
    const fileName = `uez-kayitlar-${filterPart}${modePart}.xlsx`;

    const gridBorder = {
      top: { style: "thin", color: { rgb: "FFD1D5DB" } },
      right: { style: "thin", color: { rgb: "FFD1D5DB" } },
      bottom: { style: "thin", color: { rgb: "FFD1D5DB" } },
      left: { style: "thin", color: { rgb: "FFD1D5DB" } },
    };

    const headerStyleSummary = {
      font: { bold: true, color: { rgb: "FF1F2937" } },
      alignment: { horizontal: "center" as const, vertical: "center" as const },
      border: gridBorder,
    };

    if (excelExportMode === "package") {
      const pkgMap = new Map<string, FormResponse[]>();
      for (const r of exportData) {
        const title = String(r.data?.packageTitle ?? "").trim() || "(Belirtilmemiş)";
        const sub = String(r.data?.packageSubtitle ?? "").trim();
        const key = `${title}\0${sub}`;
        if (!pkgMap.has(key)) pkgMap.set(key, []);
        pkgMap.get(key)!.push(r);
      }
      const sortedKeys = [...pkgMap.keys()].sort((a, b) => a.localeCompare(b, "tr"));
      // Liste = filteredResponses; sütunlar seçili onay filtresine göre (beklemede → sadece bekleyen kolonları)

      let pkgHeaders: string[];
      const buildRow = (
        paketLabel: string,
        list: FormResponse[],
        onay: number,
        bek: number,
        bas: number,
        tutarOnay: number,
        tutarBek: number,
        tutarBas: number
      ): unknown[] => {
        if (onayDurumuFilter === "pending") {
          return [paketLabel, list.length, formatCurrency(tutarBek)];
        }
        if (onayDurumuFilter === "success") {
          return [paketLabel, list.length, formatCurrency(tutarOnay)];
        }
        if (onayDurumuFilter === "failed") {
          return [paketLabel, list.length, formatCurrency(tutarBas)];
        }
        return [
          paketLabel,
          list.length,
          onay,
          bek,
          bas,
          formatCurrency(tutarOnay),
          formatCurrency(tutarBek),
          formatCurrency(tutarBas),
        ];
      };

      if (onayDurumuFilter === "pending") {
        pkgHeaders = ["Paket", "Kayıt Sayısı", "Bekleyen Tutar"];
      } else if (onayDurumuFilter === "success") {
        pkgHeaders = ["Paket", "Kayıt Sayısı", "Onaylı Tutar"];
      } else if (onayDurumuFilter === "failed") {
        pkgHeaders = ["Paket", "Kayıt Sayısı", "Başarısız Tutar"];
      } else {
        pkgHeaders = [
          "Paket",
          "Kayıt Sayısı",
          "Onaylı",
          "Bekleyen",
          "Başarısız",
          "Onaylı Tutar",
          "Bekleyen Tutar",
          "Başarısız Tutar",
        ];
      }

      const pkgRows: unknown[][] = [pkgHeaders];
      for (const key of sortedKeys) {
        const list = pkgMap.get(key)!;
        const sep = key.indexOf("\0");
        const title = sep >= 0 ? key.slice(0, sep) : key;
        const sub = sep >= 0 ? key.slice(sep + 1) : "";
        const paketLabel = sub ? `${title} — ${sub}` : title;
        let onay = 0;
        let bek = 0;
        let bas = 0;
        let tutarOnay = 0;
        let tutarBek = 0;
        let tutarBas = 0;
        for (const x of list) {
          const ps = String(x.data?.paymentStatus ?? "")
            .trim()
            .toLowerCase();
          const price = parsePriceToNumber(x.data?.packagePrice);
          if (ps === "success") {
            onay += 1;
            tutarOnay += price;
          } else if (ps === "failed") {
            bas += 1;
            tutarBas += price;
          } else {
            bek += 1;
            tutarBek += price;
          }
        }
        pkgRows.push(buildRow(paketLabel, list, onay, bek, bas, tutarOnay, tutarBek, tutarBas));
      }

      const colCount = pkgHeaders.length;
      const mergeEndCol = Math.min(4, colCount - 1);
      const paketBanner =
        onayDurumuFilter === "pending"
          ? "Bekleyen Ödemeler – Paket Bazlı Özet"
          : onayDurumuFilter === "success"
            ? "Onaylanmış Ödemeler – Paket Bazlı Özet"
            : onayDurumuFilter === "failed"
              ? "Başarısız Ödemeler – Paket Bazlı Özet"
              : "Tüm Ödemeler – Paket Bazlı Özet";

      const titleRow = Array<string>(colCount).fill("");
      titleRow[0] = paketBanner;
      const sheetMatrix = [titleRow, ...pkgRows];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(sheetMatrix);
      ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: mergeEndCol } }];
      ws["!cols"] = Array.from({ length: colCount }, () => ({ wch: 18 }));

      const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
      if (ws[titleRef]) {
        ws[titleRef].s = {
          font: { bold: true, sz: 12, color: { rgb: "FF111827" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: gridBorder,
        };
      }
      for (let c = 0; c < colCount; c += 1) {
        const ref = XLSX.utils.encode_cell({ r: 1, c });
        if (ws[ref]) ws[ref].s = headerStyleSummary;
      }
      for (let r = 2; r < sheetMatrix.length; r += 1) {
        for (let c = 0; c < colCount; c += 1) {
          const ref = XLSX.utils.encode_cell({ r, c });
          if (!ws[ref]) continue;
          ws[ref].s = {
            ...(ws[ref].s || {}),
            alignment: { vertical: "center" as const },
            border: gridBorder,
          };
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Paket Özeti");
      XLSX.writeFile(wb, fileName, { bookType: "xlsx", cellStyles: true });
      return;
    }

    // --- Normal (satır satır kayıt) ---
    // Hassas / teknik / dışa aktarılmayacak alanlar
    const SENSITIVE_KEYS = new Set([
      "cardNumber", "cardHolderName", "expireMonth", "expireYear", "cvc",
      "kartNumarasi", "sonKullanma", // form TR alan adları
      "cardAlias", "binNumber", "lastFourDigits", "cardType", "cardAssociation",
      "cardFamily", "cardToken", "cardUserKey",
      "iyzicoToken", "iyzicoConversationId", "iyzicoPaymentId",
      "iyzicoBasketId", "iyzicoOrderId", "iyzicoCallbackUrl",
      "iyzicoError", "paymentStatus", "paymentMethod",
      "packageId", // iç referans; Excel'de gösterilmez
    ]);

    // Sabit sütun sırası: 1.Durum 2.Ödeme Yöntemi 3.Paket 4.Paket Fiyatı sonra kullanıcı bilgileri
    const ORDERED_KEYS = [
      "packageTitle", "packagePrice",
      // 1. Katılımcı
      "adSoyad", "unvan", "kurumAdi", "kurumAdresi",
      "ceptel", "telefon", "eposta",
      // Asistan
      "asistanAdSoyad", "asistanEposta", "asistanTelefon",
      // 2. Katılımcı
      "adSoyad2", "unvan2", "kurumAdi2", "kurumAdresi2",
      "ceptel2", "telefon2", "eposta2",
      // Paket ek
      "packageSubtitle",
      // Fatura
      "invoiceType", "isEFatura", "firmaUnvani",
      "faturaAdresi", "faturaSehir", "faturaIlce", "faturaPostaKodu",
      "vergiDairesi", "vergiNo", "eArsivEmail",
      "tcKimlik", "ilgiliKisi",
      "sahisFaturaSehir", "sahisFaturaIlce", "sahisFaturaAdres", "sahisFaturaPostaKodu",
      "sahisEposta",
    ];

    const FIELD_LABELS: Record<string, string> = {
      packageTitle: "Paket",
      packagePrice: "Paket Fiyatı",
      packageSubtitle: "Paket Alt Başlığı",
      adSoyad: "Ad Soyad",
      unvan: "Ünvan",
      kurumAdi: "Kurum Adı",
      kurumAdresi: "Kurum Adresi",
      ceptel: "Cep Telefonu",
      telefon: "Telefon",
      eposta: "E-posta",
      asistanAdSoyad: "Asistan Ad Soyad",
      asistanEposta: "Asistan E-posta",
      asistanTelefon: "Asistan Telefon",
      adSoyad2: "2. Katılımcı Ad Soyad",
      unvan2: "2. Katılımcı Ünvan",
      kurumAdi2: "2. Katılımcı Kurum Adı",
      kurumAdresi2: "2. Katılımcı Kurum Adresi",
      ceptel2: "2. Katılımcı Cep Telefonu",
      telefon2: "2. Katılımcı Telefon",
      eposta2: "2. Katılımcı E-posta",
      invoiceType: "Fatura Tipi",
      firmaUnvani: "Firma Ünvanı",
      faturaAdresi: "Fatura Adresi",
      faturaSehir: "Fatura Şehri",
      faturaIlce: "Fatura İlçesi",
      faturaPostaKodu: "Fatura Posta Kodu",
      vergiDairesi: "Vergi Dairesi",
      vergiNo: "Vergi No",
      eArsivEmail: "e-Arşiv E-posta",
      tcKimlik: "TC Kimlik No",
      ilgiliKisi: "İlgili Kişi",
      sahisFaturaSehir: "Şahıs Fatura Şehri",
      sahisFaturaIlce: "Şahıs Fatura İlçesi",
      sahisFaturaAdres: "Şahıs Fatura Adresi",
      sahisFaturaPostaKodu: "Şahıs Fatura Posta Kodu",
      sahisEposta: "Şahıs E-posta",
      isEFatura: "E-Fatura",
    };

    const allKeys = [...new Set(exportData.flatMap((r) => Object.keys(r.data)))]
      .filter((k) => !SENSITIVE_KEYS.has(k));
    const orderedPresent = ORDERED_KEYS.filter((k) => allKeys.includes(k));
    const extras = allKeys.filter((k) => !ORDERED_KEYS.includes(k));
    const exportFields = [...orderedPresent, ...extras];

    const labelOf = (k: string) =>
      FIELD_LABELS[k] ?? k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();

    const cellVal = (key: string, v: unknown): string => {
      if (key === "packagePrice") return formatPriceWithCurrency(v == null ? "" : String(v)) || "";

      if (key === "isEFatura") {
        if (v === true || v === 1) return "Evet";
        if (v === false || v === 0) return "Hayır";
        const s = String(v ?? "").trim().toLowerCase();
        if (s === "true" || s === "1" || s === "yes") return "Evet";
        if (s === "false" || s === "0" || s === "no") return "Hayır";
        return s === "" ? "" : String(v);
      }

      if (v === null || v === undefined) return "";
      if (typeof v === "boolean") return v ? "Evet" : "Hayır";
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    };

    const methodLabel = (d: Record<string, string>): string => {
      const detectedMethod = detectPaymentMethod(d);
      switch (detectedMethod) {
        case 'havale':
          return 'Havale';
        case 'iyzico':
          return 'İyzico';
        case 'mailorder':
          return 'Mail Order';
        default:
          return 'Bilinmiyor';
      }
    };

    // Satır rengi: etiket metnine değil ham paymentStatus / paymentMethod’a göre
    // (etiket uyuşmazlığı veya eski veride tüm satırların sarı görünmesini önler)
    const exportRowColors = (d: Record<string, string>): { bg: string; fg: string } => {
      const ps = String(d.paymentStatus ?? "")
        .trim()
        .toLowerCase();
      if (ps === "success") return { bg: "FFD9F2E3", fg: "FF1E6B3A" };
      if (ps === "failed") return { bg: "FFC62828", fg: "FFFFFFFF" };

      const method = String(d.paymentMethod ?? "")
        .trim()
        .toLowerCase();
      if (method === "havale")
        return { bg: "FFFFF1B8", fg: "FF6B5A00" };

      // Kredi / iyzico bekleyen veya bilinmeyen bekleme
      if (ps === "pending" || ps === "" || method === "iyzico" || method === "kredi" || method === "credit_card")
        return { bg: "FFFFF1B8", fg: "FF6B5A00" };

      return { bg: "FFFFF1B8", fg: "FF6B5A00" };
    };

    const headers = ["Durum", "Ödeme Yöntemi", ...exportFields.map(labelOf)];

    // Workbook oluştur
    const wb = XLSX.utils.book_new();
    const wsData: unknown[][] = [headers];

    exportData.forEach((r) => {
      const statusLabel = getPaymentDisplayStatus(r.data).label;
      wsData.push([
        statusLabel,
        methodLabel(r.data),
        ...exportFields.map((f) => cellVal(f, r.data[f])),
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Sütun genişlikleri
    ws["!cols"] = headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...wsData.slice(1).map((row) => String(row[i] ?? "").length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
    });

    const headerStyle = {
      font: { bold: true, color: { rgb: "FF1F2937" } },
      alignment: { horizontal: "center" as const, vertical: "center" as const },
      border: gridBorder,
    };
    headers.forEach((_, ci) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: ci });
      if (ws[cellRef]) ws[cellRef].s = headerStyle;
    });

    exportData.forEach((r, ri) => {
      const { bg, fg } = exportRowColors(r.data);
      const statusCellRef = XLSX.utils.encode_cell({ r: ri + 1, c: 0 });
      if (!ws[statusCellRef]) ws[statusCellRef] = { t: "s", v: getPaymentDisplayStatus(r.data).label };
      ws[statusCellRef].s = {
        fill: { patternType: "solid" as const, fgColor: { rgb: bg } },
        font: { bold: true, color: { rgb: fg } },
        alignment: { horizontal: "center" as const, vertical: "center" as const, wrapText: true },
        border: gridBorder,
      };
    });

    // Tablodaki tüm hücrelerde çizgileri koru; sadece Durum hücresi renkli kalır
    for (let r = 1; r < wsData.length; r += 1) {
      for (let c = 0; c < headers.length; c += 1) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) continue;
        ws[cellRef].s = {
          ...(ws[cellRef].s || {}),
          border: gridBorder,
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Kayıtlar");

    XLSX.writeFile(wb, fileName, { bookType: "xlsx", cellStyles: true });
  };

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">Kayıt Formu Verileri</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-primary text-white rounded-lg hover:bg-purple-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Sipariş Oluştur
        </button>
      </div>

      <div className="mb-6 space-y-3 sm:mb-8 sm:space-y-4">
        <div className="grid min-w-0 grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 md:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const hasSubLine = Boolean(stat.subLine || stat.subLineCaption);
          return (
            <div
              key={index}
              className="flex h-full min-h-0 min-w-0 overflow-hidden rounded-xl border border-gray-100/80 bg-white shadow-sm"
            >
              <div className={cn("flex w-14 shrink-0 items-center justify-center self-stretch sm:w-16", stat.color)}>
                <Icon className="h-5 w-5 text-white sm:h-5 sm:w-5" />
              </div>
              <div
                className={cn(
                  "flex min-h-0 min-w-0 flex-1 flex-col px-3 py-2.5 sm:px-3.5 sm:py-3",
                  !hasSubLine && !stat.valueBelowLabel && "justify-center"
                )}
              >
                {stat.valueBelowLabel ? (
                  <div
                    className="flex min-h-0 w-full flex-1 flex-col justify-between text-left"
                    title={`${stat.label}: ${[stat.valueSupplement, stat.valueSupplementLine2].filter(Boolean).join(", ")}, ${stat.value}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug text-gray-600 sm:text-base">
                        {stat.label}
                        {!stat.noLabelColon ? (
                          <span className="text-gray-400" aria-hidden>
                            {" "}
                            :
                          </span>
                        ) : null}
                      </p>
                      {stat.valueSupplement ? (
                        <p
                          className={cn(
                            "pt-0.5 tabular-nums",
                            stat.valueSupplementMuted
                              ? "text-xs font-medium text-gray-500 sm:text-sm"
                              : "text-sm font-semibold text-gray-900 sm:text-base"
                          )}
                        >
                          {stat.valueSupplement}
                        </p>
                      ) : null}
                      {stat.valueSupplementLine2 ? (
                        <p
                          className={cn(
                            "pt-0.5 tabular-nums",
                            stat.valueSupplementMuted
                              ? "text-xs font-medium text-gray-500 sm:text-sm"
                              : "text-sm font-semibold text-gray-900 sm:text-base"
                          )}
                        >
                          {stat.valueSupplementLine2}
                        </p>
                      ) : null}
                    </div>
                    <div className="min-w-0 pt-2">
                      <p
                        className={cn(
                          "text-base font-bold tabular-nums leading-none sm:text-lg",
                          stat.valueTone === "red" ? "text-red-600" : "text-gray-900"
                        )}
                      >
                        {stat.value}
                      </p>
                      {stat.valueFootnote ? (
                        <p className="pt-1 text-[11px] font-normal leading-tight text-gray-500 tabular-nums sm:text-xs">
                          {stat.valueFootnote}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : hasSubLine ? (
                  <div className="flex min-h-0 w-full flex-1 flex-col justify-between">
                    <p
                      className="flex w-full min-w-0 flex-wrap items-center justify-start gap-x-0.5 gap-y-0.5 text-left"
                      title={`${stat.label}: ${stat.value}`}
                    >
                      <span
                        className="min-w-0 text-xs font-medium leading-snug text-gray-600 sm:text-sm"
                        title={stat.label}
                      >
                        {stat.label}
                      </span>
                      <span className="shrink-0 text-[10px] font-medium leading-none text-gray-400 sm:text-xs" aria-hidden>
                        :
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-bold tabular-nums leading-none sm:text-base",
                          stat.valueTone === "red" ? "text-red-600" : "text-gray-900"
                        )}
                      >
                        {stat.value}
                      </span>
                    </p>
                    <div
                      className={cn(
                        "w-full shrink-0",
                        stat.compactSubBlock ? "pt-1" : "pt-2"
                      )}
                    >
                      {stat.subLineCaption ? (
                        <p
                          className={cn(
                            "mb-0.5 text-left font-semibold text-gray-500",
                            stat.compactSubBlock ? "text-xs leading-tight sm:text-sm" : "text-[11px]"
                          )}
                        >
                          {stat.subLineCaption}
                        </p>
                      ) : null}
                      {stat.subLine ? (
                        <p
                          className={cn(
                            "text-left font-bold tabular-nums leading-tight text-gray-900",
                            stat.compactSubBlock ? "text-sm sm:text-base" : "text-base sm:text-lg",
                            stat.subLineTone === "amber" && "text-orange-600",
                            stat.subLineTone === "emerald" && "text-emerald-700",
                            stat.subLineTone === "blue" && "text-blue-600",
                            stat.subLineTone === "neutral" && "text-gray-900",
                            stat.subLineTone === "red" && "text-red-600"
                          )}
                          title={stat.subLine}
                        >
                          {stat.subLine}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p
                    className="flex w-full min-w-0 flex-wrap items-center justify-start gap-x-0.5 gap-y-0.5 text-left"
                    title={`${stat.label}: ${stat.value}`}
                  >
                    <span
                      className="min-w-0 text-xs font-medium leading-snug text-gray-600 sm:text-sm"
                      title={stat.label}
                    >
                      {stat.label}
                    </span>
                    <span className="shrink-0 text-[10px] font-medium leading-none text-gray-400 sm:text-xs" aria-hidden>
                      :
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-bold tabular-nums leading-none sm:text-base",
                        stat.valueTone === "red" ? "text-red-600" : "text-gray-900"
                      )}
                    >
                      {stat.value}
                    </span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
        </div>

        <RevenueBreakdownCards
          fromResponses={totalRevenue}
          external={externalPaymentSaved}
          pending={pendingTotalAmount}
          panelCount={successCount}
          manualEntryCount={externalEntryCount}
          pendingCount={pendingCount}
        />

        <div className="space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-gray-100/90 bg-white px-3 py-2 shadow-sm sm:flex-nowrap sm:px-4 sm:py-2.5">
            <div className="flex shrink-0 items-center gap-2 border-l-2 border-teal-600 pl-2.5 sm:pl-3">
              <Wallet className="h-4 w-4 text-teal-600 sm:h-[18px] sm:w-[18px]" aria-hidden />
              <span className="text-xs font-medium text-gray-600 sm:text-sm">Manuel gelir ekleme</span>
            </div>
            <label className="sr-only" htmlFor="reg-external-payments-amount">
              Bu oturumda eklenecek tutar (mevcut manuel gelir toplamına eklenir)
            </label>
            <input
              id="reg-external-payments-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="Eklenecek tutar"
              value={externalDraft}
              onChange={(e) => setExternalDraft(e.target.value)}
              disabled={externalSaving}
              className="min-w-0 flex-1 rounded border border-gray-200 bg-gray-50/80 px-2.5 py-1.5 text-sm tabular-nums text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-60 sm:max-w-[220px] sm:flex-initial sm:min-w-[140px]"
            />
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                disabled={externalSaving || !externalCanCommit}
                onClick={() => void commitExternalPayment()}
                className="rounded bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              >
                Ekle
              </button>
              <ExternalPaymentHistoryButton />
            </div>
          </div>
          {externalCommitError ? (
            <p className="px-1 text-xs text-red-600 sm:px-2">{externalCommitError}</p>
          ) : null}
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:flex-1 md:max-w-2xl">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Yanıtlarda ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent"
            />
          </div>
          <select
            value={onayDurumuFilter}
            onChange={(e) => setOnayDurumuFilter(e.target.value as OnayDurumuFilter)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-primary focus:border-transparent min-w-[160px]"
          >
            <option value="all">Tüm onay durumları</option>
            <option value="success">Onaylandı</option>
            <option value="pending">Beklemede</option>
            <option value="failed">Başarısız</option>
          </select>
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value as PaymentMethodFilter)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-purple-primary focus:border-transparent min-w-[160px]"
          >
            <option value="all">Tüm ödeme yöntemleri</option>
            <option value="havale">Havale</option>
            <option value="iyzico">İyzico</option>
            <option value="mailorder">Mail Order</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchResponses}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </button>
          <select
            id="excelType"
            value={excelExportMode}
            onChange={(e) => setExcelExportMode(e.target.value as ExcelExportMode)}
            className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-800 text-sm focus:ring-2 focus:ring-purple-primary focus:border-transparent min-w-[140px]"
            aria-label="Excel dışa aktarma türü"
          >
            <option value="default">Normal</option>
            <option value="package">Paket Bazlı</option>
          </select>
          <button
            id="exportExcel"
            type="button"
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Excel İndir
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 flex flex-wrap gap-4 text-sm text-gray-600">
        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
          Toplam: {responses.length} kayıt
        </span>
        {(searchTerm || onayDurumuFilter !== "all" || paymentMethodFilter !== "all") && (
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
            Filtrelenen: {filteredResponses.length} kayıt
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
                  {tableColumns.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        "text-left font-medium text-gray-500 uppercase truncate max-w-[200px]",
                        col.key === "_odeme"
                          ? "px-2 py-2 text-[10px] tracking-wide"
                          : "px-4 py-3 text-xs tracking-wider"
                      )}
                    >
                      {col.label}
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
                {pagedResponses.map((response, index) => (
                  <tr key={response.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm tabular-nums text-gray-500">
                      {pageStartIndex + index + 1}
                    </td>
                    {tableColumns.map((col) => {
                      if (col.renderCell) {
                        return (
                          <td
                            key={col.key}
                            className="px-2 py-2 align-middle whitespace-nowrap w-0"
                          >
                            {col.renderCell(response.data)}
                          </td>
                        );
                      }
                      const value = col.getValue ? col.getValue(response.data) : (response.data[col.key] || "-");
                      return (
                        <td
                          key={col.key}
                          className="px-4 py-3 text-sm text-gray-800 truncate max-w-[200px]"
                          title={String(value)}
                        >
                          {value}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(response.submittedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/uezyonetim/form-yanitlari/kayit/${response.id}`}
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

          {filteredCount > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/80">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">
                  {pageStartIndex + 1}–{rangeEnd}
                </span>
                <span className="text-gray-500"> / {filteredCount} kayıt</span>
                <span className="text-gray-400 hidden sm:inline"> · </span>
                <span className="text-gray-500 hidden sm:inline">
                  Sayfa {safeTablePage} / {totalTablePages}
                </span>
                <span className="block text-xs text-gray-500 sm:hidden mt-0.5">
                  Sayfa {safeTablePage} / {totalTablePages}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safeTablePage <= 1}
                  onClick={() =>
                    setTablePage((p) => {
                      const cur = Math.min(Math.max(1, p), totalTablePages);
                      return Math.max(1, cur - 1);
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Önceki
                </button>
                <button
                  type="button"
                  disabled={safeTablePage >= totalTablePages}
                  onClick={() =>
                    setTablePage((p) => {
                      const cur = Math.min(Math.max(1, p), totalTablePages);
                      return Math.min(totalTablePages, cur + 1);
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sonraki
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredResponses.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Kayıt bulunamadı.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Registration Modal */}
      <AdminCreateRegistration
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={() => {
          fetchResponses();
          setShowCreateForm(false);
        }}
      />
    </div>
  );
}
