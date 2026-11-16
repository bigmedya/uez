import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import LiveStreamButtons from "@/components/LiveStreamButtons";
import { cn } from "@/lib/utils";

// Arşiv yılları (geçmiş etkinlikler); güncel etkinlik /uez-2026 linkinden gidilir, menüde 2026 yok
const archiveYears = [
  { year: "2025", labelKey: "archiveYear_2025", subItemKeys: ["speakers", "program", "sponsors", "uez2025"] },
  { year: "2024", labelKey: "archiveYear_2024", subItemKeys: ["speakers", "program", "sponsors", "uez2024"] },
  { year: "2023", labelKey: "archiveYear_2023", subItemKeys: ["speakers", "program", "sponsors", "uez2023"] },
  { year: "2022", labelKey: "archiveYear_2022", subItemKeys: ["speakers", "program", "sponsors", "uez2022"] },
  { year: "2021-kasim", labelKey: "archiveYear_2021-kasim", subItemKeys: ["speakers", "program", "sponsors", "uez2021"] },
  { year: "2021-mart", labelKey: "archiveYear_2021-mart", subItemKeys: ["speakers", "program", "sponsors", "uez2021"] },
  { year: "2019", labelKey: "archiveYear_2019", subItemKeys: ["speakers", "program", "sponsors", "uez2019"] },
  { year: "2018", labelKey: "archiveYear_2018", subItemKeys: ["speakers", "program", "sponsors", "uez2018"] },
  { year: "2017", labelKey: "archiveYear_2017", subItemKeys: ["speakers", "program", "sponsors", "uez2017"] },
  { year: "2016", labelKey: "archiveYear_2016", subItemKeys: ["speakers", "program", "sponsors", "uez2016"] },
  { year: "2015", labelKey: "archiveYear_2015", subItemKeys: ["speakers", "program", "sponsors", "uez2015"] },
];

const subItemKeyToAnchor: Record<string, string> = {
  speakers: "konusmacilar",
  program: "program",
  sponsors: "sponsorlar",
};

