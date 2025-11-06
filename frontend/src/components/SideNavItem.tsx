import { Nav } from "react-bootstrap";
import { type ReactNode } from "react";

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
}

/**
 * Props del componente SideNavItem
 */
export interface SideNavItemProps {
  item: MenuItem;
  index: number;
  onHide: () => void;
  setActiveSection: (section: string) => void;
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
function SideNavItem({
  item,
  index,
  onHide,
  setActiveSection,
}: SideNavItemProps) {
  /**
   * Maneja el click en un item del menú
   *
   * @param href - Identificador de la sección
   */
  const handleClick = (href: string) => {
    // Extraer el nombre de la sección del href (sin el #)
    const section = href.replace("#", "");
    setActiveSection(section);
    onHide(); // Cierra el menú en móviles
  };

  if (item.type === "header") {
    return <hr key={index} className="my-2" />;
  }

  return (
    <Nav.Link
      key={index}
      href={item.href}
      className="text-dark py-2 rounded"
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
