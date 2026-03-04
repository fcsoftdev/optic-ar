import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Alert, Button, Col, Form, Modal, Row } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import {
  useCliente,
  useCreateCliente,
  useUpdateCliente,
  useObrasSociales,
  useCreateObraSocial,
  useUpdateObraSocial,
  useDeleteObraSocial,
} from "../hooks/useVentas";
import { clienteSchema, type ClienteFormData } from "../schemas/clienteSchema";
import type { Cliente } from "../services/ventas.service";
import EntityManagerModal from "./EntityManagerModal";
import SearchableSelect from "./SearchableSelect";

/**
 * Props para el componente ClienteFormModal.
 */
interface ClienteFormModalProps {
  /** Controla la visibilidad del modal. */
  show: boolean;
  /** Callback ejecutado al cerrar el modal. */
  onHide: () => void;
  /** Cliente a editar. Si es `null` o `undefined`, el modal opera en modo creación. */
  cliente?: Cliente | null;
}

/**
 * Modal de formulario para crear y editar Clientes/Pacientes.
 *
 * @remarks
 * En modo edición realiza un fetch completo del cliente por ID para obtener
 * todos los campos (dirección, obra social, etc.) que no incluye el listado paginado.
 * Integra gestión inline de obras sociales mediante `EntityManagerModal`.
 *
 * @param props - Ver {@link ClienteFormModalProps}.
 */
