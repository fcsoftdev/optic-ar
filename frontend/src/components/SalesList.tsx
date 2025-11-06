/**
 * @file SalesList.tsx
 * @description Componente que muestra una lista de ventas.
 */

import { Table } from "react-bootstrap";

/**
 * @interface Venta
 * @description Define la estructura del objeto venta.
 */
interface Venta {
  id: number;
  fecha: string;
  cliente: string;
  formaDePago: string;
  precioTotal: number;
}

/**
 *
 * Mock de ventas para mostrar en la tabla.
 */
const mockVentas: Venta[] = [
  {
    id: 1,
    fecha: "2024-01-15",
    cliente: "Juan Pérez",
    formaDePago: "Tarjeta de Crédito",
    precioTotal: 1500,
  },
  {
    id: 2,
    fecha: "2024-01-16",
    cliente: "María Gómez",
    formaDePago: "Efectivo",
    precioTotal: 750,
  },
];

/**
 * Componente que muestra la lista de ventas.
 * @returns
 */

function SalesList() {
  return (
    <>
      <h5>Lista de Ventas</h5>
      <Table className="table table-striped table-bordered table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Forma de Pago</th>
            <th>Precio Total</th>
          </tr>
        </thead>
        <tbody>
          {mockVentas.map((venta) => (
            <tr key={venta.id}>
              <td>{venta.id}</td>
              <td>{venta.fecha}</td>
              <td>{venta.cliente}</td>
              <td>{venta.formaDePago}</td>
              <td>{venta.precioTotal}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

export default SalesList;
