import { Row, Col } from "react-bootstrap";
import { BoxSeam } from "react-bootstrap-icons";
import InfoCard from "./InfoCard";
import TurnosHoy from "./TurnosHoy";
import VentasCard from "./VentasCard";

/**
 * @component DashboardHome
 * @description Vista principal con tarjetas informativas.
 */
const DashboardHome = () => (
  <div>
    <h1>Bienvenido a Opticar</h1>
    <p className="mb-4">Sistema de gestión de óptica</p>

    <Row className="g-3">
      <Col xs={12} md={6} lg={4}>
        <TurnosHoy />
      </Col>
      <Col xs={12} md={6} lg={4}>
        <VentasCard />
      </Col>
      <Col xs={12} md={6} lg={4}>
        <InfoCard
          icon={<BoxSeam size={48} />}
          title="15"
          description="Productos"
        />
      </Col>
    </Row>
  </div>
);

export default DashboardHome;
