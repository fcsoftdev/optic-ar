/**
 * Hooks de React Query para el módulo de auditoría centralizada.
 *
 * Gestiona el cache, el estado de carga y los filtros de la página de auditoría.
 */

import { useQuery } from "@tanstack/react-query";
import {
  getAuditoria,
  getModelosAuditados,
} from "../services/auditoria.service";
import type { AuditoriaFiltros } from "../schemas/auditoriaSchema";

/**
 * Hook para obtener el historial de auditoría paginado.
 *
 * @param filtros - Filtros activos (modelo, accion, usuario, fechas)
 * @param page - Página actual (base 1)
 * @returns Objeto con data, isLoading, isError y error
 *
 * @example
 * const { data, isLoading } = useAuditoria({ modelo: "producto", accion: "editar" }, 1);
 * const registros = data?.results ?? [];
 */
export const useAuditoria = (filtros: AuditoriaFiltros, page: number = 1) => {
  // Limpiar valores vacíos antes de enviar al servidor
  const params = Object.fromEntries(
    Object.entries({ ...filtros, page }).filter(
      ([, v]) => v !== "" && v !== undefined && v !== null
    )
  );

  return useQuery({
    queryKey: ["auditoria", params],
    queryFn: () => getAuditoria(params as AuditoriaFiltros & { page: number }),
    placeholderData: (prev) => prev, // Mantiene datos anteriores mientras carga nueva página
  });
};

/**
 * Hook para obtener la lista de modelos auditados disponibles.
 *
 * Usado para poblar el selector de filtro de modelo.
 * Los datos se cachean indefinidamente ya que la lista es estática.
 *
 * @returns Array de modelos { key, label }
 *
 * @example
 * const { data: modelos = [] } = useModelosAuditados();
 */
export const useModelosAuditados = () => {
  return useQuery({
    queryKey: ["auditoria-modelos"],
    queryFn: getModelosAuditados,
    staleTime: Infinity, // Los grupos de modelos son estáticos — no cambian en runtime
  });
};
