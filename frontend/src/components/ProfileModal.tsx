/**
 * Modal de edición del perfil del usuario autenticado.
 *
 * Permite actualizar nombre, apellido y email. Se precarga con los
 * datos actuales del store y sincroniza los cambios al cerrar con éxito.
 */

import { useEffect } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PersonCircle } from "react-bootstrap-icons";
import { perfilSchema, type PerfilFormData } from "../schemas/perfil.schema";
import { useAuthStore } from "../stores/useAuthStore";
import { usePerfil } from "../hooks/usePerfil";

interface ProfileModalProps {
  show: boolean;
  onHide: () => void;
}

/**
 * Modal de edición del perfil.
 *
 * @param show - Controla la visibilidad del modal.
 * @param onHide - Callback para cerrar el modal.
 */
function ProfileModal({ show, onHide }: ProfileModalProps) {
  const { user } = useAuthStore();
  const { actualizarPerfil, isPending, isSuccess, isError, error, reset } =
    usePerfil();

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      email: user?.email ?? "",
    },
  });

  // Recarga los valores actuales cada vez que se abre el modal
  useEffect(() => {
    if (show && user) {
      resetForm({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      });
      reset();
    }
  }, [show, user, resetForm, reset]);

  const handleClose = () => {
    reset();
    onHide();
  };

  const onSubmit = (datos: PerfilFormData) => {
    actualizarPerfil(datos);
  };

  // Cierra el modal automáticamente 1 segundo después de guardar con éxito
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => handleClose(), 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const errorMsg =
    isError && error instanceof Error
      ? ((error as { response?: { data?: { email?: string[] } } }).response
          ?.data?.email?.[0] ??
        "No se pudo guardar el perfil. Intentá de nuevo.")
      : null;

  return (
    <Modal show={show} onHide={handleClose} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <PersonCircle size={22} />
          Mi perfil
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Modal.Body>
          {isSuccess && (
            <Alert variant="success" className="py-2">
              Perfil actualizado correctamente.
            </Alert>
          )}
          {errorMsg && (
            <Alert variant="danger" className="py-2">
              {errorMsg}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              {...register("first_name")}
              isInvalid={!!errors.first_name}
              placeholder="Tu nombre"
              autoComplete="given-name"
            />
            <Form.Control.Feedback type="invalid">
              {errors.first_name?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Apellido</Form.Label>
            <Form.Control
              {...register("last_name")}
              isInvalid={!!errors.last_name}
              placeholder="Tu apellido"
              autoComplete="family-name"
            />
            <Form.Control.Feedback type="invalid">
              {errors.last_name?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-1">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              {...register("email")}
              isInvalid={!!errors.email}
              placeholder="tu@email.com"
              autoComplete="email"
            />
            <Form.Control.Feedback type="invalid">
              {errors.email?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <p className="text-muted small mt-3 mb-0">
            Usuario: <strong>{user?.username}</strong>
          </p>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isPending || isSuccess}
          >
            {isPending ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Guardando…
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default ProfileModal;
