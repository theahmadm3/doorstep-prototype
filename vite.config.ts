import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// NOTE: we deliberately do NOT use `vite-plugin-pwa`. It used to generate a
// second `sw.js` alongside our hand-rolled `public/push-sw.js`, which produced
// two service workers racing for control at scope `/`. PWA install criteria
// (HTTPS + manifest + SW with a fetch handler) are satisfied by `push-sw.js`,
// which is registered explicitly from `main.tsx`.

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
  plugins: [react(), tsconfigPaths()],
  server: { port: 9002 },
  build: { outDir: "dist" },
});
