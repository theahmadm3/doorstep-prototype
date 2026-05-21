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
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 9002 },
  build: { outDir: "dist" },
});
