import React, { useState, useEffect } from "react";
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
  useClientes,
  useDeleteCliente,
  useObrasSociales,
} from "../hooks/useVentas";
import type { Cliente } from "../services/ventas.service";
import AddButton from "./AddButton";
import ClienteFormModal from "./ClienteFormModal";
import SearchableSelect from "./SearchableSelect";

/**
 * Componente principal para la gestión del listado de Clientes/Pacientes.
 *
 * @remarks
 * Implementa búsqueda con debounce (500ms), filtrado por obra social
 * y paginación inteligente. El layout usa flexbox para que la tabla
 * sea la única área scrollable, manteniendo el header y la paginación fijos.
 */
const ClienteList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedObraSocial, setSelectedObraSocial] = useState<number | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Queries
  const {
    data: clientesData,
    isLoading,
    error,
  } = useClientes({
    page: currentPage,
    search: debouncedSearchTerm,
    obra_social: selectedObraSocial || undefined,
  });

  const { data: obrasSociales = [] } = useObrasSociales();
  const deleteCliente = useDeleteCliente();

  const clientes = clientesData?.results || [];
  const totalPages = clientesData?.count
    ? Math.ceil(clientesData.count / 10)
    : 1;

  /**
   * Abre el modal de edición precargado con los datos del cliente seleccionado.
   *
   * @param cliente - Objeto cliente a editar.
   */
  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setShowModal(true);
  };

  /**
   * Solicita confirmación al usuario y elimina el cliente si acepta.
   *
   * @param id - ID del cliente a eliminar.
   * @param nombre - Nombre del cliente, usado en el mensaje de confirmación.
   */
  const handleDelete = async (id: number, nombre: string) => {
    if (
      window.confirm(`¿Está seguro de eliminar al cliente/paciente ${nombre}?`)
    ) {
      try {
        await deleteCliente.mutateAsync(id);
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        alert("Error al eliminar el cliente. Puede estar asociado a ventas.");
      }
    }
  };

  /**
   * Cierra el modal de formulario y limpia el cliente en edición.
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCliente(null);
  };

  /**
   * Resetea todos los filtros activos y vuelve a la primera página.
   */
  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedObraSocial(null);
    setCurrentPage(1);
  };

  /**
   * Genera los items de paginación con elipsis inteligentes.
   *
   * @remarks
   * Muestra puntos suspensivos cuando hay muchas páginas para
   * no saturar la UI. Siempre muestra primera y última página.
   *
   * @returns Array de números de página intercalados con `"..."` donde corresponda.
   */
  const getPaginationItems = (): (number | string)[] => {
    const items: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
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
          Mostrando {clientes.length} de {clientesData?.count ?? 0} cliente(s)
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
        Error al cargar clientes: {(error as Error).message}
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
      {/* Header y filtros - fijos arriba */}
      <div style={{ flex: "0 0 auto" }}>
        {/* Header */}
        <Row className="mb-3 align-items-center">
          <Col>
            <h4 className="mb-0">
              Clientes/Pacientes{" "}
              <Badge bg="secondary" pill>
                {clientesData?.count ?? 0}
              </Badge>
            </h4>
          </Col>
          <Col xs="auto">
            <AddButton
              label="Cliente"
              onClick={() => {
                setEditingCliente(null);
                setShowModal(true);
              }}
            />
          </Col>
        </Row>

        {/* Filtros */}
        <Row className="mb-3 g-2">
          <Col md={4}>
            <InputGroup>
              <InputGroup.Text>
                <Search size={16} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Buscar por DNI, nombre o email..."
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

          <Col md={3}>
            <SearchableSelect
              options={obrasSociales.map((os) => ({
                value: os.id,
                label: os.nombre,
              }))}
              value={selectedObraSocial}
              onChange={setSelectedObraSocial}
              placeholder="Filtrar por Obra Social"
              isClearable={true}
            />
          </Col>

          <Col xs="auto">
            <Button variant="secondary" onClick={handleClearFilters}>
              Limpiar
            </Button>
          </Col>
        </Row>
      </div>

      {/* Tabla - área scrollable */}
      <div style={{ overflow: "auto", flex: "1 1 auto" }}>
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Cargando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <Alert variant="info">
            No se encontraron clientes con los filtros aplicados.
          </Alert>
        ) : (
          <Table striped bordered hover responsive>
            <thead
              className="table-light"
              style={{ position: "sticky", top: 0, zIndex: 1 }}
            >
              <tr>
                <th>DNI</th>
                <th>Nombre y Apellido</th>
                <th>Teléfono</th>
                <th>Obra Social</th>
                <th>Fecha Nacimiento</th>
                <th style={{ width: "120px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.dni}</td>
                  <td>{cliente.nombre_apellido}</td>
                  <td>{cliente.telefono || "-"}</td>
                  <td>{cliente.obra_social_nombre || "-"}</td>
                  <td>
                    {cliente.fecha_nacimiento
                      ? new Date(cliente.fecha_nacimiento).toLocaleDateString(
                          "es-AR",
                        )
                      : "-"}
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(cliente as any)}
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() =>
                          handleDelete(cliente.id, cliente.nombre_apellido)
                        }
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
      <ClienteFormModal
        show={showModal}
        onHide={handleCloseModal}
        cliente={editingCliente}
      />
    </div>
  );
};

export default ClienteList;
