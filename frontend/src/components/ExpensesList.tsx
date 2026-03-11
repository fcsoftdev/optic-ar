/**
 * @file ExpensesList.tsx
 * @description Componente que muestra la lista de gastos.
 */

/**
 * @interface Gastos
 * @description Define la estructura del objeto gastos.
 */
interface Gastos {
  id: number;
  feccha: string;
  descripcion: string;
  total: number;
}

/**
 * Datos mock de gastos para mostrar en la tabla.
 */
const mockGastos: Gastos[] = [
  {
    id: 1,
    feccha: "2024-01-15",
    descripcion: "Compra de lentes",
    total: 150.0,
  },
  {
    id: 2,
    feccha: "2024-02-10",
    descripcion: "Pago de servicios",
    total: 200.0,
  },
  {
    id: 3,
    feccha: "2024-03-05",
    descripcion: "Mantenimiento de equipos",
    total: 300.0,
  },
];

import ListHeader from "./ListHeader";

function ExpensesList() {
  return (
    <>
      <ListHeader title="Listado de Gastos" count={0} />
      <table className="table table-striped table-bordered table-hover">
        <thead>
          <tr>
            <th>#</th>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Total ($)</th>
          </tr>
        </thead>
        <tbody>
          {mockGastos.map((gasto) => (
            <tr key={gasto.id}>
              <td>{gasto.id}</td>
              <td>{gasto.feccha}</td>
              <td>{gasto.descripcion}</td>
              <td>{gasto.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default ExpensesList;
