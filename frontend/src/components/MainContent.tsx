import { Col } from "react-bootstrap";
import { Routes, Route, Navigate } from "react-router-dom";
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
import ReporteCaja from "./ReporteCaja";
import UserList from "./UserList";
import GroupList from "./GroupList";
import AuditoriaPage from "./AuditoriaPage";
import ProtectedRoute from "./ProtectedRoute";

/**
 * Componente MainContent - Área de contenido principal.
 *
 * Renderiza la sección activa usando React Router. Cada ruta con acceso
 * restringido está envuelta en ProtectedRoute para verificar permisos de
 * Django antes de renderizar el componente, incluso si el usuario navega
 * directamente por URL.
 */
function MainContent() {
  return (
    <Col
      xs={12}
      md={9}
      lg={10}
      className="p-4 overflow-auto bg-body"
      style={{ minHeight: 0 }}
    >
      <div className="p-2">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route
            path="/productos"
            element={
              <ProtectedRoute
                perm="productos.view_producto"
                element={<ProductList />}
              />
            }
          />
          <Route
            path="/marcas"
            element={
              <ProtectedRoute
                perm="productos.view_marca"
                element={<BrandList />}
              />
            }
          />
          <Route
            path="/clientes-pacientes"
            element={
              <ProtectedRoute
                perm="ventas.view_cliente"
                element={<ClienteList />}
              />
            }
          />
          <Route
            path="/consultas"
            element={
              <ProtectedRoute
                perm="ventas.view_consulta"
                element={<ConsultationList />}
              />
            }
          />
          <Route
            path="/obras-sociales"
            element={
              <ProtectedRoute
                perm="ventas.view_obrasocial"
                element={<InsuranceProvider />}
              />
            }
          />
          <Route
            path="/compras"
            element={
              <ProtectedRoute
                perm="compras.view_compra"
                element={<PurchaseList />}
              />
            }
          />
          <Route
            path="/gastos"
            element={
              <ProtectedRoute
                perm="compras.view_gasto"
                element={<ExpensesList />}
              />
            }
          />
          <Route
            path="/proveedores"
            element={
              <ProtectedRoute
                perm="compras.view_proveedor"
                element={<SuppliersList />}
              />
            }
          />
          <Route
            path="/ventas"
            element={
              <ProtectedRoute
                perm="ventas.view_venta"
                element={<SalesList />}
              />
            }
          />
          <Route
            path="/turnos"
            element={
              <ProtectedRoute
                perm="turnos.view_turno"
                element={<TurnosCalendar />}
              />
            }
          />
          <Route
            path="/reporte-caja"
            element={
              <ProtectedRoute
                perm="contabilidad.ver_reporte_caja"
                element={<ReporteCaja />}
              />
            }
          />
          <Route
            path="/usuarios"
            element={<ProtectedRoute requiresStaff element={<UserList />} />}
          />
          <Route
            path="/grupos"
            element={<ProtectedRoute requiresStaff element={<GroupList />} />}
          />
          <Route
            path="/auditoria"
            element={
              <ProtectedRoute
                perm="authentication.ver_auditoria"
                element={<AuditoriaPage />}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Col>
  );
}

export default MainContent;
