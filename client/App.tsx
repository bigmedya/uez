import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppHead } from "@/components/AppHead";
import Index from "@/pages/Index";
import About from "@/pages/About";
import UEZ2026 from "@/pages/UEZ2026";
import Packages from "@/pages/Packages";
import Contact from "@/pages/Contact";
import Archive from "@/pages/Archive";
import ContractPage from "@/pages/ContractPage";
import StarsOfRegions from "@/pages/StarsOfRegions";
import MobileEventPage from "@/pages/MobileEventPage";
import NotFound from "@/pages/NotFound";

// Admin pages
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminSpeakers from "@/pages/admin/Speakers";
import AdminRegistrations from "@/pages/admin/Registrations";
import AdminPayments from "@/pages/admin/Payments";
import AdminProgram from "@/pages/admin/Program";
import AdminSiteSettings from "@/pages/admin/SiteSettings";
import AdminFormResponses from "@/pages/admin/FormResponses";
import AdminFormResponseDetail from "@/pages/admin/FormResponseDetail";
import AdminFormResponseGenericDetail from "@/pages/admin/FormResponseGenericDetail";
import AdminRegistrationDetail from "@/pages/admin/RegistrationDetail";
import AdminHomePage from "@/pages/admin/HomePage";
import AdminSponsors from "@/pages/admin/Sponsors";
import AdminFAQ from "@/pages/admin/FAQ";
import AdminUez2026 from "@/pages/admin/Uez2026";
import AdminAbout from "@/pages/admin/About";
import AdminContact from "@/pages/admin/Contact";
import AdminContracts from "@/pages/admin/Contracts";
import AdminPackages from "@/pages/admin/Packages";
import AdminContactMessages from "@/pages/admin/ContactMessages";
import AdminContactMessageDetail from "@/pages/admin/ContactMessageDetail";
import AdminNotificationHistory from "@/pages/admin/AdminNotificationHistory";
import AdminStarsOfRegions from "@/pages/admin/StarsOfRegions";
import AdminMobilePage from "@/pages/admin/MobilePage";
import AdminArchiveDescriptions from "@/pages/admin/ArchiveDescriptions";
import AdminRoles from "@/pages/admin/AdminRoles";
import AdminRoleEdit from "@/pages/admin/AdminRoleEdit";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminLogs from "@/pages/admin/AdminLogs";
import AdminUTMAnalytics from "@/pages/admin/UTMAnalytics";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PWAInstallModal } from "@/components/PWAInstallModal";

/** SSR ve client’ta ortak route listesi (StaticRouter/BrowserRouter ile sarılır). */
export function AppRoutes() {
  return (
    <>
      <AppHead />
      <Toaster position="top-center" richColors closeButton />
      <PWAInstallModal />
      <AdminAuthProvider>
        <NotificationProvider>
        <Routes>
          {/* Trailing slash yönlendirmeleri */}
          <Route path="/hakkimizda" element={<Navigate to="/hakkimizda/" replace />} />
          <Route path="/uez-2026" element={<Navigate to="/uez-2026/" replace />} />
          <Route path="/kayit-ol" element={<NotFound />} />
          <Route path="/paketler" element={<Navigate to="/paketler/" replace />} />
          <Route path="/bize-ulasin" element={<Navigate to="/bize-ulasin/" replace />} />
          <Route path="/stars-of-regions" element={<Navigate to="/stars-of-regions/" replace />} />
          
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/hakkimizda/" element={<About />} />
          <Route path="/uez-2026/" element={<UEZ2026 />} />
          <Route path="/kayit-ol/" element={<NotFound />} />
          <Route path="/paketler/" element={<Packages />} />
          <Route path="/bize-ulasin/" element={<Contact />} />
          <Route path="/stars-of-regions/" element={<StarsOfRegions />} />
          <Route path="/m" element={<MobileEventPage />} />
          <Route path="/arsiv/:year" element={<Archive />} />

          {/* Contract pages - trailing slash yönlendirmeleri */}
          <Route path="/cerez-politikasi" element={<Navigate to="/cerez-politikasi/" replace />} />
          <Route path="/acik-riza-metni" element={<Navigate to="/acik-riza-metni/" replace />} />
          <Route path="/aydinlatma-metni" element={<Navigate to="/aydinlatma-metni/" replace />} />
          <Route path="/teslimat-ve-iade-sartlari" element={<Navigate to="/teslimat-ve-iade-sartlari/" replace />} />
          <Route path="/mesafeli-satis-sozlesmesi" element={<Navigate to="/mesafeli-satis-sozlesmesi/" replace />} />
          
          {/* Contract pages */}
          <Route path="/cerez-politikasi/" element={<ContractPage />} />
          <Route path="/acik-riza-metni/" element={<ContractPage />} />
          <Route path="/aydinlatma-metni/" element={<ContractPage />} />
          <Route path="/teslimat-ve-iade-sartlari/" element={<ContractPage />} />
          <Route path="/mesafeli-satis-sozlesmesi/" element={<ContractPage />} />

          {/* Admin routes */}
          <Route path="/uezyonetim/login" element={<AdminLogin />} />
          <Route
            path="/uezyonetim"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="konusmacilar" element={<AdminSpeakers />} />
            <Route path="kayitlar" element={<AdminRegistrations />} />
            <Route path="kayitlar/:id" element={<AdminRegistrationDetail />} />
            <Route path="utm-analytics" element={<AdminUTMAnalytics />} />
            <Route path="stars-of-regions" element={<AdminStarsOfRegions />} />
            <Route path="odemeler" element={<AdminPayments />} />
            <Route path="program" element={<AdminProgram />} />
            <Route path="site-ayarlari" element={<AdminSiteSettings />} />
            {/* Kayıt detayı: eski bookmark/link uyumu (form-yanitlari/kayit/:id) */}
            <Route path="form-yanitlari/kayit/:id" element={<AdminRegistrationDetail />} />
            <Route path="form-yanitlari/:formType" element={<AdminFormResponseDetail />} />
            <Route path="form-yanitlari/:formType/:id" element={<AdminFormResponseGenericDetail />} />
            <Route path="ana-sayfa" element={<AdminHomePage />} />
            <Route path="sponsorlar" element={<AdminSponsors />} />
            <Route path="arsiv-aciklamalari" element={<AdminArchiveDescriptions />} />
            <Route path="sss" element={<AdminFAQ />} />
            <Route path="uez-2026" element={<AdminUez2026 />} />
            <Route path="hakkimizda" element={<AdminAbout />} />
            <Route path="bize-ulasin" element={<AdminContact />} />
            <Route path="iletisim-mesajlari" element={<AdminContactMessages />} />
            <Route path="iletisim-mesajlari/:id" element={<AdminContactMessageDetail />} />
            <Route path="bildirim-gecmisi" element={<AdminNotificationHistory />} />
            <Route path="sozlesmeler" element={<AdminContracts />} />
            <Route path="paketler" element={<AdminPackages />} />
            <Route path="mobil-sayfa" element={<AdminMobilePage />} />
            <Route path="rol-yonetimi" element={<AdminRoles />} />
            <Route path="rol-yonetimi/yeni" element={<AdminRoleEdit />} />
            <Route path="rol-yonetimi/:id" element={<AdminRoleEdit />} />
            <Route path="kullanici-yonetimi" element={<AdminUsers />} />
            <Route path="admin-loglari" element={<AdminLogs />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </NotificationProvider>
      </AdminAuthProvider>
    </>
  );
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
