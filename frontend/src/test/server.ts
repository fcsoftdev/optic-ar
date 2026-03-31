/**
 * Instancia del servidor MSW para entorno Node/jsdom (Vitest).
 */
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
