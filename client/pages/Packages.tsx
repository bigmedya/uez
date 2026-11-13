import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePackages } from "@/hooks/usePackages";
import { formatPriceWithCurrency } from "@/utils/registrationFormatters";

export default function Packages() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? "en" : "tr";
  const { packages, isLoading } = usePackages({ activeOnly: true, locale });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-purple-dark mb-4">
              {t("packagesPage.title")}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("packagesPage.subtitle")}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-purple-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg">{t("registration.noPackages")}</p>
              <Link
                to="/bize-ulasin/"
                className="inline-block mt-6 px-6 py-3 bg-purple-primary text-white rounded-lg hover:bg-purple-dark transition-colors"
              >
                {t("header.contact")}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white rounded-xl p-6 lg:p-8 shadow-md hover:shadow-lg transition-shadow flex flex-col border border-gray-100"
                >
                  <div className="flex items-baseline gap-2 mb-4">
                    <h2 className="text-xl font-bold text-gray-800 italic">
                      {pkg.title}
                    </h2>
                    {pkg.subtitle && (
                      <span className="text-orange-primary font-medium italic text-sm">
                        {pkg.subtitle}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6 flex-grow">
                    {pkg.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <Check className="w-4 h-4 text-orange-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="text-2xl font-bold text-purple-dark mb-4 text-center">
                      {formatPriceWithCurrency(pkg.price)}
                    </div>
                    <Link
                      to="/bize-ulasin/"
                      className="block w-full py-3 rounded-lg font-medium text-center bg-purple-primary text-white hover:bg-purple-dark transition-colors"
                    >
                      {t("header.contact")}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
