import api from "./api";

/**
 * ============================================
 * INTERFACES Y TIPOS - REPORTE DE CAJA
 * ============================================
 */

/** Resumen financiero del período */
export interface ResumenCaja {
  total_ventas: string;
  cantidad_ventas: number;
  total_compras: string;
  cantidad_compras: number;
  total_gastos: string;
  cantidad_gastos: number;
  saldo_neto: string;
}

/** Desglose de ventas por forma de pago */
export interface DesglosePago {
  forma_pago: string;
  forma_pago_display: string;
  total: string;
  cantidad: number;
}

/** Ítem de venta en el reporte */
export interface VentaReporte {
  id: number;
  fecha: string;
  cliente_nombre: string;
  forma_pago: string;
  forma_pago_display: string;
  total_venta: string;
  saldo: string;
}

/** Ítem de compra en el reporte */
export interface CompraReporte {
  id: number;
  fecha: string;
  proveedor_nombre: string;
  total: string;
}

/** Ítem de gasto en el reporte */
export interface GastoReporte {
  id: number;
  fecha: string;
  descripcion: string;
  total: string;
}

/** Respuesta completa del endpoint reporte-caja */
export interface ReporteCajaData {
  fecha_desde: string | null;
  fecha_hasta: string | null;
  resumen: ResumenCaja;
  desglose_formas_pago: DesglosePago[];
  ventas: VentaReporte[];
  compras: CompraReporte[];
  gastos: GastoReporte[];
}

/** Parámetros de filtro para el reporte */
export interface ReporteCajaParams {
  fecha_desde?: string;
  fecha_hasta?: string;
}

// =============================================
// SERVICIO
// =============================================

const reporteCajaService = {
  /**
   * Obtiene el reporte de caja para un rango de fechas.
   *
   * @param params - Filtros opcionales `fecha_desde` y `fecha_hasta` (YYYY-MM-DD).
   * @returns Datos completos del reporte de caja.
   *
   * @example
   * const reporte = await reporteCajaService.getReporte({
   *   fecha_desde: "2024-01-01",
   *   fecha_hasta: "2024-01-31",
   * });
   */
  getReporte: async (params?: ReporteCajaParams): Promise<ReporteCajaData> => {
    const response = await api.get("/api/reporte-caja/", { params });
    return response.data;
  },
};

export default reporteCajaService;
