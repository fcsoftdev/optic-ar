/**
 * Tests del schema de login (loginSchema).
 *
 * Niveles cubiertos:
 * - Unitario: validaciones Zod de username y password
 *
 * Supuestos:
 * - El schema no tiene reglas de formato especiales (sin email, sin complejidad de password).
 *   Solo valida que los campos no estén vacíos.
 */

import { describe, it, expect } from "vitest";
import { loginSchema } from "../../schemas/login.schema";

// Prueba las validaciones del formulario de autenticación antes de enviar al servidor.
describe("loginSchema", () => {
  describe("cuando los datos son válidos", () => {
    it("acepta username y password correctos", () => {
      const result = loginSchema.safeParse({
        username: "cristian",
        password: "admin",
      });
      expect(result.success).toBe(true);
    });

    it("acepta username con espacios y caracteres especiales", () => {
      const result = loginSchema.safeParse({
        username: "user_name.123",
        password: "p@ssw0rd!",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("cuando el username está vacío", () => {
    it("retorna error con mensaje en español", () => {
      const result = loginSchema.safeParse({ username: "", password: "admin" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("El usuario es requerido");
        expect(result.error.issues[0].path).toEqual(["username"]);
      }
    });
  });

  describe("cuando el password está vacío", () => {
    it("retorna error con mensaje en español", () => {
      const result = loginSchema.safeParse({
        username: "cristian",
        password: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "La contraseña es requerida",
        );
        expect(result.error.issues[0].path).toEqual(["password"]);
      }
    });
  });

  describe("cuando ambos campos están vacíos", () => {
    it("retorna dos errores, uno por campo", () => {
      const result = loginSchema.safeParse({ username: "", password: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2);
      }
    });
  });

  describe("cuando se omiten los campos", () => {
    it("falla con campos undefined", () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
