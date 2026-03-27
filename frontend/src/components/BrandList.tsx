/**
 * @file BrandList.tsx
 * @description Componente para listar y gestionar marcas de productos.
 *
 * Características:
 * - Búsqueda en tiempo real con debounce
 * - CRUD completo (Crear, Leer, Actualizar, Eliminar)
 * - Selección múltiple para eliminación masiva
 * - Paginación (10 items por página)
 * - Manejo de estados de carga y errores
 * - Integración con React Query para cache optimizado
 */
import React, { useState, useEffect } from "react";
import { Button, Col, Form, Row, Table, Spinner, Alert } from "react-bootstrap";
import { PencilSquare, Tags, Trash } from "react-bootstrap-icons";
import { useMarcas, useDeleteMarca } from "../hooks/useProductos";
import ListHeader from "./ListHeader";
import { usePermiso } from "../hooks/usePermiso";
import MarcaFormModal from "./MarcaFormModal";
import PaginationBar from "./PaginationBar";
import type { Marca } from "../services/productos.service";

type SortDir = "asc" | "desc";

const sortIcon = (key: string, sortKey: string, sortDir: SortDir) =>
  sortKey !== key ? " ⇅" : sortDir === "asc" ? " ↑" : " ↓";

/**
 * Componente BrandList - Lista de marcas con ABM completo.
 *
 * Permite:
 * - Ver listado de todas las marcas
 * - Buscar marcas por nombre
 * - Crear nuevas marcas
 * - Editar marcas existentes
 * - Eliminar marcas (individual o múltiple)
 */
