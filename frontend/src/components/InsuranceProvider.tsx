/**
 * @file InsuranceProvider.tsx
 * @description ABM completo para la gestión de Obras Sociales.
 */
import React, { useEffect, useState } from "react";
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
  CardHeading,
  Pencil,
  Search,
  Trash,
  XCircle,
} from "react-bootstrap-icons";
import {
  useDeleteObraSocial,
  useObrasSocialesPaginadas,
} from "../hooks/useVentas";
import type { ObraSocial } from "../services/ventas.service";
import ListHeader from "./ListHeader";
import ObraSocialFormModal from "./ObraSocialFormModal";
import PaginationBar from "./PaginationBar";

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
        <ListHeader
          title="Obras Sociales"
          count={obrasSocialesData?.count ?? 0}
          icon={<CardHeading size={26} viewBox="0 0 16 16" />}
          addLabel="Obra Social"
          onAdd={() => {
            setEditingObraSocial(null);
            setShowModal(true);
          }}
        />

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
              className="table-dark"
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
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={obrasSocialesData?.count ?? 0}
          pageItems={obrasSociales.length}
          itemLabel="obra(s) social(es)"
        />
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
