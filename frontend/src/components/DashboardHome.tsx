import { Row, Col } from "react-bootstrap";
import TurnosHoy from "./TurnosHoy";
import VentasCard from "./VentasCard";
import ComprasCard from "./ComprasCard";

/**
 * @component DashboardHome
 * @description Vista principal con tarjetas informativas.
 */
const DashboardHome = () => (
  <div>
    <h1>Bienvenido a Optic-AR</h1>
    <p className="mb-4">Sistema de gestión de óptica</p>

    <Row className="g-3">
      <Col xs={12} md={6} lg={4}>
        <TurnosHoy />
      </Col>
      <Col xs={12} md={6} lg={4}>
        <VentasCard />
      </Col>
      <Col xs={12} md={6} lg={4}>
        <ComprasCard />
      </Col>
    </Row>
  </div>
);

export default DashboardHome;
