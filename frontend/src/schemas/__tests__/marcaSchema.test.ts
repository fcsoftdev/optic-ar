/**
 * Tests del schema de marca (marcaSchema).
 *
 * Niveles cubiertos:
 * - Unitario: reglas de longitud y trim del campo nombre
 *
 * Supuestos:
 * - El trim es aplicado por Zod antes de validar la longitud mínima,
 *   por lo que "  " (solo espacios) debe fallar la validación mínima.
 */

import { describe, it, expect } from "vitest";
import { marcaSchema } from "../../schemas/marcaSchema";

// Tests del schema que protege la creación/edición de marcas de producto.
describe("marcaSchema", () => {
  describe("cuando el nombre es válido", () => {
    it("acepta un nombre normal", () => {
      expect(marcaSchema.safeParse({ nombre: "Ray-Ban" }).success).toBe(true);
    });

    it("acepta nombre con exactamente 2 caracteres (límite inferior)", () => {
      expect(marcaSchema.safeParse({ nombre: "AB" }).success).toBe(true);
    });

    it("acepta nombre con exactamente 100 caracteres (límite superior)", () => {
      const result = marcaSchema.safeParse({ nombre: "A".repeat(100) });
      expect(result.success).toBe(true);
    });

    it("aplica trim: nombre con espacios laterales se normaliza", () => {
      const result = marcaSchema.safeParse({ nombre: "  Ray-Ban  " });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.nombre).toBe("Ray-Ban");
    });
  });

  describe("cuando el nombre es inválido", () => {
    it("falla con nombre de 1 caracter", () => {
      const result = marcaSchema.safeParse({ nombre: "A" });
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0].message).toMatch(/2 caracteres/);
    });

    it("falla con nombre vacío", () => {
      const result = marcaSchema.safeParse({ nombre: "" });
      expect(result.success).toBe(false);
    });

    it("falla con solo espacios en blanco (tras trim queda vacío)", () => {
      const result = marcaSchema.safeParse({ nombre: "   " });
      expect(result.success).toBe(false);
    });

    it("falla con nombre de 101 caracteres", () => {
      const result = marcaSchema.safeParse({ nombre: "A".repeat(101) });
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0].message).toMatch(/100 caracteres/);
    });
  });
});
