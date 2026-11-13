/** Sunucu ve client'ta aynı title/meta için tek kaynak */

export const SITE_TITLE = "UEZ 2026 - Uluslararası Ekonomi Zirvesi";
export const DEFAULT_DESCRIPTION =
  "BÜYÜK DÖNÜŞÜM: Dayanıklı ve sürdürülebilir bir küresel sisteme geçişin pusulası";

/** UEZ 2026 etkinlik sayfası başlığı (ana sayfadan ayırt için) */
export const UEZ_2026_PAGE_TITLE = "UEZ 2026 Etkinlik Bilgisi - Uluslararası Ekonomi Zirvesi";

export const NOT_FOUND_TITLE = `404 - Sayfa Bulunamadı | ${SITE_TITLE}`;

const ROUTE_TITLES: Record<string, string> = {
  "/": "Ana Sayfa",
  "/hakkimizda/": "Hakkımızda",
  "/uez-2026/": "UEZ 2026 Etkinlik Bilgisi",
  "/paketler/": "Paketler",
  "/bize-ulasin/": "Bize Ulaşın",
  "/stars-of-regions/": "Stars of Region",
  "/m/": "Mobil Etkinlik",
  "/cerez-politikasi/": "Çerez Politikası",
  "/acik-riza-metni/": "Açık Rıza Metni",
  "/aydinlatma-metni/": "Aydınlatma Metni",
  "/teslimat-ve-iade-sartlari/": "Teslimat ve İade Şartları",
  "/mesafeli-satis-sozlesmesi/": "Mesafeli Satış Sözleşmesi",
};

const ROUTE_DESCRIPTIONS: Record<string, string> = {
  "/": DEFAULT_DESCRIPTION,
  "/hakkimizda/":
    "Uluslararası Ekonomi Zirvesi hakkında bilgi edinin. Dayanıklı ve sürdürülebilir bir küresel sisteme geçişin pusulası.",
  "/uez-2026/":
    "UEZ 2026 etkinlik bilgileri, konular, program ve İstanbul'da gerçekleşecek zirve detayları.",
  "/paketler/": "UEZ 2026 katılım paketleri, sponsorluk seçenekleri ve fırsatlar.",
  "/bize-ulasin/": "UEZ 2026 iletişim bilgileri, adres ve bize ulaşın formu.",
  "/stars-of-regions/": "Bölgelerin Yıldızları ödülü ve katılımcı bilgileri.",
  "/m/": "UEZ 2026 mobil etkinlik sayfası.",
  "/cerez-politikasi/": "UEZ web sitesi çerez kullanım politikası.",
  "/acik-riza-metni/": "UEZ açık rıza ve kişisel veri işleme metni.",
  "/aydinlatma-metni/": "UEZ aydınlatma metni ve KVKK bilgilendirmesi.",
  "/teslimat-ve-iade-sartlari/": "UEZ teslimat ve iade şartları.",
  "/mesafeli-satis-sozlesmesi/": "UEZ mesafeli satış sözleşmesi.",
};
const ADMIN_BASE_PATH = "/uezyonetim";
ROUTE_TITLES[`${ADMIN_BASE_PATH}/login/`] = "Yönetim Girişi";

const KNOWN_PATHS = new Set<string>(Object.keys(ROUTE_TITLES));

const VALID_ARCHIVE_YEARS = new Set([
  "2026", "2025", "2024", "2023", "2022", "2021-kasim", "2021-mart", "2020", "2019", "2018", "2017", "2016", "2015",
]);

/** Build-time sayfa bazlı HTML üretmek için tüm public path listesi. */
export function getPublicPathsForPrerender(): string[] {
  const paths = Object.keys(ROUTE_TITLES).filter((p) => !p.startsWith(ADMIN_BASE_PATH));
  const archivePaths = [...VALID_ARCHIVE_YEARS].map((y) => `/arsiv/${y}`);
  return ["/", ...paths.filter((p) => p !== "/"), ...archivePaths];
}

/** Verilen path'in bilinen bir sayfa olup olmadığını döner. 404 sayfaları için noindex kullanılır. */
export function isKnownPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  if (KNOWN_PATHS.has(path)) return true;
  // normalizePathname tüm yollara sondaki / ekler; regex buna uyumlu olmalı
  const archiveMatch = path.match(/^\/arsiv\/([^/]+)\/?$/);
  if (archiveMatch && VALID_ARCHIVE_YEARS.has(archiveMatch[1])) return true;
  if (path === ADMIN_BASE_PATH || path.startsWith(ADMIN_BASE_PATH + "/")) return true;
  return false;
}

function isValidArchiveYear(year: string | undefined): boolean {
  return !!year && VALID_ARCHIVE_YEARS.has(year);
}

