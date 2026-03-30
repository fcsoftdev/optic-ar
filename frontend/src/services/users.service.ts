/**
 * Servicio HTTP para el ABM de Usuarios, Grupos y Permisos.
 */

import api from "./api";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface Permiso {
  id: number;
  name: string;
  codename: string;
  app_label: string;
  model: string;
}

export interface Grupo {
  id: number;
  name: string;
  permissions: Permiso[];
  user_count: number;
}

export interface GrupoPayload {
  name: string;
  permission_ids: number[];
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  groups: string[]; // listado simplificado (solo nombres)
  date_joined: string;
}

export interface UsuarioDetalle {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  groups: Grupo[]; // detalle completo con permisos
  user_permissions: Permiso[];
}

export interface UsuarioPayload {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  is_active?: boolean;
  is_staff?: boolean;
  group_ids?: number[];
  permission_ids?: number[];
}

// ── Paginación ────────────────────────────────────────────────────────────────

export interface Paginado<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Usuarios ──────────────────────────────────────────────────────────────────

/**
 * Lista todos los usuarios con paginación y búsqueda opcional.
 * @param search - Término de búsqueda (username, email, nombre).
 */
export const getUsuarios = async (search = ""): Promise<Paginado<Usuario>> => {
  const params = search ? { search, page_size: 100 } : { page_size: 100 };
  const response = await api.get<Paginado<Usuario>>("/api/usuarios/", {
    params,
  });
  return response.data;
};

/**
 * Obtiene el detalle completo de un usuario (con grupos y permisos).
 * @param id - ID del usuario.
 */
export const getUsuario = async (id: number): Promise<UsuarioDetalle> => {
  const response = await api.get<UsuarioDetalle>(`/api/usuarios/${id}/`);
  return response.data;
};

/**
 * Crea un nuevo usuario.
 * @param payload - Datos del usuario a crear.
 */
export const createUsuario = async (
  payload: UsuarioPayload,
): Promise<UsuarioDetalle> => {
  const response = await api.post<UsuarioDetalle>("/api/usuarios/", payload);
  return response.data;
};

/**
 * Actualiza un usuario (parcialmente).
 * @param id - ID del usuario.
 * @param payload - Campos a actualizar.
 */
export const updateUsuario = async (
  id: number,
  payload: Partial<UsuarioPayload>,
): Promise<UsuarioDetalle> => {
  const response = await api.patch<UsuarioDetalle>(
    `/api/usuarios/${id}/`,
    payload,
  );
  return response.data;
};

/**
 * Elimina un usuario.
 * @param id - ID del usuario.
 */
export const deleteUsuario = async (id: number): Promise<void> => {
  await api.delete(`/api/usuarios/${id}/`);
};

// ── Grupos ────────────────────────────────────────────────────────────────────

/**
 * Lista todos los grupos con sus permisos.
 */
export const getGrupos = async (): Promise<Paginado<Grupo>> => {
  const response = await api.get<Paginado<Grupo>>("/api/grupos/", {
    params: { page_size: 100 },
  });
  return response.data;
};

/**
 * Obtiene el detalle de un grupo.
 * @param id - ID del grupo.
 */
export const getGrupo = async (id: number): Promise<Grupo> => {
  const response = await api.get<Grupo>(`/api/grupos/${id}/`);
  return response.data;
};

/**
 * Crea un nuevo grupo con permisos.
 * @param payload - Nombre e IDs de permisos.
 */
export const createGrupo = async (payload: GrupoPayload): Promise<Grupo> => {
  const response = await api.post<Grupo>("/api/grupos/", payload);
  return response.data;
};

/**
 * Actualiza un grupo.
 * @param id - ID del grupo.
 * @param payload - Datos a actualizar.
 */
export const updateGrupo = async (
  id: number,
  payload: Partial<GrupoPayload>,
): Promise<Grupo> => {
  const response = await api.patch<Grupo>(`/api/grupos/${id}/`, payload);
  return response.data;
};

/**
 * Elimina un grupo.
 * @param id - ID del grupo.
 */
export const deleteGrupo = async (id: number): Promise<void> => {
  await api.delete(`/api/grupos/${id}/`);
};

// ── Permisos ──────────────────────────────────────────────────────────────────

/**
 * Lista todos los permisos disponibles del dominio del sistema.
 */
export const getPermisos = async (): Promise<Paginado<Permiso>> => {
  const response = await api.get<Paginado<Permiso>>("/api/permisos/", {
    params: { page_size: 500 },
  });
  return response.data;
};
