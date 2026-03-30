import { Nav } from "react-bootstrap";
import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Tipo de item del menú de navegación
 */
type NavItemType = "link" | "header";

/**
 * Definición de un item del menú
 */
interface MenuItem {
  type: NavItemType;
  label?: string;
  href?: string;
  icon?: ReactNode;
  /** Permiso de Django requerido ("app_label.codename"). Sin este campo, siempre visible. */
  perm?: string;
  /** Si es true, el item solo se muestra a usuarios con is_staff=true. */
  requiresStaff?: boolean;
}

/**
 * Props del componente SideNavItem
 */
export interface SideNavItemProps {
  item: MenuItem;
  index: number;
  onHide: () => void;
}

/**
 * Componente SideNavItem - Item individual del menú de navegación
 *
 * Renderiza un enlace de navegación o un separador visual
 *
 * @param item - Configuración del item del menú
 * @param index - Índice del item (usado como key)
 * @param onHide - Función para ocultar el menú móvil
 * @param setActiveSection - Función para cambiar la sección activa
 */
function SideNavItem({ item, index, onHide }: SideNavItemProps) {
  const navigate = useNavigate();

  /**
   * Maneja el click en un item del menú
   *
   * @param href - Identificador de la sección
   */
  const handleClick = (href: string) => {
    const path = "/" + href.replace("#", "");
    navigate(path);
    onHide();
  };

  if (item.type === "header") {
    return <hr key={index} className="my-2" />;
  }

  return (
    <Nav.Link
      key={index}
      href={item.href}
      className="text-body py-2 rounded"
      onClick={(e) => {
        e.preventDefault();
        if (item.href) {
          handleClick(item.href);
        }
      }}
    >
      {item.icon}
      {item.label}
    </Nav.Link>
  );
}

export default SideNavItem;
