/**
 * @file AuditoriaPage.tsx
 * @description Página centralizada de auditoría del sistema.
 *
 * Muestra el historial de cambios de todos los modelos auditados,
 * con filtros por modelo, tipo de operación, usuario y rango de fechas.
 * Cada registro muestra el detalle JSON expandible de la operación.
 */

import React, { useState } from "react";
import { Alert, Badge, Col, Form, Row, Spinner, Table } from "react-bootstrap";
import { ClockHistory } from "react-bootstrap-icons";
import { useAuditoria, useModelosAuditados } from "../hooks/useAuditoria";
import ListHeader from "./ListHeader";
import PaginationBar from "./PaginationBar";
import type {
  AuditoriaFiltros,
  RegistroAuditoria,
} from "../schemas/auditoriaSchema";

// ── Utilidades ───────────────────────────────────────────────────────────────

/**
 * Formatea una fecha ISO a formato local argentino.
 *
 * @param isoString - Fecha en formato ISO 8601
 * @returns Fecha formateada (ej: "13/04/2026 10:30")
 */
const fmtFecha = (isoString: string): string => {
  const d = new Date(isoString);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ── Sub-componente: Badge de acción ──────────────────────────────────────────

interface AccionBadgeProps {
  /** Clave de la acción */
  accion: "crear" | "editar" | "eliminar";
  /** Texto legible de la acción */
  display: string;
}

/**
 * Badge de color según el tipo de operación.
 */
const AccionBadge: React.FC<AccionBadgeProps> = ({ accion, display }) => {
  const variant =
    accion === "crear" ? "success" : accion === "editar" ? "warning" : "danger";
  return (
    <Badge bg={variant} text={accion === "editar" ? "dark" : undefined}>
      {display}
    </Badge>
  );
};

// ── Sub-componente: Detalle expandible ───────────────────────────────────────

interface DetalleBadgeProps {
  /** JSON de detalle de la operación (snapshot o diff) */
  detalle: Record<string, unknown>;
  /** Acción para determinar cómo renderizar el detalle */
  accion: "crear" | "editar" | "eliminar";
}

/**
 * Botón expandible que muestra el JSON de detalle de la operación.
 * Para editar, muestra el diff estructurado (cabecera + ítems).
 * Para crear/eliminar, muestra el snapshot completo.
 */
const DetalleBadge: React.FC<DetalleBadgeProps> = ({ detalle, accion }) => {
  const [expandido, setExpandido] = useState(false);

  const isEmpty =
    !detalle ||
    (accion === "editar" && (() => {
      // Compra/Venta: diff estructurado { cabecera, items }
      if ("cabecera" in detalle || "items" in detalle) {
        return (
          Object.keys((detalle.cabecera as Record<string, unknown>) ?? {}).length === 0 &&
          ((detalle.items as unknown[]) ?? []).length === 0
        );
      }
      // Producto/Turno: diff plano { campo: { antes, despues } }
      return Object.keys(detalle).length === 0;
    })());

  if (isEmpty) return <span className="text-muted">Sin cambios</span>;

  return (
    <div>
      <Badge
        bg="secondary"
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={() => setExpandido((v) => !v)}
        title="Click para ver detalle"
      >
        {expandido ? "Ocultar ▲" : "Ver detalle ▼"}
      </Badge>

      {expandido && (
        <div className="mt-2">
          {accion === "editar" ? (
            <DetalleEditar detalle={detalle} />
          ) : (
            <DetalleSnapshot detalle={detalle} />
          )}
        </div>
      )}
    </div>
  );
};

// ── Sub-componente: Detalle de edición (diff) ────────────────────────────────

interface DetalleEditarProps {
  detalle: Record<string, unknown>;
}

/** Renderiza el diff de una edición: cambios de cabecera + ítems modificados,
 *  o diff plano { campo: { antes, despues } } para Producto/Turno. */
const DetalleEditar: React.FC<DetalleEditarProps> = ({ detalle }) => {
  // Formato plano: Producto/Turno — cada clave es un campo con { antes, despues }
  const esFormatoPlano = !("cabecera" in detalle) && !("items" in detalle);

  if (esFormatoPlano) {
    const campos = detalle as Record<string, { antes: unknown; despues: unknown }>;
    return (
      <div style={{ fontSize: "0.8rem" }}>
        <table className="table table-sm table-bordered mb-0">
          <thead className="table-light">
            <tr>
              <th>Campo</th>
              <th>Anterior</th>
              <th>Nuevo</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(campos).map(([campo, vals]) => (
              <tr key={campo}>
                <td><code>{campo}</code></td>
                <td className="text-danger text-decoration-line-through">
                  {String(vals?.antes ?? "—")}
                </td>
                <td className="text-success">{String(vals?.despues ?? "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const cabecera = (detalle.cabecera ?? {}) as Record<
    string,
    { antes: string; despues: string }
  >;
  const items = (detalle.items ?? []) as Array<Record<string, unknown>>;

  return (
    <div style={{ fontSize: "0.8rem" }}>
      {/* Cambios en cabecera */}
      {Object.keys(cabecera).length > 0 && (
        <div className="mb-2">
          <strong>Cabecera:</strong>
          <table className="table table-sm table-bordered mb-0 mt-1">
            <thead className="table-light">
              <tr>
                <th>Campo</th>
                <th>Anterior</th>
                <th>Nuevo</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(cabecera).map(([campo, vals]) => (
                <tr key={campo}>
                  <td>
                    <code>{campo}</code>
                  </td>
                  <td className="text-danger text-decoration-line-through">
                    {vals.antes ?? "—"}
                  </td>
                  <td className="text-success">{vals.despues ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ítems modificados */}
      {items.length > 0 && (
        <div>
          <strong>Ítems:</strong>
          {items.map((item, i) => (
            <div key={i} className="border rounded p-1 mt-1 bg-light">
              <Badge
                bg={
                  item.accion === "agregado"
                    ? "success"
                    : item.accion === "eliminado"
                      ? "danger"
                      : "warning"
                }
                text={item.accion === "modificado" ? "dark" : undefined}
                className="me-1"
              >
                {String(item.accion)}
              </Badge>
              <strong>{String(item.producto ?? "")}</strong>
              {item.cambios !== null && typeof item.cambios === "object" && (
                <table className="table table-sm table-bordered mb-0 mt-1">
                  <thead className="table-light">
                    <tr>
                      <th>Campo</th>
                      <th>Anterior</th>
                      <th>Nuevo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(
                      item.cambios as Record<
                        string,
                        { antes: string; despues: string }
                      >,
                    ).map(([campo, vals]) => (
                      <tr key={campo}>
                        <td>
                          <code>{campo}</code>
                        </td>
                        <td className="text-danger text-decoration-line-through">
                          {vals.antes ?? "—"}
                        </td>
                        <td className="text-success">{vals.despues ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {item.cantidad !== undefined && item.accion !== "modificado" && (
                <div className="small text-muted mt-1">
                  Cantidad: {String(item.cantidad)}
                  {item.stock_devuelto !== undefined &&
                    ` | Stock devuelto: ${item.stock_devuelto}`}
                  {item.stock_nuevo !== undefined &&
                    ` | Stock nuevo: ${item.stock_nuevo}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Sub-componente: Detalle de snapshot (crear/eliminar) ─────────────────────

interface DetalleSnapshotProps {
  detalle: Record<string, unknown>;
}

/** Renderiza un snapshot completo (crear o eliminar) como tabla clave-valor. */
const DetalleSnapshot: React.FC<DetalleSnapshotProps> = ({ detalle }) => {
  const items = (detalle.items ?? []) as Array<Record<string, unknown>>;
  const campos = Object.entries(detalle).filter(([k]) => k !== "items");

  return (
    <div style={{ fontSize: "0.8rem" }}>
      {/* Campos de cabecera */}
      {campos.length > 0 && (
        <table className="table table-sm table-bordered mb-2">
          <tbody>
            {campos.map(([campo, valor]) => (
              <tr key={campo}>
                <td className="fw-semibold">
                  <code>{campo}</code>
                </td>
                <td>
                  {valor === null || valor === undefined ? (
                    <em className="text-muted">—</em>
                  ) : (
                    String(valor)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Ítems */}
      {items.length > 0 && (
        <div>
          <strong>Ítems ({items.length}):</strong>
          {items.map((item, i) => (
            <div key={i} className="border rounded p-1 mt-1 bg-light">
              <div className="fw-semibold">
                {String(item.producto ?? `Ítem ${i + 1}`)}
              </div>
              <div className="text-muted">
                Cant.: {String(item.cantidad ?? "—")}
                {item.precio_unitario !== undefined &&
                  ` | Costo: $${item.precio_unitario}`}
                {item.precio_venta !== undefined &&
                  ` | Venta: $${item.precio_venta}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────────────────────

/** Opciones para el selector de acción. */
const OPCIONES_ACCION = [
  { value: "", label: "Todas las operaciones" },
  { value: "crear", label: "Creación" },
  { value: "editar", label: "Modificación" },
  { value: "eliminar", label: "Eliminación" },
] as const;

/**
 * Página de auditoría centralizada del sistema.
 *
 * @remarks
 * Requiere el permiso `authentication.ver_auditoria`.
 * El acceso es controlado por ProtectedRoute en MainContent.tsx.
 */
function AuditoriaPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filtros, setFiltros] = useState<AuditoriaFiltros>({});

  const { data: modelosData = [] } = useModelosAuditados();

  const {
    data: auditoriaData,
    isLoading,
    error,
  } = useAuditoria(filtros, currentPage);

  const registros: RegistroAuditoria[] = auditoriaData?.results ?? [];
  const totalItems = auditoriaData?.count ?? 0;
  const totalPages = totalItems ? Math.ceil(totalItems / 10) : 1;

  /**
   * Actualiza un campo del filtro y resetea la paginación.
   *
   * @param campo - Nombre del campo del filtro a actualizar
   * @param valor - Nuevo valor del campo
   */
  const handleFiltro = (campo: keyof AuditoriaFiltros, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor || undefined }));
    setCurrentPage(1);
  };

  /** Limpia todos los filtros activos. */
  const handleLimpiarFiltros = () => {
    setFiltros({});
    setCurrentPage(1);
  };

  const hayFiltrosActivos = Object.values(filtros).some(
    (v) => v !== undefined && v !== "",
  );

  return (
    <div
      className="d-flex flex-column"
      style={{ height: "calc(100vh - 80px)" }}
    >
      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <div className="mb-3">
        <ListHeader
          title="Auditoría del Sistema"
          count={totalItems}
          icon={<ClockHistory size={26} viewBox="0 0 16 16" />}
          canAdd={false}
        />

        {/* ── Filtros ─────────────────────────────────────────────────── */}
        <Row className="g-2 align-items-end">
          {/* Selector de modelo */}
          <Col xs={12} sm={6} md={3} lg={2}>
            <Form.Label className="mb-1 small fw-semibold">Modelo</Form.Label>
            <Form.Select
              size="sm"
              value={filtros.modelo ?? ""}
              onChange={(e) => handleFiltro("modelo", e.target.value)}
            >
              <option value="">Todos los modelos</option>
              {modelosData.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </Form.Select>
          </Col>

          {/* Selector de acción */}
          <Col xs={12} sm={6} md={3} lg={2}>
            <Form.Label className="mb-1 small fw-semibold">
              Operación
            </Form.Label>
            <Form.Select
              size="sm"
              value={filtros.accion ?? ""}
              onChange={(e) => handleFiltro("accion", e.target.value)}
            >
              {OPCIONES_ACCION.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </Form.Select>
          </Col>

          {/* Usuario */}
          <Col xs={12} sm={6} md={2} lg={2}>
            <Form.Label className="mb-1 small fw-semibold">Usuario</Form.Label>
            <Form.Control
              size="sm"
              type="text"
              placeholder="Filtrar usuario..."
              value={filtros.usuario ?? ""}
              onChange={(e) => handleFiltro("usuario", e.target.value)}
            />
          </Col>

          {/* Fecha desde */}
          <Col xs={12} sm={6} md={2} lg={2}>
            <Form.Label className="mb-1 small fw-semibold">Desde</Form.Label>
            <Form.Control
              size="sm"
              type="date"
              value={filtros.fecha_desde ?? ""}
              onChange={(e) => handleFiltro("fecha_desde", e.target.value)}
            />
          </Col>

          {/* Fecha hasta */}
          <Col xs={12} sm={6} md={2} lg={2}>
            <Form.Label className="mb-1 small fw-semibold">Hasta</Form.Label>
            <Form.Control
              size="sm"
              type="date"
              value={filtros.fecha_hasta ?? ""}
              onChange={(e) => handleFiltro("fecha_hasta", e.target.value)}
            />
          </Col>

          {/* Botón limpiar */}
          {hayFiltrosActivos && (
            <Col xs="auto">
              <Form.Label className="mb-1 small d-block invisible">
                x
              </Form.Label>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleLimpiarFiltros}
                title="Limpiar filtros"
              >
                Limpiar
              </button>
            </Col>
          )}
        </Row>
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <div className="flex-grow-1 overflow-auto">
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : error ? (
          <Alert variant="danger">
            Error al cargar el historial de auditoría.
          </Alert>
        ) : registros.length === 0 ? (
          <Alert variant="info">
            {hayFiltrosActivos
              ? "No se encontraron registros con los filtros aplicados."
              : "No hay registros de auditoría todavía."}
          </Alert>
        ) : (
          <Table striped bordered hover responsive>
            <thead
              className="table-dark"
              style={{ position: "sticky", top: 0, zIndex: 1 }}
            >
              <tr>
                <th style={{ minWidth: "60px" }}>ID</th>
                <th style={{ minWidth: "140px" }}>Fecha</th>
                <th style={{ minWidth: "100px" }}>Modelo</th>
                <th style={{ minWidth: "110px" }}>Operación</th>
                <th style={{ minWidth: "90px" }}>Usuario</th>
                <th style={{ minWidth: "140px" }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => (
                <tr key={registro.id}>
                  <td className="small text-muted">#{registro.objeto_id}</td>
                  <td className="text-nowrap small">
                    {fmtFecha(registro.fecha)}
                  </td>
                  <td>
                    <Badge bg="light" text="dark">
                      {registro.modelo_display}
                    </Badge>
                  </td>
                  <td>
                    <AccionBadge
                      accion={registro.accion}
                      display={registro.accion_display}
                    />
                  </td>
                  <td className="small">{registro.usuario}</td>
                  <td>
                    <DetalleBadge
                      detalle={registro.detalle}
                      accion={registro.accion}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* ── Paginación ─────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="pt-2 pb-3">
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            pageItems={registros.length}
            itemLabel="registro(s)"
          />
        </div>
      )}
    </div>
  );
}

export default AuditoriaPage;
