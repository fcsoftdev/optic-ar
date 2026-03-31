/**
 * Tests del schema de producto (productoSchema).
 *
 * Niveles cubiertos:
 * - Unitario: reglas de validación, transformaciones y refinements
 *
 * Supuestos:
 * - precio_venta es calculado (readOnly), por lo que puede ser string/null/undefined.
 * - porcentaje_ganancia puede llegar como string del input HTML y se convierte a number.
 * - El schema usa .transform() para normalizar tipos, por eso se testean los valores
 *   transformados en el output, no solo el éxito/fallo del parse.
 */

import { describe, it, expect } from "vitest";
import { productoSchema } from "../../schemas/productoSchema";

// Base de datos válida reutilizable en múltiples tests
const validBase = {
  codigo: "RB001",
  nombre: "Aviator Classic",
  marca: 1,
  categoria: 1,
  stock: 5,
};

// Los campos de precio son transformados, se validan por separado.
describe("productoSchema", () => {
  describe("cuando los datos mínimos son válidos", () => {
    it("parsea correctamente el happy path", () => {
      const result = productoSchema.safeParse(validBase);
      expect(result.success).toBe(true);
    });

    it("transforma precio_venta vacío a 0", () => {
      const result = productoSchema.safeParse({
        ...validBase,
        precio_venta: "",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.precio_venta).toBe(0);
    });

    it("transforma precio_venta string a number", () => {
      const result = productoSchema.safeParse({
        ...validBase,
        precio_venta: "22500.50",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.precio_venta).toBe(22500.5);
    });

    it("transforma porcentaje_ganancia string a number", () => {
      const result = productoSchema.safeParse({
        ...validBase,
        porcentaje_ganancia: "50",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.porcentaje_ganancia).toBe(50);
    });

    it("transforma precio_costo null a null", () => {
      const result = productoSchema.safeParse({
        ...validBase,
        precio_costo: null,
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.precio_costo).toBeNull();
    });
  });

  describe("validación del campo codigo", () => {
    it("falla cuando codigo está vacío", () => {
      const result = productoSchema.safeParse({ ...validBase, codigo: "" });
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0].path).toContain("codigo");
    });

    it("falla cuando codigo supera 50 caracteres", () => {
      const result = productoSchema.safeParse({
        ...validBase,
        codigo: "A".repeat(51),
      });
      expect(result.success).toBe(false);
    });

    it("acepta codigo con exactamente 50 caracteres", () => {
      const result = productoSchema.safeParse({
        ...validBase,
        codigo: "A".repeat(50),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("validación del campo nombre", () => {
    it("falla cuando nombre está vacío", () => {
      const result = productoSchema.safeParse({ ...validBase, nombre: "" });
      expect(result.success).toBe(false);
    });

    it("falla cuando nombre supera 200 caracteres", () => {
      const result = productoSchema.safeParse({
        ...validBase,
        nombre: "N".repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("validación del campo stock", () => {
    it("falla cuando stock es negativo", () => {
      const result = productoSchema.safeParse({ ...validBase, stock: -1 });
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0].message).toMatch(/negativo/);
    });

    it("acepta stock cero", () => {
      const result = productoSchema.safeParse({ ...validBase, stock: 0 });
      expect(result.success).toBe(true);
    });

    it("falla cuando stock es decimal", () => {
      const result = productoSchema.safeParse({ ...validBase, stock: 1.5 });
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0].message).toMatch(/entero/);
    });
  });

  describe("validación del campo marca", () => {
    it("falla cuando marca es 0", () => {
      const result = productoSchema.safeParse({ ...validBase, marca: 0 });
      expect(result.success).toBe(false);
    });

    it("falla cuando marca está ausente", () => {
      const { marca: _, ...sinMarca } = validBase;
      const result = productoSchema.safeParse(sinMarca);
      expect(result.success).toBe(false);
    });
  });

  describe("refinement de precio_costo", () => {
    it("falla cuando precio_costo es negativo", () => {
      const result = productoSchema.safeParse({
        ...validBase,
        precio_costo: -100,
      });
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0].message).toMatch(/negativo/);
    });

    it("acepta precio_costo en cero", () => {
      const result = productoSchema.safeParse({
        ...validBase,
        precio_costo: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("refinement de porcentaje_ganancia", () => {
    it("falla cuando porcentaje supera 999.99", () => {
      const result = productoSchema.safeParse({
        ...validBase,
        porcentaje_ganancia: 1000,
      });
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0].message).toMatch(/999\.99/);
    });

    it("acepta porcentaje_ganancia en 0", () => {
      const result = productoSchema.safeParse({
        ...validBase,
        porcentaje_ganancia: 0,
      });
      expect(result.success).toBe(true);
    });

    it("acepta porcentaje_ganancia en 999.99 (límite)", () => {
      const result = productoSchema.safeParse({
        ...validBase,
        porcentaje_ganancia: 999.99,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("campos opcionales", () => {
    it("acepta sub_categoria null", () => {
      const result = productoSchema.safeParse({
        ...validBase,
        sub_categoria: null,
      });
      expect(result.success).toBe(true);
    });

    it("acepta descripcion vacía", () => {
      const result = productoSchema.safeParse({
        ...validBase,
        descripcion: "",
      });
      expect(result.success).toBe(true);
    });
  });
});
