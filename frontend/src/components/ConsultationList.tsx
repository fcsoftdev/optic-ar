/**
 * @file ConsultationList.tsx
 * @description Componente para listar las consultas medicas de <Pacientes />
 <Clientes></Clientes>.
 */

/** * @interface Consulta
 * @description Define la estructura del objeto consulta.
 */
interface Consulta {
  id: number;
  paciente: string;
  fecha: string;
  motivo: string;
  diagnostico: string;
  tratamiento: string;
}

/** * Lista mock de marcas para mostrar en la tabla.
 */
const mockConsultas: Consulta[] = [
  {
    id: 1,
    paciente: "Juan Perez",
    fecha: "2024-01-15",
    motivo: "Revisión anual",
    diagnostico: "Salud visual óptima",
    tratamiento: "Ninguno",
  },
  {
    id: 2,
    paciente: "María Gómez",
    fecha: "2024-02-20",
    motivo: "Molestias oculares",
    diagnostico: "Conjuntivitis",
    tratamiento: "Colirios antibióticos",
  },
  {
    id: 3,
    paciente: "Carlos López",
    fecha: "2024-03-10",
    motivo: "Cambio de lentes",
    diagnostico: "Miopía progresiva",
    tratamiento: "Nuevos lentes correctivos",
  },
];

/**
 * Componente ConsultationList - Lista de consultas médicas.
 *
 * Muestra una lista de consultas utilizando datos mock.
 */
function ConsultationList() {
  return (
    <>
      <h5 className="mb-3">Listado de Consultas</h5>
      <table className="table table-striped table-bordered table-hover table-responsive">
        <thead>
          <tr>
            <th>ID</th>
            <th>Paciente</th>
            <th>Fecha</th>
            <th>Motivo</th>
            <th>Diagnóstico</th>
            <th>Tratamiento</th>
          </tr>
        </thead>
        <tbody>
          {mockConsultas.map((consulta) => (
            <tr key={consulta.id}>
              <td>{consulta.id}</td>
              <td>{consulta.paciente}</td>
              <td>{consulta.fecha}</td>
              <td>{consulta.motivo}</td>
              <td>{consulta.diagnostico}</td>
              <td>{consulta.tratamiento}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default ConsultationList;
