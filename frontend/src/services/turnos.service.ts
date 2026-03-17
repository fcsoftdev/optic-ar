import api from "./api";

/**
 * ============================================
 * INTERFACES Y TIPOS DE DATOS - TURNOS
 * ============================================
 */

/** Turno completo devuelto por la API */
export interface Turno {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  cliente: number;
  cliente_nombre: string;
  motivo: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

/** Datos para crear o actualizar un turno */
export interface TurnoCreateUpdate {
  fecha: string;
  hora_inicio: string;
  hora_fin?: string | null;
  cliente: number;
  motivo?: string | null;
  observaciones?: string | null;
}

/** Configuración del calendario de turnos */
export interface ConfiguracionCalendario {
  id: number;
  nombre: string;
  /** Hora de apertura en formato HH:MM:SS */
  hora_apertura: string;
  /** Hora de cierre en formato HH:MM:SS */
  hora_cierre: string;
  /** Duración por defecto de cada turno en minutos */
  duracion_turno_default: number;
  /** Días laborables: 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb */
  dias_laborables: number[];
  activa: boolean;
}

/** Campos editables de la configuración del calendario */
export interface ConfiguracionCalendarioUpdate {
  hora_apertura?: string;
  hora_cierre?: string;
  duracion_turno_default?: number;
  dias_laborables?: number[];
}

// =============================================
// FUNCIONES DE SERVICIO
// =============================================

const turnosService = {
  /**
   * Obtiene la lista de turnos en un rango de fechas.
   * La paginación está deshabilitada en el backend (devuelve array directo).
   *
   * @param params - Filtros: start (fecha >=), end (fecha <=), cliente, search.
   * @returns Array de turnos.
   */
  getTurnos: async (params?: {
    start?: string;
    end?: string;
    cliente?: number;
    search?: string;
  }): Promise<Turno[]> => {
    const response = await api.get("/api/turnos/", { params });
    return response.data;
  },

  /**
   * Obtiene un turno por ID.
   *
   * @param id - ID del turno.
   * @returns Turno completo.
   */
  getTurno: async (id: number): Promise<Turno> => {
    const response = await api.get(`/api/turnos/${id}/`);
    return response.data;
  },

  /**
   * Crea un nuevo turno.
   *
   * @param data - Datos del turno.
   * @returns Turno creado.
   */
  createTurno: async (data: TurnoCreateUpdate): Promise<Turno> => {
    const response = await api.post("/api/turnos/", data);
    return response.data;
  },

  /**
   * Actualiza un turno existente (PATCH parcial).
   *
   * @param id - ID del turno.
   * @param data - Campos a actualizar.
   * @returns Turno actualizado.
   */
  updateTurno: async (
    id: number,
    data: Partial<TurnoCreateUpdate>,
  ): Promise<Turno> => {
    const response = await api.patch(`/api/turnos/${id}/`, data);
    return response.data;
  },

  /**
   * Elimina un turno.
   *
   * @param id - ID del turno a eliminar.
   */
  deleteTurno: async (id: number): Promise<void> => {
    await api.delete(`/api/turnos/${id}/`);
  },

  /**
   * Obtiene la configuración activa del calendario.
   *
   * @returns Configuración activa.
   */
  getConfigCalendario: async (): Promise<ConfiguracionCalendario> => {
    const response = await api.get("/api/configuracion-calendario/activa/");
    return response.data;
  },

  /**
   * Actualiza la configuración activa del calendario (PATCH parcial).
   *
   * @param data - Campos a actualizar.
   * @returns Configuración actualizada.
   */
  updateConfigCalendario: async (
    data: ConfiguracionCalendarioUpdate,
  ): Promise<ConfiguracionCalendario> => {
    const response = await api.patch(
      "/api/configuracion-calendario/activa/",
      data,
    );
    return response.data;
  },
};

export default turnosService;
