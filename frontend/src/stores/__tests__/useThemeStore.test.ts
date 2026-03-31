/**
 * Tests del store useThemeStore.
 *
 * Niveles cubiertos:
 * - Unitario: ciclo de temas (light → dark → auto), persistencia en localStorage
 *
 * Supuestos:
 * - jsdom provee localStorage. Vitest lo limpia entre archivos de test pero no
 *   entre tests individuales, por lo que limpiamos manualmente en beforeEach.
 * - "auto" es el tema por defecto definido en el store.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useThemeStore } from "../../stores/useThemeStore";

// Verifica el comportamiento del selector de tema que afecta toda la UI.
describe("useThemeStore", () => {
  beforeEach(() => {
    localStorage.clear();
    // Resetear el store al estado inicial
    useThemeStore.setState({ theme: "auto" });
  });

  describe("estado inicial", () => {
    it('el tema por defecto es "auto"', () => {
      expect(useThemeStore.getState().theme).toBe("auto");
    });
  });

  describe("setTheme", () => {
    it('cambia el tema a "light"', () => {
      useThemeStore.getState().setTheme("light");
      expect(useThemeStore.getState().theme).toBe("light");
    });

    it('cambia el tema a "dark"', () => {
      useThemeStore.getState().setTheme("dark");
      expect(useThemeStore.getState().theme).toBe("dark");
    });

    it('vuelve a "auto"', () => {
      useThemeStore.getState().setTheme("dark");
      useThemeStore.getState().setTheme("auto");
      expect(useThemeStore.getState().theme).toBe("auto");
    });

    it("persiste el tema en localStorage", () => {
      useThemeStore.getState().setTheme("dark");
      const stored = localStorage.getItem("opticar-theme");
      expect(stored).not.toBeNull();
      // Zustand persist almacena el estado como JSON
      const parsed = JSON.parse(stored!);
      expect(parsed.state.theme).toBe("dark");
    });
  });
});