/** Anasayfada zaten aynı #anchor'dayken Link tıklaması navigasyon tetiklemez; manuel scroll. */
function handleHomeAnchorClick(
  e: ReactMouseEvent<HTMLAnchorElement>,
  pathname: string,
  currentHash: string,
  sectionId: "program" | "sponsorlar"
) {
  const isHome = /^\/arsiv\/2026\/zirve\/?$/.test(pathname);
  const targetHash = `#${sectionId}`;
  if (isHome && currentHash === targetHash) {
    e.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function Header() {
  const { t, i18n } = useTranslation();
  const { pathname, hash } = useLocation();
  const { settings } = useSiteSettings();
  const isLightHeader = false;
  const currentLang = i18n.language || "tr";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [activeYearMenu, setActiveYearMenu] = useState<string | null>(null);
  const [mobileArchiveOpen, setMobileArchiveOpen] = useState(false);
  const [mobileActiveYear, setMobileActiveYear] = useState<string | null>(null);
  const [archiveDescriptions, setArchiveDescriptions] = useState<Set<string>>(new Set());
  const archiveRef = useRef<HTMLDivElement>(null);

  // Fetch archive descriptions to check which years have descriptions
  useEffect(() => {
    fetch("/api/archive")
      .then(res => res.json())
      .then((data: { year: string }[]) => {
        const years = new Set(data.map((arch) => arch.year));
        setArchiveDescriptions(years);
      })
      .catch(err => {
        console.error("Error fetching archive descriptions:", err);
      });
  }, []);

  // Get filter year from archive year string (e.g., "2021-kasim" -> "2021")
  const getFilterYear = (yearParam: string): string => {
    if (yearParam.startsWith("2021")) return "2021";
    return yearParam;
  };

  // Check if year has archive description
  const hasArchiveDescription = (year: string): boolean => {
    const filterYear = getFilterYear(year);
    return archiveDescriptions.has(filterYear);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (archiveRef.current && !archiveRef.current.contains(target)) {
        setArchiveOpen(false);
        setActiveYearMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <header className={cn("relative z-50 w-full", isLightHeader && "bg-white")}>
      <div className="container mx-auto px-4 lg:px-16">
        <div className="flex items-center justify-between h-[100px] lg:h-[120px]">
          {/* Logo - Left (aynı kutu, iki logo eş boyut ve hizalı) */}
          <Link to="/" className="flex items-center flex-shrink-0 w-[140px] lg:w-[160px] h-28 lg:h-32">
            <img
              src={isLightHeader ? "/logo-dark.png" : "/logo.png"}
              alt="UEZ Logo"
              className="h-28 lg:h-32 w-auto max-w-[140px] lg:max-w-[160px] object-contain object-left"
            />
          </Link>

          {/* Desktop Navigation - Center */}
          <nav className="hidden xl:flex items-center gap-6 2xl:gap-10">
            <Link
              to="/uez-2026/"
              className={cn("text-sm 2xl:text-base font-medium transition-colors whitespace-nowrap", isLightHeader ? "text-gray-900 hover:text-purple-primary" : "text-white hover:text-orange-primary")}
            >
              {t("header.uez2026")}
            </Link>
            <Link
              to="/arsiv/2026/zirve/#program"
              onClick={(e) => handleHomeAnchorClick(e, pathname, hash, "program")}
              className={cn("text-sm 2xl:text-base font-medium transition-colors whitespace-nowrap", isLightHeader ? "text-gray-900 hover:text-purple-primary" : "text-white hover:text-orange-primary")}
            >
              {t("header.program")}
            </Link>
            <Link
              to="/arsiv/2026/zirve/#sponsorlar"
              onClick={(e) => handleHomeAnchorClick(e, pathname, hash, "sponsorlar")}
              className={cn("text-sm 2xl:text-base font-medium transition-colors whitespace-nowrap", isLightHeader ? "text-gray-900 hover:text-purple-primary" : "text-white hover:text-orange-primary")}
            >
              {t("header.sponsors")}
            </Link>
            <Link
              to="/hakkimizda/"
              className={cn("text-sm 2xl:text-base font-medium transition-colors whitespace-nowrap", isLightHeader ? "text-gray-900 hover:text-purple-primary" : "text-white hover:text-orange-primary")}
            >
              {t("header.about")}
            </Link>
            {/* Arşiv Dropdown */}
            <div 
              ref={archiveRef}
              className="relative"
              onMouseEnter={() => setArchiveOpen(true)}
              onMouseLeave={() => {
                setArchiveOpen(false);
                setActiveYearMenu(null);
              }}
            >
              <button
                className={cn("flex items-center gap-1 text-sm 2xl:text-base font-medium hover:text-orange-primary transition-colors whitespace-nowrap py-2", isLightHeader ? "text-gray-900" : "text-white")}
              >
                {t("header.archive")}
                <svg className={`w-4 h-4 transition-transform ${archiveOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {archiveOpen && (
                <div className="absolute top-full left-0 pt-2 z-50">
                  <div className="bg-white rounded-lg shadow-xl min-w-[180px] py-2">
                    {archiveYears.map((item) => (
                      <div
                        key={item.year}
                        className="relative"
                        onMouseEnter={() => setActiveYearMenu(item.year)}
                      >
                        <button
                          className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-100 text-sm"
                        >
                          {t(`header.${item.labelKey}`)}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        {activeYearMenu === item.year && (
                          <div className="absolute left-full top-0 pl-1">
                            <div className="bg-white rounded-lg shadow-xl min-w-[160px] py-2">
                              {item.subItemKeys
                                .filter((subKey) => {
                                  if (subKey.startsWith("uez")) {
                                    return hasArchiveDescription(item.year);
                                  }
                                  return true;
                                })
                                .map((subKey) => (
                                  <Link
                                    key={subKey}
                                    to={subKey.startsWith("uez") 
                                      ? `/arsiv/${item.year}#uez` 
                                      : `/arsiv/${item.year}#${subItemKeyToAnchor[subKey] || subKey}`
                                    }
                                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                                    onClick={() => {
                                      setArchiveOpen(false);
                                      setActiveYearMenu(null);
                                    }}
                                  >
                                    {t(`header.subItem_${subKey}`)}
                                  </Link>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link
              to="/bize-ulasin/"
              className={cn("text-sm 2xl:text-base font-medium transition-colors whitespace-nowrap", isLightHeader ? "text-gray-900 hover:text-purple-primary" : "text-white hover:text-orange-primary")}
            >
              {t("header.contact")}
            </Link>
          </nav>

          {/* Right side - Buttons and Language */}
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Auth buttons - Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Canlı Button */}
              {settings.liveButtonActive && (
                settings.liveButtonUrl ? (
                  <a
                    href={settings.liveButtonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative px-4 py-2 rounded-full border border-orange-primary/50 bg-orange-primary/10 text-white text-xs font-medium hover:bg-orange-primary/20 transition-all whitespace-nowrap overflow-hidden group"
                  >
                    {/* Subtle pulsing background effect */}
                    <div className="absolute inset-0 bg-orange-primary/30 rounded-full animate-pulse opacity-50"></div>
                    {/* Content */}
                    <span className="relative z-10 flex items-center gap-3">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-primary opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-primary"></span>
                      </span>
                      {t("header.liveTurkish")}
                    </span>
                  </a>
                ) : (
                  <button className="relative px-4 py-2 rounded-full border border-orange-primary/50 bg-orange-primary/10 text-white text-xs font-medium hover:bg-orange-primary/20 transition-all whitespace-nowrap overflow-hidden group">
                    <div className="absolute inset-0 bg-orange-primary/30 rounded-full animate-pulse opacity-50"></div>
                    <span className="relative z-10 flex items-center gap-3">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-primary opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-primary"></span>
                      </span>
                      {t("header.liveTurkish")}
                    </span>
                  </button>
                )
              )}
              
              {/* Canlı (eng) Link */}
              {settings.liveButtonActive && settings.liveButtonUrl_en && (
                <a
                  href={settings.liveButtonUrl_en}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative px-3 py-1.5 rounded-full border border-white/30 bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-all whitespace-nowrap overflow-hidden group"
                >
                  {/* Subtle pulsing background effect */}
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse opacity-50"></div>
                  {/* Content */}
                  <span className="relative z-10 flex items-center gap-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    {t("header.liveEnglish")}
                  </span>
                </a>
              )}
            </div>

            {/* Dil: toggle (masaüstü + mobilde menü butonunun yanında) */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => i18n.changeLanguage(currentLang === "tr" ? "en" : "tr")}
                title={currentLang === "tr" ? t("header.langTr") : t("header.langEn")}
                aria-label={currentLang === "tr" ? t("header.langEn") : t("header.langTr")}
                className={cn(
                  "relative flex h-9 w-14 shrink-0 rounded-full transition-colors duration-200",
                  isLightHeader ? "bg-gray-100" : "bg-white/25"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none shadow-md transition-all duration-200 ring-1",
                    currentLang === "tr" ? "left-0.5" : "left-[calc(100%-2.25rem)]",
                    isLightHeader ? "bg-gray-100 ring-gray-300" : "bg-white/25 ring-white/40"
                  )}
                  role="img"
                  aria-hidden
                >
                  {currentLang === "tr" ? "🇹🇷" : "🇬🇧"}
                </span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn("xl:hidden p-2", isLightHeader ? "text-black" : "text-white")}
              aria-label={t("header.toggleMenu")}
            >
              {mobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden fixed inset-0 top-[100px] lg:top-[120px] bg-purple-dark z-50 overflow-y-auto">
            <nav className="flex flex-col p-4 space-y-4 min-h-full">
              <Link
                to="/uez-2026/"
                className="text-white text-lg font-medium hover:text-orange-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("header.uez2026")}
              </Link>
              <Link
                to="/arsiv/2026/zirve/#program"
                className="text-white text-lg font-medium hover:text-orange-primary transition-colors py-2"
                onClick={(e) => {
                  handleHomeAnchorClick(e, pathname, hash, "program");
                  setMobileMenuOpen(false);
                }}
              >
                {t("header.program")}
              </Link>
              <Link
                to="/arsiv/2026/zirve/#sponsorlar"
                className="text-white text-lg font-medium hover:text-orange-primary transition-colors py-2"
                onClick={(e) => {
                  handleHomeAnchorClick(e, pathname, hash, "sponsorlar");
                  setMobileMenuOpen(false);
                }}
              >
                {t("header.sponsors")}
              </Link>
              <Link
                to="/hakkimizda/"
                className="text-white text-lg font-medium hover:text-orange-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("header.about")}
              </Link>
              <div>
                <button
                  onClick={() => setMobileArchiveOpen(!mobileArchiveOpen)}
                  className="flex items-center justify-between w-full text-white text-lg font-medium hover:text-orange-primary transition-colors py-2"
                >
                  {t("header.archive")}
                  <svg className={`w-5 h-5 transition-transform ${mobileArchiveOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {mobileArchiveOpen && (
                  <div className="pl-4 space-y-1">
                    {archiveYears.map((item) => (
                      <div key={item.year}>
                        <button
                          onClick={() => setMobileActiveYear(mobileActiveYear === item.year ? null : item.year)}
                          className="flex items-center justify-between w-full text-white/80 text-base hover:text-orange-primary transition-colors py-2"
                        >
                          {t(`header.${item.labelKey}`)}
                          <svg className={`w-4 h-4 transition-transform ${mobileActiveYear === item.year ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {mobileActiveYear === item.year && (
                          <div className="pl-4 space-y-1">
                            {item.subItemKeys
                              .filter((subKey) => {
                                if (subKey.startsWith("uez")) {
                                  return hasArchiveDescription(item.year);
                                }
                                return true;
                              })
                              .map((subKey) => (
                                <Link
                                  key={subKey}
                                  to={subKey.startsWith("uez") 
                                    ? `/arsiv/${item.year}#uez` 
                                    : `/arsiv/${item.year}#${subItemKeyToAnchor[subKey] || subKey}`
                                  }
                                  className="block text-white/60 text-sm hover:text-orange-primary transition-colors py-1.5"
                                  onClick={() => {
                                    setMobileMenuOpen(false);
                                    setMobileArchiveOpen(false);
                                    setMobileActiveYear(null);
                                  }}
                                >
                                  {t(`header.subItem_${subKey}`)}
                                </Link>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Link
                to="/bize-ulasin/"
                className="text-white text-lg font-medium hover:text-orange-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("header.contact")}
              </Link>
              {settings.liveButtonActive && (
                <div className="pt-4 mt-2 border-t border-white/10">
                  <LiveStreamButtons
                    settings={settings}
                    variant="header"
                    onItemClick={() => setMobileMenuOpen(false)}
                  />
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
