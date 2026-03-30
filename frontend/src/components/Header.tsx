import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import { Button, Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import {
  CircleHalf,
  Eyeglasses,
  List,
  MoonFill,
  PersonCircle,
  SunFill,
} from "react-bootstrap-icons";
import { useAuthStore } from "../stores/useAuthStore";
import { useAuth } from "../hooks/useAuth";
import { useThemeStore, type Theme } from "../stores/useThemeStore";
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
  const { theme, setTheme } = useThemeStore();

  /** Cicla entre los tres modos de tema en orden: light → dark → auto. */
  const themeOrder: Theme[] = ["light", "dark", "auto"];
  const handleThemeToggle = () => {
    const idx = themeOrder.indexOf(theme);
    setTheme(themeOrder[(idx + 1) % themeOrder.length]);
  };

  const themeIcon: Record<Theme, React.ReactNode> = {
    light: <SunFill size={16} />,
    dark: <MoonFill size={16} />,
    auto: <CircleHalf size={16} />,
  };
  const themeLabel: Record<Theme, string> = {
    light: "Claro",
    dark: "Oscuro",
    auto: "Auto",
  };

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
            {/* Botón de tema */}
            <Nav className="me-auto" />
            <Nav className="align-items-center gap-2">
              <Button
                variant="outline-light"
                size="sm"
                onClick={handleThemeToggle}
                title={`Tema: ${themeLabel[theme]}`}
                className="d-flex align-items-center gap-1"
              >
                {themeIcon[theme]}
                <span className="d-none d-md-inline">{themeLabel[theme]}</span>
              </Button>

              {/* Menú de usuario a la derecha */}
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
