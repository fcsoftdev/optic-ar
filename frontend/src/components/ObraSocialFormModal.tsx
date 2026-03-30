import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { useCreateObraSocial, useUpdateObraSocial } from "../hooks/useVentas";
import {
  obraSocialSchema,
  type ObraSocialFormData,
} from "../schemas/obraSocialSchema";
import type { ObraSocial } from "../services/ventas.service";

/**
 * Props para el componente ObraSocialFormModal.
 */
interface ObraSocialFormModalProps {
  /** Controla la visibilidad del modal. */
  show: boolean;
  /** Callback ejecutado al cerrar el modal. */
  onHide: () => void;
  /** Obra social a editar. Si es `null` o `undefined`, opera en modo creación. */
  obraSocial?: ObraSocial | null;
  /**
   * Callback opcional ejecutado al crear exitosamente una nueva obra social.
   *
   * @param obraSocial - Obra social recién creada devuelta por la API.
   */
  onCreated?: (obraSocial: ObraSocial) => void;
}

/**
 * Modal de formulario para crear y editar Obras Sociales.
 *
 * @remarks
 * Utiliza `react-hook-form` con validación Zod. En modo edición
 * precarga los campos con los datos del objeto recibido por props,
 * ya que el listado completo siempre está disponible en cache.
 *
 * @param props - Ver {@link ObraSocialFormModalProps}.
 */
const ObraSocialFormModal: React.FC<ObraSocialFormModalProps> = ({
  show,
  onHide,
  obraSocial,
  onCreated,
}) => {
  const isEditing = !!obraSocial;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ObraSocialFormData>({
    resolver: zodResolver(obraSocialSchema),
    defaultValues: {
      nombre: "",
      direccion: "",
      telefono: "",
    },
  });

  const createObraSocial = useCreateObraSocial();
  const updateObraSocial = useUpdateObraSocial();

  useEffect(() => {
    if (obraSocial) {
      reset({
        nombre: obraSocial.nombre,
        direccion: obraSocial.direccion || "",
        telefono: obraSocial.telefono || "",
      });
    } else {
      reset({ nombre: "", direccion: "", telefono: "" });
    }
  }, [obraSocial, reset]);

  /**
   * Maneja el envío del formulario: crea o actualiza la obra social.
   *
   * @param data - Datos validados por Zod del formulario.
   */
  const onSubmit = async (data: ObraSocialFormData) => {
    try {
      const submitData = {
        nombre: data.nombre,
        direccion: data.direccion || undefined,
        telefono: data.telefono || undefined,
      };

      if (isEditing) {
        await updateObraSocial.mutateAsync({
          id: obraSocial.id,
          data: submitData,
        });
      } else {
        const created = await createObraSocial.mutateAsync(submitData);
        onCreated?.(created);
      }

      handleClose();
    } catch (error) {
      console.error("Error al guardar obra social:", error);
    }
  };

  /**
   * Cierra el modal y resetea todos los campos del formulario.
   */
  const handleClose = () => {
    reset();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditing ? "Editar Obra Social" : "Nueva Obra Social"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Form.Group className="mb-3">
            <Form.Label>
              Nombre <span className="text-danger">*</span>
            </Form.Label>
            <Controller
              name="nombre"
              control={control}
              render={({ field }) => (
                <Form.Control
                  {...field}
                  type="text"
                  isInvalid={!!errors.nombre}
                  placeholder="Ej: OSDE, Swiss Medical..."
                />
              )}
            />
            {errors.nombre && (
              <Form.Control.Feedback type="invalid">
                {errors.nombre.message}
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

          <Form.Group className="mb-3">
            <Form.Label>Teléfono</Form.Label>
            <Controller
              name="telefono"
              control={control}
              render={({ field }) => (
                <Form.Control
                  {...field}
                  type="text"
                  value={field.value || ""}
                  placeholder="Ej: 351-4123456"
                />
              )}
            />
          </Form.Group>

          {(createObraSocial.isError || updateObraSocial.isError) && (
            <Alert variant="danger" className="mt-3">
              Error al guardar la obra social. Intente nuevamente.
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
  );
};

export default ObraSocialFormModal;
