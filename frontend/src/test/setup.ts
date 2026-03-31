/**
 * Setup global de Vitest.
 * Se ejecuta antes de cada archivo de test.
 */
import "@testing-library/jest-dom";
import { afterEach, afterAll, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./server.ts";

// Forzar baseURL absoluta en axios para que MSW pueda interceptar correctamente.
// jsdom en entorno de test no tiene un origen real, así que URL relativas como
// /api/marcas/ no se resuelven a http://localhost/api/marcas/ automáticamente.
vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  mod.default.defaults.baseURL = "http://localhost";
  mod.authApi.defaults.baseURL = "http://localhost";
  return mod;
});

// Levantar el servidor MSW antes de todos los tests
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Resetear handlers después de cada test para evitar contaminación entre tests
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Cerrar el servidor MSW al finalizar todos los tests
afterAll(() => server.close());
