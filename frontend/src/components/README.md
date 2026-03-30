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

## Módulos ABM Implementados

### 📦 Productos (ProductList + ProductoFormModal)

**Características:**
✅ Búsqueda en tiempo real con debounce  
✅ Filtros por marca, categoría y subcategoría  
✅ Paginación (10 items por página)  
✅ CRUD completo con validación Zod  
✅ Selección múltiple para eliminación masiva  
✅ Indicadores de stock (bajo/crítico)  
✅ Modal de gestión de entidades relacionadas

**Archivos:**

- `ProductList.tsx` - Lista con filtros y paginación
- `ProductoFormModal.tsx` - Modal de crear/editar
- `EntityManagerModal.tsx` - CRUD de marcas/categorías/subcategorías
- `SearchableSelect.tsx` - Select con búsqueda (react-select)
- `schemas/productoSchema.ts` - Validaciones

### 🏷️ Marcas (BrandList + MarcaFormModal)

**Características:**
✅ Búsqueda por nombre (filtrado local)  
✅ CRUD completo con validación Zod  
✅ Selección múltiple para eliminación masiva  
✅ Modal simple de crear/editar  
✅ Cache optimizado con React Query (setQueryData)  
✅ Actualización instantánea sin refetch

**Archivos:**

- `BrandList.tsx` - Lista con búsqueda
- `MarcaFormModal.tsx` - Modal de crear/editar
- `schemas/marcaSchema.ts` - Validaciones

**Patrón de Arquitectura:**

```
Component → Hook (useProductos) → Service (productosService) → API (axios)
             ↓
          React Query Cache (optimizado con setQueryData)
```

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

- [x] Implementar ABM de Productos
- [x] Implementar ABM de Marcas
- [ ] Implementar ABM de Categorías
- [ ] Implementar ABM de SubCategorías
- [ ] Implementar ABM de Clientes/Pacientes
- [ ] Implementar ABM de Ventas
- [ ] Implementar ABM de Compras
- [ ] Implementar routing con React Router
- [ ] Implementar autenticación JWT
- [ ] Agregar Dashboard con métricas
