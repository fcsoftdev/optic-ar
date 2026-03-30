import { useQuery } from "@tanstack/react-query";
import reporteCajaService, {
  type ReporteCajaData,
  type ReporteCajaParams,
} from "../services/reporteCaja.service";

/**
 * Hook para obtener el Reporte de Caja.
 *
 * Consulta el endpoint `/api/reporte-caja/` con los filtros de fecha
 * opcionales y gestiona el estado de carga y error via React Query.
 *
 * @param params - Parámetros de filtro con `fecha_desde` y `fecha_hasta`.
 * @returns Objeto de React Query con `data`, `isLoading`, `isError`, `refetch`.
 *
 * @example
 * const { data, isLoading } = useReporteCaja({ fecha_desde: "2024-01-01", fecha_hasta: "2024-01-31" });
 */
export function useReporteCaja(
  params?: ReporteCajaParams,
): ReturnType<typeof useQuery<ReporteCajaData>> {
  return useQuery<ReporteCajaData>({
    queryKey: ["reporte-caja", params],
    queryFn: () => reporteCajaService.getReporte(params),
    // No refetch automático en background para reportes
    staleTime: 1000 * 60 * 5,
  });
}