export function getPageTitle(pathname: string, year?: string): string {
  const normalizedPath = normalizePathname(pathname);
  if (normalizedPath.startsWith("/arsiv/")) {
    return isValidArchiveYear(year) ? `Arşiv ${year}` : "Arşiv";
  }
  if (normalizedPath.startsWith(ADMIN_BASE_PATH)) {
    return normalizedPath === `${ADMIN_BASE_PATH}/login/` ? "Yönetim Girişi" : "Yönetim Paneli";
  }
  return ROUTE_TITLES[normalizedPath] ?? "UEZ 2026";
}

export function getPageDescription(pathname: string, year?: string): string {
  const path = normalizePathname(pathname);
  if (path.startsWith("/arsiv/")) {
    const y = year ?? path.replace("/arsiv/", "").split("/")[0];
    return `Uluslararası Ekonomi Zirvesi ${y} etkinliğine ait konuşmacılar, program ve sponsor bilgileri.`;
  }
  if (path.startsWith(ADMIN_BASE_PATH)) return DEFAULT_DESCRIPTION;
  return ROUTE_DESCRIPTIONS[path] ?? DEFAULT_DESCRIPTION;
}

function normalizePathname(pathname: string): string {
  const withoutHash = pathname ? pathname.replace(/#.*$/, "").trim() : "";
  if (!withoutHash || withoutHash === "/") return "/";
  // Ana sayfa dışındaki tüm URL'ler slash ile bitsin
  return withoutHash.endsWith("/") ? withoutHash : withoutHash + "/";
}

/** Sayfa yoluna göre başlık: "Sayfa Adı | UEZ 2026" (ana sayfa sadece SITE_TITLE). Bilinmeyen path'ler 404 başlığı döner. */
export function getFullTitle(pathname?: string, year?: string): string {
  if (!pathname) return SITE_TITLE;
  const path = normalizePathname(pathname);
  if (!isKnownPath(path)) return NOT_FOUND_TITLE;
  if (path === "/uez-2026/") return UEZ_2026_PAGE_TITLE;
  const archiveYear = path.startsWith("/arsiv/") ? path.replace("/arsiv/", "").split("/")[0] : undefined;
  const pageTitle = getPageTitle(path, year ?? archiveYear);
  if (pageTitle === "Ana Sayfa") return SITE_TITLE;
  return `${pageTitle} | ${SITE_TITLE}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * origin örn: "https://uluslararasiekonomizirvesi.org"
 */
export function getSocialMetaTagsHtml(
  fullTitle: string,
  origin: string,
  pathname: string,
  description?: string
): string {
  const url = `${origin}${pathname}`;
  const image = `${origin}/og-image.jpg`;
  const titleEsc = escapeHtml(fullTitle);
  const descEsc = escapeHtml(description ?? DEFAULT_DESCRIPTION);
  return [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_TITLE)}" />`,
    `<meta property="og:title" content="${titleEsc}" />`,
    `<meta property="og:description" content="${descEsc}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:locale" content="tr_TR" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${titleEsc}" />`,
    `<meta name="twitter:description" content="${descEsc}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join("\n    ");
}

/**
 * Statik sayfa içeriği: nav, h1, main. Root div içine veya noscript içine konabilir.
 * View Source'ta ve JS kapalıyken okunabilir HTML sağlar.
 */
function getStaticBodyContent(path: string, origin: string): string {
  const fullUrl = (p: string) => `${origin}${p}`;
  const archiveYears = [
    "2025",
    "2024",
    "2023",
    "2022",
    "2021-kasim",
    "2021-mart",
    "2019",
    "2018",
    "2017",
    "2016",
    "2015",
  ];

  const navLinks: [string, string][] = [
    ["UEZ 2026", "/uez-2026/"],
    ["Program", "/#program"],
    ["Hakkımızda", "/hakkimizda/"],
    ["Stars of Region", "/stars-of-regions/"],
    ["Bize Ulaşın", "/bize-ulasin/"],
    ["Paketler", "/paketler/"],
  ];

  const navItems = navLinks
    .map(([label, href]) => {
      const u = href.startsWith("/#") ? `${origin}/` : fullUrl(href);
      const fragment = href.includes("#") ? href.split("#")[1] : "";
      return `<a href="${escapeHtml(u)}${fragment ? "#" + escapeHtml(fragment) : ""}" style="color:white;">${escapeHtml(label)}</a>`;
    })
    .join(" ");

  const archiveItems = archiveYears
    .map((y) => `<a href="${escapeHtml(fullUrl(`/arsiv/${y}`))}" style="color:white;">${escapeHtml(y)}</a>`)
    .join(" ");

  let h1 = SITE_TITLE;
  let mainContent = DEFAULT_DESCRIPTION;

  if (path === "/") {
    h1 = SITE_TITLE;
    mainContent =
      "BÜYÜK DÖNÜŞÜM: Dayanıklı ve sürdürülebilir bir küresel sisteme geçişin pusulası. 9-12 Nisan 2026, İstanbul.";
  } else if (path === "/hakkimizda/") {
    h1 = "Hakkımızda";
    mainContent =
      "Uluslararası Ekonomi Zirvesi (UEZ), küresel ekonomi gündemini şekillendiren önde gelen bir platformdur.";
  } else if (path === "/uez-2026/") {
    h1 = "UEZ 2026 Etkinlik Bilgisi";
    mainContent =
      "UEZ 2026, 9-12 Nisan tarihlerinde İstanbul'da gerçekleşecek. Konular, program ve zirve bilgileri.";
  } else if (path === "/paketler/") {
    h1 = "Paketler";
    mainContent = "Katılım ve sponsorluk paketleri hakkında bilgi alın.";
  } else if (path === "/bize-ulasin/") {
    h1 = "Bize Ulaşın";
    mainContent = "Sorularınız için iletişim formunu kullanın veya iletişim bilgilerimizden bize ulaşın.";
  } else if (path === "/stars-of-regions/") {
    h1 = "Stars of Region";
    mainContent = "Bölgelerin Yıldızları ödül programı ve katılım bilgileri.";
  } else if (path === "/m/") {
    h1 = "Mobil Etkinlik";
    mainContent = "UEZ mobil etkinlik sayfası.";
  } else if (path.startsWith("/arsiv/")) {
    const year = path.replace("/arsiv/", "").split("/")[0];
    h1 = `Arşiv ${escapeHtml(year)}`;
    mainContent = `Uluslararası Ekonomi Zirvesi ${year} etkinliğine ait konuşmacılar, program ve sponsor bilgileri.`;
  } else if (
    [
      "/cerez-politikasi/",
      "/acik-riza-metni/",
      "/aydinlatma-metni/",
      "/teslimat-ve-iade-sartlari/",
      "/mesafeli-satis-sozlesmesi/",
    ].includes(path)
  ) {
    h1 = getPageTitle(path);
    mainContent = ROUTE_DESCRIPTIONS[path] ?? "";
  } else if (!isKnownPath(path)) {
    h1 = "Sayfa Bulunamadı";
    mainContent =
      "Aradığınız sayfa mevcut değil. Lütfen ana sayfaya dönün.";
  }

  const inner = `<header style="padding:1rem 2rem;background:#4c1d95;color:white;">
    <nav style="display:flex;flex-wrap:wrap;gap:1rem;align-items:center;">
      <a href="${escapeHtml(origin)}/" style="color:white;font-weight:bold;">UEZ 2026</a>
      <span style="color:rgba(255,255,255,0.7);">|</span>
      ${navItems}
      <span style="color:rgba(255,255,255,0.7);">|</span>
      <span style="color:rgba(255,255,255,0.9);">Arşiv:</span> ${archiveItems}
    </nav>
  </header>
  <main style="max-width:800px;margin:2rem auto;padding:0 1.5rem;">
    <h1>${escapeHtml(h1)}</h1>
    <p>${escapeHtml(mainContent)}</p>
  </main>`;
  return inner;
}

