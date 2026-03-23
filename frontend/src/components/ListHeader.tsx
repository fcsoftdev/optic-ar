import React from "react";
import { Badge, Col, Row } from "react-bootstrap";
import AddButton from "./AddButton";

/**
 * Props para el componente ListHeader.
 */
interface ListHeaderProps {
  /** Título del listado. Ejemplo: "Clientes/Pacientes", "Productos", "Consultas". */
  title: string;
  /** Cantidad total de registros mostrada en el badge. */
  count: number;
  /** Icono de react-bootstrap-icons a mostrar junto al título (en color azul primario). */
  icon?: React.ReactNode;
  /** Etiqueta para el botón de agregar. Ejemplo: "Cliente", "Producto". Si no se provee, no se renderiza el botón. */
  addLabel?: string;
  /** Callback ejecutado al hacer click en el botón de agregar. */
  onAdd?: () => void;
  /**
   * Controla si el botón de agregar es visible. Por defecto `true`.
   * Pasar `false` para ocultar el botón cuando el usuario no tiene permiso de creación.
   */
  canAdd?: boolean;
  /** Contenido adicional renderizado a la derecha, junto al botón de agregar (ej: botones extra). */
  children?: React.ReactNode;
}

/**
 * Header reutilizable para los listados de la aplicación.
 *
 * @remarks
 * Muestra un título `h4` con un badge de conteo total y, opcionalmente,
 * un botón "Agregar {addLabel}" alineado a la derecha. Acepta `children`
 * para incluir acciones adicionales junto al botón principal.
 *
 * @example
 * ```tsx
 * <ListHeader
 *   title="Clientes/Pacientes"
 *   count={clientesData?.count ?? 0}
 *   addLabel="Cliente"
 *   onAdd={() => setShowModal(true)}
 * />
 *
 * // Con acciones extra:
 * <ListHeader title="Productos" count={data?.count ?? 0} addLabel="Producto" onAdd={handleAdd}>
 *   <Button variant="danger" onClick={handleDeleteSelected}>Eliminar seleccionados</Button>
 * </ListHeader>
 * ```
 *
 * @param props - Ver {@link ListHeaderProps}.
 */
const ListHeader: React.FC<ListHeaderProps> = ({
  title,
  count,
  icon,
  addLabel,
  onAdd,
  canAdd = true,
  children,
}) => {
  const hasActions = (addLabel && canAdd) || children;

  return (
    <Row className="mb-3 align-items-center">
      <Col>
        <h4 className="mb-0 d-flex align-items-center gap-2">
          {icon && <span className="text-primary lh-1">{icon}</span>}
          <span>
            {title}{" "}
            <Badge bg="secondary" pill>
              {count}
            </Badge>
          </span>
        </h4>
      </Col>
      {hasActions && (
        <Col xs="auto" className="d-flex gap-2 align-items-center">
          {children}
          {addLabel && onAdd && canAdd && (
            <AddButton label={addLabel} onClick={onAdd} />
          )}
        </Col>
      )}
    </Row>
  );
};

export default ListHeader;
