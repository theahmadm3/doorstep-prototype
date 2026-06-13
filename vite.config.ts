import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      strategies: "generateSW",
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: false, // use existing public/manifest.json (linked in index.html)
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
      // Register the precache service worker in `npm run dev` too, so the app
      // meets PWA install criteria locally (Chrome only fires
      // `beforeinstallprompt` when a SW with a fetch handler is registered).
      // The canonical check is still a production build + preview.
      devOptions: { enabled: true, type: "module" },
    }),
  ],
  server: { port: 9002 },
  build: { outDir: "dist" },
});
