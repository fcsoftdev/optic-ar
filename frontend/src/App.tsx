import { useState } from "react";
import { Row, Col } from "react-bootstrap";
import { PersonBoundingBox, Calendar3, Cart4 } from "react-bootstrap-icons";
import Layout from "./components/Layout";
import Header from "./components/Header";
import SideNav from "./components/SideNav";
import MainContent from "./components/MainContent";
import InfoCard from "./components/InfoCard";

/**
 * Componente principal de la aplicación.
 *
 * Estructura la aplicación usando Layout que contiene:
 * 1. Header (con botón hamburguesa para móviles)
 * 2. SideNav (responsive - drawer en móviles, fijo en desktop)
 * 3. MainContent (contenido principal)
 */
function App() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard"); // 👈 nueva variable

  /**
   * Alterna la visibilidad del sidebar en móviles
   */
  const handleToggleSidebar = (): void => {
    setShowSidebar(!showSidebar);
  };

  /**
   * Oculta el sidebar (usado al hacer click en un item del menú)
   */
  const handleCloseSidebar = (): void => {
    setShowSidebar(false);
  };

  return (
    <Layout>
      <Header onToggleSidebar={handleToggleSidebar} />
      <SideNav
        show={showSidebar}
        onHide={handleCloseSidebar}
        setActiveSection={setActiveSection}
      />
      <MainContent activeSection={activeSection} />
    </Layout>
  );
}

export default App;
