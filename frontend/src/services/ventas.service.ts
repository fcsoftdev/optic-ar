import api from "./api";

/**
 * ============================================
 * INTERFACES Y TIPOS DE DATOS - VENTAS
 * ============================================
 */

/** Obra Social */
export interface ObraSocial {
  id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
}

/** Cliente/Paciente completo */
export interface Cliente {
  id: number;
  nombre_apellido: string;
  dni: string;
  fecha_nacimiento?: string;
  telefono?: string;
  mail?: string;
  direccion?: string;
  nro_afiliado?: string;
  obra_social?: number;
  obra_social_nombre?: string;
}

/** Cliente simplificado para listados */
export interface ClienteList {
  id: number;
  nombre_apellido: string;
  dni: string;
  telefono?: string;
  obra_social_nombre?: string;
  fecha_nacimiento?: string;
}

/** Respuesta paginada */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Datos para crear o actualizar un cliente */
export interface ClienteCreateUpdate {
  nombre_apellido: string;
  dni: string;
  fecha_nacimiento?: string;
  telefono?: string;
  mail?: string;
  direccion?: string;
  nro_afiliado?: string;
  obra_social?: number;
}

/** Graduación óptica asociada a una consulta */
export interface Graduacion {
  id?: number;
  od_lejos_esferico?: number | null;
  od_lejos_cilindrico?: number | null;
  od_lejos_eje?: number | null;
  oi_lejos_esferico?: number | null;
  oi_lejos_cilindrico?: number | null;
  oi_lejos_eje?: number | null;
  od_cerca_esferico?: number | null;
  od_cerca_cilindrico?: number | null;
  od_cerca_eje?: number | null;
  oi_cerca_esferico?: number | null;
  oi_cerca_cilindrico?: number | null;
  oi_cerca_eje?: number | null;
}

/** Consulta médica completa con graduación anidada */
export interface Consulta {
  id: number;
  cliente: number;
  cliente_nombre: string;
  fecha: string;
  motivo: string;
  diagnostico?: string;
  tratamiento?: string;
  graduacion?: Graduacion | null;
}

/** Consulta simplificada para listados */
export interface ConsultaList {
  id: number;
  cliente: number;
  cliente_nombre: string;
  fecha: string;
  motivo: string;
  diagnostico?: string;
  tiene_graduacion: boolean;
  graduacion?: Graduacion | null;
}

/** Datos para crear o actualizar una consulta */
export interface ConsultaCreateUpdate {
  cliente: number;
  fecha: string;
  motivo: string;
  diagnostico?: string;
  tratamiento?: string;
  graduacion?: Graduacion | null;
}

// ============================================================
// TIPOS DE VENTAS
// ============================================================

/** Formas de pago disponibles */
export type FormaPago = "CO" | "DE" | "CR" | "TR" | "QR";

/** Mapa de etiquetas para las formas de pago */
export const FORMA_PAGO_LABELS: Record<FormaPago, string> = {
  CO: "Contado",
  DE: "Tarjeta de Débito",
  CR: "Tarjeta de Crédito",
  TR: "Transferencia",
  QR: "QR",
};

/** Ítem de detalle de venta (lectura) */
export interface DetalleVenta {
  id: number;
  producto: number | null;
  producto_nombre: string;
  cantidad: number;
  precio_venta: string;
  subtotal_item: string;
}

/** Venta completa con detalles anidados */
export interface Venta {
  id: number;
  fecha: string;
  cliente: number;
  cliente_nombre: string;
  forma_pago: FormaPago;
  forma_pago_display: string;
  entrego: string;
  total_venta: string;
  saldo: string;
  detalles_ventas: DetalleVenta[];
}

/** Venta simplificada para listados */
export interface VentaList {
  id: number;
  fecha: string;
  cliente: number;
  cliente_nombre: string;
  forma_pago: FormaPago;
  forma_pago_display: string;
  entrego: string;
  total_venta: string;
  saldo: string;
}

/** Ítem de detalle para crear/actualizar (write) */
export interface DetalleVentaWrite {
  id?: number | null;
  producto: number;
  cantidad: number;
  precio_venta: number;
}

/** Datos para crear o actualizar una venta */
export interface VentaCreateUpdate {
  fecha: string;
  cliente: number;
  forma_pago: FormaPago;
  entrego: number;
  detalles: DetalleVentaWrite[];
}

/**
 * ============================================
 * SERVICIO DE VENTAS
 * ============================================
 */
