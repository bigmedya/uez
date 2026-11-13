import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const NotFound = () => {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Beyaz menü metni için düz mor bant (görsel yok; İletişim/Hakkımızda ile aynı mantık) */}
      <div className="relative bg-purple-dark">
        <Header />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">404</h1>
          <p className="text-xl text-gray-600 mb-4">{t("notFound.title")}</p>
          <a href="/" className="text-purple-primary hover:text-purple-dark font-semibold underline">
            {t("notFound.backHome")}
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
