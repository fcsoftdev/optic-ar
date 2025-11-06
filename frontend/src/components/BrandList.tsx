/**
 * @file BrandList.tsx
 * @description Componente para listar las marcas de productos.
 */
import { Table } from "react-bootstrap";

/** * @interface Marca
 * @description Define la estructura del objeto marca.
 */
interface Marca {
  id: number;
  nombre: string;
}

/** * Lista mock de marcas para mostrar en la tabla.
 */
const mockMarcas: Marca[] = [
  { id: 1, nombre: "Ray-Ban" },
  { id: 2, nombre: "Oakley" },
  { id: 3, nombre: "Acuvue" },
  { id: 4, nombre: "Vogue" },
];

/**
 * Componente BrandList - Lista de marcas de productos.
 *
 * Muestra una lista de marcas utilizando datos mock.
 */
function BrandList() {
  return (
    <>
      <h5 className="mb-3">Listado de Marcas</h5>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
          </tr>
        </thead>
        <tbody>
          {mockMarcas.map((marca) => (
            <tr key={marca.id}>
              <td>{marca.id}</td>
              <td>{marca.nombre}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

export default BrandList;
