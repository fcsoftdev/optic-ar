# Optic-AR - Sistema de Gestión de Ópticas

## Arquitectura General

**Stack Fullstack:**

- **Backend:** Django 5.2.4 + Django REST Framework 3.15.2 (Python 3.10)
- **Frontend:** React 19.1.1 + TypeScript + Vite 7.1.11
- **Database:** SQLite (desarrollo) / PostgreSQL (producción)

**Estructura del monorepo:**

```
optic-ar/
├── backend/          # Django REST API
│   ├── config/       # Settings (base.py, dev.py, prod.py)
│   ├── productos/    # App principal con ViewSets
│   ├── ventas/       # Apps legacy con views tradicionales
│   ├── compras/
│   ├── contabilidad/
│   └── turnos/
└── frontend/         # React SPA
    └── src/
        ├── components/   # Componentes React + Bootstrap
        ├── hooks/        # React Query hooks (gestión de estado servidor)
        ├── services/     # Capa HTTP (axios)
        └── schemas/      # Validaciones Zod
```

## Convenciones del Proyecto

### Backend (Django)

**URL Routing:** La app `productos` usa DRF ViewSets con router automático. URL base: `/api/` (configurado en `config/urls.py`).

```python
# productos/urls.py
router = DefaultRouter()
router.register(r"productos", viewsets.ProductoViewSet)
# Genera: /api/productos/, /api/productos/{id}/
```

**Paginación:** REST_FRAMEWORK configurado con `PAGE_SIZE: 10` en `config/settings/base.py`.

**Formato de nombres en modelos:** Las marcas aplican `.title()` automáticamente en el método `save()` (ver `productos/models.py`).

**Precios:** Usar `DecimalField(max_digits=10, decimal_places=2)` para campos monetarios (pesos argentinos).

### Frontend (React + TypeScript)

**Separación de responsabilidades:**

- `/services/*.service.ts`: Llamadas HTTP puras (axios), sin lógica React
- `/hooks/use*.ts`: React Query hooks para gestión de estado servidor (cache, mutations, invalidaciones)
- `/schemas/*.ts`: Validaciones con Zod para formularios

**Ejemplo del patrón:**

```typescript
// services/productos.service.ts
export const createMarca = async (nombre: string): Promise<Marca> => {
  const response = await api.post("/api/marcas/", { nombre });
  return response.data;
};

// hooks/useProductos.ts
export const useCreateMarca = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nombre: string) => productosService.createMarca(nombre),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["marcas"] });
      await queryClient.refetchQueries({ queryKey: ["marcas"] });
    },
  });
};
```

**Cache de React Query:** SIEMPRE invalidar Y refetch después de mutaciones para actualizar la UI inmediatamente.

**Formularios:** Usar `react-hook-form` + `zod` + `@hookform/resolvers`. Los campos de precio deben validar decimales con `.multipleOf(0.01)`.

**Select con búsqueda:** Usar el componente `SearchableSelect` (react-select wrapper) para marca/categoría/subcategoría. Acepta `value: number | null | undefined`.

**Gestión de entidades relacionadas:** El componente `EntityManagerModal` proporciona CRUD completo (crear/editar/eliminar) para Marca, Categoría y SubCategoría desde el formulario de productos.

## Configuración del Entorno

**Backend:**

```bash
cd backend
pip install -r requeriments/dev.txt
python manage.py runserver
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev  # Vite dev server en http://localhost:5173
```

**Variables de entorno:**

- Frontend usa `VITE_API_URL` (definir en `frontend/.env`)
- Default: `http://127.0.0.1:8000`

## Patrones UI

**React Bootstrap Grid:** El layout usa columnas responsivas:

- `md`: SideNav 3 cols, MainContent 9 cols
- `lg`: SideNav 2 cols, MainContent 10 cols

**Paginación inteligente:** Mostrar rangos de páginas (ej: 1...3 4 5...11) cuando hay muchas páginas (ver `ProductList.tsx`).

**Sticky elements:** Header y paginación usan `position: sticky` con flexbox para scroll vertical sin perder contexto.

## Debugging

**CORS:** Django configurado con `django-cors-headers`. Si hay errores de CORS, verificar `config/settings/dev.py`.

**React Query DevTools:** Agregar `@tanstack/react-query-devtools` para inspeccionar cache y queries.

**Errores 404 en API:** Verificar que la URL no tenga doble `/api/` (debe ser `/api/productos/`, NO `/api/productos/api/productos/`).

## Testing

**Backend:** Django tests en cada app (`tests.py`)
**Frontend:** Estructura preparada pero sin tests implementados aún

## Estilos

- Bootstrap 5.3.8 via react-bootstrap
- CSS modules en componentes individuales (ej: `Layout.css`)
- Iconos: react-bootstrap-icons
