/**
 * @file ClienteConsultasModal.tsx
 * @description Modal que muestra el historial de consultas de un cliente/paciente.
 */
import React, { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Dropdown,
  Modal,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  EyeFill,
  FileEarmarkExcel,
  FileEarmarkPdf,
  FileEarmarkText,
  Pencil,
  PlusCircle,
} from "react-bootstrap-icons";
import { useConsultas } from "../hooks/useVentas";
import useExportConsultas from "../hooks/useExportConsultas";
import type { ClienteList, ConsultaList } from "../services/ventas.service";
import PaginationBar from "./PaginationBar";

/**
 * Props del componente ClienteConsultasModal.
 */
interface ClienteConsultasModalProps {
  /** Controla la visibilidad del modal. */
  show: boolean;
  /** Callback ejecutado al cerrar el modal. */
  onHide: () => void;
  /** Cliente/paciente cuyas consultas se muestran. */
  cliente: ClienteList | null;
  /** Callback para agregar una nueva consulta al cliente. */
  onNuevaConsulta: (clienteId: number) => void;
  /** Callback para editar una consulta existente. */
  onEditarConsulta: (consulta: ConsultaList) => void;
}

/**
 * Modal que lista el historial de consultas de un cliente/paciente.
 *
 * @remarks
 * Carga las consultas filtrando por `cliente` usando el hook `useConsultas`.
 * Incluye paginación y botones para agregar o editar consultas, delegando
 * la acción al componente padre.
 *
 * @param props - Ver {@link ClienteConsultasModalProps}.
 */
const ClienteConsultasModal: React.FC<ClienteConsultasModalProps> = ({
  show,
  onHide,
  cliente,
  onNuevaConsulta,
  onEditarConsulta,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [exportando, setExportando] = useState(false);

  const { exportarPDF, exportarExcel, exportarCSV } = useExportConsultas();

  const { data, isLoading, error } = useConsultas({
    cliente: cliente?.id,
    page: currentPage,
    page_size: 10,
  });

  const consultas = data?.results || [];
  const totalPages = data?.count ? Math.ceil(data.count / 10) : 1;

  /**
   * Cierra el modal y resetea la página.
   */
  const handleClose = () => {
    setCurrentPage(1);
    onHide();
  };

  /**
   * Ejecuta una función de exportación mostrando un estado de carga.
   *
   * @param fn - Función async de exportación a ejecutar.
   */
  const handleExport = async (fn: () => Promise<void>) => {
    if (!cliente) return;
    setExportando(true);
    try {
      await fn();
    } finally {
      setExportando(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          Historial de Consultas —{" "}
          <span className="text-primary">
            {cliente?.apellido}, {cliente?.nombre}
          </span>{" "}
          <Badge bg="secondary" pill>
            {data?.count ?? 0}
          </Badge>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ minHeight: "300px" }}>
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Cargando consultas...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            Error al cargar las consultas: {(error as Error).message}
          </Alert>
        ) : consultas.length === 0 ? (
          <Alert variant="info">
            Este paciente no tiene consultas registradas.
          </Alert>
        ) : (
          <>
            <Table striped bordered hover responsive size="sm">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Motivo</th>
                  <th>Diagnóstico</th>
                  <th style={{ width: "60px" }}>Grad.</th>
                  <th style={{ width: "80px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {consultas.map((c) => (
                  <tr key={c.id}>
                    <td className="text-nowrap">
                      {new Date(c.fecha).toLocaleDateString("es-AR")}
                    </td>
                    <td
                      style={{
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={c.motivo}
                    >
                      {c.motivo}
                    </td>
                    <td
                      style={{
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={c.diagnostico}
                    >
                      {c.diagnostico || "-"}
                    </td>
                    <td className="text-center">
                      {c.tiene_graduacion ? (
                        <EyeFill
                          size={16}
                          className="text-primary"
                          title="Tiene graduación"
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => onEditarConsulta(c)}
                        title="Editar consulta"
                      >
                        <Pencil size={13} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={data?.count ?? 0}
              pageItems={consultas.length}
              itemLabel="consulta(s)"
            />
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        {/* Botones de exportación */}
        <Dropdown as={ButtonGroup} className="me-auto">
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={exportando || !data?.count}
            onClick={() => handleExport(() => exportarPDF(cliente!))}
          >
            {exportando ? (
              <Spinner animation="border" size="sm" className="me-1" />
            ) : (
              <FileEarmarkPdf size={15} className="me-1" />
            )}
            PDF
          </Button>
          <Dropdown.Toggle
            split
            variant="outline-secondary"
            size="sm"
            disabled={exportando || !data?.count}
          />
          <Dropdown.Menu>
            <Dropdown.Item
              onClick={() => handleExport(() => exportarExcel(cliente!))}
              disabled={exportando || !data?.count}
            >
              <FileEarmarkExcel size={15} className="me-1 text-success" />
              Exportar como Excel (.xlsx)
            </Dropdown.Item>
            <Dropdown.Item
              onClick={() => handleExport(() => exportarCSV(cliente!))}
              disabled={exportando || !data?.count}
            >
              <FileEarmarkText size={15} className="me-1 text-secondary" />
              Exportar como CSV
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        <Button
          variant="primary"
          onClick={() => cliente && onNuevaConsulta(cliente.id)}
        >
          <PlusCircle size={16} className="me-1" />
          Nueva Consulta
        </Button>
        <Button variant="secondary" onClick={handleClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ClienteConsultasModal;
