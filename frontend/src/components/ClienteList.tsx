import React, { useState, useEffect } from "react";
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
  Pencil,
  ClipboardPulse,
  People,
  Search,
  Trash,
  XCircle,
} from "react-bootstrap-icons";
import {
  useClientes,
  useDeleteCliente,
  useObrasSociales,
} from "../hooks/useVentas";
import type {
  Cliente,
  ClienteList as ClienteListType,
  ConsultaList,
} from "../services/ventas.service";
import ListHeader from "./ListHeader";
import { usePermiso } from "../hooks/usePermiso";
import ClienteConsultasModal from "./ClienteConsultasModal";
import ClienteFormModal from "./ClienteFormModal";
import ConsultationFormModal from "./ConsultationFormModal";
import PaginationBar from "./PaginationBar";
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
  const { tienePermiso } = usePermiso();
  const puedeEditar = tienePermiso("ventas.change_cliente");
  const puedeEliminar = tienePermiso("ventas.delete_cliente");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedObraSocial, setSelectedObraSocial] = useState<number | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [showConsultasModal, setShowConsultasModal] = useState(false);
  const [selectedCliente, setSelectedCliente] =
    useState<ClienteListType | null>(null);
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState<ConsultaList | null>(
    null,
  );
  const [preselectedClienteId, setPreselectedClienteId] = useState<
    number | undefined
  >(undefined);

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
  const { data: todosLosClientes } = useClientes({ page_size: 9999 });
  const deleteCliente = useDeleteCliente();

  const clienteOptions = (todosLosClientes?.results || []).map((c) => ({
    value: c.id,
    label: `${c.apellido}, ${c.nombre} (DNI: ${c.dni})`,
  }));

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
   * Abre el modal de historial de consultas del cliente seleccionado.
   *
   * @param cliente - Cliente cuyas consultas se desean ver.
   */
  const handleVerConsultas = (cliente: ClienteListType) => {
    setSelectedCliente(cliente);
    setShowConsultasModal(true);
  };

  /**
   * Cierra el modal de consultas y abre el formulario de nueva consulta
   * con el cliente preseleccionado.
   *
   * @param clienteId - ID del cliente a preseleccionar.
   */
  const handleNuevaConsulta = (clienteId: number) => {
    setShowConsultasModal(false);
    setEditingConsulta(null);
    setPreselectedClienteId(clienteId);
    setShowConsultationForm(true);
  };

  /**
   * Cierra el modal de consultas y abre el formulario de edición
   * con los datos de la consulta seleccionada.
   *
   * @param consulta - Consulta a editar.
   */
  const handleEditarConsulta = (consulta: ConsultaList) => {
    setShowConsultasModal(false);
    setPreselectedClienteId(undefined);
    setEditingConsulta(consulta);
    setShowConsultationForm(true);
  };

  /**
   * Cierra el formulario de consulta y vuelve al historial del cliente.
   */
  const handleCloseConsultationForm = () => {
    setShowConsultationForm(false);
    setEditingConsulta(null);
    setPreselectedClienteId(undefined);
    if (selectedCliente) setShowConsultasModal(true);
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
        height: "calc(100vh - 80px)",
      }}
    >
      {/* Header y filtros - fijos arriba */}
      <div style={{ flex: "0 0 auto" }}>
        {/* Header */}
        <ListHeader
          title="Clientes/Pacientes"
          count={clientesData?.count ?? 0}
          icon={<People size={26} viewBox="0 0 16 16" />}
          addLabel="Cliente"
          canAdd={tienePermiso("ventas.add_cliente")}
          onAdd={() => {
            setEditingCliente(null);
            setShowModal(true);
          }}
        />

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
              className="table-dark"
              style={{ position: "sticky", top: 0, zIndex: 1 }}
            >
              <tr>
                <th>DNI</th>
                <th>Apellido</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Obra Social</th>
                <th>Fecha Nacimiento</th>
                <th style={{ width: "140px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.dni}</td>
                  <td>{cliente.apellido}</td>
                  <td>{cliente.nombre}</td>
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
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleVerConsultas(cliente)}
                        title="Ver consultas"
                      >
                        <ClipboardPulse size={14} />
                      </Button>
                      {puedeEditar && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEdit(cliente as any)}
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </Button>
                      )}
                      {puedeEliminar && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() =>
                            handleDelete(
                              cliente.id,
                              `${cliente.apellido}, ${cliente.nombre}`,
                            )
                          }
                          title="Eliminar"
                        >
                          <Trash size={14} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Paginación - fija abajo */}
      {totalPages > 1 && (
        <div className="pt-2 pb-3">
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={clientesData?.count ?? 0}
            pageItems={clientes.length}
            itemLabel="cliente(s)"
          />
        </div>
      )}

      {/* Modal de formulario */}
      <ClienteFormModal
        show={showModal}
        onHide={handleCloseModal}
        cliente={editingCliente}
      />

      {/* Modal de historial de consultas */}
      <ClienteConsultasModal
        show={showConsultasModal}
        onHide={() => setShowConsultasModal(false)}
        cliente={selectedCliente}
        onNuevaConsulta={handleNuevaConsulta}
        onEditarConsulta={handleEditarConsulta}
      />

      {/* Modal de formulario de consulta */}
      <ConsultationFormModal
        show={showConsultationForm}
        onHide={handleCloseConsultationForm}
        clienteOptions={clienteOptions}
        consulta={editingConsulta}
        defaultClienteId={preselectedClienteId}
      />
    </div>
  );
};

export default ClienteList;
