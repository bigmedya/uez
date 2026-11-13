import { cn } from "@/lib/utils";

export type PaymentStatusTone = "success" | "failed" | "pending";

/** RegistrationDetail ile aynı mantık: success / failed / beklemede ayrımı */
export function getPaymentDisplayStatus(d: Record<string, string>): {
  label: string;
  tone: PaymentStatusTone;
} {
  const status = d.paymentStatus;
  const method = d.paymentMethod;
  if (status === "success") return { label: "Onaylandı", tone: "success" };
  if (status === "failed") return { label: "Başarısız", tone: "failed" };
  if (method === "havale") return { label: "Havale bekleniyor", tone: "pending" };
  return { label: "Beklemede", tone: "pending" };
}

export function PaymentStatusBadge({ data }: { data: Record<string, string> }) {
  const { label, tone } = getPaymentDisplayStatus(data);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ring-1 ring-inset",
        tone === "success" && "bg-emerald-100 text-emerald-800 ring-emerald-200/60",
        tone === "failed" && "bg-rose-100 text-rose-800 ring-rose-200/70",
        tone === "pending" && "bg-amber-100 text-amber-900 ring-amber-200/70"
      )}
    >
      {label}
    </span>
  );
}
