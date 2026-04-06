import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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
  server: {
    proxy: proxyConfig,
  },
  preview: {
    proxy: proxyConfig,
    allowedHosts: true,
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
