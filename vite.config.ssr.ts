import { defineConfig } from "vite";
import path from "path";

/** SSR bundle: sunucuda React'ı HTML'e render etmek için. */
export default defineConfig({
  build: {
    ssr: true,
    outDir: "dist/ssr",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "client/entry-server.tsx"),
      output: {
        entryFileNames: "entry-server.mjs",
        format: "es",
      },
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
    target: "node18",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  ssr: {
    noExternal: ["react-router-dom", "@tanstack/react-query", "react-helmet-async", "i18next", "react-i18next"],
    target: "node",
  },
});
