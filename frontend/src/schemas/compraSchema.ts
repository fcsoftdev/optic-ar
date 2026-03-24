import { z } from "zod";

/**
 * Esquema de validación Zod para un ítem de detalle de compra.
 */
const detalleCompraSchema = z.object({
  id: z.number().nullable().optional(),
  producto: z
    .number({ error: "Seleccione un producto" })
    .int()
    .min(1, "Seleccione un producto"),
  cantidad: z
    .number({ error: "Ingrese la cantidad" })
    .int()
    .min(1, "La cantidad debe ser mayor a 0"),
  precio_unitario: z
    .number({ error: "Ingrese el precio de costo" })
    .multipleOf(0.01)
    .positive("El precio de costo debe ser mayor a 0"),
  porcentaje_ganancia: z
    .number({ error: "Ingrese el porcentaje de ganancia" })
    .min(0, "El porcentaje no puede ser negativo")
    .multipleOf(0.01),
  precio_venta: z
    .number({ error: "Ingrese el precio de venta" })
    .min(0, "El precio de venta no puede ser negativo")
    .multipleOf(0.01),
});

/**
 * Esquema de validación Zod para el formulario de Compra.
 *
 * @remarks
 * - `proveedor`: obligatorio.
 * - `fecha`: requerida.
 * - `detalles`: al menos un ítem con producto, cantidad y precios.
 */
export const compraSchema = z.object({
  proveedor: z
    .number({ error: "Seleccione un proveedor" })
    .int()
    .min(1, "Seleccione un proveedor"),
  fecha: z.string().min(1, "La fecha es requerida"),
  detalles: z.array(detalleCompraSchema).min(1, "Agregue al menos un producto"),
});

export type CompraFormValues = z.infer<typeof compraSchema>;
export type DetalleCompraFormValues = z.infer<typeof detalleCompraSchema>;

/**
 * Esquema de validación Zod para el formulario de Proveedor.
 *
 * @remarks
 * Solo `nombre` es obligatorio. Los demás campos son opcionales.
 */
export const proveedorSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .trim(),
  direccion: z
    .string()
    .max(50, "La dirección no puede exceder 50 caracteres")
    .optional()
    .or(z.literal("")),
  telefono: z
    .string()
    .max(50, "El teléfono no puede exceder 50 caracteres")
    .optional()
    .or(z.literal("")),
  alias: z
    .string()
    .max(50, "El alias no puede exceder 50 caracteres")
    .optional()
    .or(z.literal("")),
});

export type ProveedorFormData = z.infer<typeof proveedorSchema>;

/**
 * Esquema de validación Zod para el formulario de Gasto.
 *
 * @remarks
 * - `fecha`: requerida.
 * - `descripcion`: entre 2 y 50 caracteres.
 * - `total`: número positivo con hasta 2 decimales.
 */
export const gastoSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  descripcion: z
    .string()
    .min(2, "La descripción debe tener al menos 2 caracteres")
    .max(50, "La descripción no puede exceder 50 caracteres")
    .trim(),
  total: z
    .number({ error: "Ingrese el total" })
    .multipleOf(0.01)
    .min(0, "El total no puede ser negativo"),
});

export type GastoFormData = z.infer<typeof gastoSchema>;
