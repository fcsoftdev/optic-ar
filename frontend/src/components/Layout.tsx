import { Children } from "react";
import type { ReactNode } from "react";
import { Container, Row } from "react-bootstrap";
import "./Layout.css";
import "bootstrap/dist/css/bootstrap.min.css";

interface LayoutProps {
  children: ReactNode;
}

/**
 * Componente Layout - Contenedor principal con Grid.
 *
 * Proporciona la estructura completa de la aplicación.
 * Espera recibir en este orden:
 * 1. Header (primer hijo)
 * 2. SideNav (segundo hijo)
 * 3. MainContent (tercer hijo)
 *
 * @param children - Todos los componentes (Header, SideNav, MainContent)
 */
function Layout({ children }: LayoutProps) {
  const childrenArray = Children.toArray(children);
  const header = childrenArray[0];
  const gridContent = childrenArray.slice(1);

  return (
    <div className="d-flex flex-column vh-100 layout-root">
      {/* Header fijo en la parte superior */}
      {header}

      {/* Contenedor principal con Grid */}
      <Container fluid className="flex-grow-1 overflow-hidden p-0 layout-content">
        <Row className="h-100 g-0 layout-row">{gridContent}</Row>
      </Container>
    </div>
  );
}

export default Layout;
