/**
 * Tests de integración de LoginPage.
 *
 * Niveles cubiertos:
 * - Integración: render del formulario, interacciones del usuario,
 *   llamadas a la API (MSW), estados de carga y error
 * - E2E-like: flujo completo de login exitoso → store actualizado
 *
 * Supuestos:
 * - El componente usa useAuth (React Query mutation) internamente.
 * - El store useAuthStore es el efecto observable del login exitoso.
 * - En el entorno de test, axios llama a http://localhost/api/token/ que
 *   MSW intercepta.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import LoginPage from "../../components/LoginPage";
import { renderWithProviders } from "../../test/utils";
import { server } from "../../test/server";
import { useAuthStore } from "../../stores/useAuthStore";

// Prueba el punto de entrada de autenticación: el componente más crítico del sistema.
describe("LoginPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, user: null });
  });

  // ── Render inicial ──────────────────────────────────────────────────────────

  describe("render inicial", () => {
    it("muestra el logo y el título de la aplicación", () => {
      renderWithProviders(<LoginPage />);
      expect(screen.getByText("Opticar")).toBeInTheDocument();
      expect(
        screen.getByText("Sistema de Gestión de Ópticas"),
      ).toBeInTheDocument();
    });

    it("muestra los campos de usuario y contraseña", () => {
      renderWithProviders(<LoginPage />);
      expect(
        screen.getByRole("textbox", { name: /usuario/i }),
      ).toBeInTheDocument();
      // El campo password no tiene role textbox en HTML semántico
      expect(screen.getByPlaceholderText(/contraseña/i)).toBeInTheDocument();
    });

    it("muestra el botón de ingresar habilitado", () => {
      renderWithProviders(<LoginPage />);
      expect(
        screen.getByRole("button", { name: /ingresar/i }),
      ).not.toBeDisabled();
    });

    it("no muestra la alerta de error por defecto", () => {
      renderWithProviders(<LoginPage />);
      expect(
        screen.queryByText(/usuario o contraseña incorrectos/i),
      ).not.toBeInTheDocument();
    });
  });

  // ── Validación del formulario ───────────────────────────────────────────────

  describe("validación Zod antes de enviar", () => {
    it("muestra error cuando el usuario está vacío al enviar", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      await user.click(screen.getByRole("button", { name: /ingresar/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/el usuario es requerido/i),
        ).toBeInTheDocument();
      });
    });

    it("muestra error cuando la contraseña está vacía al enviar", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      await user.type(
        screen.getByRole("textbox", { name: /usuario/i }),
        "cristian",
      );
      await user.click(screen.getByRole("button", { name: /ingresar/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/la contraseña es requerida/i),
        ).toBeInTheDocument();
      });
    });
  });

  // ── Login exitoso ───────────────────────────────────────────────────────────

  describe("cuando las credenciales son correctas", () => {
    it("actualiza el store con el access token y el usuario", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      await user.type(
        screen.getByRole("textbox", { name: /usuario/i }),
        "cristian",
      );
      await user.type(screen.getByPlaceholderText(/contraseña/i), "admin");
      await user.click(screen.getByRole("button", { name: /ingresar/i }));

      await waitFor(() => {
        const state = useAuthStore.getState();
        expect(state.accessToken).toBe("mock-access-token");
        expect(state.user?.username).toBe("cristian");
      });
    });

    it("muestra el spinner mientras se procesa el login", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      await user.type(
        screen.getByRole("textbox", { name: /usuario/i }),
        "cristian",
      );
      await user.type(screen.getByPlaceholderText(/contraseña/i), "admin");

      // No esperamos respuesta, capturamos el estado durante la petición
      user.click(screen.getByRole("button", { name: /ingresar/i }));

      await waitFor(() => {
        expect(screen.getByText(/ingresando/i)).toBeInTheDocument();
      });
    });
  });

  // ── Login fallido ───────────────────────────────────────────────────────────

  describe("cuando las credenciales son incorrectas", () => {
    it("muestra la alerta de error de autenticación", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      await user.type(
        screen.getByRole("textbox", { name: /usuario/i }),
        "cristian",
      );
      await user.type(screen.getByPlaceholderText(/contraseña/i), "mal-pass");
      await user.click(screen.getByRole("button", { name: /ingresar/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/usuario o contraseña incorrectos/i),
        ).toBeInTheDocument();
      });
    });

    it("no actualiza el store cuando falla el login", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      await user.type(
        screen.getByRole("textbox", { name: /usuario/i }),
        "cristian",
      );
      await user.type(
        screen.getByPlaceholderText(/contraseña/i),
        "wrong-password",
      );
      await user.click(screen.getByRole("button", { name: /ingresar/i }));

      await waitFor(() => {
        expect(useAuthStore.getState().accessToken).toBeNull();
      });
    });
  });

  // ── Error de red ────────────────────────────────────────────────────────────

  describe("cuando la API no responde (error de red)", () => {
    it("muestra la alerta de error incluso con network error", async () => {
      server.use(
        http.post("http://localhost/api/token/", () => {
          return HttpResponse.error();
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      await user.type(
        screen.getByRole("textbox", { name: /usuario/i }),
        "cristian",
      );
      await user.type(screen.getByPlaceholderText(/contraseña/i), "admin");
      await user.click(screen.getByRole("button", { name: /ingresar/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/usuario o contraseña incorrectos/i),
        ).toBeInTheDocument();
      });
    });
  });
});
