/**
 * Hook de autenticación con React Query.
 *
 * Expone mutaciones para login y logout, y el estado del usuario autenticado.
 * El refresco silencioso inicial se gestiona en App.tsx (useEffect de montaje).
 */

import { useMutation } from "@tanstack/react-query";
import { login, logout } from "../services/auth.service";
import type { LoginCredentials } from "../services/auth.service";
import { useAuthStore } from "../stores/useAuthStore";

/**
 * Hook principal de autenticación.
 *
 * @returns Estado de autenticación y funciones de login/logout.
 * @example
 * const { user, login, logout, isLoggingIn } = useAuth();
 */
export function useAuth() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (data) => {
      setAuth(data.access, data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Limpia el estado local siempre, aunque falle el endpoint de logout
      clearAuth();
    },
  });

  return {
    user,
    isAuthenticated: !!accessToken,
    /** Inicia sesión con las credenciales provistas. */
    login: loginMutation.mutateAsync,
    /** Cierra la sesión del usuario. */
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
  };
}
