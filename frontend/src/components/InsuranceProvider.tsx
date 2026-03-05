/**
 * @file InsuranceProvider.tsx
 * @description ABM completo para la gestión de Obras Sociales.
 */
import { useState } from "react";
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
import { Pencil, Search, Trash, XCircle } from "react-bootstrap-icons";
import { useDeleteObraSocial, useObrasSociales } from "../hooks/useVentas";
import type { ObraSocial } from "../services/ventas.service";
import AddButton from "./AddButton";
import ObraSocialFormModal from "./ObraSocialFormModal";

/**
 * Componente ABM para la gestión de Obras Sociales.
 *
 * @remarks
 * Permite listar, crear, editar y eliminar obras sociales.
 * Incluye búsqueda local por nombre. No requiere paginación
 * ya que el endpoint devuelve el listado completo sin paginar.
 */
function InsuranceProvider() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingObraSocial, setEditingObraSocial] = useState<ObraSocial | null>(
    null,
  );

  const { data: obrasSociales = [], isLoading, error } = useObrasSociales();
  const deleteObraSocial = useDeleteObraSocial();

  /** Obras sociales filtradas por el término de búsqueda local. */
  const filtered = obrasSociales.filter((os) =>
    os.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
        <Row className="mb-3 align-items-center">
          <Col>
            <h4 className="mb-0">
              Obras Sociales{" "}
              <Badge bg="secondary" pill>
                {obrasSociales.length}
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
        ) : filtered.length === 0 ? (
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
              {filtered.map((os) => (
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

      {/* Modal de formulario */}
      <ObraSocialFormModal
        show={showModal}
        onHide={handleCloseModal}
        obraSocial={editingObraSocial}
      />
    </div>
  );
}

export default InsuranceProvider;
