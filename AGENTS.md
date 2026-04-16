# AGENTS.md — Optic-AR: Sistema de Gestión de Ópticas

Proyecto: **Optic-AR** | Monorepo: `backend/` (Django) + `frontend/` (React + TypeScript)

> Este archivo es un **router de skills**. Cargá solo el skill relevante para la tarea.
> No leas todos los skills — usá las descripciones para decidir cuál cargar.

---

## Skills disponibles

| Skill | Cuándo cargarlo |
|---|---|
| [backend-django](.opencode/skills/backend-django/SKILL.md) | Modelos, ViewSets, serializers, endpoints, paginación, campos monetarios |
| [frontend-react](.opencode/skills/frontend-react/SKILL.md) | Componentes React, servicios HTTP, hooks, arquitectura frontend |
| [forms-validation](.opencode/skills/forms-validation/SKILL.md) | Formularios, validaciones, Zod, React Hook Form |
| [ui-components](.opencode/skills/ui-components/SKILL.md) | Componentes reutilizables: SearchableSelect, EntityManagerModal, Bootstrap grid, layout |
| [state-management](.opencode/skills/state-management/SKILL.md) | Zustand (estado global), React Query (estado servidor, cache, mutaciones) |
| [python-standards](.opencode/skills/python-standards/SKILL.md) | Docstrings PEP257, type hints PEP484, convenciones Python |
| [typescript-standards](.opencode/skills/typescript-standards/SKILL.md) | TSDoc, tipado TypeScript, convenciones TS |
| [dev-environment](.opencode/skills/dev-environment/SKILL.md) | Setup local, variables de entorno, CORS, debugging |
| [ai-agent-rules](.opencode/skills/ai-agent-rules/SKILL.md) | Principios generales para agentes IA, memoria Engram, reglas globales |

---

## Reglas globales (aplican siempre)

- Siempre usar **context7** al generar código o recuperar documentación de librerías.
- Comentarios y docstrings en **español técnico**.
- Código **modular y mantenible**.
- Respetar la arquitectura del monorepo: `backend/` y `frontend/` son independientes.

---

## Estructura del monorepo

```
optic-ar/
├── backend/
│   ├── config/
│   ├── productos/
│   ├── ventas/
│   ├── compras/
│   ├── contabilidad/
│   └── turnos/
└── frontend/
    └── src/
        ├── components/
        ├── hooks/
        ├── services/
        └── schemas/
```
