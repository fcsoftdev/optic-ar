import { z } from "zod";

/**
 * Esquema de validación Zod para el formulario de Turno.
 *
 * @remarks
 * - `fecha`: obligatoria.
 * - `hora_inicio`: obligatoria, formato HH:mm.
 * - `cliente`: ID numérico obligatorio.
 * - `motivo` y `observaciones`: opcionales.
 */
export const turnoSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  hora_inicio: z.string().min(1, "La hora de inicio es requerida"),
  cliente: z
    .number({ error: "Seleccione un cliente" })
    .int()
    .min(1, "Seleccione un cliente"),
  motivo: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  observaciones: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export type TurnoFormData = z.infer<typeof turnoSchema>;

/**
 * Esquema de validación Zod para el formulario de configuración del calendario.
 *
 * @remarks
 * - `hora_apertura` y `hora_cierre`: formato HH:mm, apertura < cierre.
 * - `duracion_turno_default`: entero entre 15 y 120 minutos.
 * - `dias_laborables`: al menos un día seleccionado.
 */
export const configCalendarioSchema = z
  .object({
    hora_apertura: z.string().min(1, "La hora de apertura es requerida"),
    hora_cierre: z.string().min(1, "La hora de cierre es requerida"),
    duracion_turno_default: z
      .number({ error: "Ingrese un número válido" })
      .int()
      .min(15, "Mínimo 15 minutos")
      .max(120, "Máximo 120 minutos"),
    dias_laborables: z
      .array(z.number().int().min(0).max(6))
      .min(1, "Seleccione al menos un día laborable"),
  })
  .refine((d) => d.hora_apertura < d.hora_cierre, {
    message: "La hora de apertura debe ser anterior a la hora de cierre",
    path: ["hora_cierre"],
  });

export type ConfigCalendarioFormData = z.infer<typeof configCalendarioSchema>;
