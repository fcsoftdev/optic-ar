/**
 * @file ObraSocialManagerModal.tsx
 * @description Modal de gestión ABM para Obras Sociales embebido en formularios de clientes.
 */
import React, { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  ListGroup,
  Modal,
  Spinner,
} from "react-bootstrap";
import { Pencil, PlusCircle, Trash } from "react-bootstrap-icons";
import { useDeleteObraSocial, useObrasSociales } from "../hooks/useVentas";
import type { ObraSocial } from "../services/ventas.service";
import ObraSocialFormModal from "./ObraSocialFormModal";

/**
 * Props del componente ObraSocialManagerModal.
 */
interface ObraSocialManagerModalProps {
  /** Controla la visibilidad del modal. */
  show: boolean;
  /** Callback ejecutado al cerrar el modal. */
  onHide: () => void;
  /**
   * Callback ejecutado cuando se crea una nueva obra social.
   * Permite al formulario padre seleccionarla automáticamente.
   *
   * @param obraSocial - Obra social recién creada.
   */
  onCreated?: (obraSocial: ObraSocial) => void;
}

/**
 * Modal de gestión de Obras Sociales con CRUD completo.
 *
 * @remarks
 * Muestra la lista de obras sociales con botones de editar y eliminar.
 * Para crear y editar abre `ObraSocialFormModal`, que incluye todos los
 * campos (nombre, dirección, teléfono). Se usa desde `ClienteFormModal`
 * para gestionar obras sociales sin salir del contexto del cliente.
 *
 * @param props - Ver {@link ObraSocialManagerModalProps}.
 */
const ObraSocialManagerModal: React.FC<ObraSocialManagerModalProps> = ({
  show,
  onHide,
  onCreated,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingObraSocial, setEditingObraSocial] = useState<ObraSocial | null>(
    null,
  );

  const { data: obrasSociales = [], isLoading, error } = useObrasSociales();
  const deleteObraSocial = useDeleteObraSocial();

  /**
   * Abre el formulario en modo creación.
   */
  const handleNew = () => {
    setEditingObraSocial(null);
    setShowForm(true);
  };

  /**
   * Abre el formulario en modo edición con los datos de la obra social.
   *
   * @param os - Obra social a editar.
   */
  const handleEdit = (os: ObraSocial) => {
    setEditingObraSocial(os);
    setShowForm(true);
  };

  /**
   * Solicita confirmación y elimina la obra social indicada.
   *
   * @param id - ID de la obra social a eliminar.
   * @param nombre - Nombre usado en el mensaje de confirmación.
   */
  const handleDelete = async (id: number, nombre: string) => {
    if (window.confirm(`¿Eliminar la obra social "${nombre}"?`)) {
      try {
        await deleteObraSocial.mutateAsync(id);
      } catch {
        alert(
          "No se puede eliminar: la obra social puede estar asignada a clientes.",
        );
      }
    }
  };

  /**
   * Cierra el formulario interno y notifica al padre si se creó una nueva OS.
   *
   * @param created - Obra social creada, si aplica.
   */
  const handleFormHide = (created?: ObraSocial) => {
    setShowForm(false);
    setEditingObraSocial(null);
    if (created) {
      onCreated?.(created);
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            Gestionar Obras Sociales{" "}
            <Badge bg="secondary" pill>
              {obrasSociales.length}
            </Badge>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && (
            <Alert variant="danger">
              Error al cargar obras sociales: {(error as Error).message}
            </Alert>
          )}

          {isLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" size="sm" />
              <span className="ms-2">Cargando...</span>
            </div>
          ) : obrasSociales.length === 0 ? (
            <Alert variant="info">No hay obras sociales registradas.</Alert>
          ) : (
            <ListGroup variant="flush">
              {obrasSociales.map((os) => (
                <ListGroup.Item
                  key={os.id}
                  className="d-flex justify-content-between align-items-center py-2"
                >
                  <div>
                    <strong>{os.nombre}</strong>
                    {os.direccion && (
                      <small className="text-muted d-block">
                        {os.direccion}
                      </small>
                    )}
                    {os.telefono && (
                      <small className="text-muted">{os.telefono}</small>
                    )}
                  </div>
                  <div className="d-flex gap-1">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleEdit(os)}
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(os.id, os.nombre)}
                      title="Eliminar"
                    >
                      <Trash size={13} />
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>

        <Modal.Footer className="justify-content-between">
          <Button variant="success" size="sm" onClick={handleNew}>
            <PlusCircle size={16} className="me-1" />
            Nueva Obra Social
          </Button>
          <Button variant="secondary" onClick={onHide}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Formulario de creación / edición con todos los campos */}
      <ObraSocialFormModal
        show={showForm}
        onHide={() => handleFormHide()}
        obraSocial={editingObraSocial}
        onCreated={(created) => handleFormHide(created)}
      />
    </>
  );
};

export default ObraSocialManagerModal;
