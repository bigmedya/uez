import "dotenv/config";
import path from "path";
import fs from "fs";
import { pathToFileURL, fileURLToPath } from "url";
import { createServer } from "./index";
import * as express from "express";
import type { Request } from "express";
import { injectSeoIntoIndexHtml, getStaticBodyContent } from "../shared/seo";
import { SSR_OUTLET, PRELOADED_STATE } from "../shared/ssr";

/** Canonical/OG linkler için public origin (proxy arkasında iç IP kullanılmaz). */
function getPublicOrigin(req: Request): string {
  // Prefer explicit config
  const fromEnv = process.env.PUBLIC_ORIGIN || process.env.SITE_URL;
  if (fromEnv && fromEnv.startsWith("http")) return fromEnv.replace(/\/$/, "");

  // Respect common reverse-proxy headers
  const xfProto = (req.get("x-forwarded-proto") || "").split(",")[0].trim();
  const xfHost = (req.get("x-forwarded-host") || "").split(",")[0].trim();
  const host = xfHost || req.get("host") || "";
  const proto = xfProto || req.protocol;

  return `${proto}://${host}`.replace(/\/$/, "");
}

/** İstek URL'sinden pathname üretir (proxy/barındırma ortamında doğru canonical için). */
function getPathnameFromRequest(req: Request): string {
  const raw = (req.originalUrl ?? req.url ?? req.path ?? "").replace(/\?.*$/, "").trim();
  if (!raw || raw === "") return "/";
  return raw.replace(/\/$/, "") || "/";
}

// SSR kullanıldığında HTML sadece bu dosyadaki middleware'den sunulur; createServer SPA fallback eklemesin
const app = createServer({ skipHtmlFallback: true });
const port = process.env.PORT || 3000;

const __dirname = typeof import.meta.dirname !== "undefined" ? import.meta.dirname : path.dirname(fileURLToPath(import.meta.url));
const rootPath = process.cwd();
// SSR bundle: önce cwd'ye göre, yoksa çalışan script'e göre (dist/server/../ssr/entry-server.mjs)
let ssrEntryPath = path.join(rootPath, "dist", "ssr", "entry-server.mjs");
if (!fs.existsSync(ssrEntryPath)) {
  const serverDir = path.dirname(fileURLToPath(import.meta.url));
  ssrEntryPath = path.join(serverDir, "..", "ssr", "entry-server.mjs");
}

// SSR render fonksiyonu (bundle yoksa null)
let ssrRender: ((url: string, origin: string) => Promise<{ html: string; queryState: string }>) | null = null;
try {
  if (!fs.existsSync(ssrEntryPath)) {
    throw new Error(`SSR entry bulunamadı: ${ssrEntryPath}`);
  }
  const entryUrl = pathToFileURL(ssrEntryPath).href;
  const mod = await import(entryUrl);
  ssrRender = mod.render ?? null;
  if (ssrRender) {
    console.log("✓ SSR bundle yüklendi, React HTML sunulacak");
  } else {
    console.warn("⚠ SSR bundle'da render fonksiyonu yok, statik fallback kullanılacak");
  }
} catch (e) {
  console.warn("⚠ SSR bundle yüklenemedi, statik fallback kullanılacak:", String(e));
}

// Static: sadece /assets ve /uploads; sayfa istekleri (/) önce HTML middleware'de SSR ile sunulur
app.use("/assets", express.static(path.join(rootPath, "public", "assets"), {
  maxAge: "1y",
  etag: true,
  lastModified: true,
}));
app.use("/uploads", express.static(path.join(rootPath, "public", "uploads")));

// HTML sayfaları: SSR varsa render et, yoksa SPA index + SEO enjeksiyonu
app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/assets/") || req.path.startsWith("/health")) {
    return next();
  }
  if (/\.[a-z0-9]+$/i.test(req.path)) {
    return next();
  }

  res.set({
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  });

  const indexPath = path.join(rootPath, "dist", "spa", "index.html");
  const templatePath = path.join(rootPath, "dist", "spa", "index.template.html");
  // Prerender yoksa runtime SSR/fallback için placeholder'lı şablon gerekir
  const htmlPath = fs.existsSync(templatePath) ? templatePath : indexPath;
  let html: string;
  try {
    html = fs.readFileSync(htmlPath, "utf-8");
  } catch {
    return next();
  }

  const origin = getPublicOrigin(req);
  const pathname = getPathnameFromRequest(req);
  const url = req.originalUrl || req.url || req.path;

  const sendHtml = (finalHtml: string) => {
    res.set("Content-Type", "text/html").send(finalHtml);
  };

  // Prerendered dosya varsa doğrudan sun (runtime SSR atla, kaynak kodunda tam HTML görünür)
  const prerenderedPath =
    pathname === "/"
      ? path.join(rootPath, "dist", "spa", "index.html")
      : path.join(rootPath, "dist", "spa", pathname.slice(1), "index.html");
  if (fs.existsSync(prerenderedPath)) {
    const prerenderedHtml = fs.readFileSync(prerenderedPath, "utf-8");
    // Prerendered dosyada SSR_OUTLET zaten doldurulmuş olmalı
    if (!prerenderedHtml.includes("<!--ssr-outlet-->")) {
      res.set("X-SSR", "prerendered");
      return sendHtml(prerenderedHtml);
    }
  }

  if (ssrRender) {
    ssrRender(url, origin)
      .then((result) => {
        let out = html.replace(SSR_OUTLET, result.html);
        // `queryState` is expected to be a JSON string (e.g. "{...}") from the SSR bundle.
        // Do NOT JSON.stringify again or it becomes a quoted string.
        const safeState = typeof result.queryState === "string" && result.queryState.trim() !== ""
          ? result.queryState
          : "{}";
        const stateScript = `<script>window.__PRELOADED_STATE__=${safeState};</script>`;
        out = out.replace(PRELOADED_STATE, stateScript);
        out = injectSeoIntoIndexHtml(out, pathname, origin);
        res.set("X-SSR", "1");
        sendHtml(out);
      })
      .catch((err) => {
        console.error("SSR error:", err);
        const fallback = getStaticBodyContent(pathname, origin);
        let out = html.replace(SSR_OUTLET, `<div class="static-fallback" aria-hidden="true">${fallback}</div>`);
        out = out.replace(PRELOADED_STATE, "");
        out = injectSeoIntoIndexHtml(out, pathname, origin);
        res.set("X-SSR", "0");
        sendHtml(out);
      });
    return; // Response async gelecek; sonraki middleware'e geçme
  }

  // SSR yok: root içine statik HTML koy (View Source ve JS kapalıyken dolu içerik)
  const staticContent = getStaticBodyContent(pathname, origin);
  html = html.replace(SSR_OUTLET, `<div class="static-fallback" aria-hidden="true">${staticContent}</div>`);
  html = html.replace(PRELOADED_STATE, "");
  html = injectSeoIntoIndexHtml(html, pathname, origin);
  res.set("X-SSR", "0");
  sendHtml(html);
});

// Favicon, manifest vb. (uzantılı istekler yukarıda next() ile buraya düşer)
app.use(express.static(path.join(rootPath, "dist", "spa"), {
  maxAge: "1y",
  etag: true,
  lastModified: true,
}));

app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
