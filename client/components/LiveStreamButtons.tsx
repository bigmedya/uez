import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/hooks/useSiteSettings";

type Props = {
  settings: SiteSettings;
  /** Hero’da üst bardaki canlılarla çakışmaması için */
  hideOnDesktop?: boolean;
  /** `header`: masaüstü Header ile aynı pill stilleri; `hero`: Hero mobil (rounded-2xl) */
  variant?: "hero" | "header";
  /** Örn. mobil menü: harici yayına tıklanınca menüyü kapat */
  onItemClick?: () => void;
  className?: string;
};

/**
 * Site ayarlarından canlı Türkçe / İngilizce yayın butonları (aktif + URL’lere göre).
 */
export default function LiveStreamButtons({
  settings,
  hideOnDesktop = false,
  variant = "hero",
  onItemClick,
  className,
}: Props) {
  const { t } = useTranslation();
  const isHeader = variant === "header";

  if (!settings.liveButtonActive) return null;

  const layoutClass = settings.liveButtonUrl_en
    ? "grid w-full grid-cols-2 items-stretch gap-2"
    : "flex w-full max-w-full flex-wrap items-center justify-start gap-2";

  if (isHeader) {
    return (
      <div className={cn(hideOnDesktop && "lg:hidden", layoutClass, className)}>
        {settings.liveButtonUrl ? (
          <a
            href={settings.liveButtonUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onItemClick?.()}
            className="relative flex min-h-[40px] w-full min-w-0 items-center justify-center px-3 py-2 rounded-full border border-orange-primary/50 bg-orange-primary/10 text-white text-xs font-medium hover:bg-orange-primary/20 transition-all overflow-hidden sm:px-4"
          >
            <div className="absolute inset-0 rounded-full bg-orange-primary/30 animate-pulse opacity-50" />
            <span className="relative z-10 flex min-w-0 items-center justify-center gap-2 sm:gap-3">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-primary opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-primary" />
              </span>
              <span className="truncate">{t("header.liveTurkish")}</span>
            </span>
          </a>
        ) : (
          <button
            type="button"
            className="relative flex min-h-[40px] w-full min-w-0 items-center justify-center px-3 py-2 rounded-full border border-orange-primary/50 bg-orange-primary/10 text-white text-xs font-medium overflow-hidden sm:px-4"
          >
            <div className="absolute inset-0 rounded-full bg-orange-primary/30 animate-pulse opacity-50" />
            <span className="relative z-10 flex min-w-0 items-center justify-center gap-2 sm:gap-3">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-primary opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-primary" />
              </span>
              <span className="truncate">{t("header.liveTurkish")}</span>
            </span>
          </button>
        )}
        {settings.liveButtonUrl_en && (
          <a
            href={settings.liveButtonUrl_en}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onItemClick?.()}
            className="relative flex min-h-[40px] w-full min-w-0 items-center justify-center px-3 py-1.5 rounded-full border border-white/30 bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse opacity-50" />
            <span className="relative z-10 flex min-w-0 items-center justify-center gap-2 sm:gap-3">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span className="truncate">{t("header.liveEnglish")}</span>
            </span>
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={cn(hideOnDesktop && "lg:hidden", layoutClass, className)}>
      {settings.liveButtonUrl ? (
        <a
          href={settings.liveButtonUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onItemClick?.()}
          className="relative flex min-h-[38px] w-full min-w-0 items-center justify-center gap-1 overflow-hidden rounded-2xl border border-orange-primary/50 bg-orange-primary/10 px-2.5 py-1.5 text-center text-xs font-medium leading-tight text-white sm:min-h-[40px] sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
        >
          <div className="absolute inset-0 animate-pulse rounded-2xl bg-orange-primary/30 opacity-50 sm:rounded-xl" />
          <span className="relative z-10 flex min-w-0 items-center justify-center gap-2.5 sm:gap-3">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-primary" />
            </span>
            <span className="truncate">{t("header.liveTurkish")}</span>
          </span>
        </a>
      ) : (
        <button
          type="button"
          className="relative flex min-h-[38px] w-full min-w-0 items-center justify-center gap-1 overflow-hidden rounded-2xl border border-orange-primary/50 bg-orange-primary/10 px-2.5 py-1.5 text-center text-xs font-medium text-white sm:min-h-[40px] sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
        >
          <div className="absolute inset-0 animate-pulse rounded-2xl bg-orange-primary/30 opacity-50 sm:rounded-xl" />
          <span className="relative z-10 flex min-w-0 items-center justify-center gap-2.5 sm:gap-3">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-primary" />
            </span>
            <span className="truncate">{t("header.liveTurkish")}</span>
          </span>
        </button>
      )}
      {settings.liveButtonUrl_en && (
        <a
          href={settings.liveButtonUrl_en}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onItemClick?.()}
          className="relative flex min-h-[38px] w-full min-w-0 items-center justify-center gap-1 overflow-hidden rounded-2xl border border-purple-medium/60 bg-[#26023F] px-2.5 py-1.5 text-center text-xs font-medium leading-tight text-white sm:min-h-[40px] sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm before:absolute before:inset-0 before:rounded-2xl before:bg-[url('https://api.builder.io/api/v1/image/assets/TEMP/381e8b17c5fa919c50c30c74e9e5fdb4a9f04259?width=2456')] before:bg-cover before:bg-center before:opacity-30 sm:before:rounded-xl"
        >
          <div className="absolute inset-0 animate-pulse rounded-2xl bg-white/10 opacity-40 sm:rounded-xl" />
          <span className="relative z-10 flex min-w-0 items-center justify-center gap-2.5 sm:gap-3">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            <span className="truncate">{t("header.liveEnglish")}</span>
          </span>
        </a>
      )}
    </div>
  );
}
