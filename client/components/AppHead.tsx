import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { getFullTitle, getPageDescription, isKnownPath, SITE_TITLE } from "@shared/seo";

function useGtagPageView() {
  const { pathname, search, hash } = useLocation();
  const isFirst = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined" || !window.gtag) return;

    const pagePath = `${pathname}${search}${hash}`;
    const pageLocation = window.location.href;
    const title = getFullTitle(pathname);

    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_location: pageLocation,
      page_title: title,
    });
  }, [pathname, search, hash]);
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function AppHead() {
  const { pathname } = useLocation();
  useGtagPageView();

  const fullTitle = getFullTitle(pathname);
  const pageDescription = getPageDescription(pathname);
  const canonicalUrl =
    typeof window !== "undefined" ? `${window.location.origin}${pathname}` : "";
  const ogImage =
    typeof window !== "undefined"
      ? `${window.location.origin}/og-image.jpg`
      : "/og-image.jpg";

  useEffect(() => {
    document.title = fullTitle;
  }, [fullTitle]);

  const is404 = !isKnownPath(pathname);

  return (
    <Helmet key={pathname}>
      <title>{fullTitle}</title>
      <meta name="description" content={pageDescription} />
      
      <meta name="keywords" content="UEZ, uluslararası ekonomi zirvesi, UEZ 2026, ekonomi, zirve, sürdürülebilir sistem, küresel dönüşüm, ekonomi konferansı" />
      <meta name="author" content="UEZ 2026 - Uluslararası Ekonomi Zirvesi" />
      <meta name="robots" content={is404 ? "noindex, follow" : "index, follow"} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_TITLE} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/jpeg" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:locale" content="tr_TR" />
      <meta property="og:locale:alternate" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@UEkonomiZirvesi" />
      <meta name="twitter:creator" content="@UEkonomiZirvesi" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content="UEZ 2026 - Uluslararası Ekonomi Zirvesi" />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

    </Helmet>
  );
}
