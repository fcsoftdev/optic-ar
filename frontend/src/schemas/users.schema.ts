/**
 * Esquemas de validación Zod para el ABM de Usuarios y Grupos.
 */

import { z } from "zod";

// ── Usuario ───────────────────────────────────────────────────────────────────

export const usuarioSchema = z.object({
  username: z.string().min(1, "El usuario es requerido").max(150),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  first_name: z.string().max(150).optional(),
  last_name: z.string().max(150).optional(),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean(),
  is_staff: z.boolean(),
  group_ids: z.array(z.number()),
  permission_ids: z.array(z.number()),
});

export type UsuarioFormData = z.infer<typeof usuarioSchema>;

// ── Grupo ─────────────────────────────────────────────────────────────────────

export const grupoSchema = z.object({
  name: z.string().min(1, "El nombre del grupo es requerido").max(150),
  permission_ids: z.array(z.number()),
});

export type GrupoFormData = z.infer<typeof grupoSchema>;
