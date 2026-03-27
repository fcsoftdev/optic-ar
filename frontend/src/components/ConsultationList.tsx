/**
 * @file ConsultationList.tsx
 * @description ABM completo para la gestión de Consultas médicas.
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
  EyeFill,
  FileMedical,
  Pencil,
  Search,
  Trash,
  XCircle,
} from "react-bootstrap-icons";
import {
  useClientes,
  useConsultas,
  useDeleteConsulta,
} from "../hooks/useVentas";
import type { ConsultaList } from "../services/ventas.service";
import ListHeader from "./ListHeader";
import { usePermiso } from "../hooks/usePermiso";
import ConsultationFormModal from "./ConsultationFormModal";
import PaginationBar from "./PaginationBar";

type SortDir = "asc" | "desc";

const sortIcon = (key: string, sortKey: string, sortDir: SortDir) =>
  sortKey !== key ? " ⇅" : sortDir === "asc" ? " ↑" : " ↓";

/**
 * Componente ABM para la gestión del listado de Consultas médicas.
 *
 * @remarks
 * Implementa búsqueda con debounce (500ms), filtrado por rango de fechas
 * y paginación inteligente con elipsis. El layout utiliza flexbox
 * para que la tabla sea el único área scrollable.
 */
const ConsultationList: React.FC = () => {
  const { tienePermiso } = usePermiso();
  const puedeEditar = tienePermiso("ventas.change_consulta");
  const puedeEliminar = tienePermiso("ventas.delete_consulta");
  const hayAcciones = puedeEditar || puedeEliminar;
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState<ConsultaList | null>(
    null,
  );

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: consultasData,
    isLoading,
    error,
  } = useConsultas({
    page: currentPage,
    search: debouncedSearchTerm || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
  });

  // Carga todos los clientes (sin paginación) para el SearchableSelect del modal
  const { data: clientesData } = useClientes({ page: 1, page_size: 9999 });
  const deleteConsulta = useDeleteConsulta();

  const consultas = consultasData?.results || [];
  const totalPages = consultasData?.count
    ? Math.ceil(consultasData.count / 10)
    : 1;

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

  const sortedConsultas = [...consultas].sort((a, b) => {
    const av = (a as any)[sortKey];
    const bv = (b as any)[sortKey];
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = String(av).localeCompare(String(bv), "es", { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  /** Opciones formateadas para el selector de pacientes en el modal. */
  const clienteOptions = (clientesData?.results || []).map((c) => ({
    value: c.id,
    label: `${c.apellido}, ${c.nombre} (DNI: ${c.dni})`,
  }));

  /**
   * Abre el modal en modo edición con los datos de la consulta seleccionada.
   *
   * @param consulta - Consulta a editar.
   */
  const handleEdit = (consulta: ConsultaList) => {
    setEditingConsulta(consulta);
    setShowModal(true);
  };

  /**
   * Solicita confirmación y elimina la consulta si el usuario acepta.
   *
   * @param id - ID de la consulta a eliminar.
   * @param paciente - Nombre del paciente usado en el mensaje de confirmación.
   */
  const handleDelete = async (id: number, paciente: string) => {
    if (
      window.confirm(`¿Está seguro de eliminar la consulta de ${paciente}?`)
    ) {
      try {
        await deleteConsulta.mutateAsync(id);
      } catch {
        alert("Error al eliminar la consulta.");
      }
    }
  };

  /**
   * Cierra el modal y limpia la consulta en edición.
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConsulta(null);
  };

  /**
   * Resetea todos los filtros y vuelve a la primera página.
   */
  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setFechaDesde("");
    setFechaHasta("");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || fechaDesde || fechaHasta;

  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        Error al cargar consultas: {(error as Error).message}
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
      {/* Header y filtros — fijos arriba */}
      <div style={{ flex: "0 0 auto" }}>
        <ListHeader
          title="Consultas"
          count={consultasData?.count ?? 0}
          icon={<FileMedical size={26} viewBox="0 0 16 16" />}
          addLabel="Consulta"
          canAdd={tienePermiso("ventas.add_consulta")}
          onAdd={() => {
            setEditingConsulta(null);
            setShowModal(true);
          }}
        />

        <Row className="mb-3 g-2 align-items-end">
          <Col md={4}>
            <InputGroup>
              <InputGroup.Text>
                <Search size={16} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Buscar paciente o motivo..."
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
            <Form.Label className="small mb-1">Desde</Form.Label>
            <Form.Control
              type="date"
              size="sm"
              value={fechaDesde}
              onChange={(e) => {
                setFechaDesde(e.target.value);
                setCurrentPage(1);
              }}
            />
          </Col>

          <Col md={3}>
            <Form.Label className="small mb-1">Hasta</Form.Label>
            <Form.Control
              type="date"
              size="sm"
              value={fechaHasta}
              onChange={(e) => {
                setFechaHasta(e.target.value);
                setCurrentPage(1);
              }}
            />
          </Col>

          {hasActiveFilters && (
            <Col md="auto">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleClearFilters}
              >
                <XCircle size={14} className="me-1" />
                Limpiar filtros
              </Button>
            </Col>
          )}
        </Row>
      </div>

      {/* Tabla — área scrollable */}
      <div style={{ overflow: "auto", flex: "1 1 auto" }}>
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Cargando consultas...</p>
          </div>
        ) : consultas.length === 0 ? (
          <Alert variant="info">
            {hasActiveFilters
              ? "No se encontraron consultas con esos criterios."
              : "No hay consultas registradas."}
          </Alert>
        ) : (
          <Table striped bordered hover responsive>
            <thead
              className="table-dark"
              style={{ position: "sticky", top: 0, zIndex: 1 }}
            >
              <tr>
                <th
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSort("cliente_nombre")}
                >
                  Paciente{sortIcon("cliente_nombre", sortKey, sortDir)}
                </th>
                <th
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSort("fecha")}
                >
                  Fecha{sortIcon("fecha", sortKey, sortDir)}
                </th>
                <th>Motivo</th>
                <th>Diagnóstico</th>
                <th className="text-center">Grad.</th>
                {hayAcciones && <th style={{ width: "100px" }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {sortedConsultas.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.cliente_nombre}</strong>
                  </td>
                  <td className="text-nowrap">
                    {new Date(c.fecha + "T00:00:00").toLocaleDateString(
                      "es-AR",
                    )}
                  </td>
                  <td>
                    <span
                      title={c.motivo}
                      style={{
                        display: "block",
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.motivo}
                    </span>
                  </td>
                  <td>
                    {c.diagnostico ? (
                      <span
                        title={c.diagnostico}
                        style={{
                          display: "block",
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.diagnostico}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-center">
                    {c.tiene_graduacion ? (
                      <EyeFill
                        size={16}
                        className="text-primary"
                        title="Tiene graduación"
                      />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  {hayAcciones && (
                    <td>
                      <div className="d-flex gap-1">
                        {puedeEditar && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEdit(c)}
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </Button>
                        )}
                        {puedeEliminar && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(c.id, c.cliente_nombre)}
                            title="Eliminar"
                          >
                            <Trash size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Paginación — fija abajo */}
      {totalPages > 1 && (
        <div className="pt-2 pb-3">
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={consultasData?.count ?? 0}
            pageItems={consultas.length}
            itemLabel="consulta(s)"
          />
        </div>
      )}

      {/* Modal de formulario */}
      <ConsultationFormModal
        show={showModal}
        onHide={handleCloseModal}
        consulta={editingConsulta}
        clienteOptions={clienteOptions}
      />
    </div>
  );
};

export default ConsultationList;
