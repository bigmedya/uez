import { useTranslation } from "react-i18next";
import { useSponsors } from "@/hooks/useSponsors";

export default function Sponsors() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? "en" : "tr";
  const { categories, isLoading } = useSponsors(undefined, locale);

  // Filter only active sponsors
  const activeCategories = categories
    .map((cat) => ({
      ...cat,
      sponsors: cat.sponsors.filter((s) => s.active),
    }))
    .filter((cat) => cat.sponsors.length > 0);

  return (
    <section id="stars-of-region" className="relative bg-purple-dark py-12 lg:py-16 overflow-hidden">
      <div className="container mx-auto px-8 lg:px-16 relative z-10 max-w-[1600px]">
        {/* Title — ana sayfa Konuşmacılar/Program ile aynı ölçek */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-white text-center mb-8 sm:mb-12 md:mb-14 lg:mb-16 leading-tight">
          {t("sponsors.title")}
        </h2>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-accent border-t-orange-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Sponsor categories */}
        <div className="space-y-16">
          {activeCategories.map((category) => (
            <div key={category.id} className="space-y-8">
              {/* Category divider */}
              <div className="border-t border-purple-accent pt-6">
                <h3 className="text-xl lg:text-2xl font-semibold text-white text-center mb-6">
                  {category.title}
                </h3>
              </div>

              {/* Sponsors: hep yan yana; az veya çok olsun tek satırda / wrap’te eşit görünsün */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
                {category.sponsors.map((sponsor) => (
                  <a
                    key={sponsor.id}
                    href={sponsor.url || undefined}
                    target={sponsor.url ? "_blank" : undefined}
                    rel={sponsor.url ? "noopener noreferrer" : undefined}
                    className="flex items-center justify-center p-6 lg:p-8 aspect-square overflow-hidden bg-purple-dark/50 rounded-lg hover:bg-purple-dark/70 transition-colors"
                  >
                    <img
                      src={sponsor.localImage || sponsor.image}
                      alt={sponsor.name}
                      className="object-contain max-w-full max-h-full"
                      style={{
                        width: `${sponsor.width ?? 100}%`,
                        height: "auto",
                      }}
                    />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
