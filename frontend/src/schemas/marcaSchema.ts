import { z } from "zod";

/**
 * Schema de validación para Marca usando Zod
 *
 * Validaciones:
 * - nombre: String obligatorio, mínimo 2 caracteres, máximo 100
 */
export const marcaSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
});

/**
 * Tipo inferido del schema para uso en TypeScript
 */
export type MarcaFormData = z.infer<typeof marcaSchema>;
