import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChartLine,
  CashStack,
  CreditCard2Front,
} from "react-bootstrap-icons";
import { useReporteCaja } from "../hooks/useReporteCaja";

/**
 * Formatea un número decimal como moneda argentina.
 *
 * @param valor - Valor en formato string o número.
 * @returns Cadena formateada con símbolo de pesos.
 */
function formatearPesos(valor: string | number): string {
  const num = typeof valor === "string" ? parseFloat(valor) : valor;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(num);
}

/**
 * Retorna la fecha de hoy en formato YYYY-MM-DD (local, sin UTC offset).
 */
function hoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Retorna el primer día del mes actual en formato YYYY-MM-DD.
 */
function primerDiaMes(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// ─── Tarjetas de resumen ──────────────────────────────────────────────────────

interface TarjetaResumenProps {
  titulo: string;
  total: string;
  cantidad: number;
  variante: "success" | "danger" | "warning" | "primary";
  icono: React.ReactNode;
}

/**
 * Tarjeta de resumen financiero con total y cantidad de operaciones.
 */
function TarjetaResumen({
  titulo,
  total,
  cantidad,
  variante,
  icono,
}: TarjetaResumenProps) {
  return (
    <Card className={`border-${variante} h-100`}>
      <Card.Body>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className={`text-${variante} fs-3`}>{icono}</span>
          <Badge bg={variante} className="fs-6">
            {cantidad} {cantidad === 1 ? "op." : "ops."}
          </Badge>
        </div>
        <Card.Subtitle className="text-muted mb-1">{titulo}</Card.Subtitle>
        <Card.Title className={`text-${variante} fs-4 mb-0`}>
          {formatearPesos(total)}
        </Card.Title>
      </Card.Body>
    </Card>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Componente ReporteCaja - Reporte financiero de caja.
 *
 * Muestra un resumen agregado de Ventas, Compras y Gastos para un
 * rango de fechas seleccionado, junto con el desglose por forma
 * de pago y los listados detallados de cada movimiento.
 */
function ReporteCaja() {
  const [fechaDesde, setFechaDesde] = useState<string>(primerDiaMes());
  const [fechaHasta, setFechaHasta] = useState<string>(hoy());
  // Params aplicados sólo al hacer clic en "Generar"
  const [paramsActivos, setParamsActivos] = useState<{
    fecha_desde: string;
    fecha_hasta: string;
  }>({
    fecha_desde: primerDiaMes(),
    fecha_hasta: hoy(),
  });

  const { data, isLoading, isError, refetch } = useReporteCaja(paramsActivos);

  /**
   * Aplica el filtro de fechas y fuerza la recarga del reporte.
   */
  const handleGenerar = () => {
    setParamsActivos({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta });
    // Si los params no cambiaron, forzar refetch
    refetch();
  };

  const saldo = data ? parseFloat(data.resumen.saldo_neto) : 0;
  const saldoPositivo = saldo >= 0;

  return (
    <div
      style={{
        height: "calc(100vh - 100px)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        paddingRight: "1rem",
      }}
    >
      {/* Encabezado */}
      <div className="d-flex align-items-center gap-2 mb-4">
        <BarChartLine size={26} className="text-primary" />
        <h4 className="mb-0">Reporte de Caja</h4>
      </div>

      {/* Filtro de fechas */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-end g-3">
            <Col xs={12} sm={4}>
              <Form.Label className="fw-semibold">Desde</Form.Label>
              <Form.Control
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </Col>
            <Col xs={12} sm={4}>
              <Form.Label className="fw-semibold">Hasta</Form.Label>
              <Form.Control
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </Col>
            <Col xs={12} sm={4}>
              <Button
                variant="primary"
                className="w-100"
                onClick={handleGenerar}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generando…
                  </>
                ) : (
                  "Filtrar y Generar"
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error */}
      {isError && (
        <Alert variant="danger">
          No se pudo cargar el reporte. Verificá la conexión con el servidor.
        </Alert>
      )}

      {/* Resultados */}
      {data && (
        <>
          {/* Tarjetas de resumen */}
          <Row className="g-3 mb-4">
            <Col xs={12} sm={6} xl={3}>
              <TarjetaResumen
                titulo="Total Ventas"
                total={data.resumen.total_ventas}
                cantidad={data.resumen.cantidad_ventas}
                variante="success"
                icono={<ArrowUpCircle />}
              />
            </Col>
            <Col xs={12} sm={6} xl={3}>
              <TarjetaResumen
                titulo="Total Compras"
                total={data.resumen.total_compras}
                cantidad={data.resumen.cantidad_compras}
                variante="danger"
                icono={<ArrowDownCircle />}
              />
            </Col>
            <Col xs={12} sm={6} xl={3}>
              <TarjetaResumen
                titulo="Total Gastos"
                total={data.resumen.total_gastos}
                cantidad={data.resumen.cantidad_gastos}
                variante="warning"
                icono={<CashStack />}
              />
            </Col>
            <Col xs={12} sm={6} xl={3}>
              <Card
                className={`border-${saldoPositivo ? "primary" : "secondary"} h-100`}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span
                      className={`text-${saldoPositivo ? "primary" : "secondary"} fs-3`}
                    >
                      <CreditCard2Front />
                    </span>
                    <Badge bg={saldoPositivo ? "primary" : "secondary"}>
                      Saldo Neto
                    </Badge>
                  </div>
                  <Card.Subtitle className="text-muted mb-1">
                    Ventas − Compras − Gastos
                  </Card.Subtitle>
                  <Card.Title
                    className={`text-${saldoPositivo ? "primary" : "secondary"} fs-4 mb-0`}
                  >
                    {formatearPesos(data.resumen.saldo_neto)}
                  </Card.Title>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Desglose por forma de pago */}
          {data.desglose_formas_pago.length > 0 && (
            <Card className="mb-4 shadow-sm">
              <Card.Header className="fw-semibold">
                Ventas por Forma de Pago
              </Card.Header>
              <Card.Body className="p-0">
                <Table
                  hover
                  responsive
                  className="mb-0 align-middle text-center"
                >
                  <thead className="table-light">
                    <tr>
                      <th className="text-start ps-3">Forma de Pago</th>
                      <th>Cantidad</th>
                      <th className="text-end pe-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.desglose_formas_pago.map((fp) => (
                      <tr key={fp.forma_pago}>
                        <td className="text-start ps-3">
                          {fp.forma_pago_display}
                        </td>
                        <td>
                          <Badge bg="success">{fp.cantidad}</Badge>
                        </td>
                        <td className="text-end pe-3 fw-semibold text-success">
                          {formatearPesos(fp.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* Detalle Ventas */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="fw-semibold d-flex justify-content-between align-items-center">
              <span>Detalle de Ventas</span>
              <Badge bg="success">{data.ventas.length}</Badge>
            </Card.Header>
            {data.ventas.length === 0 ? (
              <Card.Body className="text-muted text-center py-4">
                Sin ventas para el período seleccionado.
              </Card.Body>
            ) : (
              <Card.Body className="p-0">
                <Table hover responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">Fecha</th>
                      <th>Cliente</th>
                      <th>Forma Pago</th>
                      <th className="text-end">Total</th>
                      <th className="text-end pe-3">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ventas.map((v) => (
                      <tr key={v.id}>
                        <td className="ps-3">
                          {new Date(v.fecha + "T00:00:00").toLocaleDateString(
                            "es-AR",
                          )}
                        </td>
                        <td>{v.cliente_nombre}</td>
                        <td>
                          <Badge bg="light" text="dark">
                            {v.forma_pago_display}
                          </Badge>
                        </td>
                        <td className="text-end text-success fw-semibold">
                          {formatearPesos(v.total_venta)}
                        </td>
                        <td className="text-end pe-3">
                          {parseFloat(v.saldo) > 0 ? (
                            <span className="text-danger">
                              {formatearPesos(v.saldo)}
                            </span>
                          ) : (
                            <Badge bg="success">Pagado</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            )}
          </Card>

          {/* Detalle Compras */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="fw-semibold d-flex justify-content-between align-items-center">
              <span>Detalle de Compras</span>
              <Badge bg="danger">{data.compras.length}</Badge>
            </Card.Header>
            {data.compras.length === 0 ? (
              <Card.Body className="text-muted text-center py-4">
                Sin compras para el período seleccionado.
              </Card.Body>
            ) : (
              <Card.Body className="p-0">
                <Table hover responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">Fecha</th>
                      <th>Proveedor</th>
                      <th className="text-end pe-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.compras.map((c) => (
                      <tr key={c.id}>
                        <td className="ps-3">
                          {new Date(c.fecha + "T00:00:00").toLocaleDateString(
                            "es-AR",
                          )}
                        </td>
                        <td>{c.proveedor_nombre}</td>
                        <td className="text-end pe-3 text-danger fw-semibold">
                          {formatearPesos(c.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            )}
          </Card>

          {/* Detalle Gastos */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="fw-semibold d-flex justify-content-between align-items-center">
              <span>Detalle de Gastos</span>
              <Badge bg="warning" text="dark">
                {data.gastos.length}
              </Badge>
            </Card.Header>
            {data.gastos.length === 0 ? (
              <Card.Body className="text-muted text-center py-4">
                Sin gastos para el período seleccionado.
              </Card.Body>
            ) : (
              <Card.Body className="p-0">
                <Table hover responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">Fecha</th>
                      <th>Descripción</th>
                      <th className="text-end pe-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.gastos.map((g) => (
                      <tr key={g.id}>
                        <td className="ps-3">
                          {new Date(g.fecha + "T00:00:00").toLocaleDateString(
                            "es-AR",
                          )}
                        </td>
                        <td>{g.descripcion}</td>
                        <td className="text-end pe-3 text-warning fw-semibold">
                          {formatearPesos(g.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export default ReporteCaja;
