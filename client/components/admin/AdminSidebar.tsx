import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Settings, Home, Users, Calendar, Award, HelpCircle, FileText, Info, Phone, ClipboardList, CreditCard, LogOut, ExternalLink, MessageSquare, ScrollText, Package, Star, Smartphone, Archive, X, Shield, UserCog, Activity, History, Target } from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

type AdminSidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

const menuItems = [
  { path: "/uezyonetim", label: "Dashboard", icon: LayoutDashboard },
  { path: "/uezyonetim/site-ayarlari", label: "Site Ayarları", icon: Settings },
  { path: "/uezyonetim/ana-sayfa", label: "Ana Sayfa", icon: Home },
  { path: "/uezyonetim/mobil-sayfa", label: "Mobil Sayfa", icon: Smartphone },
  { path: "/uezyonetim/konusmacilar", label: "Konuşmacılar", icon: Users },
  { path: "/uezyonetim/program", label: "Program", icon: Calendar },
  { path: "/uezyonetim/sponsorlar", label: "Sponsorlar", icon: Award },
  { path: "/uezyonetim/arsiv-aciklamalari", label: "Arşiv Açıklamaları", icon: Archive },
  { path: "/uezyonetim/sss", label: "SSS", icon: HelpCircle },
  { path: "/uezyonetim/uez-2026", label: "UEZ 2026", icon: FileText },
  { path: "/uezyonetim/hakkimizda", label: "Hakkımızda", icon: Info },
  { path: "/uezyonetim/bize-ulasin", label: "Bize Ulaşın", icon: Phone },
  { path: "/uezyonetim/sozlesmeler", label: "Sözleşmeler", icon: ScrollText },
  { path: "/uezyonetim/paketler", label: "Paketler", icon: Package },
  { path: "/uezyonetim/kayitlar", label: "Kayıtlar", icon: ClipboardList },
  { path: "/uezyonetim/utm-analytics", label: "UTM Analytics", icon: Target },
  { path: "/uezyonetim/stars-of-regions", label: "Stars of Region", icon: Star },
  { path: "/uezyonetim/iletisim-mesajlari", label: "İletişim Mesajları", icon: MessageSquare },
  { path: "/uezyonetim/bildirim-gecmisi", label: "Bildirim Geçmişi", icon: History },
  { path: "/uezyonetim/odemeler", label: "Ödemeler", icon: CreditCard },
  { path: "/uezyonetim/rol-yonetimi", label: "Rol Yönetimi", icon: Shield },
  { path: "/uezyonetim/kullanici-yonetimi", label: "Kullanıcı Yönetimi", icon: UserCog },
  { path: "/uezyonetim/admin-loglari", label: "Admin Logları", icon: Activity },
];

export default function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, canAccess } = useAdminAuth();
  const isMobile = useIsMobile();
  const visibleItems = menuItems.filter((item) => canAccess(item.path));

  const isActive = (path: string) => path === "/uezyonetim" ? location.pathname === "/uezyonetim" : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate("/uezyonetim/login");
    onClose?.();
  };

  const linkClass = "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors";
  const activeClass = (path: string) => {
    const active = isActive(path);
    return active ? "bg-purple-primary text-white" : "text-purple-accent hover:bg-purple-primary/50 hover:text-white";
  };

  return (
    <aside
      className={`
        w-64 bg-purple-dark min-h-screen flex flex-col shrink-0
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-out
        md:relative md:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      aria-hidden={isMobile ? !mobileOpen : false}
    >
      <div className="flex items-center justify-between border-b border-purple-primary p-4 md:p-6">
        <Link 
          to="/uezyonetim" 
          className="flex items-center gap-3" 
          onClick={onClose}
          tabIndex={isMobile && !mobileOpen ? -1 : 0}
        >
          <img src="https://api.builder.io/api/v1/image/assets/TEMP/bc1aefcc49920778079094c811fbb255fd0b276e?width=100" alt="UEZ Logo" className="h-12 w-auto" />
          <div>
            <span className="text-white font-semibold text-lg">UEZ</span>
            <span className="text-purple-accent text-sm block">Admin Panel</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="flex md:hidden items-center justify-center rounded-lg p-2 text-purple-accent hover:bg-purple-primary/50 hover:text-white"
          aria-label="Menüyü kapat"
          tabIndex={isMobile && !mobileOpen ? -1 : 0}
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={linkClass + " " + activeClass(item.path)} 
                  onClick={onClose}
                  tabIndex={isMobile && !mobileOpen ? -1 : 0}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-purple-primary space-y-2">
        <a 
          href="/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-purple-accent hover:bg-purple-primary/50 hover:text-white transition-colors" 
          onClick={onClose}
          tabIndex={isMobile && !mobileOpen ? -1 : 0}
        >
          <ExternalLink className="w-5 h-5" />
          <span className="text-sm font-medium">Siteye Git</span>
        </a>
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          tabIndex={isMobile && !mobileOpen ? -1 : 0}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}

