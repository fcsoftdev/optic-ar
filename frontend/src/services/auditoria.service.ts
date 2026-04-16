/**
 * Servicio HTTP para el módulo de auditoría centralizada.
 *
 * Realiza las llamadas a la API REST de auditoría.
 * Solo contiene llamadas HTTP — la lógica de cache y estado
 * se gestiona en useAuditoria.ts.
 */

import api from "./api";
import type { AuditoriaFiltros, AuditoriaResponse, ModeloAuditado } from "../schemas/auditoriaSchema";

/**
 * Obtiene el historial de auditoría paginado con filtros opcionales.
 *
 * @param params - Filtros y número de página
 * @returns Respuesta paginada con registros históricos
 *
 * @example
 * const data = await getAuditoria({ modelo: "producto", accion: "editar", page: 1 });
 */
export const getAuditoria = async (
  params?: AuditoriaFiltros & { page?: number }
): Promise<AuditoriaResponse> => {
  const response = await api.get<AuditoriaResponse>("/api/auditoria/", {
    params,
  });
  return response.data;
};

/**
 * Obtiene la lista de modelos auditados disponibles para usar como filtro.
 *
 * @returns Array de modelos con su clave y etiqueta legible
 *
 * @example
 * const modelos = await getModelosAuditados();
 * // [{ key: "producto", label: "Producto" }, ...]
 */
export const getModelosAuditados = async (): Promise<ModeloAuditado[]> => {
  const response = await api.get<ModeloAuditado[]>("/api/auditoria/modelos/");
  return response.data;
};
