# AGENTS.md --- Instrucciones para Agentes de IA

Proyecto: Optic-AR -- Sistema de Gestión de Ópticas

## 1. Alcance

Define arquitectura, convenciones, estándares de documentación, patrones
frontend/backend, configuración del entorno y reglas para generación de
código por agentes de IA.

------------------------------------------------------------------------

## 2. Arquitectura

### Backend

-   Python 3.10
-   Django 5.2.4
-   Django REST Framework 3.15.2

### Frontend

-   React 19.1.1
-   TypeScript
-   Vite 7.1.11

### Base de datos

-   SQLite (desarrollo)
-   PostgreSQL (producción)

------------------------------------------------------------------------

## 3. Estructura del Monorepo

optic-ar/ ├── backend/ │ ├── config/ │ ├── productos/ │ ├── ventas/ │
├── compras/ │ ├── contabilidad/ │ └── turnos/ └── frontend/ └── src/
├── components/ ├── hooks/ ├── services/ └── schemas/

------------------------------------------------------------------------

## 4. Backend (Django)

### API REST

Se utilizan ViewSets de DRF con router automático.

Ejemplo:

``` python
router = DefaultRouter()
router.register(r"productos", viewsets.ProductoViewSet)
```

Endpoints:

/api/productos/ /api/productos/{id}/

Base API:

/api/

------------------------------------------------------------------------

### Paginación

Configurada en:

config/settings/base.py

PAGE_SIZE = 10

------------------------------------------------------------------------

### Convenciones en modelos

Normalización de nombres:

``` python
nombre = nombre.title()
```

------------------------------------------------------------------------

### Campos monetarios

``` python
DecimalField(max_digits=10, decimal_places=2)
```

Valores expresados en pesos argentinos.

------------------------------------------------------------------------

## 5. Estándares Python

### Docstrings (PEP257)

Reglas:

-   Usar triple comillas
-   Primera línea resumen breve
-   Descripción extendida después de línea en blanco
-   Documentar módulos, clases, funciones y métodos
-   Comentarios en español técnico

------------------------------------------------------------------------

### Type Hints (PEP484)

Todas las funciones deben usar anotaciones de tipo.

Ejemplo:

``` python
from typing import List, Dict

def procesar_datos(entradas: List[float]) -> Dict[str, float]:
    """Procesa números y devuelve estadísticas."""
    return {
        "media": sum(entradas) / len(entradas),
        "maximo": max(entradas)
    }
```

------------------------------------------------------------------------

## 6. Frontend (React + TypeScript)

Librerías obligatorias:

-   TypeScript
-   React Bootstrap
-   React Query
-   Zustand
-   Axios
-   Zod
-   React Hook Form

El código debe ser modular, reutilizable y responsivo.

------------------------------------------------------------------------

## 7. Arquitectura Frontend

Separación de responsabilidades:

services → llamadas HTTP hooks → lógica React Query schemas →
validaciones components → UI

------------------------------------------------------------------------

### Services

Contienen únicamente llamadas HTTP.

Ejemplo:

``` ts
export const createMarca = async (nombre: string) => {
  const response = await api.post("/api/marcas/", { nombre })
  return response.data
}
```

------------------------------------------------------------------------

### Hooks (React Query)

Gestionan:

-   cache
-   mutaciones
-   invalidaciones
-   refetch

Regla obligatoria:

invalidateQueries + refetchQueries después de mutaciones.

------------------------------------------------------------------------

## 8. Formularios

Usar:

-   react-hook-form
-   zod
-   @hookform/resolvers

Validación de precios:

z.number().multipleOf(0.01)

------------------------------------------------------------------------

## 9. Componentes reutilizables

### SearchableSelect

Basado en react-select.

Tipos permitidos:

number \| null \| undefined

Usado para:

-   Marca
-   Categoría
-   Subcategoría

------------------------------------------------------------------------

### EntityManagerModal

CRUD completo para:

-   Marca
-   Categoría
-   SubCategoría

------------------------------------------------------------------------

## 10. Estado Global

Gestionado con Zustand.

Ejemplo:

``` ts
import { create } from "zustand"

export const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user })
}))
```

------------------------------------------------------------------------

## 11. Layout UI

React Bootstrap Grid:

md → 3 / 9 columnas lg → 2 / 10 columnas

------------------------------------------------------------------------

### Sticky elements

Header y paginación usan:

position: sticky

------------------------------------------------------------------------

## 12. Paginación UI

Paginación inteligente:

1 ... 3 4 5 ... 11

Implementado en ProductList.tsx

------------------------------------------------------------------------

## 13. Configuración del Entorno

Backend:

cd backend pip install -r requeriments/dev.txt python manage.py
runserver

Frontend:

cd frontend npm install npm run dev

------------------------------------------------------------------------

## 14. Variables de Entorno

Frontend:

VITE_API_URL=http://127.0.0.1:8000

------------------------------------------------------------------------

## 15. Debugging

### CORS

django-cors-headers

Verificar:

config/settings/dev.py

------------------------------------------------------------------------

### React Query DevTools

@tanstack/react-query-devtools

------------------------------------------------------------------------

### Error común

Incorrecto:

/api/productos/api/productos/

Correcto:

/api/productos/

------------------------------------------------------------------------

## 16. Testing

Backend:

tests.py en cada app.

Frontend:

estructura preparada.

------------------------------------------------------------------------

## 17. Estilos

-   Bootstrap 5.3
-   CSS Modules
-   react-bootstrap-icons

------------------------------------------------------------------------

## 18. Documentación TypeScript (TSDoc)

Usar:

@param @returns @example @remarks @deprecated

Comentarios en español técnico.

------------------------------------------------------------------------

## 19. Principios para Agentes IA

1.  Respetar arquitectura del monorepo.
2.  Usar DRF ViewSets.
3.  Usar TypeScript en frontend.
4.  Mantener separación services/hooks/components.
5.  Usar React Query para estado servidor.
6.  Usar Zustand para estado global.
7.  Validar formularios con Zod.
8.  Documentar con PEP257 y TSDoc.
9.  Comentarios claros en español.
10. Código modular y mantenible.
