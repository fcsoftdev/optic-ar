/**
 * Servicios HTTP de autenticación.
 *
 * Utiliza `authApi` (instancia sin interceptores JWT) para evitar bucles
 * infinitos al intentar refrescar un token expirado.
 */

import { authApi } from "./api";
import type { AuthUser } from "../stores/useAuthStore";

/** Credenciales de inicio de sesión. */
export interface LoginCredentials {
  username: string;
  password: string;
}

/** Respuesta de los endpoints de login y refresh. */
export interface AuthResponse {
  access: string;
  user: AuthUser;
}

/**
 * Inicia sesión con las credenciales del usuario.
 *
 * @param credentials - Usuario y contraseña.
 * @returns Access token y datos del usuario.
 * @example
 * const data = await login({ username: "admin", password: "pass" });
 */
export const login = async (
  credentials: LoginCredentials,
): Promise<AuthResponse> => {
  const response = await authApi.post<AuthResponse>("/api/token/", credentials);
  return response.data;
};

/**
 * Refresca silenciosamente el access token usando la cookie HttpOnly.
 *
 * Se llama al inicializar la app para restaurar la sesión previa.
 *
 * @returns Nuevo access token y datos actualizados del usuario.
 * @throws Error si no hay cookie válida o el token expiró.
 */
export const silentRefresh = async (): Promise<AuthResponse> => {
  const response = await authApi.post<AuthResponse>("/api/token/refresh/");
  return response.data;
};

/**
 * Cierra la sesión del usuario.
 *
 * Invalida el refresh token en el backend (blacklist) y elimina la cookie.
 */
export const logout = async (): Promise<void> => {
  await authApi.post("/api/token/logout/");
};
