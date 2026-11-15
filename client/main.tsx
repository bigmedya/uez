import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./global.css";
import "./i18n";
import { QueryClient, QueryClientProvider, HydrationBoundary } from "@tanstack/react-query";

import { getAdminBearerToken } from "./lib/adminSession";

const browserFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input.toString(), location.href);
  if (!/^\/uezyonetim(?:\/|$)/.test(location.pathname) || url.origin !== location.origin || !url.pathname.startsWith("/api/")) {
    return browserFetch(input, init);
  }
  const token = getAdminBearerToken();
  if (!token) return browserFetch(input, init);
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  if (!headers.has("Authorization")) headers.set("Authorization", "Bearer " + token);
  return browserFetch(input, { ...init, headers, redirect: "error" });
};

declare global {
  interface Window {
    __PRELOADED_STATE__?: string;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const rootEl = document.getElementById("root")!;
const preloadedState = typeof window !== "undefined" ? window.__PRELOADED_STATE__ : undefined;
let state: unknown = undefined;
if (preloadedState) {
  try {
    state = JSON.parse(preloadedState);
  } catch {
    state = undefined;
  }
}

const app = (
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        {state ? (
          <HydrationBoundary state={state}>
            <App />
          </HydrationBoundary>
        ) : (
          <App />
        )}
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);

// Safer hydration approach to prevent React errors
try {
  if (rootEl.hasChildNodes() && rootEl.innerHTML.trim() !== "" && !rootEl.innerHTML.includes("<!--ssr-outlet-->")) {
    // Only hydrate if there's actual server-rendered content
    ReactDOM.hydrateRoot(rootEl, app);
  } else {
    // Use createRoot for client-side rendering
    ReactDOM.createRoot(rootEl).render(app);
  }
} catch (hydrationError) {
  console.warn("Hydration failed, falling back to client-side rendering:", hydrationError);
  // Clear the root and render client-side
  rootEl.innerHTML = '';
  ReactDOM.createRoot(rootEl).render(app);
}

