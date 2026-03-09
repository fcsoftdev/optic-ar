/**
 * @file ventaSchema.ts
 * @description Esquemas de validación Zod para el formulario de Ventas.
 */
import { z } from "zod";

/**
 * Esquema de validación para un ítem de detalle de venta.
 */
export const detalleVentaSchema = z.object({
  /** ID del detalle (undefined si es nuevo, número si ya existe) */
  id: z.number().optional().nullable(),
  producto: z
    .number({ error: "Seleccioná un producto" })
    .int()
    .positive("Seleccioná un producto"),
  cantidad: z
    .number({ error: "Ingresá la cantidad" })
    .int()
    .min(1, "Mínimo 1 unidad"),
  precio_venta: z
    .number({ error: "Ingresá el precio" })
    .multipleOf(0.01, "Máximo 2 decimales")
    .positive("El precio debe ser mayor a 0"),
});

/**
 * Esquema de validación para el formulario de una venta.
 */
export const ventaSchema = z.object({
  fecha: z.string().min(1, "La fecha es obligatoria"),
  cliente: z
    .number({ error: "Seleccioná un cliente" })
    .int()
    .positive("Seleccioná un cliente"),
  forma_pago: z.enum(["CO", "DE", "CR", "TR", "QR"] as const),
  entrego: z
    .number({ error: "Ingresá el monto entregado" })
    .multipleOf(0.01, "Máximo 2 decimales")
    .min(0, "No puede ser negativo"),
  detalles: z
    .array(detalleVentaSchema)
    .min(1, "Agregá al menos un producto a la venta"),
});

export type VentaFormValues = z.infer<typeof ventaSchema>;
export type DetalleVentaFormValues = z.infer<typeof detalleVentaSchema>;