const ventasService = {
  // ==================== OBRAS SOCIALES ====================

  /**
   * Obtener lista completa de obras sociales (sin paginar, para selectores)
   */
  getObrasSociales: async (): Promise<ObraSocial[]> => {
    const response = await api.get("/ventas/api/obras-sociales/", {
      params: { page_size: 9999 },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener obras sociales paginadas con filtros (para el ABM)
   *
   * @param params - Parámetros opcionales de página y búsqueda.
   * @returns Respuesta paginada de obras sociales.
   */
  getObrasSocialesPaginadas: async (params?: {
    page?: number;
    search?: string;
    page_size?: number;
  }): Promise<PaginatedResponse<ObraSocial>> => {
    const response = await api.get("/ventas/api/obras-sociales/", { params });
    return response.data;
  },

  /**
   * Crear una nueva obra social
   */
  createObraSocial: async (
    data: Omit<ObraSocial, "id">,
  ): Promise<ObraSocial> => {
    const response = await api.post("/ventas/api/obras-sociales/", data);
    return response.data;
  },

  /**
   * Actualizar una obra social
   */
  updateObraSocial: async (
    id: number,
    data: Partial<ObraSocial>,
  ): Promise<ObraSocial> => {
    const response = await api.put(`/ventas/api/obras-sociales/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una obra social
   */
  deleteObraSocial: async (id: number): Promise<void> => {
    await api.delete(`/ventas/api/obras-sociales/${id}/`);
  },

  // ==================== CLIENTES ====================

  /**
   * Obtener lista de clientes con filtros y paginación
   */
  getClientes: async (params?: {
    page?: number;
    search?: string;
    obra_social?: number;
    /** Tamaño de página. Usar un valor grande (ej: 9999) para obtener todos los registros en selectores. */
    page_size?: number;
  }): Promise<PaginatedResponse<ClienteList>> => {
    const response = await api.get("/ventas/api/clientes/", { params });
    return response.data;
  },

  /**
   * Obtener un cliente específico por ID
   */
  getCliente: async (id: number): Promise<Cliente> => {
    const response = await api.get(`/ventas/api/clientes/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo cliente
   */
  createCliente: async (data: ClienteCreateUpdate): Promise<Cliente> => {
    const response = await api.post("/ventas/api/clientes/", data);
    return response.data;
  },

  /**
   * Actualizar un cliente existente
   */
  updateCliente: async (
    id: number,
    data: ClienteCreateUpdate,
  ): Promise<Cliente> => {
    const response = await api.put(`/ventas/api/clientes/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un cliente
   */
  deleteCliente: async (id: number): Promise<void> => {
    await api.delete(`/ventas/api/clientes/${id}/`);
  },

  // ==================== CONSULTAS ====================

  /**
   * Obtener listado paginado de consultas con filtros opcionales
   */
  getConsultas: async (params?: {
    page?: number;
    search?: string;
    cliente?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    /** Tamaño de página. Usar un valor grande para obtener todos los registros. */
    page_size?: number;
  }): Promise<PaginatedResponse<ConsultaList>> => {
    const response = await api.get("/ventas/api/consultas/", { params });
    return response.data;
  },

  /**
   * Obtener el detalle completo de una consulta por ID
   */
  getConsulta: async (id: number): Promise<Consulta> => {
    const response = await api.get(`/ventas/api/consultas/${id}/`);
    return response.data;
  },

  /**
   * Crear una nueva consulta con graduación opcional
   */
  createConsulta: async (data: ConsultaCreateUpdate): Promise<Consulta> => {
    const response = await api.post("/ventas/api/consultas/", data);
    return response.data;
  },

  /**
   * Actualizar una consulta existente
   */
  updateConsulta: async (
    id: number,
    data: ConsultaCreateUpdate,
  ): Promise<Consulta> => {
    const response = await api.put(`/ventas/api/consultas/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una consulta
   */
  deleteConsulta: async (id: number): Promise<void> => {
    await api.delete(`/ventas/api/consultas/${id}/`);
  },

  // ==================== VENTAS ====================

  /**
   * Obtener listado paginado de ventas con filtros opcionales.
   */
  getVentas: async (params?: {
    page?: number;
    search?: string;
    cliente?: number;
    forma_pago?: string;
    page_size?: number;
  }): Promise<PaginatedResponse<VentaList>> => {
    const response = await api.get("/ventas/api/ventas/", { params });
    return response.data;
  },

  /**
   * Obtener el detalle completo de una venta (con ítems anidados).
   */
  getVenta: async (id: number): Promise<Venta> => {
    const response = await api.get(`/ventas/api/ventas/${id}/`);
    return response.data;
  },

  /**
   * Crear una nueva venta con sus ítems de detalle.
   */
  createVenta: async (data: VentaCreateUpdate): Promise<Venta> => {
    const response = await api.post("/ventas/api/ventas/", data);
    return response.data;
  },

  /**
   * Actualizar una venta existente y sincronizar sus ítems.
   */
  updateVenta: async (id: number, data: VentaCreateUpdate): Promise<Venta> => {
    const response = await api.put(`/ventas/api/ventas/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una venta. El backend restaura el stock automáticamente
   * mediante la señal ``devolver_stock_al_eliminar_venta``.
   */
  deleteVenta: async (id: number): Promise<void> => {
    await api.delete(`/ventas/api/ventas/${id}/`);
  },
};

export default ventasService;
