import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Admin sayfaları (sıralı - ilk erişilebilir sayfaya yönlendirilir)
const ADMIN_PAGES = [
  "/uezyonetim",
  "/uezyonetim/site-ayarlari",
  "/uezyonetim/ana-sayfa",
  "/uezyonetim/mobil-sayfa",
  "/uezyonetim/konusmacilar",
  "/uezyonetim/program",
  "/uezyonetim/sponsorlar",
  "/uezyonetim/arsiv-aciklamalari",
  "/uezyonetim/sss",
  "/uezyonetim/uez-2026",
  "/uezyonetim/hakkimizda",
  "/uezyonetim/bize-ulasin",
  "/uezyonetim/sozlesmeler",
  "/uezyonetim/paketler",
  "/uezyonetim/kayitlar",
  "/uezyonetim/utm-analytics",
  "/uezyonetim/stars-of-regions",
  "/uezyonetim/iletisim-mesajlari",
  "/uezyonetim/odemeler",
  "/uezyonetim/rol-yonetimi",
  "/uezyonetim/kullanici-yonetimi",
];

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, canAccess, permissions } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/uezyonetim/login" replace />;
  }

  if (!canAccess(location.pathname)) {
    // Kullanıcının yetkisi olan ilk sayfayı bul
    const firstAccessiblePage = ADMIN_PAGES.find((page) => canAccess(page));
    
    if (firstAccessiblePage) {
      return <Navigate to={firstAccessiblePage} replace />;
    }
    
    // Hiçbir sayfaya erişimi yoksa yetki yok mesajı göster
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erişim Yetkisi Yok</h2>
          <p className="text-gray-600 mb-4">
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
          </p>
          <p className="text-sm text-gray-500">
            Lütfen yöneticinizle iletişime geçin.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

