/**
 * @file SalesList.tsx
 * @description ABM completo de Ventas con búsqueda, paginación y formulario modal.
 */
import React, { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Col,
  Form,
  InputGroup,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  CartCheck,
  Pencil,
  Search,
  Trash,
  XCircle,
} from "react-bootstrap-icons";
import { useDeleteVenta, useVentas } from "../hooks/useVentas";
import type { VentaList } from "../services/ventas.service";
import ListHeader from "./ListHeader";
import { usePermiso } from "../hooks/usePermiso";
import PaginationBar from "./PaginationBar";
import VentaFormModal from "./VentaFormModal";

/**
 * Componente principal para la gestión del listado de Ventas.
 *
 * @remarks
 * Implementa búsqueda con debounce (500ms) y paginación inteligente.
 * Al eliminar una venta, el backend restaura automáticamente el stock
 * de los productos involucrados mediante la señal Django.
 */
const SalesList: React.FC = () => {
  const { tienePermiso } = usePermiso();
  const puedeEditar = tienePermiso("ventas.change_venta");
  const puedeEliminar = tienePermiso("ventas.delete_venta");
  const hayAcciones = puedeEditar || puedeEliminar;
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingVenta, setEditingVenta] = useState<VentaList | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: ventasData,
    isLoading,
    error,
  } = useVentas({
    page: currentPage,
    search: debouncedSearchTerm || undefined,
  });

  const deleteVenta = useDeleteVenta();

  const ventas = ventasData?.results ?? [];
  const totalPages = ventasData?.count ? Math.ceil(ventasData.count / 10) : 1;

  /**
   * Abre el modal para crear una venta nueva.
   */
  const handleNuevaVenta = () => {
    setEditingVenta(null);
    setShowModal(true);
  };

  /**
   * Abre el modal con los datos de la venta para editar.
   *
   * @param v - Venta a editar.
   */
  const handleEditar = (v: VentaList) => {
    setEditingVenta(v);
    setShowModal(true);
  };

  /**
   * Elimina la venta confirmada. El stock se restaura en el backend.
   */
  const handleConfirmarEliminar = async () => {
    if (deleteConfirmId == null) return;
    await deleteVenta.mutateAsync(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  /**
   * Limpia el filtro de búsqueda y vuelve a la primera página.
   */
  const handleLimpiar = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setCurrentPage(1);
  };

  const hayFiltros = !!debouncedSearchTerm;

  return (
    <div
      className="d-flex flex-column"
      style={{ height: "calc(100vh - 80px)" }}
    >
      {/* ── Encabezado / Filtros ────────────────────────────────────── */}
      <div className="mb-3">
        <ListHeader
          title="Ventas"
          count={ventasData?.count ?? 0}
          icon={<CartCheck size={26} viewBox="0 0 16 16" />}
          addLabel="Venta"
          onAdd={handleNuevaVenta}
          canAdd={tienePermiso("ventas.add_venta")}
        />

        <Row className="mt-3 g-2">
          <Col md={5}>
            <InputGroup>
              <InputGroup.Text>
                <Search size={15} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Buscar por cliente o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="outline-secondary"
                  onClick={handleLimpiar}
                  title="Limpiar búsqueda"
                >
                  <XCircle size={15} />
                </Button>
              )}
            </InputGroup>
          </Col>
          {hayFiltros && (
            <Col xs="auto">
              <Button variant="outline-secondary" onClick={handleLimpiar}>
                <XCircle size={14} className="me-1" />
                Limpiar
              </Button>
            </Col>
          )}
        </Row>
      </div>

      {/* ── Tabla ────────────────────────────────────────────────────── */}
      <div className="flex-grow-1 overflow-auto">
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Cargando ventas...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            Error al cargar las ventas: {(error as Error).message}
          </Alert>
        ) : ventas.length === 0 ? (
          <Alert variant="info">
            {hayFiltros
              ? "No se encontraron ventas para la búsqueda."
              : "No hay ventas registradas. ¡Creá la primera!"}
          </Alert>
        ) : (
          <Table striped bordered hover responsive size="sm">
            <thead
              className="table-dark"
              style={{ position: "sticky", top: 0, zIndex: 1 }}
            >
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Forma de pago</th>
                <th className="text-end">Total</th>
                <th className="text-end">Entregó</th>
                <th className="text-end">Saldo</th>
                {hayAcciones && <th style={{ width: "90px" }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => {
                const saldo = Number(v.saldo);
                return (
                  <tr key={v.id}>
                    <td className="text-nowrap">
                      {new Date(v.fecha).toLocaleDateString("es-AR")}
                    </td>
                    <td>{v.cliente_nombre}</td>
                    <td>
                      <Badge bg="secondary">{v.forma_pago_display}</Badge>
                    </td>
                    <td className="text-end fw-semibold">
                      ${Number(v.total_venta).toFixed(2)}
                    </td>
                    <td className="text-end">
                      ${Number(v.entrego).toFixed(2)}
                    </td>
                    <td
                      className={`text-end fw-semibold ${
                        saldo < 0
                          ? "text-danger"
                          : saldo > 0
                            ? "text-success"
                            : ""
                      }`}
                    >
                      ${saldo.toFixed(2)}
                    </td>
                    {hayAcciones && (
                      <td>
                        {deleteConfirmId === v.id ? (
                          <div className="d-flex gap-1">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={handleConfirmarEliminar}
                              disabled={deleteVenta.isPending}
                              title="Confirmar eliminación"
                            >
                              {deleteVenta.isPending ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                "Sí"
                              )}
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              No
                            </Button>
                          </div>
                        ) : (
                          <div className="d-flex gap-1">
                            {puedeEditar && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditar(v)}
                                title="Editar venta"
                              >
                                <Pencil size={13} />
                              </Button>
                            )}
                            {puedeEliminar && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => setDeleteConfirmId(v.id)}
                                title="Eliminar venta (devuelve stock)"
                              >
                                <Trash size={13} />
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>

      {/* ── Paginación ───────────────────────────────────────────────── */}
      {!isLoading && ventas.length > 0 && (
        <div className="mt-2">
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={ventasData?.count ?? 0}
            pageItems={ventas.length}
            itemLabel="venta(s)"
          />
        </div>
      )}

      {/* ── Modal crear / editar ─────────────────────────────────────── */}
      <VentaFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        venta={editingVenta}
        onSuccess={() => setShowModal(false)}
      />
    </div>
  );
};

export default SalesList;
