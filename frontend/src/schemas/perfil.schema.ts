/**
 * Esquema de validación Zod para el formulario de perfil de usuario.
 */

import { z } from "zod";

export const perfilSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().min(1, "El apellido es requerido"),
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Ingresá un email válido"),
});

export type PerfilFormData = z.infer<typeof perfilSchema>;
