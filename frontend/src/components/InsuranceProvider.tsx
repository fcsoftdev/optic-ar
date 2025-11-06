import { Table } from "react-bootstrap";

/**
 * @file InsuranceProvider.tsx
 * @description Componente de proveedor de seguros. (OSDE, Swiss Medical, etc.)
 */
interface ObraSocial {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
}

/** * Lista mock de obras sociales para mostrar en la tabla.
 *
 */
const mockObrasSociales: ObraSocial[] = [
  {
    id: 1,
    nombre: "OSDE",
    direccion: "Calle Falsa 123",
    telefono: "1234-5678",
  },
  {
    id: 2,
    nombre: "Swiss Medical",
    direccion: "Avenida Siempre Viva 742",
    telefono: "8765-4321",
  },
  {
    id: 3,
    nombre: "Galeno",
    direccion: "Boulevard de los Sueños Rotos 456",
    telefono: "1122-3344",
  },
];

function InsuranceProvider() {
  return (
    <>
      <h5 className="mb-3">Obras Sociales</h5>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Dirección</th>
            <th>Teléfono</th>
          </tr>
        </thead>
        <tbody>
          {mockObrasSociales.map((obraSocial) => (
            <tr key={obraSocial.id}>
              <td>{obraSocial.id}</td>
              <td>{obraSocial.nombre}</td>
              <td>{obraSocial.direccion}</td>
              <td>{obraSocial.telefono}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

export default InsuranceProvider;
