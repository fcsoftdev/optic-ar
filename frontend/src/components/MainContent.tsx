import type { ReactNode } from "react";
import { Col } from "react-bootstrap";
import DashboardHome from "./DashboardHome";
import ProductList from "./ProductList";

interface MainContentProps {
  children?: ReactNode;
  activeSection: string;
}

/**
 * Componente MainContent - Área de contenido principal.
 *
 * Renderiza el contenido principal de la aplicación dentro
 * de una columna de Bootstrap con responsive design.
 *
 * @param children - Contenido a mostrar en el área principal
 */
function MainContent({ children, activeSection }: MainContentProps) {
  return (
    <Col xs={12} md={9} lg={10} className="p-4 overflow-auto bg-white">
      <div className="p-2">
        {activeSection === "dashboard" && <DashboardHome />}
        {activeSection === "productos" && <ProductList />}
      </div>
    </Col>
  );
}

export default MainContent;
