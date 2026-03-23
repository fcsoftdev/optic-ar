/**
 * @file SuppliersList.tsx
 * @description ABM completo de Proveedores con búsqueda, paginación y formulario modal.
 */
import { useEffect, useState } from "react";
import {
  Alert,
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
  People,
  Search,
  Trash,
  XCircle,
} from "react-bootstrap-icons";
import {
  useCompras,
  useDeleteProveedor,
  useProveedores,
} from "../hooks/useCompras";
import type { CompraList, Proveedor } from "../services/compras.service";
import ListHeader from "./ListHeader";
import { usePermiso } from "../hooks/usePermiso";
import PaginationBar from "./PaginationBar";
import ProveedorComprasModal from "./ProveedorComprasModal";
import ProveedorFormModal from "./ProveedorFormModal";

/**
 * Componente ABM para la gestión del listado de Proveedores.
 *
 * @remarks
 * Implementa búsqueda con debounce (500ms) y paginación inteligente.
 * Un proveedor no puede eliminarse si tiene compras asociadas (el backend
 * responde con error 409 / PROTECT).
 */
function SuppliersList() {
  const { tienePermiso } = usePermiso();
  const puedeEditar = tienePermiso("compras.change_proveedor");
  const puedeEliminar = tienePermiso("compras.delete_proveedor");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(
    null,
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showComprasModal, setShowComprasModal] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(
    null,
  );

  const { data: comprasParaEliminar, isLoading: loadingCompras } = useCompras(
    deleteConfirmId != null
      ? { proveedor: deleteConfirmId, page_size: 100 }
      : undefined,
  );
  const comprasAsociadas: CompraList[] = comprasParaEliminar?.results ?? [];

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: proveedoresData,
    isLoading,
    error,
  } = useProveedores({
    page: currentPage,
    search: debouncedSearchTerm || undefined,
  });

  const deleteProveedor = useDeleteProveedor();

  const proveedores = proveedoresData?.results ?? [];
  const totalPages = proveedoresData?.count
    ? Math.ceil(proveedoresData.count / 10)
    : 1;

  /**
   * Abre el modal para crear un nuevo proveedor.
   */
  const handleNuevoProveedor = () => {
    setEditingProveedor(null);
    setShowModal(true);
  };

  /**
   * Abre el modal con los datos del proveedor para editar.
   *
   * @param proveedor - Proveedor a editar.
   */
  const handleEditar = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor);
    setShowModal(true);
  };

  /**
   * Elimina el proveedor confirmado. Si tiene compras asociadas, muestra error.
   */
  const handleConfirmarEliminar = async () => {
    if (deleteConfirmId == null) return;
    setDeleteError(null);
    try {
      await deleteProveedor.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch {
      setDeleteError(
        "No se puede eliminar el proveedor porque tiene compras asociadas.",
      );
    }
  };

  /**
   * Abre el modal de historial de compras del proveedor seleccionado.
   *
   * @param proveedor - Proveedor cuyas compras se desean ver.
   */
  const handleVerCompras = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setShowComprasModal(true);
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
          title="Proveedores"
          count={proveedoresData?.count ?? 0}
          icon={<People size={26} viewBox="0 0 16 16" />}
          addLabel="Proveedor"
          onAdd={handleNuevoProveedor}
          canAdd={tienePermiso("compras.add_proveedor")}
        />

        <Row className="g-2">
          <Col md={5}>
            <InputGroup>
              <InputGroup.Text>
                <Search size={15} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Buscar por nombre o alias..."
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

        {deleteError && (
          <Alert
            variant="danger"
            className="mt-2 mb-0"
            dismissible
            onClose={() => setDeleteError(null)}
          >
            {deleteError}
          </Alert>
        )}
      </div>

      {/* ── Tabla ────────────────────────────────────────────────────── */}
      <div className="flex-grow-1 overflow-auto">
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Cargando proveedores...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            Error al cargar proveedores: {(error as Error).message}
          </Alert>
        ) : proveedores.length === 0 ? (
          <Alert variant="info">
            {hayFiltros
              ? "No se encontraron proveedores para la búsqueda."
              : "No hay proveedores registrados. ¡Agregá el primero!"}
          </Alert>
        ) : (
          <Table striped bordered hover responsive size="sm">
            <thead
              className="table-dark"
              style={{ position: "sticky", top: 0, zIndex: 1 }}
            >
              <tr>
                <th>Nombre</th>
                <th>Alias</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th style={{ width: "110px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((p) => (
                <>
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{p.alias || <span className="text-muted">-</span>}</td>
                    <td>
                      {p.telefono || <span className="text-muted">-</span>}
                    </td>
                    <td>
                      {p.direccion || <span className="text-muted">-</span>}
                    </td>
                    <td>
                      {deleteConfirmId === p.id ? (
                        <div className="d-flex gap-1">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={handleConfirmarEliminar}
                            disabled={
                              deleteProveedor.isPending ||
                              loadingCompras ||
                              comprasAsociadas.length > 0
                            }
                            title={
                              comprasAsociadas.length > 0
                                ? "No se puede eliminar: tiene compras asociadas"
                                : "Confirmar eliminación"
                            }
                          >
                            {deleteProveedor.isPending ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              "Sí"
                            )}
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => {
                              setDeleteConfirmId(null);
                              setDeleteError(null);
                            }}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleVerCompras(p)}
                            title="Ver compras del proveedor"
                          >
                            <CartCheck size={13} />
                          </Button>
                          {puedeEditar && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEditar(p)}
                              title="Editar proveedor"
                            >
                              <Pencil size={13} />
                            </Button>
                          )}
                          {puedeEliminar && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                setDeleteConfirmId(p.id);
                              }}
                              title="Eliminar proveedor"
                            >
                              <Trash size={13} />
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                  {deleteConfirmId === p.id && (
                    <tr key={`warn-${p.id}`} className="table-warning">
                      <td colSpan={5} className="p-2">
                        {loadingCompras ? (
                          <div className="d-flex align-items-center gap-2">
                            <Spinner animation="border" size="sm" />
                            <span className="small">
                              Verificando compras asociadas...
                            </span>
                          </div>
                        ) : comprasAsociadas.length > 0 ? (
                          <>
                            <p className="mb-1 fw-semibold text-danger small">
                              ⚠ No se puede eliminar. Este proveedor tiene{" "}
                              {comprasAsociadas.length} compra
                              {comprasAsociadas.length !== 1 ? "s" : ""}{" "}
                              asociada
                              {comprasAsociadas.length !== 1 ? "s" : ""}.
                            </p>
                          </>
                        ) : (
                          <span className="small">
                            ¿Confirmar eliminación de{" "}
                            <strong>{p.nombre}</strong>? Esta acción no se puede
                            deshacer.
                          </span>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* ── Paginación ───────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mt-2">
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={proveedoresData?.count ?? 0}
            pageItems={proveedores.length}
            itemLabel="proveedor(es)"
          />
        </div>
      )}

      {/* ── Modales ──────────────────────────────────────────────────── */}
      <ProveedorFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        proveedor={editingProveedor}
      />

      <ProveedorComprasModal
        show={showComprasModal}
        onHide={() => setShowComprasModal(false)}
        proveedor={selectedProveedor}
      />
    </div>
  );
}

export default SuppliersList;
