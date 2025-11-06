/**
 * @file PurchaseList.tsx
 * @description Componente que muestra un listado de compras.
 */

import { Table } from "react-bootstrap";

/** @interface Compras
 * @description Define la estructura del objeto compra.
 */
interface Compras {
  id: number;
  fecha: string;
  proveedor: string;
  total: number;
}

/**
 * @constant mockCompras
 * @description Lista de compras mock para pruebas visuales.
 */
const mockCompras: Compras[] = [
  {
    id: 1,
    fecha: "2024-01-15",
    proveedor: "Óptica Central",
    total: 150000,
  },
  {
    id: 2,
    fecha: "2024-02-10",
    proveedor: "Lentes y Más",
    total: 85000,
  },
  {
    id: 3,
    fecha: "2024-03-05",
    proveedor: "Visión Perfecta",
    total: 120000,
  },
];

function PurchaseList() {
  return (
    <>
      <h5 className="mb-3">Listado de Compras</h5>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Fecha</th>
            <th>Proveedor</th>
            <th>Total (CLP)</th>
          </tr>
        </thead>
        <tbody>
          {mockCompras.map((compra) => (
            <tr key={compra.id}>
              <td>{compra.id}</td>
              <td>{compra.fecha}</td>
              <td>{compra.proveedor}</td>
              <td>{compra.total.toLocaleString("es-CL")}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

export default PurchaseList;
