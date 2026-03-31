/**
 * Tests del store useAuthStore.
 *
 * Niveles cubiertos:
 * - Unitario: mutaciones del estado (setAuth, clearAuth, setInitialized)
 *
 * Supuestos:
 * - El store es un store Zustand puro. No se testa la persistencia de localStorage
 *   porque esse store no usa `persist` (decisión de seguridad intencional).
 * - Se resetea el store antes de cada test con setState para aislamiento total.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../../stores/useAuthStore";
import type { AuthUser } from "../../stores/useAuthStore";

const mockUser: AuthUser = {
  id: 1,
  username: "cristian",
  first_name: "Cristian",
  last_name: "Test",
  email: "c@test.com",
  is_staff: true,
  is_superuser: true,
  groups: [],
  permissions: [],
};

// Verifica el estado de autenticación global que controla todo el flujo de la app.
describe("useAuthStore", () => {
  beforeEach(() => {
    // Resetear al estado inicial antes de cada test
    useAuthStore.setState({
      accessToken: null,
      user: null,
      isInitialized: false,
    });
  });

  describe("estado inicial", () => {
    it("arranca con accessToken null", () => {
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it("arranca con user null", () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("arranca con isInitialized en false", () => {
      expect(useAuthStore.getState().isInitialized).toBe(false);
    });
  });

  describe("setAuth", () => {
    it("guarda el access token en memoria", () => {
      useAuthStore.getState().setAuth("my-access-token", mockUser);
      expect(useAuthStore.getState().accessToken).toBe("my-access-token");
    });

    it("guarda los datos del usuario", () => {
      useAuthStore.getState().setAuth("tok", mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it("sobreescribe un token previo en una segunda llamada", () => {
      useAuthStore.getState().setAuth("token-viejo", mockUser);
      useAuthStore.getState().setAuth("token-nuevo", mockUser);
      expect(useAuthStore.getState().accessToken).toBe("token-nuevo");
    });
  });

  describe("clearAuth", () => {
    it("limpia el accessToken a null", () => {
      useAuthStore.getState().setAuth("tok", mockUser);
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it("limpia el user a null", () => {
      useAuthStore.getState().setAuth("tok", mockUser);
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("no lanza error si ya está limpio", () => {
      expect(() => useAuthStore.getState().clearAuth()).not.toThrow();
    });
  });

  describe("setInitialized", () => {
    it("cambia isInitialized a true", () => {
      useAuthStore.getState().setInitialized();
      expect(useAuthStore.getState().isInitialized).toBe(true);
    });

    it("es idempotente: llamarlo dos veces no cambia el resultado", () => {
      useAuthStore.getState().setInitialized();
      useAuthStore.getState().setInitialized();
      expect(useAuthStore.getState().isInitialized).toBe(true);
    });
  });
});
