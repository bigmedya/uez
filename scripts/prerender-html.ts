/**
 * Her public path için tam SSR render ile HTML üretir.
 * Gerçek React bileşenlerini render ederek prerendered HTML oluşturur.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { injectSeoIntoIndexHtml, getPublicPathsForPrerender } from "../shared/seo";
import { SSR_OUTLET, PRELOADED_STATE } from "../shared/ssr";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const spaDir = path.join(root, "dist", "spa");
const ssrDir = path.join(root, "dist", "ssr");
const indexPath = path.join(spaDir, "index.html");
const ssrEntry = path.join(ssrDir, "entry-server.mjs");

const origin = process.env.PUBLIC_ORIGIN || process.env.SITE_URL || "https://uluslararasiekonomizirvesi.org";

async function main() {
  if (!fs.existsSync(indexPath)) {
    console.error("dist/spa/index.html yok. Önce: npm run build:client");
    process.exit(1);
  }

  if (!fs.existsSync(ssrEntry)) {
    console.error("dist/ssr/entry-server.mjs yok. Önce: npm run build:ssr");
    process.exit(1);
  }

  const template = fs.readFileSync(indexPath, "utf-8");
  // Runtime'da prerender yoksa SSR/fallback için placeholder'lı şablon (node-build kullanır)
  const templatePath = path.join(spaDir, "index.template.html");
  fs.writeFileSync(templatePath, template, "utf-8");
  console.log("  📄 index.template.html kaydedildi");

  const paths = getPublicPathsForPrerender();
  console.log(`🚀 ${paths.length} sayfa için tam SSR prerendering (JS kapalı da aynı tasarım)...`);

  // SSR modülünü import et
  const { render } = await import(path.resolve(ssrEntry));

  for (const pathname of paths) {
    try {
      // Gerçek SSR render
      const { html: renderedHtml, queryState } = await render(pathname, origin);
      
      let html = template;
      
      // SSR içeriği ve prefetch state'i inject et
      html = html.replace(SSR_OUTLET, renderedHtml);
      html = html.replace(PRELOADED_STATE, `<script>window.__PRELOADED_STATE__=${queryState};</script>`);
      
      // SEO meta tag'larını inject et
      html = injectSeoIntoIndexHtml(html, pathname, origin);

      const outPath =
        pathname === "/"
          ? path.join(spaDir, "index.html")
          : path.join(spaDir, pathname.slice(1), "index.html");
      
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html, "utf-8");
      
      console.log("  ✓", pathname || "/", "→", path.relative(root, outPath));
    } catch (error) {
      console.error(`  ❌ ${pathname} render hatası:`, error);
      console.error("  💡 Build sırasında API erişilebilir olmalı (PUBLIC_ORIGIN/SITE_URL ile aynı origin'de).");
      process.exit(1);
    }
  }

  console.log(`\n✅ ${paths.length} sayfa için tam SSR HTML oluşturuldu!`);
  console.log(`📍 Origin: ${origin}`);
}

main().catch((error) => {
  console.error("❌ Prerendering hatası:", error);
  process.exit(1);
});
