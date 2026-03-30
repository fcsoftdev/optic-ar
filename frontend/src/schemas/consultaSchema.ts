import { z } from "zod";

/**
 * Esquema de validación Zod para los campos de graduación óptica.
 *
 * @remarks
 * Todos los campos son opcionales. Los esféricos y cilíndricos aceptan
 * valores decimales (ej: -2.50, +1.25). El eje acepta enteros de 0 a 180.
 */
const graduacionSchema = z.object({
  od_lejos_esferico: z.coerce
    .number()
    .multipleOf(0.25, "Debe ser múltiplo de 0.25")
    .optional()
    .nullable(),
  od_lejos_cilindrico: z.coerce
    .number()
    .multipleOf(0.25, "Debe ser múltiplo de 0.25")
    .optional()
    .nullable(),
  od_lejos_eje: z.coerce
    .number()
    .int()
    .min(0)
    .max(180, "El eje debe estar entre 0 y 180")
    .optional()
    .nullable(),

  oi_lejos_esferico: z.coerce
    .number()
    .multipleOf(0.25, "Debe ser múltiplo de 0.25")
    .optional()
    .nullable(),
  oi_lejos_cilindrico: z.coerce
    .number()
    .multipleOf(0.25, "Debe ser múltiplo de 0.25")
    .optional()
    .nullable(),
  oi_lejos_eje: z.coerce
    .number()
    .int()
    .min(0)
    .max(180, "El eje debe estar entre 0 y 180")
    .optional()
    .nullable(),

  od_cerca_esferico: z.coerce
    .number()
    .multipleOf(0.25, "Debe ser múltiplo de 0.25")
    .optional()
    .nullable(),
  od_cerca_cilindrico: z.coerce
    .number()
    .multipleOf(0.25, "Debe ser múltiplo de 0.25")
    .optional()
    .nullable(),
  od_cerca_eje: z.coerce
    .number()
    .int()
    .min(0)
    .max(180, "El eje debe estar entre 0 y 180")
    .optional()
    .nullable(),

  oi_cerca_esferico: z.coerce
    .number()
    .multipleOf(0.25, "Debe ser múltiplo de 0.25")
    .optional()
    .nullable(),
  oi_cerca_cilindrico: z.coerce
    .number()
    .multipleOf(0.25, "Debe ser múltiplo de 0.25")
    .optional()
    .nullable(),
  oi_cerca_eje: z.coerce
    .number()
    .int()
    .min(0)
    .max(180, "El eje debe estar entre 0 y 180")
    .optional()
    .nullable(),
});

/**
 * Esquema de validación Zod para el formulario de Consulta médica.
 *
 * @remarks
 * Campos obligatorios: `cliente`, `fecha`, `motivo`.
 * Campos opcionales: `diagnostico`, `tratamiento`, `graduacion`.
 *
 * Reglas:
 * - `cliente`: ID numérico del paciente (requerido).
 * - `fecha`: fecha en formato ISO (YYYY-MM-DD), default hoy.
 * - `motivo`: mínimo 3 caracteres.
 * - `graduacion`: objeto con los 12 campos ópticos, todos opcionales.
 *   Si se incluye, al menos un campo debe estar completo.
 */
export const consultaSchema = z.object({
  cliente: z.number().int().positive("Debe seleccionar un paciente"),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  motivo: z
    .string()
    .min(3, "El motivo debe tener al menos 3 caracteres")
    .max(500, "El motivo no puede exceder 500 caracteres"),
  diagnostico: z
    .string()
    .max(500, "El diagnóstico no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  tratamiento: z
    .string()
    .max(500, "El tratamiento no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  graduacion: graduacionSchema.optional().nullable(),
});

export type ConsultaFormData = z.infer<typeof consultaSchema>;
export type GraduacionFormData = z.infer<typeof graduacionSchema>;
