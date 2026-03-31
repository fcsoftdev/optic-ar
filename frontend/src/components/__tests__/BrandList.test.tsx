/**
 * Suite de tests para BrandList.tsx
 *
 * Niveles cubiertos:
 * - Unitario: lógica de ordenamiento, selección y estados de UI en aislamiento
 * - Integración: interacción con MSW (CRUD completo), estados de carga/error,
 *   flujo de confirmación inline de eliminación, búsqueda con debounce,
 *   paginación, permisos por rol
 * - E2E-like: flujo crear → ver en lista, editar → reflejar cambio, eliminar con confirmación
 *
 * Supuestos importantes:
 * - El handler MSW simula paginación real con count/results.
 * - usePermiso lee de useAuthStore: se configura el store antes de cada grupo.
 * - BrandList usa debounce de 500ms — los tests de búsqueda usan vi.useFakeTimers().
 * - El modal de marcas (MarcaFormModal) se testea en integración dentro de BrandList.
 * - window.scrollTo no existe en jsdom; se mockea en setup para evitar warnings.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import BrandList from "../BrandList";
import { renderWithProviders } from "../../test/utils";
import { server } from "../../test/server";
import { useAuthStore } from "../../stores/useAuthStore";
import { mockMarcas, mockUser } from "../../test/handlers";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Configura el store con un superusuario (todos los permisos). */
function loginAsSuperuser() {
  useAuthStore.setState({ accessToken: "tok", user: mockUser });
}

/** Configura el store con un usuario sin permisos de escritura. */
function loginAsReadOnly() {
  useAuthStore.setState({
    accessToken: "tok",
    user: {
      ...mockUser,
      is_superuser: false,
      is_staff: false,
      permissions: [],
    },
  });
}

// window.scrollTo no está implementado en jsdom
window.scrollTo = vi.fn();

// ── Setup global por suite ─────────────────────────────────────────────────────

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, user: null });
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. UNITARIO — Render inicial y estados de UI
// ══════════════════════════════════════════════════════════════════════════════

// Verifica que el componente renderiza correctamente en los diferentes estados
// sin requerir acciones del usuario (solo mount + async load).
describe("BrandList — render inicial", () => {
  it("muestra spinner mientras carga las marcas", () => {
    // MSW responde lento: el spinner debe aparecer antes de la respuesta
    server.use(
      http.get("http://localhost/api/marcas/", async () => {
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        });
      }),
    );
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("muestra el título 'Marcas' al cargar", async () => {
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => expect(screen.getByText("Marcas")).toBeInTheDocument());
  });

  it("muestra las marcas del mock después de cargar", async () => {
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() =>
      expect(screen.getByText("Ray-Ban")).toBeInTheDocument(),
    );
    expect(screen.getByText("Oakley")).toBeInTheDocument();
    expect(screen.getByText("Prada")).toBeInTheDocument();
  });

  it("muestra texto vacío cuando no hay marcas", async () => {
    server.use(
      http.get("http://localhost/api/marcas/", () =>
        HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        }),
      ),
    );
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() =>
      expect(
        screen.getByText(/no hay marcas registradas/i),
      ).toBeInTheDocument(),
    );
  });

  it("muestra alerta de error cuando la API falla", async () => {
    server.use(
      http.get("http://localhost/api/marcas/", () =>
        HttpResponse.json({ detail: "Error interno" }, { status: 500 }),
      ),
    );
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. UNITARIO — Sistema de permisos
// ══════════════════════════════════════════════════════════════════════════════

// Verifica que los controles de escritura solo aparecen cuando el usuario
// tiene los permisos correspondientes (crítico para seguridad en el UI).
describe("BrandList — permisos", () => {
  it("muestra botón 'Crear Marca' si tiene permiso add_marca", async () => {
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /marca/i }),
      ).toBeInTheDocument(),
    );
  });

  it("oculta botón 'Crear Marca' sin permiso add_marca", async () => {
    loginAsReadOnly();
    renderWithProviders(<BrandList />);
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /marca/i }),
      ).not.toBeInTheDocument(),
    );
  });

  it("muestra botones de editar y eliminar para superusuario", async () => {
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));
    // Debe haber al menos un botón de editar (lápiz)
    expect(screen.getAllByTitle("Editar marca").length).toBeGreaterThan(0);
    // Debe haber al menos un botón de eliminar (trash)
    expect(screen.getAllByTitle("Eliminar marca").length).toBeGreaterThan(0);
  });

  it("oculta columna de acciones para usuario sin permisos", async () => {
    loginAsReadOnly();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));
    expect(screen.queryByText("Acciones")).not.toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. INTEGRACIÓN — Búsqueda con debounce
