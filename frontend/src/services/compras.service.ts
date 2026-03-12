import api from "./api";

/**
 * ============================================
 * INTERFACES Y TIPOS DE DATOS - COMPRAS
 * ============================================
 */

/** Proveedor de insumos/productos */
export interface Proveedor {
  id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  alias?: string;
}

/** Ítem de compra (lectura, anidado en Compra) */
export interface DetalleCompraRead {
  id: number;
  producto: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: string;
  precio_venta: string;
  subtotal: string;
}

/** Compra simplificada para listados paginados */
export interface CompraList {
  id: number;
  fecha: string;
  proveedor: number | null;
  proveedor_nombre: string;
  cantidad_items: number;
  total: string;
}

/** Compra completa con detalles anidados */
export interface Compra {
  id: number;
  fecha: string;
  proveedor: number | null;
  proveedor_nombre: string;
  total: string;
  detalles_productos: DetalleCompraRead[];
}

/** Datos de un ítem para crear o actualizar */
export interface DetalleCompraWrite {
  id?: number | null;
  producto: number;
  cantidad: number;
  precio_unitario: number;
  precio_venta: number;
}

/** Datos para crear o actualizar una compra */
export interface CompraCreateUpdate {
  proveedor?: number | null;
  fecha: string;
  detalles: DetalleCompraWrite[];
}

/** Gasto varios */
export interface Gasto {
  id: number;
  fecha: string;
  descripcion: string;
  total: string;
}

/** Datos para crear o actualizar un gasto */
export interface GastoCreateUpdate {
  fecha: string;
  descripcion: string;
  total: number;
}

/** Respuesta paginada genérica */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// =============================================
// FUNCIONES DE SERVICIO
// =============================================

const comprasService = {
  // ── Proveedores ──────────────────────────────────────────────────────────

  /**
   * Obtiene el listado paginado de proveedores.
   *
   * @param params - Filtros opcionales: search, page, page_size.
   * @returns Respuesta paginada con proveedores.
   */
  getProveedores: async (params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Proveedor>> => {
    const response = await api.get("/api/proveedores/", { params });
    return response.data;
  },

  /**
   * Obtiene un proveedor por ID.
   *
   * @param id - ID del proveedor.
   * @returns Proveedor completo.
   */
  getProveedor: async (id: number): Promise<Proveedor> => {
    const response = await api.get(`/api/proveedores/${id}/`);
    return response.data;
  },

  /**
   * Crea un nuevo proveedor.
   *
   * @param data - Datos del proveedor sin ID.
   * @returns Proveedor creado.
   */
  createProveedor: async (data: Omit<Proveedor, "id">): Promise<Proveedor> => {
    const response = await api.post("/api/proveedores/", data);
    return response.data;
  },

  /**
   * Actualiza un proveedor existente.
   *
   * @param id - ID del proveedor.
   * @param data - Nuevos datos del proveedor.
   * @returns Proveedor actualizado.
   */
  updateProveedor: async (
    id: number,
    data: Omit<Proveedor, "id">,
  ): Promise<Proveedor> => {
    const response = await api.put(`/api/proveedores/${id}/`, data);
    return response.data;
  },

  /**
   * Elimina un proveedor.
   *
   * @param id - ID del proveedor a eliminar.
   */
  deleteProveedor: async (id: number): Promise<void> => {
    await api.delete(`/api/proveedores/${id}/`);
  },

  // ── Compras ───────────────────────────────────────────────────────────────

  /**
   * Obtiene el listado paginado de compras.
   *
   * @param params - Filtros opcionales: search, page, page_size, proveedor.
   * @returns Respuesta paginada con compras.
   */
  getCompras: async (params?: {
    search?: string;
    page?: number;
    page_size?: number;
    proveedor?: number;
  }): Promise<PaginatedResponse<CompraList>> => {
    const response = await api.get("/api/compras/", { params });
    return response.data;
  },

  /**
   * Obtiene una compra completa con sus detalles.
   *
   * @param id - ID de la compra.
   * @returns Compra con detalles anidados.
   */
  getCompra: async (id: number): Promise<Compra> => {
    const response = await api.get(`/api/compras/${id}/`);
    return response.data;
  },

  /**
   * Crea una nueva compra con sus ítems anidados.
   *
   * @param data - Datos de la compra con detalles.
   * @returns Compra creada.
   */
  createCompra: async (data: CompraCreateUpdate): Promise<Compra> => {
    const response = await api.post("/api/compras/", data);
    return response.data;
  },

  /**
   * Actualiza una compra existente y sus ítems.
   *
   * @param id - ID de la compra.
   * @param data - Nuevos datos con detalles.
   * @returns Compra actualizada.
   */
  updateCompra: async (
    id: number,
    data: CompraCreateUpdate,
  ): Promise<Compra> => {
    const response = await api.put(`/api/compras/${id}/`, data);
    return response.data;
  },

  /**
   * Elimina una compra y revierte el stock vía señal Django.
   *
   * @param id - ID de la compra a eliminar.
   */
  deleteCompra: async (id: number): Promise<void> => {
    await api.delete(`/api/compras/${id}/`);
  },

  // ── Gastos ───────────────────────────────────────────────────────────────

  /**
   * Obtiene el listado paginado de gastos.
   *
   * @param params - Filtros opcionales: search, page, page_size.
   * @returns Respuesta paginada con gastos.
   */
  getGastos: async (params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Gasto>> => {
    const response = await api.get("/api/gastos/", { params });
    return response.data;
  },

  /**
   * Crea un nuevo gasto.
   *
   * @param data - Datos del gasto.
   * @returns Gasto creado.
   */
  createGasto: async (data: GastoCreateUpdate): Promise<Gasto> => {
    const response = await api.post("/api/gastos/", data);
    return response.data;
  },

  /**
   * Actualiza un gasto existente.
   *
   * @param id - ID del gasto.
   * @param data - Nuevos datos del gasto.
   * @returns Gasto actualizado.
   */
  updateGasto: async (id: number, data: GastoCreateUpdate): Promise<Gasto> => {
    const response = await api.put(`/api/gastos/${id}/`, data);
    return response.data;
  },

  /**
   * Elimina un gasto.
   *
   * @param id - ID del gasto a eliminar.
   */
  deleteGasto: async (id: number): Promise<void> => {
    await api.delete(`/api/gastos/${id}/`);
  },
};

export default comprasService;
