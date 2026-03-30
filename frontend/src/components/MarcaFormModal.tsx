import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { useCreateMarca, useUpdateMarca } from "../hooks/useProductos";
import { marcaSchema, type MarcaFormData } from "../schemas/marcaSchema";
import type { Marca } from "../services/productos.service";

interface MarcaFormModalProps {
  show: boolean;
  onHide: () => void;
  marca?: Marca | null;
}

/**
 * Modal para crear/editar marcas
 *
 * Características:
 * - Formulario con validación Zod
 * - React Hook Form para gestión de estado
 * - Soporte para crear y editar
 * - Validación en tiempo real
 *
 * @param show - Estado de visibilidad del modal
 * @param onHide - Función para cerrar el modal
 * @param marca - Marca a editar (null para crear nueva)
 */
const MarcaFormModal: React.FC<MarcaFormModalProps> = ({
  show,
  onHide,
  marca,
}) => {
  const isEditing = !!marca;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MarcaFormData>({
    resolver: zodResolver(marcaSchema),
    defaultValues: {
      nombre: "",
    },
  });

  const createMarca = useCreateMarca();
  const updateMarca = useUpdateMarca();

  // Cargar datos de la marca al editar
  useEffect(() => {
    if (marca) {
      reset({
        nombre: marca.nombre,
      });
    } else {
      reset({
        nombre: "",
      });
    }
  }, [marca, reset]);

  const onSubmit = async (data: MarcaFormData) => {
    try {
      if (isEditing && marca) {
        await updateMarca.mutateAsync({
          id: marca.id,
          nombre: data.nombre,
        });
      } else {
        await createMarca.mutateAsync(data.nombre);
      }

      handleClose();
    } catch (error) {
      console.error("Error al guardar marca:", error);
    }
  };

  const handleClose = () => {
    reset();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" centered>
      <Modal.Header closeButton>
        <Modal.Title>{isEditing ? "Editar Marca" : "Nueva Marca"}</Modal.Title>
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
                  placeholder="Ej: Ray-Ban, Oakley, Prada..."
                  autoFocus
                />
              )}
            />
            {errors.nombre && (
              <Form.Control.Feedback type="invalid">
                {errors.nombre.message}
              </Form.Control.Feedback>
            )}
          </Form.Group>
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

export default MarcaFormModal;