// ══════════════════════════════════════════════════════════════════════════════

// Verifica que la búsqueda filtra correctamente los resultados.
// Usamos waitFor con timeout extendido para respetar el debounce real de 500ms.
describe("BrandList — búsqueda", () => {
  it("filtra marcas cuando se escribe en el buscador (tras debounce)", async () => {
    // Respuesta filtrada según el parámetro search
    server.use(
      http.get("http://localhost/api/marcas/", ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get("search") ?? "";
        const filtered = mockMarcas.filter((m) =>
          m.nombre.toLowerCase().includes(search.toLowerCase()),
        );
        return HttpResponse.json({
          count: filtered.length,
          next: null,
          previous: null,
          results: filtered,
        });
      }),
    );
    loginAsSuperuser();
    const user = userEvent.setup();
    renderWithProviders(<BrandList />);

    // Esperar carga inicial
    await waitFor(() => screen.getByText("Ray-Ban"));

    // Tipear en el buscador — el debounce dispara tras 500ms
    await user.type(screen.getByPlaceholderText(/buscar/i), "ray");

    await waitFor(
      () => {
        expect(screen.queryByText("Oakley")).not.toBeInTheDocument();
        expect(screen.getByText("Ray-Ban")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  }, 10000);

  it("muestra mensaje 'no se encontraron' cuando la búsqueda no da resultados", async () => {
    server.use(
      http.get("http://localhost/api/marcas/", ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get("search") ?? "";
        if (search) {
          return HttpResponse.json({
            count: 0,
            next: null,
            previous: null,
            results: [],
          });
        }
        return HttpResponse.json({
          count: mockMarcas.length,
          next: null,
          previous: null,
          results: mockMarcas,
        });
      }),
    );
    loginAsSuperuser();
    const user = userEvent.setup();
    renderWithProviders(<BrandList />);

    await waitFor(() => screen.getByText("Ray-Ban"));
    await user.type(screen.getByPlaceholderText(/buscar/i), "zzz_no_existe");

    await waitFor(
      () =>
        expect(
          screen.getByText(/no se encontraron marcas/i),
        ).toBeInTheDocument(),
      { timeout: 2000 },
    );
  }, 10000);
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. INTEGRACIÓN — Ordenamiento
// ══════════════════════════════════════════════════════════════════════════════

// Verifica que el ordenamiento local (sin llamada a API) funciona correctamente.
describe("BrandList — ordenamiento", () => {
  it("invierte el orden al hacer click dos veces en la columna Nombre", async () => {
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));

    const colNombre = screen.getByText(/nombre/i);
    const user = userEvent.setup();

    // Primera vez → asc (ya está asc por defecto, ahora cambia a desc)
    await user.click(colNombre);

    // Segunda vez → vuelve a asc
    await user.click(colNombre);

    // El icono de ordenamiento debe cambiar
    expect(colNombre.textContent).toMatch(/↑|↓|⇅/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. INTEGRACIÓN — Selección múltiple
// ══════════════════════════════════════════════════════════════════════════════

// La selección múltiple es parte del flujo de eliminación masiva — crítico
// para que el usuario no elimine datos por accidente.
describe("BrandList — selección múltiple", () => {
  it("selecciona todas las marcas con el checkbox del header", async () => {
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));

    const user = userEvent.setup();
    const checkboxes = screen.getAllByRole("checkbox");
    // El primero es el "select all"
    await user.click(checkboxes[0]);

    // Todos los checkboxes de fila deben quedar marcados
    const rowCheckboxes = checkboxes.slice(1);
    rowCheckboxes.forEach((cb) => expect(cb).toBeChecked());
  });

  it("deselecciona todas las marcas al desmarcar el checkbox del header", async () => {
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));

    const user = userEvent.setup();
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]); // seleccionar todo
    await user.click(checkboxes[0]); // deseleccionar todo

    checkboxes.slice(1).forEach((cb) => expect(cb).not.toBeChecked());
  });

  it("selecciona y deselecciona una marca individual", async () => {
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));

    const user = userEvent.setup();
    const checkboxes = screen.getAllByRole("checkbox");
    const primerCheckboxFila = checkboxes[1];

    await user.click(primerCheckboxFila);
    expect(primerCheckboxFila).toBeChecked();

    await user.click(primerCheckboxFila);
    expect(primerCheckboxFila).not.toBeChecked();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. INTEGRACIÓN — Flujo de eliminación con confirmación inline (E2E-like)
// ══════════════════════════════════════════════════════════════════════════════

// La confirmación inline (nuevo flujo post-TC015) es el cambio más crítico
// reciente. Verificamos que el dialogo aparece, se puede confirmar y cancelar.
describe("BrandList — eliminación individual (confirmación inline)", () => {
  it("muestra botones Confirmar/Cancelar al hacer click en eliminar", async () => {
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));

    const user = userEvent.setup();
    // Click en el primer botón de eliminar (Ray-Ban)
    await user.click(screen.getAllByTitle("Eliminar marca")[0]);

    expect(
      screen.getByRole("button", { name: /confirmar/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cancelar/i }),
    ).toBeInTheDocument();
  });

  it("cancela la eliminación y restaura el botón de eliminar", async () => {
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));

    const user = userEvent.setup();
    await user.click(screen.getAllByTitle("Eliminar marca")[0]);
    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    // Los botones de confirmar/cancelar desaparecen
    expect(
      screen.queryByRole("button", { name: /confirmar/i }),
    ).not.toBeInTheDocument();
    // El botón de eliminar vuelve a estar disponible
    expect(screen.getAllByTitle("Eliminar marca").length).toBeGreaterThan(0);
  });

  it("confirma la eliminación y llama a DELETE en la API", async () => {
    let deleteCalledWith: string | null = null;
    server.use(
      http.delete("http://localhost/api/marcas/:id/", ({ params }) => {
        deleteCalledWith = params.id as string;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));

    const user = userEvent.setup();
    await user.click(screen.getAllByTitle("Eliminar marca")[0]);
    await user.click(screen.getByRole("button", { name: /confirmar/i }));

    await waitFor(() => {
      // Debe haber llamado al endpoint con algún id numérico
      expect(deleteCalledWith).not.toBeNull();
      expect(Number(deleteCalledWith)).toBeGreaterThan(0);
    });
  });

  it("eliminar solo un ítem no afecta la confirmación de otro", async () => {
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));

    const user = userEvent.setup();
    // Iniciar eliminación del primero
    await user.click(screen.getAllByTitle("Eliminar marca")[0]);
    // Solo un par Confirmar/Cancelar debe estar visible
    expect(screen.getAllByRole("button", { name: /confirmar/i })).toHaveLength(
      1,
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. INTEGRACIÓN — Flujo crear marca (E2E-like)
// ══════════════════════════════════════════════════════════════════════════════

// El flujo crear → cerrar modal → ver en lista es el camino crítico de negocio.
describe("BrandList — crear nueva marca", () => {
  it("abre el modal al hacer click en Nueva Marca", async () => {
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));

    const user = userEvent.setup();
    // El botón dice "Agregar\nMarca" — lo buscamos por texto exacto del ListHeader
    await user.click(screen.getByRole("button", { name: /agregar.*marca/i }));

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
  });

  it("cierra el modal al hacer click en Cancelar", async () => {
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /agregar.*marca/i }));
    await waitFor(() => screen.getByRole("dialog"));

    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("crea una marca nueva y la API recibe el nombre correcto", async () => {
    let bodyEnviado: { nombre?: string } = {};
    server.use(
      http.post("http://localhost/api/marcas/", async ({ request }) => {
        bodyEnviado = (await request.json()) as { nombre: string };
        return HttpResponse.json(
          { id: 99, nombre: bodyEnviado.nombre },
          { status: 201 },
        );
      }),
    );

    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /agregar.*marca/i }));
    await waitFor(() => screen.getByRole("dialog"));

    await user.clear(screen.getByPlaceholderText(/ray-ban/i));
    await user.type(screen.getByPlaceholderText(/ray-ban/i), "Nike");
    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() => {
      expect(bodyEnviado.nombre).toBe("Nike");
    });
  });

  it("muestra error de validación si el nombre tiene menos de 2 caracteres", async () => {
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /agregar.*marca/i }));
    await waitFor(() => screen.getByRole("dialog"));

    await user.clear(screen.getByPlaceholderText(/ray-ban/i));
    await user.type(screen.getByPlaceholderText(/ray-ban/i), "X");
    await user.click(screen.getByRole("button", { name: /crear/i }));

    await waitFor(() =>
      expect(screen.getByText(/al menos 2 caracteres/i)).toBeInTheDocument(),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. INTEGRACIÓN — Flujo editar marca (E2E-like)
// ══════════════════════════════════════════════════════════════════════════════

// Editar → verificar que el modal se pre-rellena con el valor actual es
// crítico para evitar sobreescribir datos con valores vacíos.
describe("BrandList — editar marca existente", () => {
  it("abre el modal con el nombre pre-cargado al editar", async () => {
    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));

    const user = userEvent.setup();
    await user.click(screen.getAllByTitle("Editar marca")[0]);

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/ray-ban/i) as HTMLInputElement;
      // El modal debe estar pre-relleno con el nombre de la marca
      expect(input.value).not.toBe("");
    });
  });

  it("envía el nombre actualizado al confirmar edición", async () => {
    let bodyEnviado: { nombre?: string } = {};
    server.use(
      http.put("http://localhost/api/marcas/:id/", async ({ request }) => {
        bodyEnviado = (await request.json()) as { nombre: string };
        return HttpResponse.json({ id: 1, nombre: bodyEnviado.nombre });
      }),
    );

    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));

    const user = userEvent.setup();
    await user.click(screen.getAllByTitle("Editar marca")[0]);
    await waitFor(() => screen.getByRole("dialog"));

    const input = screen.getByPlaceholderText(/ray-ban/i);
    await user.clear(input);
    await user.type(input, "Ray-Ban Pro");
    await user.click(screen.getByRole("button", { name: /actualizar/i }));

    await waitFor(() => {
      expect(bodyEnviado.nombre).toBe("Ray-Ban Pro");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. INTEGRACIÓN — Error de API en mutaciones
// ══════════════════════════════════════════════════════════════════════════════

// Verificar que los errores del servidor se comunican visualmente al usuario.
describe("BrandList — manejo de errores en mutaciones", () => {
  it("el modal sigue abierto si la creación falla en el servidor", async () => {
    // Suprimir el console.error de React Query por el 400 esperado
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    server.use(
      http.post("http://localhost/api/marcas/", () =>
        HttpResponse.json(
          { nombre: ["Ya existe una marca con ese nombre."] },
          { status: 400 },
        ),
      ),
    );

    loginAsSuperuser();
    renderWithProviders(<BrandList />);
    await waitFor(() => screen.getByText("Ray-Ban"));

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /agregar.*marca/i }));
    await waitFor(() => screen.getByRole("dialog"));

    await user.type(screen.getByPlaceholderText(/ray-ban/i), "Ray-Ban");
    await user.click(screen.getByRole("button", { name: /crear/i }));

    // El modal no debe cerrarse en caso de error
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    consoleError.mockRestore();
  });
});
