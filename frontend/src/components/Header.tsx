import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { Eyeglasses, List, PersonCircle } from "react-bootstrap-icons";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

/**
 * Componente Header del sistema.
 *
 * Muestra la barra de navegación principal con:
 * - Logo y nombre de la aplicación
 * - Botón hamburguesa para móviles
 * - Menú de usuario con opciones de perfil y logout
 *
 * @param onToggleSidebar - Función para mostrar/ocultar el sidebar en móviles
 */
function Header({ onToggleSidebar }: HeaderProps) {
  /**
   * Maneja el cierre de sesión del usuario.
   */
  const handleLogout = (): void => {
    console.log("Cerrando sesión...");
    // TODO: Implementar lógica de logout con API
  };

  /**
   * Navega al perfil del usuario.
   */
  const handleProfile = (): void => {
    console.log("Ir a administrador de perfil...");
    // TODO: Implementar navegación al perfil
  };

  return (
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
        <Navbar.Brand href="#home" className="d-flex align-items-center">
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
                  Usuario
                </span>
              }
              id="user-dropdown"
              align="end"
            >
              <NavDropdown.Item onClick={handleProfile}>
                Perfil
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>Salir</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
