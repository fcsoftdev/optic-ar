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
import {
  Button,
  Col,
  Form,
  Row,
  Table,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import { PencilSquare, Trash } from "react-bootstrap-icons";
import { useMarcas, useDeleteMarca } from "../hooks/useProductos";
import AddButton from "./AddButton";
import MarcaFormModal from "./MarcaFormModal";
import PaginationBar from "./PaginationBar";
import type { Marca } from "../services/productos.service";

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

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando marcas...</span>
        </Spinner>
        <p className="mt-3">Cargando marcas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        Error al cargar las marcas. Por favor, intente nuevamente.
      </Alert>
    );
  }

  return (
    <>
      {/* Header con título y botón de crear */}
      <Row className="mb-3 align-items-center">
        <Col>
          <h4 className="mb-0">
            Marcas{" "}
            <Badge bg="secondary" pill>
              {!Array.isArray(data) && data?.count ? data.count : marcas.length}
            </Badge>
          </h4>
        </Col>
        <Col xs="auto">
          <AddButton label="Marca" onClick={handleAddMarca} />
        </Col>
      </Row>

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
          {selectedMarcas.length > 0 && (
            <Button variant="danger" onClick={handleDeleteSelected}>
              <Trash size={16} className="me-1" />
              Eliminar seleccionadas ({selectedMarcas.length})
            </Button>
          )}
        </Col>
      </Row>

      {/* Contenedor con scroll para la tabla */}
      <div
        style={{
          overflow: "auto",
          maxHeight: "calc(100vh - 300px)",
          border: "1px solid #dee2e6",
          borderRadius: "4px",
        }}
      >
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
          >
            <tr>
              <th style={{ width: "50px" }}>
                <Form.Check
                  type="checkbox"
                  checked={
                    marcas.length > 0 && selectedMarcas.length === marcas.length
                  }
                  onChange={handleSelectAll}
                />
              </th>
              <th style={{ width: "80px" }}>ID</th>
              <th>Nombre</th>
              <th style={{ width: "150px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {marcas.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted">
                  {debouncedSearchTerm
                    ? "No se encontraron marcas con ese criterio de búsqueda"
                    : "No hay marcas registradas. Agregue una nueva marca."}
                </td>
              </tr>
            ) : (
              marcas.map((marca) => (
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
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEditMarca(marca)}
                      title="Editar marca"
                    >
                      <PencilSquare size={14} />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteMarca(marca.id)}
                      title="Eliminar marca"
                    >
                      <Trash size={14} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Paginación */}
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

      {/* Modal de crear/editar marca */}
      <MarcaFormModal
        show={showModal}
        onHide={handleCloseModal}
        marca={editingMarca}
      />
    </>
  );
}

export default BrandList;