/** Aynı içeriği &lt;noscript&gt; içinde döndürür (root boş kaldığında kullanım için). */
function getStaticBodyHtml(path: string, origin: string): string {
  return `<noscript>${getStaticBodyContent(path, origin)}</noscript>`;
}

/** Root'a enjekte edilecek statik HTML (SSR yokken kullanılır). Dışa aktarılır. */
export { getStaticBodyContent };

/** Event JSON-LD için tek kaynak; origin ile URL'ler dinamik olur. */
const EVENT_JSON_LD = {
  startDate: "2026-04-09",
  endDate: "2026-04-12",
  name: SITE_TITLE,
  alternateName: "International Economy Summit 2026",
  description: DEFAULT_DESCRIPTION,
  location: { name: "İstanbul", addressLocality: "İstanbul", addressCountry: "TR" },
  sameAs: [
    "https://www.linkedin.com/company/uluslararasiekonomizirvesi",
    "https://www.facebook.com/UEkonomiZirvesi",
    "https://www.instagram.com/uluslararasiekonomizirvesi/",
    "https://www.youtube.com/@UluslararasiEkonomiZirvesi",
    "https://x.com/UEkonomiZirvesi",
  ],
} as const;

function getEventJsonLd(origin: string): string {
  const base = origin.replace(/\/$/, "");
  const ld = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: EVENT_JSON_LD.name,
    alternateName: EVENT_JSON_LD.alternateName,
    description: EVENT_JSON_LD.description,
    startDate: EVENT_JSON_LD.startDate,
    endDate: EVENT_JSON_LD.endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: EVENT_JSON_LD.location.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: EVENT_JSON_LD.location.addressLocality,
        addressCountry: EVENT_JSON_LD.location.addressCountry,
      },
    },
    image: [`${base}/og-image.jpg`],
    organizer: {
      "@type": "Organization",
      name: EVENT_JSON_LD.name,
      url: base,
      sameAs: EVENT_JSON_LD.sameAs,
    },
    offers: {
      "@type": "Offer",
      url: `${base}/paketler/`,
      price: "0",
      priceCurrency: "TRY",
      availability: "https://schema.org/InStock",
      validFrom: "2026-01-01",
    },
    performer: { "@type": "Organization", name: "UEZ 2026 Konuşmacıları" },
  };
  // Sayfa kaynağında okunabilir olsun diye 2 boşluk indent
  return JSON.stringify(ld, null, 2);
}