const ClienteFormModal: React.FC<ClienteFormModalProps> = ({
  show,
  onHide,
  cliente,
}) => {
  const isEditing = !!cliente;
  const [showObraSocialManager, setShowObraSocialManager] = useState(false);

  // Fetch completo del cliente para tener todos los campos (direccion, obra_social ID, etc.)
  const { data: clienteCompleto } = useCliente(cliente?.id ?? 0);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema) as any,
    defaultValues: {
      nombre_apellido: "",
      dni: "",
      fecha_nacimiento: "",
      telefono: "",
      mail: "",
      direccion: "",
      nro_afiliado: "",
      obra_social: undefined,
    },
  });

  const { data: obrasSociales = [], isLoading: loadingObrasSociales } =
    useObrasSociales();
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();

  const createObraSocial = useCreateObraSocial();
  const updateObraSocial = useUpdateObraSocial();
  const deleteObraSocial = useDeleteObraSocial();

  useEffect(() => {
    if (cliente && clienteCompleto) {
      reset({
        nombre_apellido: clienteCompleto.nombre_apellido,
        dni: clienteCompleto.dni,
        fecha_nacimiento: clienteCompleto.fecha_nacimiento || "",
        telefono: clienteCompleto.telefono || "",
        mail: clienteCompleto.mail || "",
        direccion: clienteCompleto.direccion || "",
        nro_afiliado: clienteCompleto.nro_afiliado || "",
        obra_social: clienteCompleto.obra_social || undefined,
      });
    } else if (!cliente) {
      reset({
        nombre_apellido: "",
        dni: "",
        fecha_nacimiento: "",
        telefono: "",
        mail: "",
        direccion: "",
        nro_afiliado: "",
        obra_social: undefined,
      });
    }
  }, [cliente, clienteCompleto, reset]);

  /**
   * Maneja el envío del formulario: crea o actualiza el cliente según el modo.
   *
   * @param data - Datos validados por Zod del formulario.
   */
  const onSubmit = async (data: ClienteFormData) => {
    try {
      const submitData = {
        ...data,
        fecha_nacimiento: data.fecha_nacimiento || undefined,
        telefono: data.telefono || undefined,
        mail: data.mail || undefined,
        direccion: data.direccion || undefined,
        nro_afiliado: data.nro_afiliado || undefined,
        obra_social: data.obra_social || undefined,
      };

      if (isEditing) {
        await updateCliente.mutateAsync({
          id: cliente.id,
          data: submitData,
        });
      } else {
        await createCliente.mutateAsync(submitData);
      }

      handleClose();
    } catch (error) {
      console.error("Error al guardar cliente:", error);
    }
  };

  /**
   * Cierra el modal y resetea todos los campos del formulario.
   */
  const handleClose = () => {
    reset();
    onHide();
  };

  /**
   * Crea una nueva obra social y la selecciona automáticamente en el formulario.
   *
   * @param nombre - Nombre de la nueva obra social.
   */
  const handleCreateObraSocial = async (nombre: string) => {
    const newObraSocial = await createObraSocial.mutateAsync(nombre);
    setValue("obra_social", newObraSocial.id);
  };

  /**
   * Actualiza el nombre de una obra social existente.
   *
   * @param id - ID de la obra social a modificar.
   * @param nombre - Nuevo nombre a asignar.
   */
  const handleUpdateObraSocial = async (id: number, nombre: string) => {
    await updateObraSocial.mutateAsync({ id, data: { nombre } });
  };

  /**
   * Elimina una obra social del sistema.
   *
   * @param id - ID de la obra social a eliminar.
   */
  const handleDeleteObraSocial = async (id: number) => {
    await deleteObraSocial.mutateAsync(id);
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Editar Cliente/Paciente" : "Nuevo Cliente/Paciente"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Nombre y Apellido <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="nombre_apellido"
                    control={control}
                    render={({ field }) => (
                      <Form.Control
                        {...field}
                        type="text"
                        isInvalid={!!errors.nombre_apellido}
                        placeholder="Ej: Juan Pérez"
                      />
                    )}
                  />
                  {errors.nombre_apellido && (
                    <Form.Control.Feedback type="invalid">
                      {errors.nombre_apellido.message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    DNI <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="dni"
                    control={control}
                    render={({ field }) => (
                      <Form.Control
                        {...field}
                        type="text"
                        maxLength={8}
                        isInvalid={!!errors.dni}
                        placeholder="12345678"
                      />
                    )}
                  />
                  {errors.dni && (
                    <Form.Control.Feedback type="invalid">
                      {errors.dni.message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Fecha de Nacimiento</Form.Label>
                  <Controller
                    name="fecha_nacimiento"
                    control={control}
                    render={({ field }) => (
                      <Form.Control
                        {...field}
                        type="date"
                        value={field.value || ""}
                      />
                    )}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Teléfono</Form.Label>
                  <Controller
                    name="telefono"
                    control={control}
                    render={({ field }) => (
                      <Form.Control
                        {...field}
                        type="text"
                        value={field.value || ""}
                        placeholder="Ej: 1234567890"
                      />
                    )}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Controller
                name="mail"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    {...field}
                    type="email"
                    value={field.value || ""}
                    isInvalid={!!errors.mail}
                    placeholder="ejemplo@correo.com"
                  />
                )}
              />
              {errors.mail && (
                <Form.Control.Feedback type="invalid">
                  {errors.mail.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Controller
                name="direccion"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    {...field}
                    type="text"
                    value={field.value || ""}
                    placeholder="Calle, número, ciudad"
                  />
                )}
              />
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Obra Social</Form.Label>
                  <Controller
                    name="obra_social"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={obrasSociales.map((os) => ({
                          value: os.id,
                          label: os.nombre,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Seleccionar Obra Social"
                        disabled={loadingObrasSociales}
                        onManageClick={() => setShowObraSocialManager(true)}
                        isClearable={true}
                        noOptionsMessage="No hay obras sociales disponibles"
                      />
                    )}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Número de Afiliado</Form.Label>
                  <Controller
                    name="nro_afiliado"
                    control={control}
                    render={({ field }) => (
                      <Form.Control
                        {...field}
                        type="text"
                        value={field.value || ""}
                        placeholder="Número de afiliado"
                      />
                    )}
                  />
                </Form.Group>
              </Col>
            </Row>

            {(createCliente.isError || updateCliente.isError) && (
              <Alert variant="danger" className="mt-3">
                Error al guardar el cliente. Verifique que el DNI no esté
                duplicado.
              </Alert>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de gestión de obras sociales */}
      <EntityManagerModal
        show={showObraSocialManager}
        onHide={() => setShowObraSocialManager(false)}
        title="Obras Sociales"
        entityType="marca"
        items={obrasSociales}
        onCreate={handleCreateObraSocial}
        onUpdate={handleUpdateObraSocial}
        onDelete={handleDeleteObraSocial}
        isLoading={loadingObrasSociales}
      />
    </>
  );
};

export default ClienteFormModal;
