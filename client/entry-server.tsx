import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider, dehydrate } from "@tanstack/react-query";
import { AppRoutes } from "./App";
import { SSR_OUTLET, PRELOADED_STATE } from "@shared/ssr";
// CSS client build'de yüklenir; Node'da import etmek SSR bundle'ı kırabilir
import "./i18n";

export { SSR_OUTLET, PRELOADED_STATE };

export interface SSRResult {
  html: string;
  queryState: string;
}

/**
 * Ana sayfa (/) için sunucu tarafında veri ön-yükleme.
 * Aynı queryKey'ler client'taki useQuery ile eşleşmeli.
 */
async function prefetchHomepage(queryClient: QueryClient, origin: string): Promise<void> {
  const locale = "tr";
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["settings", locale],
      queryFn: () => fetch(`${origin}/api/settings?locale=${locale}`).then((r) => r.json()),
    }),
    queryClient.prefetchQuery({
      queryKey: ["sponsors", "2026", locale],
      queryFn: () =>
        fetch(`${origin}/api/sponsors?year=2026&locale=${locale}`).then((r) => r.json()),
    }),
    queryClient.prefetchQuery({
      queryKey: ["speakers", "2026", locale],
      queryFn: async () => {
        const res = await fetch(`${origin}/api/speakers?year=2026&locale=${locale}`);
        if (!res.ok) return [];
        const data = await res.json();
        if (Array.isArray(data)) return data;
        if (data?.speakers && Array.isArray(data.speakers)) return data.speakers;
        return [];
      },
    }),
  ]);
}

/**
 * Sunucu tarafında React uygulamasını HTML string'e render eder.
 * @param url - İstek yolu (örn. "/" veya "/hakkimizda")
 * @param origin - Tam origin (örn. "https://uluslararasiekonomizirvesi.org")
 */
export async function render(url: string, origin: string): Promise<SSRResult> {
  (globalThis as typeof globalThis & { __API_ORIGIN__: string }).__API_ORIGIN__ = origin;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 1000 * 60 * 5, retry: 1 },
    },
  });

  const pathname = url.replace(/\?.*$/, "") || "/";
  if (/^\/arsiv\/2026\/zirve\/?$/.test(pathname)) {
    await prefetchHomepage(queryClient, origin);
  }
  // API'den veri alan sayfalar için prefetch (prerender'da dolu HTML çıksın, loading'de takılı kalmasın)
  const locale = "tr";
  if (pathname === "/hakkimizda") {
    await queryClient.prefetchQuery({
      queryKey: ["about", locale],
      queryFn: () => fetch(`${origin}/api/about?locale=${locale}`).then((r) => r.json()),
    }).catch(() => {}); 
  }
  if (pathname === "/bize-ulasin") {
    await queryClient.prefetchQuery({
      queryKey: ["contact", locale],
      queryFn: () => fetch(`${origin}/api/contact?locale=${locale}`).then((r) => r.json()),
    }).catch(() => {});
  }

  const appHtml = renderToString(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <StaticRouter location={url} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </StaticRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );

  const state = dehydrate(queryClient);
  const queryState = JSON.stringify(state);
  return { html: appHtml, queryState };
}
