/**
 * @file CustomerList.tsx
 * @description Componente para listar los clientes.
 */
interface Customer {
  id: number;
  nombre_apellido: string;
  dni: string;
  numero_afiliado: number;
  obra_social: string;
}

/**
 * Lista mock de clientes para mostrar en la tabla.
 */
const mockCustomers: Customer[] = [
  {
    id: 1,
    nombre_apellido: "Juan Perez",
    dni: "12345678",
    numero_afiliado: 1001,
    obra_social: "OSDE",
  },
  {
    id: 2,
    nombre_apellido: "Maria Gomez",
    dni: "87654321",
    numero_afiliado: 1002,
    obra_social: "Swiss Medical",
  },
  {
    id: 3,
    nombre_apellido: "Carlos Lopez",
    dni: "11223344",
    numero_afiliado: 1003,
    obra_social: "Galeno",
  },
];

/**
 * Componente para listar los clientes.
 */
import ListHeader from "./ListHeader";

function CustomerList() {
  return (
    <>
      <ListHeader title="Listado de Clientes" count={0} />
      <table className="table table-striped table-bordered table-hover">
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre y Apellido</th>
            <th>DNI</th>
            <th>Número de Afiliado</th>
            <th>Obra Social</th>
          </tr>
        </thead>
        <tbody>
          {mockCustomers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.id}</td>
              <td>{customer.nombre_apellido}</td>
              <td>{customer.dni}</td>
              <td>{customer.numero_afiliado}</td>
              <td>{customer.obra_social}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default CustomerList;
