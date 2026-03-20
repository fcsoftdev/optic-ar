/**
 * Componente de página de login.
 *
 * Presenta el formulario de autenticación con validación vía Zod y
 * react-hook-form. Tras el login exitoso, el store de Zustand actualiza
 * el accessToken y App.tsx renderiza el layout principal.
 */

import { Form, Button, Card, Alert, Container, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eyeglasses } from "react-bootstrap-icons";
import { useAuth } from "../hooks/useAuth";
import { loginSchema, type LoginFormData } from "../schemas/login.schema";

/**
 * Página de inicio de sesión.
 *
 * @remarks
 * No recibe props. El estado de autenticación se gestiona íntegramente
 * a través de `useAuth` (Zustand + React Query).
 */
export default function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  /**
   * Maneja el envío del formulario de login.
   * @param data - Credenciales validadas por Zod.
   */
  const onSubmit = async (data: LoginFormData): Promise<void> => {
    await login(data);
  };

  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center vh-100 bg-light"
    >
      <Card
        style={{ width: "100%", maxWidth: 420 }}
        className="shadow-sm border-0"
      >
        <Card.Body className="p-5">
          {/* Logo y títulos */}
          <div className="text-center mb-4">
            <Eyeglasses size={52} className="text-primary mb-3" />
            <h4 className="fw-bold mb-1">Opticar</h4>
            <p className="text-muted small mb-0">
              Sistema de Gestión de Ópticas
            </p>
          </div>

          {/* Alerta de credenciales incorrectas */}
          {loginError && (
            <Alert variant="danger" className="py-2 text-center small">
              Usuario o contraseña incorrectos.
            </Alert>
          )}

          {/* Formulario */}
          <Form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Usuario</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingresá tu usuario"
                autoComplete="username"
                isInvalid={!!errors.username}
                {...register("username")}
              />
              <Form.Control.Feedback type="invalid">
                {errors.username?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Ingresá tu contraseña"
                autoComplete="current-password"
                isInvalid={!!errors.password}
                {...register("password")}
              />
              <Form.Control.Feedback type="invalid">
                {errors.password?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Ingresando…
                </>
              ) : (
                "Ingresar"
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
