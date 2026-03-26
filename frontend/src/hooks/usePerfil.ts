/**
 * Hook para gestión del perfil del usuario autenticado.
 *
 * Encapsula la mutación de actualización de perfil y sincroniza
 * el resultado con el store de autenticación global.
 */

import { useMutation } from "@tanstack/react-query";
import { updatePerfil } from "../services/perfil.service";
import type { PerfilFormData } from "../schemas/perfil.schema";
import { useAuthStore } from "../stores/useAuthStore";

/**
 * Hook para actualizar el perfil del usuario autenticado.
 *
 * Al completarse con éxito, actualiza el store global con los datos
 * devueltos por el backend para que Header y demás componentes reflejen
 * los cambios inmediatamente.
 *
 * @returns Mutación de actualización y estado de carga/error.
 * @example
 * const { actualizarPerfil, isPending, isSuccess } = usePerfil();
 * actualizarPerfil({ first_name: "Ana", last_name: "López", email: "ana@mail.com" });
 */
export function usePerfil() {
  const { setAuth, accessToken } = useAuthStore();

  const mutation = useMutation({
    mutationFn: (datos: PerfilFormData) => updatePerfil(datos),
    onSuccess: (data) => {
      // Sincroniza el store con el payload completo del usuario actualizado
      if (accessToken) {
        setAuth(accessToken, data.user);
      }
    },
  });

  return {
    actualizarPerfil: mutation.mutate,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
