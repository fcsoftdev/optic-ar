import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables for the current mode so VITE_API_URL is available
  // at config time (vite.config.ts runs in Node, not the browser bundle).
  const env = loadEnv(mode, process.cwd(), "");

  // In development the proxy forwards /api, /ventas and /static to the local
  // Django server.  In production the built assets are served by `npx serve`
  // which has no proxy layer, so the browser uses VITE_API_URL directly as
  // the axios baseURL (set in src/services/api.ts).
  const backendTarget = env.VITE_API_URL || "http://127.0.0.1:8000";

  const proxyConfig = {
    "/api": {
      target: backendTarget,
      changeOrigin: true,
      cookieDomainRewrite: { "127.0.0.1": "localhost", "*": "" },
    },
    "/ventas": {
      target: backendTarget,
      changeOrigin: true,
    },
    "/static": {
      target: backendTarget,
      changeOrigin: true,
    },
  };

  return {
    plugins: [react()],
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
  };
});
