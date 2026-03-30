import { Badge, Card, Spinner } from "react-bootstrap";
import { ArrowRightShort, ClockFill, PersonFill } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { useTurnos } from "../hooks/useTurnos";

/**
 * Formatea "HH:MM:SS" → "HH:MM"
 */
const fmtHora = (hora: string) => hora.slice(0, 5);

/**
 * @component TurnosHoy
 * @description Card del Dashboard que muestra los turnos del día actual.
 *
 * Consulta al backend los turnos entre start=hoy y end=hoy.
 * Muestra cantidad total como badge y lista los turnos ordenados por hora.
 */
function TurnosHoy() {
  const navigate = useNavigate();
  const hoy = new Date().toISOString().slice(0, 10);

  const irAAgendaHoy = () => navigate(`/turnos?date=${hoy}&view=timeGridDay`);

  const { data: turnos = [], isLoading } = useTurnos({
    start: hoy,
    end: hoy,
  });

  const turnosOrdenados = [...turnos].sort((a, b) =>
    a.hora_inicio.localeCompare(b.hora_inicio),
  );

  return (
    <Card className="h-100 shadow-sm">
      {/* ── Encabezado ─────────────────────────────────────────────── */}
      <Card.Header
        role="button"
        onClick={irAAgendaHoy}
        className="d-flex align-items-center justify-content-between bg-primary text-white py-3"
        style={{ cursor: "pointer" }}
        title="Ver agenda de hoy"
      >
        <div className="d-flex align-items-center gap-2">
          <ClockFill size={20} />
          <span className="fw-semibold fs-6">Turnos de Hoy</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="light" text="primary" pill className="fs-6 px-3">
            {isLoading ? "…" : turnos.length}
          </Badge>
          <ArrowRightShort size={22} className="opacity-75" />
        </div>
      </Card.Header>

      {/* ── Cuerpo ─────────────────────────────────────────────────── */}
      <Card.Body className="p-0">
        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" variant="primary" />
          </div>
        ) : turnosOrdenados.length === 0 ? (
          <div className="text-center text-muted py-4 small">
            No hay turnos programados para hoy.
          </div>
        ) : (
          <ul className="list-unstyled mb-0">
            {turnosOrdenados.map((turno, idx) => (
              <li
                key={turno.id}
                className={`d-flex align-items-center gap-3 px-3 py-2${
                  idx < turnosOrdenados.length - 1 ? " border-bottom" : ""
                }`}
              >
                {/* Hora */}
                <span
                  className="text-primary fw-bold text-nowrap"
                  style={{ minWidth: "3.5rem", fontSize: "0.85rem" }}
                >
                  {fmtHora(turno.hora_inicio)}
                </span>

                {/* Separador vertical */}
                <div
                  style={{
                    width: 3,
                    height: 36,
                    borderRadius: 4,
                    background: "var(--bs-primary)",
                    opacity: 0.25,
                    flexShrink: 0,
                  }}
                />

                {/* Datos del turno */}
                <div className="flex-grow-1 overflow-hidden">
                  <div className="d-flex align-items-center gap-1">
                    <PersonFill
                      size={13}
                      className="text-muted flex-shrink-0"
                    />
                    <span
                      className="fw-semibold text-truncate"
                      style={{ fontSize: "0.9rem" }}
                    >
                      {turno.cliente_nombre}
                    </span>
                  </div>
                  {turno.motivo && (
                    <div
                      className="text-muted text-truncate"
                      style={{ fontSize: "0.78rem" }}
                    >
                      {turno.motivo}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card.Body>
    </Card>
  );
}

export default TurnosHoy;
