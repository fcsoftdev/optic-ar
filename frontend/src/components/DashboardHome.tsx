import { Row, Col } from "react-bootstrap";
import { PersonBoundingBox, Cart4 } from "react-bootstrap-icons";
import InfoCard from "./InfoCard";
import TurnosHoy from "./TurnosHoy";

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
        <InfoCard
          icon={<PersonBoundingBox size={48} />}
          title="30"
          description="Total de pacientes"
        />
      </Col>
      <Col xs={12} md={6} lg={4}>
        <InfoCard
          icon={<Cart4 size={48} />}
          title="15"
          description="Productos"
        />
      </Col>
    </Row>
  </div>
);

export default DashboardHome;
