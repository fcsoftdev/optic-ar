import type { ReactNode } from "react";
import { Col } from "react-bootstrap";
import DashboardHome from "./DashboardHome";
import ProductList from "./ProductList";
import BrandList from "./BrandList";
import ClienteList from "./ClienteList";
import ConsultationList from "./ConsultationList";
import InsuranceProvider from "./InsuranceProvider";
import PurchaseList from "./PurchaseList";
import ExpensesList from "./ExpensesList";
import SuppliersList from "./SuppliersList";
import SalesList from "./SalesList";
import TurnosCalendar from "./TurnosCalendar";

interface MainContentProps {
  children?: ReactNode;
  activeSection: string;
}

/**
 * Componente MainContent - Área de contenido principal.
 *
 * Renderiza el contenido principal de la aplicación dentro
 * de una columna de Bootstrap con responsive design.
 *
 * @param children - Contenido a mostrar en el área principal
 */
function MainContent({ children, activeSection }: MainContentProps) {
  return (
    <Col
      xs={12}
      md={9}
      lg={10}
      className="p-4 overflow-auto bg-white"
      style={{ minHeight: 0 }}
    >
      <div className="p-2">
        {activeSection === "dashboard" && <DashboardHome />}
        {activeSection === "productos" && <ProductList />}
        {activeSection === "marcas" && <BrandList />}
        {activeSection === "clientes-pacientes" && <ClienteList />}
        {activeSection === "consultas" && <ConsultationList />}
        {activeSection === "obras-sociales" && <InsuranceProvider />}
        {activeSection === "compras" && <PurchaseList />}
        {activeSection === "gastos" && <ExpensesList />}
        {activeSection === "proveedores" && <SuppliersList />}
        {activeSection === "ventas" && <SalesList />}
        {activeSection === "turnos" && <TurnosCalendar />}
      </div>
    </Col>
  );
}

export default MainContent;
