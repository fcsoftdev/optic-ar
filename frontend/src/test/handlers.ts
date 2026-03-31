/**
 * Handlers MSW para interceptar todas las llamadas HTTP de los tests.
 * Centraliza las respuestas mock de la API Django REST Framework.
 */
import { http, HttpResponse } from "msw";
import type { Marca } from "../services/productos.service";

const BASE = "http://localhost";

// ── Fixtures reutilizables ──────────────────────────────────────────────────

export const mockUser = {
  id: 1,
  username: "cristian",
  first_name: "Cristian",
  last_name: "Test",
  email: "cristian@test.com",
  is_staff: true,
  is_superuser: true,
  groups: [],
  permissions: [],
};

export const mockMarcas: Marca[] = [
  { id: 1, nombre: "Ray-Ban" },
  { id: 2, nombre: "Oakley" },
  { id: 3, nombre: "Prada" },
];

export const mockProducto = {
  id: 1,
  codigo: "RB001",
  nombre: "Aviator Classic",
  marca: 1,
  marca_nombre: "Ray-Ban",
  categoria: 1,
  categoria_nombre: "Anteojos de Sol",
  stock: 10,
  precio_costo: 15000,
  porcentaje_ganancia: 50,
  precio_venta: 22500,
};

// ── Handlers por defecto ────────────────────────────────────────────────────

export const handlers = [
  // Auth: login exitoso
  http.post(`${BASE}/api/token/`, async ({ request }) => {
    const body = (await request.json()) as {
      username: string;
      password: string;
    };
    if (body.username === "cristian" && body.password === "admin") {
      return HttpResponse.json({
        access: "mock-access-token",
        user: mockUser,
      });
    }
    return HttpResponse.json(
      { detail: "No active account found with the given credentials" },
      { status: 401 },
    );
  }),

  // Auth: refresh silencioso
  http.post(`${BASE}/api/token/refresh/`, () =>
    HttpResponse.json({ access: "mock-access-token", user: mockUser }),
  ),

  // Auth: logout
  http.post(`${BASE}/api/token/logout/`, () =>
    HttpResponse.json({}, { status: 200 }),
  ),

  // Marcas: lista paginada
  http.get(`${BASE}/api/marcas/`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const filtered = mockMarcas.filter((m) =>
      m.nombre.toLowerCase().includes(search),
    );
    return HttpResponse.json({
      count: filtered.length,
      next: null,
      previous: null,
      results: filtered,
    });
  }),

  // Marcas: crear
  http.post(`${BASE}/api/marcas/`, async ({ request }) => {
    const body = (await request.json()) as { nombre: string };
    return HttpResponse.json({ id: 99, nombre: body.nombre }, { status: 201 });
  }),

  // Marcas: editar
  http.put(`${BASE}/api/marcas/:id/`, async ({ params, request }) => {
    const body = (await request.json()) as { nombre: string };
    return HttpResponse.json({ id: Number(params.id), nombre: body.nombre });
  }),

  // Marcas: eliminar
  http.delete(
    `${BASE}/api/marcas/:id/`,
    () => new HttpResponse(null, { status: 204 }),
  ),

  // Productos: lista paginada
  http.get(`${BASE}/api/productos/`, () =>
    HttpResponse.json({
      count: 1,
      next: null,
      previous: null,
      results: [mockProducto],
    }),
  ),

  // Productos: crear
  http.post(`${BASE}/api/productos/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: 100, ...body }, { status: 201 });
  }),

  // Productos: actualizar
  http.put(`${BASE}/api/productos/:id/`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: Number(params.id), ...body });
  }),

  // Productos: eliminar
  http.delete(
    `${BASE}/api/productos/:id/`,
    () => new HttpResponse(null, { status: 204 }),
  ),
];
