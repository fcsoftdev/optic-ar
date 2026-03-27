/**
 * @file PurchaseList.tsx
 * @description ABM completo de Compras con búsqueda, paginación y formulario modal.
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
import { Bag, Pencil, Search, Trash, XCircle } from "react-bootstrap-icons";
import { useCompras, useDeleteCompra } from "../hooks/useCompras";
import type { CompraList } from "../services/compras.service";
import ListHeader from "./ListHeader";
import { usePermiso } from "../hooks/usePermiso";
import PaginationBar from "./PaginationBar";
import CompraFormModal from "./CompraFormModal";
import { useNavStore } from "../stores/useNavStore";
import { useLocation } from "react-router-dom";

/**
 * Formatea un número con separador de miles (.) y decimales (,) en formato argentino.
 */
const fmtARS = (valor: number | string): string => {
  const n = Number(valor);
  return Number.isFinite(n)
    ? n.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0,00";
};

/**
 * Componente principal para la gestión del listado de Compras.
 *
 * @remarks
 * Al eliminar una compra, el backend descuenta automáticamente el stock
 * de los productos involucrados mediante la señal Django `descontar_stock_al_eliminar_compra`.
 */
const PurchaseList: React.FC = () => {
  const { tienePermiso } = usePermiso();
  const puedeEditar = tienePermiso("compras.change_compra");
  const puedeEliminar = tienePermiso("compras.delete_compra");
  const hayAcciones = puedeEditar || puedeEliminar;
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCompra, setEditingCompra] = useState<CompraList | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Abrir compra solicitada desde historial de producto
  const { pendingCompraId, clearPendingCompraId } = useNavStore();
  const location = useLocation();
  const locationCompraId: number | null =
    (location.state as any)?.compraId ?? null;

  useEffect(() => {
    // Prioridad: state de react-router (navegación desde modal)
    const compraId = locationCompraId ?? pendingCompraId;
    if (compraId !== null) {
      const stub: CompraList = {
        id: compraId,
        fecha: "",
        proveedor: null,
        proveedor_nombre: "",
        cantidad_items: 0,
        total: "0",
      };
      setEditingCompra(stub);
      setShowModal(true);
      if (pendingCompraId !== null) clearPendingCompraId();
    }
  }, [locationCompraId, pendingCompraId]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: comprasData,
    isLoading,
    error,
  } = useCompras({
    page: currentPage,
    search: debouncedSearchTerm || undefined,
  });

  const deleteCompra = useDeleteCompra();

  const compras = comprasData?.results ?? [];
  const totalPages = comprasData?.count ? Math.ceil(comprasData.count / 10) : 1;

  const handleNuevaCompra = () => {
    setEditingCompra(null);
    setShowModal(true);
  };

  const handleEditar = (c: CompraList) => {
    setEditingCompra(c);
    setShowModal(true);
  };

  /**
   * Elimina la compra confirmada.
   * El backend revierte el stock automáticamente mediante la señal Django.
   */
  const handleConfirmarEliminar = async () => {
    if (deleteConfirmId == null) return;
    await deleteCompra.mutateAsync(deleteConfirmId);
    setDeleteConfirmId(null);
  };

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
          title="Compras"
          count={comprasData?.count ?? 0}
          icon={<Bag size={26} viewBox="0 0 16 16" />}
          addLabel="Compra"
          onAdd={handleNuevaCompra}
          canAdd={tienePermiso("compras.add_compra")}
        />

        <Row className="mt-3 g-2">
          <Col md={5}>
            <InputGroup>
              <InputGroup.Text>
                <Search size={15} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Buscar por proveedor..."
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
            <p className="mt-2 text-muted">Cargando compras...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            Error al cargar las compras: {(error as Error).message}
          </Alert>
        ) : compras.length === 0 ? (
          <Alert variant="info">
            {hayFiltros
              ? "No se encontraron compras para la búsqueda."
              : "No hay compras registradas. ¡Registrá la primera!"}
          </Alert>
        ) : (
          <Table striped bordered hover responsive size="sm">
            <thead
              className="table-dark"
              style={{ position: "sticky", top: 0, zIndex: 1 }}
            >
              <tr>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th className="text-center">Ítems</th>
                <th className="text-end">Total</th>
                {hayAcciones && <th style={{ width: "90px" }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => (
                <tr key={c.id}>
                  <td className="text-nowrap">
                    {new Date(c.fecha + "T00:00:00").toLocaleDateString(
                      "es-AR",
                    )}
                  </td>
                  <td>
                    {c.proveedor_nombre || (
                      <span className="text-muted fst-italic">
                        Sin proveedor
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    <Badge bg="info" text="dark">
                      {c.cantidad_items}
                    </Badge>
                  </td>
                  <td className="text-end fw-semibold">${fmtARS(c.total)}</td>
                  {hayAcciones && (
                    <td>
                      {deleteConfirmId === c.id ? (
                        <div className="d-flex gap-1">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={handleConfirmarEliminar}
                            disabled={deleteCompra.isPending}
                            title="Confirmar — se revertirá el stock"
                          >
                            {deleteCompra.isPending ? (
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
                              onClick={() => handleEditar(c)}
                              title="Editar compra"
                            >
                              <Pencil size={13} />
                            </Button>
                          )}
                          {puedeEliminar && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => setDeleteConfirmId(c.id)}
                              title="Eliminar compra (revierte el stock)"
                            >
                              <Trash size={13} />
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* ── Paginación ───────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="pt-2 pb-3">
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={comprasData?.count ?? 0}
            pageItems={compras.length}
            itemLabel="compra(s)"
          />
        </div>
      )}

      {/* ── Modal ────────────────────────────────────────────────────── */}
      <CompraFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        compra={editingCompra}
        onSuccess={() => setShowModal(false)}
      />
    </div>
  );
};

export default PurchaseList;
