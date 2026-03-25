import { useState, useEffect, useRef } from "react";
import { Row, Col } from "react-bootstrap";
import { PersonBoundingBox, Calendar3, Cart4 } from "react-bootstrap-icons";
import Layout from "./components/Layout";
import Header from "./components/Header";
import SideNav from "./components/SideNav";
import MainContent from "./components/MainContent";
import InfoCard from "./components/InfoCard";
import LoginPage from "./components/LoginPage";
import { useAuthStore } from "./stores/useAuthStore";
import { useNavStore } from "./stores/useNavStore";
import { silentRefresh } from "./services/auth.service";

/**
 * Componente principal de la aplicación.
 *
 * Gestiona el ciclo de autenticación:
 * 1. Al montar, intenta restaurar la sesión via refresh silencioso.
 * 2. Muestra un spinner mientras verifica la sesión.
 * 3. Si no hay sesión válida, renderiza LoginPage.
 * 4. Si hay sesión, renderiza el layout principal.
 */
function App() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const { accessToken, setAuth, clearAuth, isInitialized, setInitialized } =
    useAuthStore();
  const { pendingCompraId } = useNavStore();

  // Navegar a compras cuando se solicita desde historial de producto
  useEffect(() => {
    if (pendingCompraId !== null) {
      setActiveSection("compras");
    }
  }, [pendingCompraId]);

  // Guard para evitar doble ejecución en React StrictMode (desarrollo).
  // StrictMode monta/desmonta/remonta los componentes dos veces. Con
  // ROTATE_REFRESH_TOKENS=True, el segundo refresh usa un token ya invalidado
  // por el primero → Django devuelve 401 → clearAuth() → cierre de sesión.
  // useRef persiste entre ambos ciclos, a diferencia de las variables locales.
  const refreshCalledRef = useRef(false);

  /**
   * Intento de refresco silencioso al inicializar la app.
   * Restaura la sesión si existe una cookie de refresh válida.
   */
  useEffect(() => {
    if (refreshCalledRef.current) return;
    refreshCalledRef.current = true;

    silentRefresh()
      .then((data) => setAuth(data.access, data.user))
      .catch(() => clearAuth())
      .finally(() => setInitialized());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Spinner de carga mientras se verifica la sesión
  if (!isInitialized) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div
          className="spinner-border text-primary"
          role="status"
          aria-label="Verificando sesión…"
        />
      </div>
    );
  }

  // Sin sesión → pantalla de login
  if (!accessToken) {
    return <LoginPage />;
  }

  const handleToggleSidebar = (): void => {
    setShowSidebar(!showSidebar);
  };

  const handleCloseSidebar = (): void => {
    setShowSidebar(false);
  };

  return (
    <Layout>
      <Header onToggleSidebar={handleToggleSidebar} />
      <SideNav
        show={showSidebar}
        onHide={handleCloseSidebar}
        setActiveSection={setActiveSection}
      />
      <MainContent activeSection={activeSection} />
    </Layout>
  );
}

export default App;
