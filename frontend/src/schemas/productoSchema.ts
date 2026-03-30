import { z } from "zod";

/**
 * Schema de validación para Producto usando Zod
 *
 * Validaciones:
 * - Campos obligatorios: codigo, nombre, marca, categoria, stock, precio_venta
 * - Campos opcionales: descripcion, sub_categoria, precio_costo
 * - Precios con máximo 2 decimales
 * - Stock debe ser entero no negativo
 */
export const productoSchema = z
  .object({
    codigo: z
      .string()
      .min(1, "El código es requerido")
      .max(50, "El código no puede exceder 50 caracteres"),
    nombre: z
      .string()
      .min(1, "El nombre es requerido")
      .max(200, "El nombre no puede exceder 200 caracteres"),
    descripcion: z.string().optional(),
    marca: z
      .number({
        message: "Debe seleccionar una marca válida",
      })
      .min(1, "La marca es requerida"),
    categoria: z
      .number({
        message: "Debe seleccionar una categoría válida",
      })
      .min(1, "La categoría es requerida"),
    sub_categoria: z.number().optional().nullable(),
    stock: z
      .number({
        message: "El stock debe ser un número",
      })
      .int("El stock debe ser un número entero")
      .min(0, "El stock no puede ser negativo"),
    precio_costo: z
      .union([z.number(), z.string(), z.null()])
      .optional()
      .nullable(),
    porcentaje_ganancia: z
      .union([z.number(), z.string(), z.null()])
      .optional()
      .nullable(),
    precio_venta: z.union([z.number(), z.string(), z.null()]).optional(),
  })
  .transform((data) => {
    // Transformar precio_costo
    const precio_costo =
      data.precio_costo === null ||
      data.precio_costo === undefined ||
      data.precio_costo === ""
        ? null
        : typeof data.precio_costo === "string"
        ? parseFloat(data.precio_costo)
        : data.precio_costo;

    // Transformar porcentaje_ganancia
    const porcentaje_ganancia =
      data.porcentaje_ganancia === null ||
      data.porcentaje_ganancia === undefined ||
      data.porcentaje_ganancia === ""
        ? null
        : typeof data.porcentaje_ganancia === "string"
        ? parseFloat(data.porcentaje_ganancia)
        : data.porcentaje_ganancia;

    // Transformar precio_venta
    const precio_venta =
      data.precio_venta === "" ||
      data.precio_venta === undefined ||
      data.precio_venta === null
        ? 0
        : typeof data.precio_venta === "string"
        ? parseFloat(data.precio_venta) || 0
        : data.precio_venta;

    return {
      ...data,
      precio_costo,
      porcentaje_ganancia,
      precio_venta,
    };
  })
  .refine(
    (data) => {
      if (data.precio_costo !== null && !isNaN(data.precio_costo)) {
        return data.precio_costo >= 0;
      }
      return true;
    },
    {
      message: "El precio de costo no puede ser negativo",
      path: ["precio_costo"],
    }
  )
  .refine(
    (data) => {
      if (
        data.porcentaje_ganancia !== null &&
        !isNaN(data.porcentaje_ganancia)
      ) {
        return (
          data.porcentaje_ganancia >= 0 && data.porcentaje_ganancia <= 999.99
        );
      }
      return true;
    },
    {
      message: "El porcentaje de ganancia debe estar entre 0 y 999.99",
      path: ["porcentaje_ganancia"],
    }
  );

export type ProductoFormData = {
  codigo: string;
  nombre: string;
  descripcion?: string;
  marca: number;
  categoria: number;
  sub_categoria?: number | null;
  stock: number;
  precio_costo?: number | null;
  porcentaje_ganancia?: number | null;
  precio_venta: number;
};
