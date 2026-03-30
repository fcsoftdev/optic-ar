import React from "react";
import { Button } from "react-bootstrap";
import { PlusCircle } from "react-bootstrap-icons";

/**
 * Props para el componente AddButton.
 */
interface AddButtonProps {
  /** Texto que se muestra junto al ícono. Ejemplo: "Cliente", "Marca", "Producto". */
  label: string;
  /** Callback ejecutado al hacer click. */
  onClick: () => void;
  /** Deshabilita el botón cuando es `true`. Por defecto `false`. */
  disabled?: boolean;
}

/**
 * Botón reutilizable para agregar nuevos registros en cualquier listado.
 *
 * @remarks
 * Genera automáticamente el texto "Agregar {label}" y muestra un ícono `PlusCircle`.
 * Mantiene un estilo visual consistente en toda la aplicación.
 *
 * @example
 * ```tsx
 * <AddButton label="Cliente" onClick={() => setShowModal(true)} />
 * // Renderiza: [+ Agregar Cliente]
 *
 * <AddButton label="Marca" onClick={handleAddMarca} />
 * // Renderiza: [+ Agregar Marca]
 * ```
 *
 * @param props - Ver {@link AddButtonProps}.
 */
const AddButton: React.FC<AddButtonProps> = ({
  label,
  onClick,
  disabled = false,
}) => {
  return (
    <Button variant="primary" onClick={onClick} disabled={disabled}>
      <PlusCircle size={18} className="me-2" />
      Agregar {label}
    </Button>
  );
};

export default AddButton;
