/**
 * @file SuppliersList.tsx
 * @description Componente que muestra la lista de proveedores.
 */

import { Table } from "react-bootstrap";
import ListHeader from "./ListHeader";

/**
 * @interface Proveedor
 * @description Define la estructura del objeto proveedor.
 */
interface Proveedor {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
}

/**
 * Mock de proveedores para mostrar en la tabla.
 */
const mockProveedores: Proveedor[] = [
  {
    id: 1,
    nombre: "Proveedor A",
    direccion: "Calle Falsa 123",
    telefono: "1234-5678",
  },
  {
    id: 2,
    nombre: "Proveedor B",
    direccion: "Avenida Siempre Viva 742",
    telefono: "8765-4321",
  },
];

/**
 * Componente que muestra la lista de proveedores.
 * @returns
 */
function SuppliersList() {
  return (
    <>
      <ListHeader title="Lista de Proveedores" count={0} />
      <Table className="table table-striped table-bordered table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Dirección</th>
            <th>Teléfono</th>
          </tr>
        </thead>
        <tbody>
          {mockProveedores.map((proveedor) => (
            <tr key={proveedor.id}>
              <td>{proveedor.id}</td>
              <td>{proveedor.nombre}</td>
              <td>{proveedor.direccion}</td>
              <td>{proveedor.telefono}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

export default SuppliersList;
