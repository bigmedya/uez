import type { LucideIcon } from "lucide-react";
import { CheckCircle, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRegistrationExternalPayment } from "@/hooks/useRegistrationExternalPayment";
import { ExternalPaymentHistoryButton } from "@/components/admin/ExternalPaymentHistoryButton";
import { RevenueBreakdownCards } from "@/components/admin/RevenueBreakdownCards";

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

  if (paymentMethod === "havale") {
    return "havale";
  }

  if (paymentMethod === "mailorder") {
    return "mailorder";
  }

  if (data.iyzicoPaymentId || data.iyzicoResult || paymentMethod === "iyzico" || paymentMethod === "credit_card") {
    return "iyzico";
  }

  if (data.kartNumarasi || data.cvc || data.sonKullanma) {
    return "mailorder";
  }

  if (paymentMethod === "kredi") {
    return "mailorder";
  }

  return "unknown";
}

export interface RegistrationPaymentFormResponse {
  id: number;
  formType: string;
  formName: string;
  data: Record<string, string>;
  submittedAt: string;
  createdAt: string;
}

type Stat = {
  label: string;
  value: string;
  icon: LucideIcon;
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
};

export interface RegistrationPaymentStatsGridProps {
  responses: RegistrationPaymentFormResponse[];
  className?: string;
  showManualSections?: boolean;
}

export default function RegistrationPaymentStatsGrid({
  responses,
  className,
  showManualSections = true,
}: RegistrationPaymentStatsGridProps) {
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

  const successCount = responses.filter((r) => r.data?.paymentStatus === "success").length;
  const totalRevenue = responses
    .filter((r) => r.data?.paymentStatus === "success")
    .reduce((sum, r) => sum + parsePriceToNumber(r.data?.packagePrice), 0);

  const pendingResponses = responses.filter(
    (r) => r.data?.paymentStatus !== "success" && r.data?.paymentStatus !== "failed"
  );
  const pendingTotalAmount = pendingResponses.reduce(
    (sum, r) => sum + parsePriceToNumber(r.data?.packagePrice),
    0
  );
  const pendingCount = pendingResponses.length;

  const havalePayments = responses.filter((r) => detectPaymentMethod(r.data) === "havale");
  const iyzicoPayments = responses.filter((r) => detectPaymentMethod(r.data) === "iyzico");
  const mailOrderPayments = responses.filter((r) => detectPaymentMethod(r.data) === "mailorder");

  const havaleRevenue = havalePayments
    .filter((r) => r.data?.paymentStatus === "success")
    .reduce((sum, r) => sum + parsePriceToNumber(r.data?.packagePrice), 0);

  const iyzicoRevenue = iyzicoPayments
    .filter((r) => r.data?.paymentStatus === "success")
    .reduce((sum, r) => sum + parsePriceToNumber(r.data?.packagePrice), 0);

  const mailOrderRevenue = mailOrderPayments
    .filter((r) => r.data?.paymentStatus === "success")
    .reduce((sum, r) => sum + parsePriceToNumber(r.data?.packagePrice), 0);

  const havaleSuccessCount = havalePayments.filter((r) => r.data?.paymentStatus === "success").length;
  const iyzicoSuccessCount = iyzicoPayments.filter((r) => r.data?.paymentStatus === "success").length;
  const mailOrderSuccessCount = mailOrderPayments.filter((r) => r.data?.paymentStatus === "success").length;

  const stats: Stat[] = [
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

  return (
    <div className={cn("min-w-0 space-y-3 sm:space-y-4", className)}>
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

      {showManualSections ? (
        <>
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
              <label className="sr-only" htmlFor="external-payments-amount">
                Bu oturumda eklenecek tutar (mevcut manuel gelir toplamına eklenir)
              </label>
              <input
                id="external-payments-amount"
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
        </>
      ) : null}
    </div>
  );
}
