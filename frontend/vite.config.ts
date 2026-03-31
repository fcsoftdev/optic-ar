import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
/// <reference types="vitest" />

const proxyConfig = {
  "/api": {
    target: "http://127.0.0.1:8000",
    changeOrigin: true,
    cookieDomainRewrite: { "127.0.0.1": "localhost", "*": "" },
  },
  "/ventas": {
    target: "http://127.0.0.1:8000",
    changeOrigin: true,
  },
  "/static": {
    target: "http://127.0.0.1:8000",
    changeOrigin: true,
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/test/**", "src/**/*.d.ts"],
    },
  },
  server: {
    proxy: proxyConfig,
  },
  preview: {
    proxy: proxyConfig,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["react-bootstrap", "bootstrap"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-form": ["react-hook-form", "zod", "@hookform/resolvers"],
          "vendor-calendar": [
            "@fullcalendar/core",
            "@fullcalendar/react",
            "@fullcalendar/daygrid",
            "@fullcalendar/timegrid",
            "@fullcalendar/interaction",
          ],
          "vendor-misc": ["axios", "zustand", "react-select"],
        },
      },
    },
  },
});
