import type { LucideIcon } from "lucide-react";
import { Clock, FileSpreadsheet, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

function formatCurrency(num: number): string {
  if (num === 0) return "₺0";
  return "₺" + new Intl.NumberFormat("tr-TR").format(Math.round(num));
}

export interface RevenueBreakdownCardsProps {
  fromResponses: number;
  external: number;
  pending: number;
  panelCount: number;
  manualEntryCount: number;
  pendingCount: number;
  className?: string;
}

type MiniCardProps = {
  title: string;
  amount: number;
  countLabel: string;
  icon: LucideIcon;
  stripeClass: string;
  iconWrapClass: string;
  amountClass: string;
};

function MiniCard({ title, amount, countLabel, icon: Icon, stripeClass, iconWrapClass, amountClass }: MiniCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow duration-200 hover:shadow-md",
        "border-gray-100/90"
      )}
    >
      <div className={cn("w-1.5 shrink-0 sm:w-2", stripeClass)} aria-hidden />
      <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3.5 sm:gap-3.5 sm:px-4 sm:py-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12",
            iconWrapClass
          )}
        >
          <Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">{title}</p>
            <span className="shrink-0 text-[9px] tabular-nums text-gray-400 sm:text-[10px]">{countLabel}</span>
          </div>
          <p className={cn("mt-0.5 text-lg font-bold tabular-nums tracking-tight sm:text-xl", amountClass)}>
            {formatCurrency(amount)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function RevenueBreakdownCards({
  fromResponses,
  external,
  pending,
  panelCount,
  manualEntryCount,
  pendingCount,
  className,
}: RevenueBreakdownCardsProps) {
  return (
    <div className={cn("grid min-w-0 grid-cols-1 items-stretch gap-3 sm:grid-cols-3 sm:gap-4", className)}>
      <MiniCard
        title="Panel kayıtları geliri"
        amount={fromResponses}
        countLabel={`${panelCount} kişi`}
        icon={FileSpreadsheet}
        stripeClass="bg-gradient-to-b from-indigo-500 to-indigo-600"
        iconWrapClass="bg-indigo-50 text-indigo-600"
        amountClass="text-gray-900"
      />
      <MiniCard
        title="Manuel eklenen gelir"
        amount={external}
        countLabel={`${manualEntryCount} işlem`}
        icon={Wallet}
        stripeClass="bg-gradient-to-b from-teal-500 to-teal-600"
        iconWrapClass="bg-teal-50 text-teal-700"
        amountClass={external > 0 ? "text-teal-800" : "text-gray-400"}
      />
      <MiniCard
        title="Bekleyen tahsilat"
        amount={pending}
        countLabel={`${pendingCount} kişi`}
        icon={Clock}
        stripeClass={cn(
          pending > 0
            ? "bg-gradient-to-b from-amber-500 to-amber-600"
            : "bg-gradient-to-b from-gray-300 to-gray-400"
        )}
        iconWrapClass={cn(
          pending > 0 ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-400"
        )}
        amountClass={pending > 0 ? "text-amber-950" : "text-gray-400"}
      />
    </div>
  );
}
