import { Nav, Col, Offcanvas } from "react-bootstrap";
import {
  BoxSeam,
  CartCheck,
  Calendar3,
  Bag,
  Cash,
  People,
  BarChartLine,
  Tags,
  FileMedical,
  CardHeading,
  PeopleFill,
  ShieldLock,
  ClockHistory,
} from "react-bootstrap-icons";
import SideNavItem, { type SideNavItemProps } from "./SideNavItem";
import { useAuthStore } from "../stores/useAuthStore";

interface SideNavProps {
  show: boolean;
  onHide: () => void;
}

/**
 * Componente SideNav - Menú lateral de navegación.
 *
 * Solo muestra los links para los que el usuario autenticado
 * tiene permiso de visualización. Los separadores huérfanos
 * (sin links visibles a continuación) se ocultan automáticamente.
 *
 * @param show - Estado de visibilidad en móviles
 * @param onHide - Función para ocultar el menú en móviles
 */
function SideNav({ show, onHide }: SideNavProps) {
  const { user } = useAuthStore();

  /**
   * Verifica si el usuario tiene el permiso de Django indicado.
   * Los superusuarios tienen acceso a todo.
   *
   * @param perm - Permiso en formato "app_label.codename".
   */
  const tienePermiso = (perm: string): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return user.permissions.includes(perm);
  };

  /** Definición completa del menú con el permiso requerido por cada link. */
  const todosLosItems: SideNavItemProps["item"][] = [
    { type: "header" },
    {
      type: "link",
      label: "Compras",
      href: "#compras",
      icon: <Bag size={18} className="me-2" />,
      perm: "compras.view_compra",
    },
    {
      type: "link",
      label: "Gastos",
      href: "#gastos",
      icon: <Cash size={18} className="me-2" />,
      perm: "compras.view_gasto",
    },
    {
      type: "link",
      label: "Proveedores",
      href: "#proveedores",
      icon: <People size={18} className="me-2" />,
      perm: "compras.view_proveedor",
    },
    { type: "header" },
    {
      type: "link",
      label: "Reporte de caja",
      href: "#reporte-caja",
      icon: <BarChartLine size={18} className="me-2" />,
      perm: "contabilidad.ver_reporte_caja",
    },
    { type: "header" },
    {
      type: "link",
      label: "Marcas",
      href: "#marcas",
      icon: <Tags size={18} className="me-2" />,
      perm: "productos.view_marca",
    },
    {
      type: "link",
      label: "Productos",
      href: "#productos",
      icon: <BoxSeam size={18} className="me-2" />,
      perm: "productos.view_producto",
    },
    { type: "header" },
    {
      type: "link",
      label: "Turnos",
      href: "#turnos",
      icon: <Calendar3 size={18} className="me-2" />,
      perm: "turnos.view_turno",
    },
    { type: "header" },
    {
      type: "link",
      label: "Clientes/Pacientes",
      href: "#clientes-pacientes",
      icon: <People size={18} className="me-2" />,
      perm: "ventas.view_cliente",
    },
    {
      type: "link",
      label: "Consultas",
      href: "#consultas",
      icon: <FileMedical size={18} className="me-2" />,
      perm: "ventas.view_consulta",
    },
    {
      type: "link",
      label: "Obras Sociales",
      href: "#obras-sociales",
      icon: <CardHeading size={18} className="me-2" />,
      perm: "ventas.view_obrasocial",
    },
    {
      type: "link",
      label: "Ventas",
      href: "#ventas",
      icon: <CartCheck size={18} className="me-2" />,
      perm: "ventas.view_venta",
    },
    { type: "header" },
    {
      type: "link",
      label: "Usuarios",
      href: "#usuarios",
      icon: <PeopleFill size={18} className="me-2" />,
      requiresStaff: true,
    },
    {
      type: "link",
      label: "Grupos / Roles",
      href: "#grupos",
      icon: <ShieldLock size={18} className="me-2" />,
      requiresStaff: true,
    },
    { type: "header" },
    {
      type: "link",
      label: "Auditoría",
      href: "#auditoria",
      icon: <ClockHistory size={18} className="me-2" />,
      perm: "authentication.ver_auditoria",
    },
  ];

  /**
   * Filtra los links por permiso y luego elimina los separadores
   * que quedarían huérfanos (sin links visibles a continuación).
   */
  const menuItems = (() => {
    // Paso 1: retener solo links con permiso o headers (provisionales)
    const conPermiso = todosLosItems.filter((item) => {
      if (item.type === "header") return true;
      if (item.requiresStaff) return user?.is_staff ?? false;
      if (item.perm) return tienePermiso(item.perm);
      return true; // links sin restricción siempre visibles
    });

    // Paso 2: recorrer de derecha a izquierda y eliminar headers sin links después
    const resultado: typeof conPermiso = [];
    let hayLinkDespues = false;
    for (let i = conPermiso.length - 1; i >= 0; i--) {
      const item = conPermiso[i];
      if (item.type === "header") {
        if (hayLinkDespues) {
          resultado.unshift(item);
          hayLinkDespues = false;
        }
        // header sin links posteriores → se descarta
      } else {
        hayLinkDespues = true;
        resultado.unshift(item);
      }
    }
    return resultado;
  })();

  /** Contenido del menú (reutilizado en desktop y móvil). */
  const menuContent = (
    <>
      <h5 className="mb-3 text-muted px-3 pt-3">Menú Principal</h5>
      <Nav className="flex-column px-3">
        {menuItems.map((item, index) => (
          <SideNavItem key={index} item={item} index={index} onHide={onHide} />
        ))}
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
        className="bg-body-secondary border-end p-0 d-none d-md-block"
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
