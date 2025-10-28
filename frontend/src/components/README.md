# 📐 Estructura del Layout

## Componentes principales

### Layout.tsx

Componente principal que estructura la aplicación usando React Bootstrap Grid System.

**Estructura:**

```
┌─────────────────────────────────────────┐
│            Header (100%)                │
├──────────┬──────────────────────────────┤
│          │                              │
│ SideNav  │      MainContent             │
│ (2-3 col)│      (9-10 col)              │
│          │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

**Grid Breakpoints:**

- `xs` (< 576px): SideNav oculto, MainContent 12 columnas
- `md` (≥ 768px): SideNav 3 columnas, MainContent 9 columnas
- `lg` (≥ 992px): SideNav 2 columnas, MainContent 10 columnas

### Header.tsx

Barra de navegación superior con:

- Logo y nombre de la aplicación
- Menú de usuario (perfil, logout)

### SideNav.tsx

Menú lateral de navegación con enlaces a:

- Dashboard
- Productos
- Ventas
- Compras
- Contabilidad
- Turnos

## Estilos

### Layout.css

Estilos personalizados para:

- Scrollbars personalizados
- Estados hover/active del menú
- Responsive design para móviles
- Transiciones suaves

## Uso

```tsx
import Layout from "./components/Layout";

function App() {
  return (
    <Layout>
      <YourPageContent />
    </Layout>
  );
}
```

## TODO

- [ ] Implementar routing con React Router
- [ ] Agregar estado activo en navegación
- [ ] Implementar autenticación
- [ ] Agregar menú móvil (hamburger menu)
- [ ] Crear componente MainContent separado