function BrandList() {
  const { tienePermiso } = usePermiso();
  const puedeEditar = tienePermiso("productos.change_marca");
  const puedeEliminar = tienePermiso("productos.delete_marca");
  const hayAcciones = puedeEditar || puedeEliminar;
  const [selectedMarcas, setSelectedMarcas] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null);

  // Debounce para el término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset a la primera página al buscar
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Obtener marcas desde API con React Query (con paginación)
  const { data, isLoading, error } = useMarcas({
    page: currentPage,
    search: debouncedSearchTerm || undefined,
  });
  const deleteMarca = useDeleteMarca();

  // Extraer marcas y total de la respuesta paginada o usar array simple
  const marcas = Array.isArray(data) ? data : data?.results || [];
  const totalPages =
    !Array.isArray(data) && data?.count ? Math.ceil(data.count / 10) : 0;

  const [sortKey, setSortKey] = useState("nombre");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedMarcas = [...marcas].sort((a, b) => {
    const av = (a as any)[sortKey];
    const bv = (b as any)[sortKey];
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = String(av).localeCompare(String(bv), "es", { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  /**
   * Seleccionar/deseleccionar todas las marcas de la página actual
   */
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedMarcas(marcas.map((m) => m.id));
    } else {
      setSelectedMarcas([]);
    }
  };

  /**
   * Seleccionar/deseleccionar una marca individual
   */
  const handleSelectMarca = (marcaId: number) => {
    if (selectedMarcas.includes(marcaId)) {
      setSelectedMarcas(selectedMarcas.filter((id) => id !== marcaId));
    } else {
      setSelectedMarcas([...selectedMarcas, marcaId]);
    }
  };

  /**
   * Eliminar una marca con confirmación
   */
  const handleDeleteMarca = (marcaId: number) => {
    if (confirm("¿Está seguro de eliminar esta marca?")) {
      deleteMarca.mutate(marcaId);
      setSelectedMarcas(selectedMarcas.filter((id) => id !== marcaId));
    }
  };

  /**
   * Eliminar marcas seleccionadas con confirmación
   */
  const handleDeleteSelected = () => {
    if (
      confirm(`¿Está seguro de eliminar ${selectedMarcas.length} marca(s)?`)
    ) {
      selectedMarcas.forEach((id) => {
        deleteMarca.mutate(id);
      });
      setSelectedMarcas([]);
    }
  };

  /**
   * Abrir modal para editar marca
   */
  const handleEditMarca = (marca: Marca) => {
    setEditingMarca(marca);
    setShowModal(true);
  };

  /**
   * Abrir modal para crear nueva marca
   */
  const handleAddMarca = () => {
    setEditingMarca(null);
    setShowModal(true);
  };

  /**
   * Cerrar modal y resetear estado
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMarca(null);
  };

  /**
   * Cambiar de página
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className="d-flex flex-column"
      style={{ height: "calc(100vh - 80px)" }}
    >
      {/* Header con título y botón de crear */}
      <ListHeader
        title="Marcas"
        count={!Array.isArray(data) && data?.count ? data.count : marcas.length}
        icon={<Tags size={26} viewBox="0 0 16 16" />}
        addLabel="Marca"
        onAdd={handleAddMarca}
        canAdd={tienePermiso("productos.add_marca")}
      />

      {/* Barra de búsqueda y acciones */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Buscar marca por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col md={6} className="text-end">
          {puedeEliminar && selectedMarcas.length > 0 && (
            <Button variant="danger" onClick={handleDeleteSelected}>
              <Trash size={16} className="me-1" />
              Eliminar seleccionadas ({selectedMarcas.length})
            </Button>
          )}
        </Col>
      </Row>

      {/* Tabla */}
      <div className="flex-grow-1 overflow-auto">
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Cargando marcas...</span>
            </Spinner>
            <p className="mt-3">Cargando marcas...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            Error al cargar las marcas. Por favor, intente nuevamente.
          </Alert>
        ) : (
          <Table
            striped
            bordered
            hover
            style={{ minWidth: "600px", marginBottom: 0 }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                backgroundColor: "#fff",
                zIndex: 1,
                boxShadow: "0 2px 2px -1px rgba(0, 0, 0, 0.1)",
              }}
              className="table-dark"
            >
              <tr>
                <th style={{ width: "50px" }}>
                  <Form.Check
                    type="checkbox"
                    checked={
                      marcas.length > 0 &&
                      selectedMarcas.length === marcas.length
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th
                  style={{
                    width: "80px",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onClick={() => handleSort("id")}
                >
                  #{sortIcon("id", sortKey, sortDir)}
                </th>
                <th
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSort("nombre")}
                >
                  Nombre{sortIcon("nombre", sortKey, sortDir)}
                </th>
                {hayAcciones && <th style={{ width: "150px" }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {marcas.length === 0 ? (
                <tr>
                  <td
                    colSpan={hayAcciones ? 4 : 3}
                    className="text-center text-muted"
                  >
                    {debouncedSearchTerm
                      ? "No se encontraron marcas con ese criterio de búsqueda"
                      : "No hay marcas registradas. Agregue una nueva marca."}
                  </td>
                </tr>
              ) : (
                sortedMarcas.map((marca) => (
                  <tr key={marca.id}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selectedMarcas.includes(marca.id)}
                        onChange={() => handleSelectMarca(marca.id)}
                      />
                    </td>
                    <td>{marca.id}</td>
                    <td>
                      <strong>{marca.nombre}</strong>
                    </td>
                    {hayAcciones && (
                      <td>
                        {puedeEditar && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEditMarca(marca)}
                            title="Editar marca"
                          >
                            <PencilSquare size={14} />
                          </Button>
                        )}
                        {puedeEliminar && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteMarca(marca.id)}
                            title="Eliminar marca"
                          >
                            <Trash size={14} />
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pt-2 pb-3">
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={
              !Array.isArray(data) && data?.count ? data.count : marcas.length
            }
            pageItems={marcas.length}
            itemLabel="marca(s)"
          />
        </div>
      )}

      {/* Modal de crear/editar marca */}
      <MarcaFormModal
        show={showModal}
        onHide={handleCloseModal}
        marca={editingMarca}
      />
    </div>
  );
}

export default BrandList;
