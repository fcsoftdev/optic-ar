import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import { Button, Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { Eyeglasses, List, PersonCircle } from "react-bootstrap-icons";
import { useAuthStore } from "../stores/useAuthStore";
import { useAuth } from "../hooks/useAuth";
import ProfileModal from "./ProfileModal";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

/**
 * Componente Header del sistema.
 *
 * Muestra la barra de navegación principal con:
 * - Logo y nombre de la aplicación
 * - Botón hamburguesa para móviles
 * - Saludo "Bienvenido {nombre} {apellido}" que se actualiza reactivamente
 * - Menú de usuario con acceso al perfil y logout
 *
 * @param onToggleSidebar - Función para mostrar/ocultar el sidebar en móviles
 */
function Header({ onToggleSidebar }: HeaderProps) {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  /** Nombre a mostrar: "Nombre Apellido" o username como fallback. */
  const nombreCompleto =
    user?.first_name || user?.last_name
      ? `${user.first_name} ${user.last_name}`.trim()
      : (user?.username ?? "Usuario");

  /**
   * Maneja el cierre de sesión: blacklistea el refresh token y limpia el store.
   */
  const handleLogout = (): void => {
    logout();
  };

  return (
    <>
      <Navbar bg="dark" data-bs-theme="dark" expand="lg">
        <Container fluid>
          {/* Botón hamburguesa para móviles (sidebar) */}
          <Button
            variant="dark"
            className="d-md-none me-2"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <List size={24} />
          </Button>

          {/* Brand a la izquierda */}
          <Navbar.Brand
            onClick={() => navigate("/")}
            className="d-flex align-items-center"
            style={{ cursor: "pointer" }}
          >
            <Eyeglasses size={30} className="me-2" />
            <span>Opticar</span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="navbar-nav" />

          <Navbar.Collapse id="navbar-nav">
            {/* Menú de usuario a la derecha */}
            <Nav className="ms-auto">
              <NavDropdown
                title={
                  <span>
                    <PersonCircle size={24} className="me-2" />
                    {`Bienvenido ${nombreCompleto}`}
                  </span>
                }
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item onClick={() => setShowProfile(true)}>
                  Perfil
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Salir
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <ProfileModal show={showProfile} onHide={() => setShowProfile(false)} />
    </>
  );
}

export default Header;
