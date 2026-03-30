import { Card } from "react-bootstrap";
import { ArrowRightShort, Bag } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";

/**
 * @component ComprasCard
 * @description Tarjeta de acceso rápido al módulo de Compras en el Dashboard.
 *
 * Mantiene el mismo estilo visual que VentasCard: header clickeable
 * con icono, título y flecha de navegación.
 */
function ComprasCard() {
  const navigate = useNavigate();

  return (
    <Card
      className="h-100 shadow-sm"
      role="button"
      onClick={() => navigate("/compras")}
      style={{ cursor: "pointer" }}
    >
      {/* ── Encabezado ─────────────────────────────────────────────── */}
      <Card.Header className="d-flex align-items-center justify-content-between bg-warning text-dark py-3">
        <div className="d-flex align-items-center gap-2">
          <Bag size={20} />
          <span className="fw-semibold fs-6">Compras</span>
        </div>
        <ArrowRightShort size={22} className="opacity-75" />
      </Card.Header>

      {/* ── Cuerpo ─────────────────────────────────────────────────── */}
      <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center py-4 gap-3">
        <Bag size={48} className="text-warning opacity-50" />
        <div>
          <p className="mb-1 fw-semibold text-secondary">Módulo de Compras</p>
          <p className="mb-0 small text-muted">
            Registrá y consultá el historial de compras
          </p>
        </div>
      </Card.Body>
    </Card>
  );
}

export default ComprasCard;
