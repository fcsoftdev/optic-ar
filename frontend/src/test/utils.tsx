/**
 * Helpers de render para tests de integración.
 *
 * Envuelve los componentes con todos los providers necesarios:
 * QueryClient, MemoryRouter, etc.
 */
import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

/**
 * Crea un QueryClient fresco y aislado para cada test.
 * Sin reintentos para que los errores fallen rápido.
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface WrapperProps {
  children: React.ReactNode;
  initialEntries?: string[];
}

/**
 * Wrapper completo de providers para tests de integración.
 */
export function AllProviders({
  children,
  initialEntries = ["/"],
}: WrapperProps) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

/**
 * Función de render personalizada que incluye todos los providers.
 *
 * @example
 * const { getByRole } = renderWithProviders(<LoginPage />);
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { initialEntries?: string[] },
) {
  const { initialEntries, ...rest } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={initialEntries}>{children}</AllProviders>
    ),
    ...rest,
  });
}
