import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { Alert, Button, Col, Form, Modal, Row } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { useCreateProveedor, useUpdateProveedor } from "../hooks/useCompras";
import {
  proveedorSchema,
  type ProveedorFormData,
} from "../schemas/compraSchema";
import type { Proveedor } from "../services/compras.service";

/**
 * Props para el componente ProveedorFormModal.
 */
interface ProveedorFormModalProps {
  /** Controla la visibilidad del modal. */
  show: boolean;
  /** Callback ejecutado al cerrar el modal. */
  onHide: () => void;
  /** Proveedor a editar. Si es `null` o `undefined`, opera en modo creación. */
  proveedor?: Proveedor | null;
  /**
   * Callback opcional ejecutado al crear exitosamente un nuevo proveedor.
   *
   * @param proveedor - Proveedor recién creado devuelto por la API.
   */
  onCreated?: (proveedor: Proveedor) => void;
}

/**
 * Modal de formulario para crear y editar Proveedores.
 *
 * @remarks
 * Utiliza `react-hook-form` con validación Zod. Solo el nombre es
 * obligatorio; los demás campos son opcionales. El callback `onCreated`
 * permite auto-seleccionar el proveedor recién creado en el formulario
 * de compra padre.
 *
 * @param props - Ver {@link ProveedorFormModalProps}.
 */
const ProveedorFormModal: React.FC<ProveedorFormModalProps> = ({
  show,
  onHide,
  proveedor,
  onCreated,
}) => {
  const isEditing = !!proveedor;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProveedorFormData>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: { nombre: "", direccion: "", telefono: "", alias: "" },
  });

  const createProveedor = useCreateProveedor();
  const updateProveedor = useUpdateProveedor();

  useEffect(() => {
    if (proveedor) {
      reset({
        nombre: proveedor.nombre,
        direccion: proveedor.direccion || "",
        telefono: proveedor.telefono || "",
        alias: proveedor.alias || "",
      });
    } else {
      reset({ nombre: "", direccion: "", telefono: "", alias: "" });
    }
  }, [proveedor, reset, show]);

  /**
   * Maneja el envío del formulario: crea o actualiza el proveedor.
   *
   * @param data - Datos validados por Zod del formulario.
   */
  const onSubmit = async (data: ProveedorFormData) => {
    try {
      if (isEditing && proveedor) {
        await updateProveedor.mutateAsync({ id: proveedor.id, data });
        onHide();
      } else {
        const nuevo = await createProveedor.mutateAsync(data);
        onCreated?.(nuevo);
        onHide();
      }
      reset();
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
    }
  };

  const handleClose = () => {
    reset();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditing ? "Editar Proveedor" : "Nuevo Proveedor"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit(onSubmit)} id="proveedorForm">
          <Row className="g-3">
            <Col xs={12}>
              <Form.Group>
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
                      placeholder="Ej: Distribuidora Óptica Sur"
                    />
                  )}
                />
                {errors.nombre && (
                  <Form.Control.Feedback type="invalid">
                    {errors.nombre.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Alias</Form.Label>
                <Controller
                  name="alias"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      value={field.value || ""}
                      type="text"
                      placeholder="Ej: Óptica Sur"
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
                      value={field.value || ""}
                      type="text"
                      placeholder="Ej: 3512345678"
                    />
                  )}
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group>
                <Form.Label>Dirección</Form.Label>
                <Controller
                  name="direccion"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      value={field.value || ""}
                      type="text"
                      placeholder="Ej: Av. Colón 1234"
                    />
                  )}
                />
              </Form.Group>
            </Col>
          </Row>

          {(createProveedor.error || updateProveedor.error) && (
            <Alert variant="danger" className="mt-3 mb-0">
              Error al guardar el proveedor. Verifique los datos.
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
          type="submit"
          form="proveedorForm"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Guardando..."
            : isEditing
              ? "Guardar cambios"
              : "Crear proveedor"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProveedorFormModal;
