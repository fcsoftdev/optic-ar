/**
 * @file ExpensesList.tsx
 * @description ABM completo de Gastos con búsqueda, paginación y formulario modal.
 */
import { useEffect, useState } from "react";
import React from "react";
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
import { Cash, Pencil, Search, Trash, XCircle } from "react-bootstrap-icons";
import { useDeleteGasto, useGastos } from "../hooks/useCompras";
import type { Gasto } from "../services/compras.service";
import GastoFormModal from "./GastoFormModal";
import ListHeader from "./ListHeader";
import { usePermiso } from "../hooks/usePermiso";
import PaginationBar from "./PaginationBar";

/** Formatea un valor a pesos argentinos con 2 decimales. */
const fmtARS = (value: string | number) =>
  `$ ${parseFloat(String(value)).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type SortDir = "asc" | "desc";

const sortIcon = (key: string, sortKey: string, sortDir: SortDir) =>
  sortKey !== key ? " ⇅" : sortDir === "asc" ? " ↑" : " ↓";

/**
 * Componente ABM para la gestión del listado de Gastos.
 *
 * @remarks
 * Implementa búsqueda con debounce (500ms) y paginación inteligente.
 */
function ExpensesList() {
  const { tienePermiso } = usePermiso();
  const puedeEditar = tienePermiso("compras.change_gasto");
  const puedeEliminar = tienePermiso("compras.delete_gasto");
  const hayAcciones = puedeEditar || puedeEliminar;
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: gastosData,
    isLoading,
    error,
  } = useGastos({
    page: currentPage,
    search: debouncedSearchTerm || undefined,
  });

  const deleteGasto = useDeleteGasto();

  const gastos = gastosData?.results ?? [];
  const totalPages = gastosData?.count ? Math.ceil(gastosData.count / 10) : 1;

  const [sortKey, setSortKey] = useState("fecha");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedGastos = [...gastos].sort((a, b) => {
    const av = (a as any)[sortKey];
    const bv = (b as any)[sortKey];
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = String(av).localeCompare(String(bv), "es", { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  /** Abre el modal para crear un nuevo gasto. */
  const handleNuevoGasto = () => {
    setEditingGasto(null);
    setShowModal(true);
  };

  /**
   * Abre el modal con los datos del gasto para editar.
   *
   * @param gasto - Gasto a editar.
   */
  const handleEdit = (gasto: Gasto) => {
    setEditingGasto(gasto);
    setDeleteConfirmId(null);
    setShowModal(true);
  };

  /**
   * Activa la fila de confirmación de eliminación.
   *
   * @param id - ID del gasto a eliminar.
   */
  const handleDeleteRequest = (id: number) => {
    setDeleteConfirmId(id);
    setDeleteError(null);
  };

  /** Confirma y ejecuta la eliminación del gasto. */
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteGasto.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
      setDeleteError(null);
    } catch {
      setDeleteError("No se pudo eliminar el gasto.");
    }
  };

  return (
    <div
      className="d-flex flex-column"
      style={{ height: "calc(100vh - 80px)" }}
    >
      {/* ── Encabezado / Filtros ────────────────────────────────────── */}
      <div className="mb-3">
        <ListHeader
          title="Listado de Gastos"
          count={gastosData?.count ?? 0}
          icon={<Cash size={26} viewBox="0 0 16 16" />}
          addLabel="Gasto"
          onAdd={handleNuevoGasto}
          canAdd={tienePermiso("compras.add_gasto")}
        />

        {/* Barra de búsqueda */}
        <Row className="mt-3">
          <Col>
            <InputGroup>
              <InputGroup.Text>
                <Search />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Buscar por descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="outline-secondary"
                  onClick={() => setSearchTerm("")}
                >
                  <XCircle />
                </Button>
              )}
            </InputGroup>
          </Col>
        </Row>

        {/* Error global */}
        {deleteError && (
          <Alert
            variant="danger"
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
          </div>
        ) : error ? (
          <Alert variant="danger">Error al cargar los gastos.</Alert>
        ) : gastos.length === 0 ? (
          <Alert variant="info">No se encontraron gastos.</Alert>
        ) : (
          <Table striped bordered hover responsive>
            <thead
              className="table-dark"
              style={{ position: "sticky", top: 0, zIndex: 1 }}
            >
              <tr>
                <th
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSort("fecha")}
                >
                  Fecha{sortIcon("fecha", sortKey, sortDir)}
                </th>
                <th
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSort("descripcion")}
                >
                  Descripción{sortIcon("descripcion", sortKey, sortDir)}
                </th>
                <th
                  className="text-end"
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSort("total")}
                >
                  Total{sortIcon("total", sortKey, sortDir)}
                </th>
                {hayAcciones && <th className="text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {sortedGastos.map((gasto) => (
                <React.Fragment key={gasto.id}>
                  <tr>
                    <td>
                      {new Date(gasto.fecha + "T00:00:00").toLocaleDateString(
                        "es-AR",
                      )}
                    </td>
                    <td>{gasto.descripcion}</td>
                    <td className="text-end">{fmtARS(gasto.total)}</td>
                    {hayAcciones && (
                      <td className="text-center">
                        {puedeEditar && (
                          <Button
                            size="sm"
                            variant="outline-warning"
                            className="me-1"
                            title="Editar"
                            onClick={() => handleEdit(gasto)}
                          >
                            <Pencil />
                          </Button>
                        )}
                        {puedeEliminar && (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            title="Eliminar"
                            onClick={() => handleDeleteRequest(gasto.id)}
                          >
                            <Trash />
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>

                  {/* Fila de confirmación de eliminación */}
                  {deleteConfirmId === gasto.id && (
                    <tr key={`confirm-${gasto.id}`} className="table-warning">
                      <td colSpan={4}>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span>
                            ¿Eliminar el gasto{" "}
                            <strong>{gasto.descripcion}</strong>?
                          </span>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={handleDeleteConfirm}
                            disabled={deleteGasto.isPending}
                          >
                            {deleteGasto.isPending ? (
                              <Spinner size="sm" animation="border" />
                            ) : (
                              "Sí, eliminar"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}{" "}
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
            totalItems={gastosData?.count ?? 0}
            pageItems={gastos.length}
            itemLabel="gasto(s)"
          />
        </div>
      )}

      {/* Modal de formulario */}
      <GastoFormModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditingGasto(null);
        }}
        gasto={editingGasto}
      />
    </div>
  );
}

export default ExpensesList;
