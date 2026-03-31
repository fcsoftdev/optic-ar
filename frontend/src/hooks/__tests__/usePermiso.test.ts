/**
 * Tests del hook usePermiso.
 *
 * Niveles cubiertos:
 * - Unitario: lógica de permisos con diferentes estados del store de auth
 *
 * Supuestos:
 * - El store Zustand (useAuthStore) se controla manualmente en cada test
 *   llamando a setState() para simular distintos estados de usuario.
 * - Los superusuarios tienen acceso a todo independientemente del array permissions.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermiso } from "../../hooks/usePermiso";
import { useAuthStore } from "../../stores/useAuthStore";

// Verifica la lógica de autorización granular que protege rutas y acciones del UI.
describe("usePermiso", () => {
  // Limpiamos el store antes de cada test para evitar contaminación
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null });
  });

  describe("cuando no hay usuario autenticado", () => {
    it("tienePermiso retorna false para cualquier permiso", () => {
      const { result } = renderHook(() => usePermiso());
      expect(result.current.tienePermiso("productos.add_producto")).toBe(false);
    });
  });

  describe("cuando el usuario es superusuario", () => {
    beforeEach(() => {
      useAuthStore.setState({
        accessToken: "tok",
        user: {
          id: 1,
          username: "admin",
          first_name: "Admin",
          last_name: "",
          email: "",
          is_staff: true,
          is_superuser: true,
          groups: [],
          permissions: [], // sin permisos explícitos
        },
      });
    });

    it("retorna true aunque permissions esté vacío", () => {
      const { result } = renderHook(() => usePermiso());
      expect(result.current.tienePermiso("productos.add_producto")).toBe(true);
    });

    it("retorna true para cualquier permiso existente", () => {
      const { result } = renderHook(() => usePermiso());
      expect(result.current.tienePermiso("contabilidad.ver_reporte_caja")).toBe(
        true,
      );
    });

    it("retorna true incluso para permiso inventado", () => {
      const { result } = renderHook(() => usePermiso());
      expect(result.current.tienePermiso("app.permiso_que_no_existe")).toBe(
        true,
      );
    });
  });

  describe("cuando el usuario NO es superusuario", () => {
    beforeEach(() => {
      useAuthStore.setState({
        accessToken: "tok",
        user: {
          id: 2,
          username: "operador",
          first_name: "Op",
          last_name: "",
          email: "",
          is_staff: false,
          is_superuser: false,
          groups: ["Vendedores"],
          permissions: ["productos.view_producto", "ventas.add_venta"],
        },
      });
    });

    it("retorna true cuando tiene el permiso exacto", () => {
      const { result } = renderHook(() => usePermiso());
      expect(result.current.tienePermiso("productos.view_producto")).toBe(true);
    });

    it("retorna false cuando no tiene el permiso", () => {
      const { result } = renderHook(() => usePermiso());
      expect(result.current.tienePermiso("productos.delete_producto")).toBe(
        false,
      );
    });

    it("retorna false para permiso con formato incorrecto", () => {
      const { result } = renderHook(() => usePermiso());
      // La comparación es exacta, no parcial
      expect(result.current.tienePermiso("productos")).toBe(false);
    });

    it("retorna false para permiso de otra app", () => {
      const { result } = renderHook(() => usePermiso());
      expect(result.current.tienePermiso("contabilidad.ver_reporte_caja")).toBe(
        false,
      );
    });
  });

  describe("cuando el usuario es staff pero no superusuario", () => {
    beforeEach(() => {
      useAuthStore.setState({
        accessToken: "tok",
        user: {
          id: 3,
          username: "staff",
          first_name: "Staff",
          last_name: "",
          email: "",
          is_staff: true,
          is_superuser: false,
          groups: [],
          permissions: ["productos.add_marca"],
        },
      });
    });

    it("retorna true solo para permisos explícitamente asignados", () => {
      const { result } = renderHook(() => usePermiso());
      expect(result.current.tienePermiso("productos.add_marca")).toBe(true);
      expect(result.current.tienePermiso("productos.delete_marca")).toBe(false);
    });
  });
});
