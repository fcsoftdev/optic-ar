import React from "react";
import { Nav } from "react-bootstrap";

export type SideNavItemProps = {
  item: {
    type: "header" | "link";
    label?: string;
    href?: string;
    icon?: React.ReactNode;
  };
  index: number;
  onHide: () => void;
  setActiveSection: (section: string) => void;
};

function SideNavItem({
  item,
  index,
  onHide,
  setActiveSection,
}: SideNavItemProps) {
  const handleSelect = (section: string) => {
    setActiveSection(section);
    onHide(); // cierra el sidebar si está en modo móvil
  };

  if (item.type === "header") {
    return <div className="border-bottom my-2 mx-2 opacity-100"></div>;
  }

  return (
    <Nav.Link
      key={index}
      href={item.href}
      className="d-flex align-items-center mb-2 text-dark py-0"
      onClick={() => item.label === "Productos" && handleSelect("productos")}
    >
      {item.icon}
      <span>{item.label}</span>
    </Nav.Link>
  );
}

export default SideNavItem;
