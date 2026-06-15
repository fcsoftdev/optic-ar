/**
 * Schemas Zod para el módulo de auditoría centralizada.
 *
 * Define los tipos y validaciones para los registros de RegistroAuditoria
 * y los filtros de búsqueda de la página de auditoría.
 */

import { z } from "zod";

// ── Schema de un registro de auditoría individual ────────────────────────────

export const registroAuditoriaSchema = z.object({
  /** ID interno del registro */
  id: z.number(),
  /** Fecha y hora ISO del evento */
  fecha: z.string(),
  /** Username del usuario que realizó la operación */
  usuario: z.string(),
  /** Clave de la acción realizada: crear | editar | eliminar */
  accion: z.enum(["crear", "editar", "eliminar"] as const),
  /** Texto legible de la acción */
  accion_display: z.string(),
  /** Clave del modelo auditado: compra | venta | producto | turno */
  modelo: z.string(),
  /** Texto legible del modelo */
  modelo_display: z.string(),
  /** ID del objeto afectado */
  objeto_id: z.number(),
  /** JSON con el snapshot (crear/eliminar) o diff (editar) de la operación */
  detalle: z.record(z.string(), z.unknown()),
});

export type RegistroAuditoria = z.infer<typeof registroAuditoriaSchema>;

// ── Schema de respuesta paginada ─────────────────────────────────────────────

export const auditoriaResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(registroAuditoriaSchema),
});

export type AuditoriaResponse = z.infer<typeof auditoriaResponseSchema>;

// ── Schema de filtros de búsqueda ────────────────────────────────────────────

export const auditoriaFiltrosSchema = z.object({
  /** Clave del modelo a filtrar: compra | venta | producto | turno */
  modelo: z.string().optional(),
  /** Clave de la acción a filtrar: crear | editar | eliminar */
  accion: z.enum(["crear", "editar", "eliminar", ""] as const).optional(),
  /** Username (búsqueda parcial) */
  usuario: z.string().optional(),
  /** Fecha desde en formato YYYY-MM-DD */
  fecha_desde: z.string().optional(),
  /** Fecha hasta en formato YYYY-MM-DD */
  fecha_hasta: z.string().optional(),
});

export type AuditoriaFiltros = z.infer<typeof auditoriaFiltrosSchema>;

// ── Schema de modelo auditado (para el selector de filtros) ──────────────────

export const modeloAuditadoSchema = z.object({
  /** Clave interna del modelo (ej: "compra") */
  key: z.string(),
  /** Etiqueta legible (ej: "Compra") */
  label: z.string(),
});

export type ModeloAuditado = z.infer<typeof modeloAuditadoSchema>;
