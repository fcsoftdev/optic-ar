import axios from "axios";

/**
 * URL base de la API de Django
 * Lee la variable de entorno VITE_API_URL del archivo .env
 * Si no existe, usa http://127.0.0.1:8000 por defecto
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/**
 * Instancia configurada de Axios para todas las peticiones HTTP
 *
 * Configuración:
 * - baseURL: URL base que se antepone a todas las rutas (ej: /api/productos/ → http://127.0.0.1:8000/api/productos/)
 * - headers: Headers HTTP que se envían en cada petición
 *   - Content-Type: application/json → Indica que enviamos/esperamos JSON
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Interceptor de respuestas HTTP
 * Se ejecuta automáticamente después de cada respuesta de la API
 *
 * Casos:
 * - Respuesta exitosa (2xx): La devuelve sin modificaciones
 * - Error 401 (No autorizado): Registra el error en consola
 * - Otros errores: Los propaga para que se manejen en el código que hizo la petición
 *
 * Uso futuro: Aquí se agregará lógica para refresh de tokens JWT
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("No autorizado");
      // TODO: Redirigir a login cuando se implemente autenticación
    }
    return Promise.reject(error);
  }
);

export default api;
