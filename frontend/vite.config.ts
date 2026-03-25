import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redirige /api/, /ventas/ y /static/ al backend Django.
      // Esto hace que el navegador trate todas las peticiones como mismo
      // origen (localhost:5173), resolviendo el problema de SameSite con cookies.
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        // Reescribe el dominio de las cookies Set-Cookie del backend para
        // que el navegador las almacene en localhost (origen del frontend).
        // Sin esto, la cookie refresh_token queda atada a 127.0.0.1 y
        // el navegador no la envía en peticiones desde localhost:5173.
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
    },
  },
});
