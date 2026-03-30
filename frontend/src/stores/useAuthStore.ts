/**
 * Store de Zustand para el estado global de autenticación.
 *
 * El access token se mantiene únicamente en memoria (no se persiste en
 * localStorage ni sessionStorage) para minimizar la superficie de ataque XSS.
 * El refresh token vive en una cookie HttpOnly gestionada por el backend.
 */

import { create } from "zustand";

/** Datos del usuario autenticado recibidos del backend. */
export interface AuthUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  /** True si el usuario tiene acceso al admin de Django / ABM de usuarios. */
  is_staff: boolean;
  /** True si el usuario es superusuario (acceso total). */
  is_superuser: boolean;
  /** Nombres de los grupos a los que pertenece el usuario. */
  groups: string[];
  /** Permisos en formato "app_label.codename". */
  permissions: string[];
}

interface AuthState {
  /** JWT access token en memoria. Null si no hay sesión activa. */
  accessToken: string | null;
  /** Datos del usuario autenticado. Null si no hay sesión activa. */
  user: AuthUser | null;
  /**
   * Indica si el intento de restauración silenciosa de sesión ya finalizó
   * (con o sin éxito). Se usa para mostrar el spinner de carga inicial.
   */
  isInitialized: boolean;
  /**
   * Establece el access token y los datos del usuario tras un login o refresh exitoso.
   * @param accessToken - Nuevo JWT access token.
   * @param user - Datos del usuario autenticado.
   */
  setAuth: (accessToken: string, user: AuthUser) => void;
  /** Limpia el estado de sesión (sin tocar la cookie, eso lo gestiona el backend). */
  clearAuth: () => void;
  /** Marca que el intento de restauración silenciosa ya terminó. */
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isInitialized: false,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
  setInitialized: () => set({ isInitialized: true }),
}));
