import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import Header from "./components/Header";
import SideNav from "./components/SideNav";
import MainContent from "./components/MainContent";
import LoginPage from "./components/LoginPage";
import { useAuthStore } from "./stores/useAuthStore";
import { useNavStore } from "./stores/useNavStore";
import { useThemeStore } from "./stores/useThemeStore";
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
  const { accessToken, setAuth, clearAuth, isInitialized, setInitialized } =
    useAuthStore();
  const { pendingCompraId } = useNavStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  /**
   * Aplica data-bs-theme al elemento <html> cada vez que cambia el tema.
   * El modo "auto" lee la preferencia del SO y escucha cambios en tiempo real.
   */
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (t: "light" | "dark") =>
      root.setAttribute("data-bs-theme", t);

    if (theme !== "auto") {
      applyTheme(theme);
      return;
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    applyTheme(mq.matches ? "dark" : "light");

    const listener = (e: MediaQueryListEvent) =>
      applyTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [theme]);

  // Navegar a compras cuando se solicita desde historial de producto
  useEffect(() => {
    if (pendingCompraId !== null) {
      navigate("/compras");
    }
  }, [pendingCompraId, navigate]);

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
      <SideNav show={showSidebar} onHide={handleCloseSidebar} />
      <MainContent />
    </Layout>
  );
}

export default App;
