import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobil: menü kapalıyken backdrop; tıklanınca kapanır */}
      <button
        type="button"
        aria-label="Menüyü kapat"
        className="fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden"
        style={{
          pointerEvents: mobileMenuOpen ? "auto" : "none",
          opacity: mobileMenuOpen ? 1 : 0,
        }}
        onClick={() => setMobileMenuOpen(false)}
      />
      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobil: üst bar ve hamburger */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Menüyü aç"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-sm font-semibold text-gray-700">UEZ Admin</span>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
