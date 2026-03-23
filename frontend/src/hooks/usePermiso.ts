/**
 * Hook para verificar permisos de Django en el frontend.
 *
 * Encapsula la lógica de comprobación de permisos del usuario autenticado,
 * respetando la regla de que los superusuarios tienen acceso a todo.
 */

import { useAuthStore } from "../stores/useAuthStore";

/**
 * Hook que expone la función `tienePermiso` para verificar permisos de Django.
 *
 * @returns Objeto con la función `tienePermiso`.
 * @example
 * const { tienePermiso } = usePermiso();
 * const puedeAgregar = tienePermiso("productos.add_producto");
 */
export function usePermiso() {
  const user = useAuthStore((state) => state.user);

  /**
   * Verifica si el usuario autenticado posee el permiso indicado.
   * Los superusuarios siempre retornan `true`.
   *
   * @param perm - Permiso en formato "app_label.codename". Ej: "productos.add_producto".
   * @returns `true` si el usuario tiene el permiso, `false` en caso contrario.
   */
  const tienePermiso = (perm: string): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return user.permissions.includes(perm);
  };

  return { tienePermiso };
}
