import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

// Koyudan açık mora geçişli, minimal küçük kutular
const bannerShellClass =
  "relative overflow-hidden flex items-center justify-center font-medium text-white bg-[#26023F] border border-purple-medium/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-medium/60 focus:ring-offset-0 before:content-[''] before:absolute before:inset-0 before:bg-[url('https://api.builder.io/api/v1/image/assets/TEMP/381e8b17c5fa919c50c30c74e9e5fdb4a9f04259?width=2456')] before:bg-cover before:bg-center before:opacity-30 hover:before:opacity-40";

/** Tam genişlik / sayfa içi bölüm */
const bannerBaseClass = cn(
  bannerShellClass,
  "rounded-lg min-h-[52px] px-4 py-3 text-sm",
);

/** Hero vb. yan yana satır — mobilde kompakt, sm+ Keşfet ile aynı ağırlık */
const bannerInlineLinkClass = cn(
  bannerShellClass,
  "min-h-[40px] max-w-full rounded-2xl px-3 py-2 text-sm leading-tight sm:min-h-[48px] sm:max-w-none sm:rounded-lg sm:px-6 sm:py-3 sm:text-lg",
);

export default function InfoBanner({
  inline = false,
  className,
}: {
  inline?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();

  const content = (
    <div
      className={cn(
        "flex flex-row items-center gap-3",
        inline && "inline-flex max-w-full",
        className,
      )}
    >
      <Link
        to="/uez-2026/"
        className={cn(
          inline ? bannerInlineLinkClass : bannerBaseClass,
          "whitespace-nowrap",
        )}
      >
        <span className="relative z-10">{t("infoBanner.banner2Alt")}</span>
      </Link>
    </div>
  );

  if (inline) return content;

  return (
    <section className="relative py-6 bg-white overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 relative z-10">{content}</div>
    </section>
  );
}
