import { z } from "zod";

/**
 * Esquema de validación Zod para el formulario de Cliente/Paciente.
 *
 * @remarks
 * Campos obligatorios: `nombre_apellido` y `dni`.
 * Transforma los campos opcionales vacíos a `undefined` antes de enviar al servidor.
 *
 * Reglas:
 * - `nombre_apellido`: requerido, máximo 150 caracteres.
 * - `dni`: requerido, exactamente 8 dígitos numéricos.
 * - `mail`: formato de email válido si se proporciona.
 * - `telefono`, `direccion`, `nro_afiliado`: opcionales con límite de caracteres.
 * - `obra_social`: ID numérico de la obra social, opcional.
 */
export const clienteSchema = z
  .object({
    nombre_apellido: z
      .string()
      .min(1, "El nombre es requerido")
      .max(150, "El nombre no puede exceder 150 caracteres"),
    dni: z
      .string()
      .min(1, "El DNI es requerido")
      .length(8, "El DNI debe tener 8 dígitos")
      .regex(/^\d+$/, "El DNI debe contener solo números"),
    fecha_nacimiento: z.string().optional().nullable(),
    telefono: z
      .string()
      .max(16, "El teléfono no puede exceder 16 caracteres")
      .optional()
      .nullable(),
    mail: z
      .string()
      .email("El email no tiene un formato válido")
      .optional()
      .or(z.literal("")),
    direccion: z
      .string()
      .max(50, "La dirección no puede exceder 50 caracteres")
      .optional()
      .nullable(),
    nro_afiliado: z
      .string()
      .max(50, "El número de afiliado no puede exceder 50 caracteres")
      .optional()
      .nullable(),
    obra_social: z.number().optional().nullable(),
  })
  .transform((data) => {
    return {
      ...data,
      fecha_nacimiento: data.fecha_nacimiento || undefined,
      telefono: data.telefono || undefined,
      mail: data.mail || undefined,
      direccion: data.direccion || undefined,
      nro_afiliado: data.nro_afiliado || undefined,
      obra_social: data.obra_social || undefined,
    };
  });

export type ClienteFormData = z.infer<typeof clienteSchema>;

/**
 * Schema de validación para Obra Social
 */
export const obraSocialSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  direccion: z
    .string()
    .max(100, "La dirección no puede exceder 100 caracteres")
    .optional()
    .nullable(),
  telefono: z
    .string()
    .max(16, "El teléfono no puede exceder 16 caracteres")
    .optional()
    .nullable(),
});

export type ObraSocialFormData = z.infer<typeof obraSocialSchema>;
