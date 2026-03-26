/**
 * Componente de ruta protegida para React Router.
 *
 * Verifica que el usuario autenticado tenga el permiso requerido antes de
 * renderizar el elemento. Si no lo tiene, redirige a la raíz silenciosamente.
 */

import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import { usePermiso } from "../hooks/usePermiso";

interface ProtectedRouteProps {
  /** Elemento a renderizar si el permiso es válido. */
  element: React.ReactNode;
  /** Permiso de Django requerido en formato "app_label.codename". */
  perm?: string;
  /** Si es true, requiere que el usuario tenga is_staff=true. */
  requiresStaff?: boolean;
}

/**
 * Wrapper de Route que protege el acceso según permisos de Django.
 *
 * Los superusuarios tienen acceso a todo. Si el usuario no cumple el
 * requisito, se redirige a "/" sin mostrar ningún mensaje de error.
 *
 * @param element - Componente a renderizar si el acceso es permitido.
 * @param perm - Permiso Django requerido (opcional).
 * @param requiresStaff - Requiere is_staff=true (opcional).
 *
 * @example
 * <Route path="/reporte-caja" element={<ProtectedRoute perm="contabilidad.ver_reporte_caja" element={<ReporteCaja />} />} />
 */
function ProtectedRoute({ element, perm, requiresStaff }: ProtectedRouteProps) {
  const { user } = useAuthStore();
  const { tienePermiso } = usePermiso();

  if (!user) return <Navigate to="/" replace />;

  if (requiresStaff && !user.is_staff && !user.is_superuser) {
    return <Navigate to="/" replace />;
  }

  if (perm && !tienePermiso(perm)) {
    return <Navigate to="/" replace />;
  }

  return <>{element}</>;
}

export default ProtectedRoute;
