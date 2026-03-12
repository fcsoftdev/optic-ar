import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { Alert, Button, Col, Form, Modal, Row } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { useCreateGasto, useUpdateGasto } from "../hooks/useCompras";
import { gastoSchema, type GastoFormData } from "../schemas/compraSchema";
import type { Gasto } from "../services/compras.service";

/**
 * Props para el componente GastoFormModal.
 */
interface GastoFormModalProps {
  /** Controla la visibilidad del modal. */
  show: boolean;
  /** Callback ejecutado al cerrar el modal. */
  onHide: () => void;
  /** Gasto a editar. Si es `null` o `undefined`, opera en modo creación. */
  gasto?: Gasto | null;
}

/**
 * Modal de formulario para crear y editar Gastos.
 *
 * @remarks
 * Utiliza `react-hook-form` con validación Zod.
 * Campos: fecha, descripción y total.
 *
 * @param props - Ver {@link GastoFormModalProps}.
 */
const GastoFormModal: React.FC<GastoFormModalProps> = ({
  show,
  onHide,
  gasto,
}) => {
  const isEditing = !!gasto;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GastoFormData>({
    resolver: zodResolver(gastoSchema),
    defaultValues: {
      fecha: new Date().toISOString().split("T")[0],
      descripcion: "",
      total: 0,
    },
  });

  const createGasto = useCreateGasto();
  const updateGasto = useUpdateGasto();

  useEffect(() => {
    if (gasto) {
      reset({
        fecha: gasto.fecha,
        descripcion: gasto.descripcion,
        total: parseFloat(gasto.total),
      });
    } else {
      reset({
        fecha: new Date().toISOString().split("T")[0],
        descripcion: "",
        total: 0,
      });
    }
  }, [gasto, reset, show]);

  /**
   * Maneja el envío del formulario: crea o actualiza el gasto.
   *
   * @param data - Datos validados por Zod del formulario.
   */
  const onSubmit = async (data: GastoFormData) => {
    try {
      if (isEditing && gasto) {
        await updateGasto.mutateAsync({ id: gasto.id, data });
      } else {
        await createGasto.mutateAsync(data);
      }
      reset();
      onHide();
    } catch (error) {
      console.error("Error al guardar gasto:", error);
    }
  };

  const handleClose = () => {
    reset();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{isEditing ? "Editar Gasto" : "Nuevo Gasto"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit(onSubmit)} id="gastoForm">
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Fecha <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="fecha"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="date"
                      isInvalid={!!errors.fecha}
                    />
                  )}
                />
                {errors.fecha && (
                  <Form.Control.Feedback type="invalid">
                    {errors.fecha.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Total ($) <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="total"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      type="number"
                      min={0}
                      step="0.01"
                      isInvalid={!!errors.total}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  )}
                />
                {errors.total && (
                  <Form.Control.Feedback type="invalid">
                    {errors.total.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group>
                <Form.Label>
                  Descripción <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="descripcion"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      isInvalid={!!errors.descripcion}
                      placeholder="Ej: Alquiler local"
                    />
                  )}
                />
                {errors.descripcion && (
                  <Form.Control.Feedback type="invalid">
                    {errors.descripcion.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
          </Row>

          {(createGasto.error || updateGasto.error) && (
            <Alert variant="danger" className="mt-3 mb-0">
              Error al guardar el gasto. Verifique los datos.
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
          form="gastoForm"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Guardando..."
            : isEditing
              ? "Guardar cambios"
              : "Crear gasto"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default GastoFormModal;
