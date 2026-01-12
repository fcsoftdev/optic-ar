import { Nav, Col, Offcanvas } from "react-bootstrap";
import {
  BoxSeam,
  CartCheck,
  CashStack,
  Calendar3,
  Bag,
  Cash,
  People,
  BarChartLine,
  Tags,
  FileMedical,
  CardHeading,
} from "react-bootstrap-icons";
import SideNavItem, { type SideNavItemProps } from "./SideNavItem";

interface SideNavProps {
  show: boolean;
  onHide: () => void;
  setActiveSection: (section: string) => void;
}

/**
 * Componente SideNav - Menú lateral de navegación.
 *
 * Muestra el menú principal de navegación con iconos para:
 * - Dashboard
 * - Productos
 * - Ventas
 * - Compras
 * - Contabilidad
 * - Turnos
 *
 * En móviles se muestra como Offcanvas (drawer lateral)
 * En desktop se muestra como columna fija
 *
 * @param show - Estado de visibilidad en móviles
 * @param onHide - Función para ocultar el menú en móviles
 */
function SideNav({ show, onHide, setActiveSection }: SideNavProps) {
  /**
   * Items del menú de navegación con secciones
   */
  const menuItems: SideNavItemProps["item"][] = [
    {
      type: "header",
    },
    {
      type: "link",
      label: "Compras",
      href: "#compras",
      icon: <Bag size={18} className="me-2" />,
    },
    {
      type: "link",
      label: "Gastos",
      href: "#gastos",
      icon: <Cash size={18} className="me-2" />,
    },
    {
      type: "link",
      label: "Proveedores",
      href: "#proveedores",
      icon: <People size={18} className="me-2" />,
    },
    {
      type: "header",
    },
    {
      type: "link",
      label: "Caja manual",
      href: "#caja-manual",
      icon: <CashStack size={18} className="me-2" />,
    },
    {
      type: "link",
      label: "Reporte de caja",
      href: "#reporte-caja",
      icon: <BarChartLine size={18} className="me-2" />,
    },
    {
      type: "header",
    },
    {
      type: "link",
      label: "Marcas",
      href: "#marcas",
      icon: <Tags size={18} className="me-2" />,
    },
    {
      type: "link",
      label: "Productos",
      href: "#productos",
      icon: <BoxSeam size={18} className="me-2" />,
    },
    {
      type: "header",
    },
    {
      type: "link",
      label: "Turnos",
      href: "#turnos",
      icon: <Calendar3 size={18} className="me-2" />,
    },
    {
      type: "header",
    },
    {
      type: "link",
      label: "Clientes/Pacientes",
      href: "#clientes-pacientes",
      icon: <People size={18} className="me-2" />,
    },
    {
      type: "link",
      label: "Consultas",
      href: "#consultas",
      icon: <FileMedical size={18} className="me-2" />,
    },
    {
      type: "link",
      label: "Obras Sociales",
      href: "#obras-sociales",
      icon: <CardHeading size={18} className="me-2" />,
    },
    {
      type: "link",
      label: "Ventas",
      href: "#ventas",
      icon: <CartCheck size={18} className="me-2" />,
    },
  ];

  /**
   * Contenido del menú (reutilizado en desktop y móvil)
   */
  const menuContent = (
    <>
      <h5 className="mb-3 text-muted px-3 pt-3">Menú Principal</h5>
      <Nav className="flex-column px-3">
        {menuItems.map((item, index) => {
          return (
            <SideNavItem
              key={index}
              item={item}
              index={index}
              onHide={onHide}
              setActiveSection={setActiveSection}
            />
          );
        })}
      </Nav>
    </>
  );

  return (
    <>
      {/* SideNav para Desktop - Columna fija */}
      <Col
        xs={12}
        md={3}
        lg={2}
        className="bg-light border-end p-0 d-none d-md-block"
        style={{ overflowY: "auto", maxHeight: "100%" }}
      >
        <div className="sidenav">{menuContent}</div>
      </Col>

      {/* SideNav para Móviles - Offcanvas (drawer) */}
      <Offcanvas show={show} onHide={onHide} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Opticar</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>{menuContent}</Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default SideNav;
