/**
 * Servicio HTTP para el perfil del usuario autenticado.
 *
 * Utiliza `api` (instancia con interceptores JWT) ya que el endpoint
 * requiere autenticación.
 */

import api from "./api";
import type { AuthUser } from "../stores/useAuthStore";
import type { PerfilFormData } from "../schemas/perfil.schema";

/** Respuesta del endpoint PATCH /api/perfil/ */
export interface PerfilUpdateResponse {
  perfil: Pick<
    AuthUser,
    "id" | "username" | "email" | "first_name" | "last_name"
  >;
  user: AuthUser;
}

/**
 * Obtiene el perfil del usuario autenticado.
 *
 * @returns Datos básicos del perfil (id, username, email, first_name, last_name).
 */
export const getPerfil = async (): Promise<PerfilUpdateResponse["perfil"]> => {
  const response = await api.get("/api/perfil/");
  return response.data;
};

/**
 * Actualiza parcialmente el perfil del usuario autenticado.
 *
 * @param datos - Campos a actualizar: first_name, last_name, email.
 * @returns Perfil actualizado y payload completo del usuario para el store.
 */
export const updatePerfil = async (
  datos: PerfilFormData,
): Promise<PerfilUpdateResponse> => {
  const response = await api.patch<PerfilUpdateResponse>("/api/perfil/", datos);
  return response.data;
};
