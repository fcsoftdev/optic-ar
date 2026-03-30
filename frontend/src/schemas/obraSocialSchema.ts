import { z } from "zod";

/**
 * Esquema de validación Zod para el formulario de Obra Social.
 *
 * @remarks
 * Campo obligatorio: `nombre`.
 * Campos opcionales: `direccion` y `telefono`.
 *
 * Reglas:
 * - `nombre`: requerido, mínimo 2 y máximo 100 caracteres.
 * - `direccion`: opcional, máximo 150 caracteres.
 * - `telefono`: opcional, máximo 20 caracteres.
 */
export const obraSocialSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  direccion: z
    .string()
    .max(150, "La dirección no puede exceder 150 caracteres")
    .optional()
    .or(z.literal("")),
  telefono: z
    .string()
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .optional()
    .or(z.literal("")),
});

export type ObraSocialFormData = z.infer<typeof obraSocialSchema>;