const JSON_LD_PLACEHOLDER = "<!--json-ld-event-->";

export interface InjectSeoOptions {
  /** true ise root/ssr-outlet'e statik fallback enjekte edilmez (dev: React client mount etsin) */
  skipStaticFallback?: boolean;
}

export function injectSeoIntoIndexHtml(
  html: string,
  pathname: string,
  origin: string,
  options?: InjectSeoOptions
): string {
  const path = normalizePathname(pathname);
  const is404 = !isKnownPath(path);
  const fullTitle = getFullTitle(pathname);
  const pageDesc = getPageDescription(pathname);
  const canonicalUrl = `${origin}${path}`;
  const skipFallback = options?.skipStaticFallback === true;

  const titleEsc = escapeHtml(fullTitle);
  const descEsc = escapeHtml(pageDesc);
  let out = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${titleEsc}</title>`);

  // meta description path'e özel
  out = out.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${descEsc}" />`
  );

  const canonicalTag = `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`;
  out = out.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*\/?>\s*/gi, "");
  // Şablondaki varsayılan OG/Twitter meta'ları kaldır; aşağıda path'e özel tek set ekliyoruz
  out = out.replace(/<meta\s+[^>]*(?:property=["']og:[^"']*["']|name=["']twitter:[^"']*["'])[^>]*\s*\/?>/gi, "");

  const metaTags = getSocialMetaTagsHtml(fullTitle, origin, pathname, pageDesc);
  out = out.replace("</title>", `</title>\n    ${canonicalTag}\n    ${metaTags}`);

  if (is404) {
    out = out.replace(
      /<meta name="robots" content="[^"]*"\s*\/?>/i,
      '<meta name="robots" content="noindex, follow" />'
    );
  }

  // JSON-LD: placeholder'ı origin'e göre doldur (dev + build'de aynı davransın)
  const jsonLdScript = `<script type="application/ld+json">\n    ${getEventJsonLd(origin)}\n    </script>`;
  out = out.replace(/<!--\s*json-ld-event\s*-->/g, jsonLdScript);

  // Body: dev'de dokunma (React client mount etsin); production/prerender'da statik fallback
  if (!skipFallback) {
    const staticContent = getStaticBodyContent(path, origin);
    out = out.replace(/<div id="root"><\/div>/, `<div id="root"></div>\n    <noscript>${staticContent}</noscript>`);
    if (out.includes('<div id="root">') && !out.includes('<noscript>')) {
      out = out.replace('</body>', `    <noscript>${staticContent}</noscript>\n  </body>`);
    }
    if (out.includes("<!--ssr-outlet-->")) {
      out = out.replace("<!--ssr-outlet-->", `<div class="static-fallback" aria-hidden="true">${staticContent}</div>`);
    }
  }

  // Gereksiz boş bölüm yorumlarını kaldır (View Source daha düzenli görünsün)
  out = out.replace(/\s*<!--\s*(Open Graph Meta Tags|Twitter Card Meta Tags|Canonical URL|Favicon)\s*-->\s*/gi, "\n    ");
  // Theme Color / Preconnect / JSON-LD yorum satırı (tek başına kalan) – opsiyonel temizlik
  out = out.replace(/\s*<!--\s*JSON-LD[^>]*-->\s*/gi, "\n    ");

  // Tag'lar arasına satır sonu ekle; sayfa kaynağı bitişik karışık değil düzenli gelir
  out = formatHtmlReadable(out);

  return out;
}

/**
 * Sayfa kaynağında HTML'in okunabilir gelmesi için tag'lar arasına newline ekler.
 */
function formatHtmlReadable(html: string): string {
  return html.replace(/></g, ">\n<");
}
