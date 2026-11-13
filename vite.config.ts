import { defineConfig, Plugin } from "vite";
import path from "path";
import fs from "fs";
import { createServer } from "./server";
import { injectSeoIntoIndexHtml } from "./shared/seo";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  root: process.cwd(),
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: false,
      interval: 100,
    },
    fs: {
      allow: [".", "./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // react-dom ve radix ayrı chunk'tan çıkarıldı (circular chunk uyarılarını önlemek için)
            if (id.includes("react/") && !id.includes("react-dom")) return "react";
            if (id.includes("react-router") || id.includes("react-router-dom")) return "router";
            if (id.includes("@tanstack/react-query")) return "query";
            if (id.includes("i18next") || id.includes("react-i18next")) return "i18n";
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("sonner")) return "sonner";
            if (id.includes("framer-motion")) return "framer-motion";
            if (id.includes("date-fns")) return "date-fns";
            if (id.includes("react-hook-form") || id.includes("hookform")) return "react-hook-form";
            if (id.includes("zod")) return "zod";
            if (id.includes("recharts")) return "recharts";
            if (id.includes("embla-carousel")) return "embla";
            if (id.includes("react-day-picker")) return "day-picker";
            if (id.includes("jspdf") || id.includes("html2canvas")) return "pdf";
            return "vendor";
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    chunkSizeWarningLimit: 1200,
  },
  plugins: [seoInjectPlugin(), expressPlugin(), oneSignalCopyPlugin()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react'
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

/** Dev modunda index.html servis edilirken path'e göre title + og/twitter meta enjekte eder (kaynak kodda görünsün). */
function seoInjectPlugin(): Plugin {
  return {
    name: "seo-inject",
    apply: "serve",
    configureServer(server) {
      const seoMiddleware = (req: import("connect").IncomingMessage, res: import("http").ServerResponse, next: () => void) => {
        const url = req.url?.split("?")[0] ?? "/";
        const pathname = url === "" ? "/" : url;
        // Script, asset, API ve Vite internal isteklerini Vite'a bırak (bunları kesme)
        if (
          pathname.startsWith("/api") ||
          pathname.startsWith("/assets") ||
          pathname.startsWith("/@") ||
          pathname.startsWith("/node_modules") ||
          pathname.startsWith("/uploads") ||
          pathname.startsWith("/speakers") ||
          pathname.startsWith("/client/") ||
          pathname.startsWith("/src/") ||
          /\.[a-z0-9]+$/i.test(pathname)
        ) {
          return next();
        }
        const indexPath = path.join(process.cwd(), "index.html");
        let html: string;
        try {
          html = fs.readFileSync(indexPath, "utf-8");
        } catch {
          return next();
        }
        const host = req.headers.host || "localhost:8082";
        const protocol = req.headers["x-forwarded-proto"] ?? "http";
        const origin = `${protocol}://${host}`;
        html = injectSeoIntoIndexHtml(html, pathname, origin, { skipStaticFallback: true });
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(html);
      };
      // Vite Connect server accepts (handler, { prepend }) but Connect types only declare (path?, handler)
      (server.middlewares as { use: (fn: typeof seoMiddleware, opts?: { prepend?: boolean }) => void }).use(seoMiddleware, { prepend: true });
    },
  };
}

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}

/** OneSignal service worker dosyalarını build sonrası dist/spa/'ya kopyalar ve .htaccess'i düzenler */
function oneSignalCopyPlugin(): Plugin {
  return {
    name: "onesignal-copy",
    apply: "build",
    writeBundle() {
      const sourceDir = path.join(process.cwd(), "public");
      const targetDir = path.join(process.cwd(), "dist/spa");
      
      const oneSignalFiles = [
        "OneSignalSDK.sw.js",
        "OneSignalSDKWorker.js", 
        "OneSignalSDKUpdaterWorker.js"
      ];

      // OneSignal dosyalarını kopyala
      oneSignalFiles.forEach(file => {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);
        
        try {
          if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`✅ OneSignal: ${file} kopyalandı`);
          }
        } catch (error) {
          console.error(`❌ OneSignal: ${file} kopyalanamadı:`, error);
        }
      });

      // .htaccess dosyasını düzenle
      const htaccessPath = path.join(targetDir, ".htaccess");
      try {
        let htaccessContent = fs.readFileSync(htaccessPath, "utf-8");
        
        // OneSignal kuralları zaten varsa ekleme
        if (!htaccessContent.includes("OneSignal")) {
          const oneSignalRules = `

# OneSignal service worker - Gereksinimler: aynı origin, HTTPS, Content-Type application/javascript; charset=utf-8
<IfModule mod_headers.c>
  <FilesMatch "OneSignal.*\\.js$">
    Header set Content-Type "application/javascript; charset=utf-8"
  </FilesMatch>
</IfModule>
<Files "OneSignal*.js">
  ForceType application/javascript
</Files>

`;
          
          // MIME type ayarlarından sonra ekle
          htaccessContent = htaccessContent.replace(
            /(<\/IfModule>\s*\n)/,
            `$1${oneSignalRules}`
          );
          
          fs.writeFileSync(htaccessPath, htaccessContent);
          console.log("✅ OneSignal: .htaccess güncellendi");
        }
      } catch (error) {
        console.error("❌ OneSignal: .htaccess güncellenemedi:", error);
      }
    },
  };
}
