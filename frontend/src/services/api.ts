import axios from "axios";
import type {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { useAuthStore } from "../stores/useAuthStore";

/**
 * URL base de la API.
 * En desarrollo el proxy de Vite reenvía /api/* → Django (mismo origen).
 * En producción se lee VITE_API_URL o se usa la raíz del mismo servidor.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Instancia Axios principal para todas las peticiones autenticadas.
 *
 * - Adjunta automáticamente el Bearer token via interceptor de request.
 * - En caso de 401, intenta un refresh silencioso y reintenta la petición.
 * - withCredentials: true para enviar la cookie HttpOnly del refresh.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

/**
 * Instancia Axios para los endpoints de autenticación.
 *
 * No tiene interceptores JWT para evitar bucles infinitos al refrescar tokens.
 * Se importa y usa exclusivamente en `auth.service.ts`.
 */
export const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ── Interceptor de REQUEST: adjunta el Bearer token ─────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ── Interceptor de RESPONSE: maneja 401 con refresh silencioso ──────────────

interface AuthRefreshResponse {
  access: string;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    is_staff: boolean;
    is_superuser: boolean;
    groups: string[];
    permissions: string[];
  };
}

interface QueueEntry {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueEntry[] = [];

/** Resuelve o rechaza todas las peticiones en espera del nuevo token. */
function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Si ya se está refrescando, encolar la petición fallida
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await authApi.post<AuthRefreshResponse>(
        "/api/token/refresh/",
      );
      useAuthStore.getState().setAuth(data.access, data.user);
      processQueue(null, data.access);
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
