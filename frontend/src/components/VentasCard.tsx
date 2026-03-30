import { Card } from "react-bootstrap";
import { ArrowRightShort, CartCheck } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";

/**
 * @component VentasCard
 * @description Tarjeta de acceso rápido al módulo de Ventas en el Dashboard.
 *
 * Mantiene el mismo estilo visual que TurnosHoy: header primario clickeable
 * con icono, título y flecha de navegación.
 */
function VentasCard() {
  const navigate = useNavigate();

  return (
    <Card
      className="h-100 shadow-sm"
      role="button"
      onClick={() => navigate("/ventas")}
      style={{ cursor: "pointer" }}
    >
      {/* ── Encabezado ─────────────────────────────────────────────── */}
      <Card.Header className="d-flex align-items-center justify-content-between bg-success text-white py-3">
        <div className="d-flex align-items-center gap-2">
          <CartCheck size={20} />
          <span className="fw-semibold fs-6">Ventas</span>
        </div>
        <ArrowRightShort size={22} className="opacity-75" />
      </Card.Header>

      {/* ── Cuerpo ─────────────────────────────────────────────────── */}
      <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center py-4 gap-3">
        <CartCheck size={48} className="text-success opacity-50" />
        <div>
          <p className="mb-1 fw-semibold text-secondary">Módulo de Ventas</p>
          <p className="mb-0 small text-muted">
            Registrá y consultá el historial de ventas
          </p>
        </div>
      </Card.Body>
    </Card>
  );
}

export default VentasCard;
