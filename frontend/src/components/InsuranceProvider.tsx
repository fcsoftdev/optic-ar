/**
 * @file InsuranceProvider.tsx
 * @description ABM completo para la gestión de Obras Sociales.
 */
import React, { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Col,
  Form,
  InputGroup,
  Pagination,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { Pencil, Search, Trash, XCircle } from "react-bootstrap-icons";
import {
  useDeleteObraSocial,
  useObrasSocialesPaginadas,
} from "../hooks/useVentas";
import type { ObraSocial } from "../services/ventas.service";
import AddButton from "./AddButton";
import ObraSocialFormModal from "./ObraSocialFormModal";

/**
 * Componente ABM para la gestión de Obras Sociales.
 *
 * @remarks
 * Permite listar, crear, editar y eliminar obras sociales.
 * Incluye búsqueda con debounce (500ms) y paginación al estilo
 * del resto de los ABM del sistema.
 */
const InsuranceProvider: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingObraSocial, setEditingObraSocial] = useState<ObraSocial | null>(
    null,
  );

  /** Debounce para búsqueda (500ms) */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: obrasSocialesData,
    isLoading,
    error,
  } = useObrasSocialesPaginadas({
    page: currentPage,
    search: debouncedSearchTerm,
  });

  const deleteObraSocial = useDeleteObraSocial();

  const obrasSociales = obrasSocialesData?.results || [];
  const totalPages = obrasSocialesData?.count
    ? Math.ceil(obrasSocialesData.count / 10)
    : 1;

  /**
   * Abre el modal de edición con los datos de la obra social seleccionada.
   *
   * @param obraSocial - Obra social a editar.
   */
  const handleEdit = (obraSocial: ObraSocial) => {
    setEditingObraSocial(obraSocial);
    setShowModal(true);
  };

  /**
   * Solicita confirmación y elimina la obra social si el usuario acepta.
   *
   * @param id - ID de la obra social a eliminar.
   * @param nombre - Nombre usado en el mensaje de confirmación.
   */
  const handleDelete = async (id: number, nombre: string) => {
    if (
      window.confirm(`¿Está seguro de eliminar la obra social "${nombre}"?`)
    ) {
      try {
        await deleteObraSocial.mutateAsync(id);
      } catch {
        alert(
          "Error al eliminar la obra social. Puede estar asociada a clientes.",
        );
      }
    }
  };

  /**
   * Cierra el modal y limpia la obra social en edición.
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingObraSocial(null);
  };

  /**
   * Genera los items de paginación con elipsis inteligentes.
   *
   * @returns Array de números de página intercalados con `"..."` donde corresponda.
   */
  const getPaginationItems = (): (number | string)[] => {
    const items: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) items.push(i);
        items.push("...");
        items.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        items.push(1);
        items.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) items.push(i);
      } else {
        items.push(1);
        items.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) items.push(i);
        items.push("...");
        items.push(totalPages);
      }
    }
    return items;
  };

  /**
   * Renderiza el bloque de paginación con contador y controles Bootstrap.
   *
   * @returns JSX de la paginación o `null` si hay una sola página.
   */
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div
        className="d-flex justify-content-between align-items-center mt-4 pt-3"
        style={{ borderTop: "1px solid #dee2e6" }}
      >
        <div className="text-muted">
          Mostrando {obrasSociales.length} de {obrasSocialesData?.count ?? 0}{" "}
          obra(s) social(es)
        </div>
        <Pagination className="mb-0">
          <Pagination.First
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          />
          <Pagination.Prev
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          />
          {getPaginationItems().map((item, index) =>
            typeof item === "number" ? (
              <Pagination.Item
                key={index}
                active={item === currentPage}
                onClick={() => setCurrentPage(item)}
              >
                {item}
              </Pagination.Item>
            ) : (
              <Pagination.Ellipsis key={index} disabled />
            ),
          )}
          <Pagination.Next
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
          <Pagination.Last
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          />
        </Pagination>
      </div>
    );
  };

  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        Error al cargar obras sociales: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 100px)",
      }}
    >
      {/* Header y búsqueda - fijos arriba */}
      <div style={{ flex: "0 0 auto" }}>
        {/* Header */}
        <Row className="mb-3 align-items-center">
          <Col>
            <h4 className="mb-0">
              Obras Sociales{" "}
              <Badge bg="secondary" pill>
                {obrasSocialesData?.count ?? 0}
              </Badge>
            </h4>
          </Col>
          <Col xs="auto">
            <AddButton
              label="Obra Social"
              onClick={() => {
                setEditingObraSocial(null);
                setShowModal(true);
              }}
            />
          </Col>
        </Row>

        {/* Búsqueda */}
        <Row className="mb-3 g-2">
          <Col md={4}>
            <InputGroup>
              <InputGroup.Text>
                <Search size={16} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="outline-secondary"
                  onClick={() => setSearchTerm("")}
                >
                  <XCircle size={16} />
                </Button>
              )}
            </InputGroup>
          </Col>
        </Row>
      </div>

      {/* Tabla - área scrollable */}
      <div style={{ overflow: "auto", flex: "1 1 auto" }}>
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Cargando obras sociales...</p>
          </div>
        ) : obrasSociales.length === 0 ? (
          <Alert variant="info">
            {searchTerm
              ? "No se encontraron obras sociales con ese nombre."
              : "No hay obras sociales registradas."}
          </Alert>
        ) : (
          <Table striped bordered hover responsive>
            <thead
              className="table-light"
              style={{ position: "sticky", top: 0, zIndex: 1 }}
            >
              <tr>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th style={{ width: "120px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {obrasSociales.map((os) => (
                <tr key={os.id}>
                  <td>
                    <strong>{os.nombre}</strong>
                  </td>
                  <td>{os.direccion || "-"}</td>
                  <td>{os.telefono || "-"}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(os)}
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(os.id, os.nombre)}
                        title="Eliminar"
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Paginación - fija abajo */}
      <div style={{ flex: "0 0 auto", marginTop: "auto" }}>
        {renderPagination()}
      </div>

      {/* Modal de formulario */}
      <ObraSocialFormModal
        show={showModal}
        onHide={handleCloseModal}
        obraSocial={editingObraSocial}
      />
    </div>
  );
};

export default InsuranceProvider;
