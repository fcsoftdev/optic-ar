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
import logo from "../assets/logo.png";
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
    // mutateAsync lanza si la petición falla; lo capturamos aquí para que
    // react-hook-form no reciba una promise rechazada sin manejar.
    // El error ya es visible en la UI vía el estado isError del hook.
    await login(data).catch(() => {});
  };

  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center vh-100 bg-body"
    >
      <Card
        style={{ width: "100%", maxWidth: 420 }}
        className="shadow-sm border-0"
      >
        <Card.Body className="p-5">
          {/* Logo y títulos */}
          <div className="text-center mb-4">
            <img
              src={logo}
              alt="Optic-AR"
              style={{ height: 120, width: "auto" }}
              className="mb-3"
            />
          </div>

          {/* Alerta de credenciales incorrectas */}
          {loginError && (
            <Alert variant="danger" className="py-2 text-center small">
              Usuario o contraseña incorrectos.
            </Alert>
          )}

          {/* Formulario */}
          <Form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Form.Group className="mb-3" controlId="username">
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

            <Form.Group className="mb-4" controlId="password">
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
