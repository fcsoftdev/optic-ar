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

/**
 * ============================================
 * SERVICIO DE VENTAS
 * ============================================
 */
const ventasService = {
  // ==================== OBRAS SOCIALES ====================

  /**
   * Obtener lista completa de obras sociales
   */
  getObrasSociales: async (): Promise<ObraSocial[]> => {
    const response = await api.get("/ventas/api/obras-sociales/");
    return response.data.results || response.data;
  },

  /**
   * Crear una nueva obra social
   */
  createObraSocial: async (nombre: string): Promise<ObraSocial> => {
    const response = await api.post("/ventas/api/obras-sociales/", { nombre });
    return response.data;
  },

  /**
   * Actualizar una obra social
   */
  updateObraSocial: async (
    id: number,
    data: Partial<ObraSocial>
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
    data: ClienteCreateUpdate
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
};

export default ventasService;
